import { Server, Socket } from 'socket.io';
import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import type { ErrorPayload } from '@shared/types/socketEvents';
import * as gameStateService from '@/core/services/gameStateService';
import { calculateTimerForLateJoiner } from '../../core/services/timerUtils';
import { validateGameAccess } from '@/utils/gameAuthorization';

const logger = createLogger('ProjectionHandler');

/**
 * Handler for teacher projection page to join projection room
 * Separate from dashboard to keep rooms cleanly separated
 */
export function projectionHandler(io: Server, socket: Socket) {
    logger.info({ socketId: socket.id }, 'ProjectionHandler: Socket connected, setting up projection event listeners');

    /**
     * Join projection room for a specific gameId
     * This is specifically for the teacher projection page display
     */
    socket.on(SOCKET_EVENTS.PROJECTOR.JOIN_PROJECTION, async (payload: any) => {
        logger.info({ socketId: socket.id, payload }, 'ProjectionHandler: Received JOIN_PROJECTION event');
        try {
            const { gameId } = payload;

            if (!gameId || typeof gameId !== 'string') {
                const errorPayload: ErrorPayload = {
                    message: 'Invalid gameId for projection join',
                    code: 'VALIDATION_ERROR',
                    details: { gameId }
                };
                socket.emit(SOCKET_EVENTS.PROJECTOR.PROJECTION_ERROR, errorPayload);
                return;
            }

            // Get userId from socket.data (should be populated by auth middleware)
            let effectiveUserId = socket.data?.userId || socket.data?.user?.userId;

            // Debug authentication data
            logger.info({
                socketId: socket.id,
                socketData: socket.data,
                auth: socket.handshake.auth,
                headers: socket.handshake.headers
            }, 'Projection socket authentication data');

            if (!effectiveUserId) {
                logger.warn({ gameId, socketId: socket.id }, 'No userId on socket.data for projection');

                // Try to get userId from auth directly for testing purposes
                const testUserId = socket.handshake.auth.userId;

                if (testUserId && socket.handshake.auth.userType === 'teacher') {
                    logger.info({ testUserId }, 'Using userId from auth directly for testing (projection)');
                    // Set the userId on socket.data for future usage
                    socket.data.userId = testUserId;
                    socket.data.user = { userId: testUserId, role: 'teacher' };
                    effectiveUserId = testUserId;
                } else {
                    // No userId found anywhere, return error
                    const errorPayload: ErrorPayload = {
                        message: 'Authentication required to join projection',
                        code: 'AUTHENTICATION_REQUIRED',
                        details: { gameId }
                    };
                    socket.emit(SOCKET_EVENTS.PROJECTOR.PROJECTION_ERROR, errorPayload);
                    return;
                }
            }

            // Use shared authorization helper
            const isTestEnvironment = process.env.NODE_ENV === 'test' || socket.handshake.auth?.isTestUser;
            const authResult = await validateGameAccess({
                gameId,
                userId: effectiveUserId,
                isTestEnvironment,
                requireQuizMode: true
            }); // QUIZ ONLY

            if (!authResult.isAuthorized) {
                const errorPayload: ErrorPayload = {
                    message: authResult.errorMessage || 'Authorization failed',
                    code: authResult.errorCode || 'AUTHORIZATION_ERROR',
                    details: { gameId }
                };
                socket.emit(SOCKET_EVENTS.PROJECTOR.PROJECTION_ERROR, errorPayload);
                return;
            }

            const gameInstance = authResult.gameInstance;

            // Join the projection room
            const projectionRoom = `projection_${gameId}`;
            await socket.join(projectionRoom);

            logger.info({
                socketId: socket.id,
                gameId,
                projectionRoom,
                accessCode: gameInstance.accessCode
            }, 'Projection page joined projection room');

            // Send success confirmation
            socket.emit(SOCKET_EVENTS.PROJECTOR.PROJECTION_JOINED, {
                gameId,
                accessCode: gameInstance.accessCode,
                room: projectionRoom
            });

            // Send initial game state to the projection
            try {
                const fullState = await gameStateService.getFullGameState(gameInstance.accessCode);

                if (!fullState) {
                    logger.warn({ gameId }, 'No game state found for projection');
                    return;
                }

                let enhancedGameState = fullState.gameState;

                // If there's an active question, fetch the current question data from DB (same approach as joinGameHandler)
                if (fullState.gameState.currentQuestionIndex >= 0 || fullState.gameState.timer?.questionUid) {
                    try {
                        const gameInstanceWithQuestions = await prisma.gameInstance.findUnique({
                            where: { id: gameId },
                            include: {
                                gameTemplate: {
                                    include: {
                                        questions: {
                                            include: { question: true },
                                            orderBy: { sequence: 'asc' }
                                        }
                                    }
                                }
                            }
                        });

                        if (gameInstanceWithQuestions?.gameTemplate?.questions) {
                            let currentQuestion = null;

                            // Try to find question by timer.questionUid first (canonical), then by index (fallback)
                            if (fullState.gameState.timer?.questionUid) {
                                currentQuestion = gameInstanceWithQuestions.gameTemplate.questions
                                    .find(q => q.question.uid === fullState.gameState.timer.questionUid)?.question;
                            } else if (fullState.gameState.currentQuestionIndex >= 0 &&
                                fullState.gameState.currentQuestionIndex < gameInstanceWithQuestions.gameTemplate.questions.length) {
                                currentQuestion = gameInstanceWithQuestions.gameTemplate.questions[fullState.gameState.currentQuestionIndex]?.question;
                            }

                            if (currentQuestion) {
                                const { filterQuestionForClient } = await import('@shared/types/quiz/liveQuestion');
                                const filteredQuestion = filterQuestionForClient(currentQuestion);

                                // Calculate remaining time for projection using shared utility
                                const actualTimer = calculateTimerForLateJoiner(fullState.gameState.timer);

                                // Add the question data and corrected timer to the game state for projection
                                enhancedGameState = {
                                    ...fullState.gameState,
                                    questionData: filteredQuestion,
                                    timer: actualTimer || fullState.gameState.timer
                                };

                                logger.info({
                                    gameId,
                                    questionUid: currentQuestion.uid,
                                    foundVia: fullState.gameState.timer?.questionUid ? 'timer.questionUid' : 'currentQuestionIndex',
                                    originalTimeLeft: fullState.gameState.timer?.timeLeftMs,
                                    originalStatus: fullState.gameState.timer?.status,
                                    actualTimeLeft: actualTimer?.timeLeftMs,
                                    actualStatus: actualTimer?.status,
                                    elapsed: fullState.gameState.timer?.timestamp ? Date.now() - fullState.gameState.timer.timestamp : 'no timestamp'
                                }, 'Added current question data and corrected timer to projection state');
                            }
                        }
                    } catch (questionFetchError) {
                        logger.warn({ error: questionFetchError, gameId }, 'Failed to fetch current question for projection, sending without question data');
                    }
                }

                const payload = {
                    accessCode: gameInstance.accessCode,
                    gameState: enhancedGameState,
                    participants: fullState.participants,
                    answers: fullState.answers,
                    leaderboard: fullState.leaderboard
                };

                // DEBUG: Log the leaderboard being sent to projection
                logger.info({
                    gameId,
                    accessCode: gameInstance.accessCode,
                    leaderboardCount: fullState.leaderboard?.length || 0,
                    leaderboard: fullState.leaderboard?.map((entry: any) => ({
                        userId: entry.userId,
                        username: entry.username,
                        avatarEmoji: entry.avatarEmoji,
                        score: entry.score
                    })) || []
                }, '🔍 [DEBUG-PROJECTION] Sending initial leaderboard to projection');

                // Detailed logging of the payload being sent
                logger.info({
                    gameId,
                    accessCode: gameInstance.accessCode,
                    payloadKeys: Object.keys(payload),
                    gameStateKeys: enhancedGameState ? Object.keys(enhancedGameState) : null,
                    timerState: enhancedGameState?.timer,
                    questionData: enhancedGameState?.questionData ? 'present' : 'missing',
                    questionDataUid: enhancedGameState?.questionData?.uid,
                    participantsCount: fullState?.participants?.length || 0,
                    answersKeys: fullState?.answers ? Object.keys(fullState.answers) : null,
                    leaderboardCount: fullState?.leaderboard?.length || 0
                }, 'Initial projection state payload details');

                socket.emit(SOCKET_EVENTS.PROJECTOR.PROJECTION_STATE, payload);
                logger.info({ gameId, accessCode: gameInstance.accessCode }, 'Initial projection state sent');

                // If there's an active timer (playing or paused), emit a timer update to trigger proper state in useSimpleTimer
                if (enhancedGameState?.timer && (enhancedGameState.timer.status === 'play' || enhancedGameState.timer.status === 'pause') && enhancedGameState.timer.timeLeftMs > 0) {
                    logger.info({
                        gameId,
                        timer: enhancedGameState.timer,
                        status: enhancedGameState.timer.status
                    }, 'Emitting timer update for active timer in projection');

                    const timerUpdatePayload = {
                        timer: enhancedGameState.timer,
                        questionUid: enhancedGameState.timer.questionUid
                    };

                    // Emit timer update immediately after the initial state (works for both play and pause status)
                    socket.emit(SOCKET_EVENTS.PROJECTOR.PROJECTION_TIMER_UPDATED, timerUpdatePayload);
                }

                // Send current projection display state if it exists
                const displayState = await gameStateService.getProjectionDisplayState(gameInstance.accessCode);
                if (displayState) {
                    logger.info({
                        gameId,
                        accessCode: gameInstance.accessCode,
                        displayState
                    }, 'Sending initial projection display state');

                    // If stats are currently shown, send the show stats event
                    if (displayState.showStats && displayState.statsQuestionUid) {
                        socket.emit(SOCKET_EVENTS.PROJECTOR.PROJECTION_SHOW_STATS, {
                            questionUid: displayState.statsQuestionUid,
                            show: true,
                            stats: displayState.currentStats,
                            timestamp: Date.now()
                        });
                        logger.info({ gameId, questionUid: displayState.statsQuestionUid }, 'Sent initial stats state (visible)');
                    }

                    // If correct answers are currently shown
                    if (displayState.showCorrectAnswers && displayState.correctAnswersData) {
                        socket.emit(SOCKET_EVENTS.PROJECTOR.PROJECTION_CORRECT_ANSWERS, {
                            ...displayState.correctAnswersData,
                            timestamp: Date.now()
                        });
                        logger.info({ gameId }, 'Sent initial correct answers state');
                    }
                }
            } catch (stateError) {
                logger.error({ error: stateError, gameId }, 'Failed to send initial projection state');
            }

        } catch (error) {
            logger.error({ error, payload }, 'Error joining projection room');

            const errorPayload: ErrorPayload = {
                message: 'Failed to join projection room',
                code: 'JOIN_ERROR',
                details: { error: error instanceof Error ? error.message : 'Unknown error' }
            };
            socket.emit(SOCKET_EVENTS.PROJECTOR.PROJECTION_ERROR, errorPayload);
        }
    });

    /**
     * Leave projection room
     */
    socket.on(SOCKET_EVENTS.PROJECTOR.LEAVE_PROJECTION, async (payload: any) => {
        logger.info({ socketId: socket.id, payload }, 'ProjectionHandler: Received LEAVE_PROJECTION event');
        try {
            const { gameId } = payload;

            if (gameId && typeof gameId === 'string') {
                const projectionRoom = `projection_${gameId}`;
                await socket.leave(projectionRoom);

                logger.info({
                    socketId: socket.id,
                    gameId,
                    projectionRoom
                }, 'Projection page left projection room');

                socket.emit(SOCKET_EVENTS.PROJECTOR.PROJECTION_LEFT, { gameId, room: projectionRoom });
            }
        } catch (error) {
            logger.error({ error, payload }, 'Error leaving projection room');
        }
    });
}
