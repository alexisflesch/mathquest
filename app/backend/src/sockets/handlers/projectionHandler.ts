import { Server, Socket } from 'socket.io';
import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import type { ErrorPayload } from '@shared/types/socketEvents';
import * as gameStateService from '@/core/gameStateService';
import { calculateTimerForLateJoiner } from '../../core/timerUtils';

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

            // Verify the game exists
            const gameInstance = await prisma.gameInstance.findUnique({
                where: { id: gameId },
                select: { id: true, accessCode: true, status: true }
            });

            if (!gameInstance) {
                const errorPayload: ErrorPayload = {
                    message: 'Game not found',
                    code: 'GAME_NOT_FOUND',
                    details: { gameId }
                };
                socket.emit(SOCKET_EVENTS.PROJECTOR.PROJECTION_ERROR, errorPayload);
                return;
            }

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

                // If there's a running timer, emit a timer update to trigger countdown in useSimpleTimer
                if (enhancedGameState?.timer?.status === 'play' && enhancedGameState.timer.timeLeftMs > 0) {
                    logger.info({
                        gameId,
                        timer: enhancedGameState.timer
                    }, 'Emitting timer update for running timer in projection');

                    const timerUpdatePayload = {
                        timer: enhancedGameState.timer,
                        questionUid: enhancedGameState.timer.questionUid
                    };

                    // Emit timer update immediately after the initial state
                    socket.emit(SOCKET_EVENTS.PROJECTOR.PROJECTION_TIMER_UPDATED, timerUpdatePayload);
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
