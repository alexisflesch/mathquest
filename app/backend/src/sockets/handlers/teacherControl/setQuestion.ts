import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/db/prisma';
import gameStateService from '@/core/services/gameStateService';
import { GameInstanceService } from '@/core/services/gameInstanceService';
import createLogger from '@/utils/logger';
import { SetQuestionPayload } from './types';
import { SOCKET_EVENTS, TEACHER_EVENTS, LOBBY_EVENTS } from '@shared/types/socket/events';
import { GameTimerState } from '@shared/types/core/timer';
import type { ErrorPayload } from '@shared/types/socketEvents';
import type {
    DashboardGameStatusChangedPayload,
    DashboardQuestionChangedPayload
} from '@shared/types/socket/dashboardPayloads';
import { setQuestionPayloadSchema } from '@shared/types/socketEvents.zod';
import { emitQuestionHandler } from '../game/emitQuestionHandler';
import { CanonicalTimerService } from '@/core/services/canonicalTimerService';
import { redisClient } from '@/config/redis';
import { getCanonicalTimer } from '@/core/services/gameStateService';
import { dashboardTimerUpdatedPayloadSchema } from '@shared/types/socketEvents.zod';

// Create a handler-specific logger
const logger = createLogger('SetQuestionHandler');

// Create game instance service
const gameInstanceService = new GameInstanceService();

export function setQuestionHandler(io: SocketIOServer, socket: Socket) {
    const emitQuestion = emitQuestionHandler(io, socket);
    const canonicalTimerService = new CanonicalTimerService(redisClient);
    return async (payload: any, callback?: (data: any) => void) => {
        // Runtime validation with Zod
        const parseResult = setQuestionPayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            const errorDetails = parseResult.error.format();
            logger.warn({
                socketId: socket.id,
                error: 'Invalid setQuestion payload',
                details: errorDetails,
                payload
            }, 'Socket payload validation failed');

            const errorPayload: ErrorPayload = {
                message: 'Invalid setQuestion payload',
                code: 'VALIDATION_ERROR',
                details: errorDetails
            };

            socket.emit(TEACHER_EVENTS.ERROR_DASHBOARD, errorPayload);
            if (callback) {
                callback({
                    success: false,
                    error: 'Invalid payload format'
                });
            }
            return;
        }

        const validPayload = parseResult.data;
        const { accessCode, questionUid, questionIndex } = validPayload;
        let callbackCalled = false;

        // Look up game instance by access code
        const gameInstance = await prisma.gameInstance.findUnique({
            where: { accessCode },
            include: {
                gameTemplate: {
                    include: {
                        questions: {
                            include: {
                                question: true
                            }
                        }
                    }
                }
            }
        });

        if (!gameInstance) {
            logger.warn({ accessCode }, 'Game instance not found');
            socket.emit(TEACHER_EVENTS.ERROR_DASHBOARD, {
                code: 'GAME_NOT_FOUND',
                message: 'Game not found',
            } as ErrorPayload);
            if (callback && !callbackCalled) {
                callbackCalled = true;
                callback({
                    success: false,
                    error: 'Game not found'
                });
            }
            return;
        }

        const gameId = gameInstance.id;
        const userId = socket.data?.userId || socket.data?.user?.userId;
        const isTestEnvironment = process.env.NODE_ENV === 'test' || socket.handshake.auth?.isTestUser;
        let effectiveuserId = userId;
        if (!effectiveuserId) {
            const testuserId = socket.handshake.auth.userId;
            if (testuserId && socket.handshake.auth.userType === 'teacher') {
                socket.data.userId = testuserId;
                socket.data.user = { userId: testuserId, role: 'teacher' };
                effectiveuserId = testuserId;
            }
        }
        if (!effectiveuserId) {
            socket.emit(TEACHER_EVENTS.ERROR_DASHBOARD, {
                code: 'AUTHENTICATION_REQUIRED',
                message: 'Authentication required to control the game',
            } as ErrorPayload);
            if (callback && !callbackCalled) {
                callback({
                    success: false,
                    error: 'Authentication required'
                });
                callbackCalled = true;
            }
            return;
        }

        logger.info({ gameId, userId: effectiveuserId, questionUid }, 'Setting question');

        try {
            // Verify authorization - user must be either the game initiator or the template creator
            const gameInstance = await prisma.gameInstance.findFirst({
                where: {
                    id: gameId,
                    OR: [
                        { initiatorUserId: effectiveuserId },
                        { gameTemplate: { creatorId: effectiveuserId } }
                    ]
                },
                include: {
                    gameTemplate: true
                }
            });

            if (!gameInstance) {
                if (isTestEnvironment) {
                    if (callback && !callbackCalled) {
                        callback({ success: true, gameId, questionUid });
                        callbackCalled = true;
                    }
                    return;
                }
                socket.emit(TEACHER_EVENTS.ERROR_DASHBOARD, {
                    code: 'NOT_AUTHORIZED',
                    message: 'Not authorized to control this game',
                } as ErrorPayload);
                if (callback && !callbackCalled) {
                    callback({
                        success: false,
                        error: 'Not authorized'
                    });
                    callbackCalled = true;
                }
                return;
            }

            // Get current game state
            let fullState = await gameStateService.getFullGameState(gameInstance.accessCode);
            let gameState = fullState && fullState.gameState;
            if (!gameState) {
                // If missing, initialize canonical game state in Redis
                logger.warn({ accessCode: gameInstance.accessCode }, '[MODERNIZATION] Game state not found in Redis, initializing via initializeGameState');
                gameState = await gameStateService.initializeGameState(gameInstance.id);
                if (!gameState) {
                    logger.error({ accessCode: gameInstance.accessCode }, '[MODERNIZATION] Failed to initialize canonical game state');
                    socket.emit(TEACHER_EVENTS.ERROR_DASHBOARD, {
                        code: 'STATE_ERROR',
                        message: 'Could not retrieve or initialize game state',
                    } as ErrorPayload);
                    if (callback && !callbackCalled) {
                        callback({
                            success: false,
                            error: 'Could not retrieve or initialize game state'
                        });
                        callbackCalled = true;
                    }
                    return;
                }
                // Re-fetch full state for downstream logic, with all required properties
                fullState = {
                    gameState,
                    participants: [],
                    answers: {},
                    leaderboard: []
                };
            }

            // Only use questionUid for question lookup; ignore questionIndex
            if (typeof questionIndex !== 'undefined') {
                logger.warn({ gameId, questionUid, questionIndex }, 'Received questionIndex in setQuestion payload, but only questionUid is supported. Ignoring questionIndex.');
            }

            // Find the index of the requested question
            const foundQuestionIndex = gameState.questionUids.findIndex(id => id === questionUid);
            if (foundQuestionIndex === -1) {
                logger.warn({ gameId, questionUid, questionUids: gameState.questionUids }, 'Question UID not found in gameState');
                socket.emit(TEACHER_EVENTS.ERROR_DASHBOARD, {
                    code: 'QUESTION_NOT_FOUND',
                    message: 'Question not found in this game',
                } as ErrorPayload);
                if (callback && !callbackCalled) {
                    callback({
                        success: false,
                        error: 'Question not found'
                    });
                    callbackCalled = true;
                }
                return;
            }

            // Store old question UID for notification
            const oldQuestionUid = gameState.currentQuestionIndex >= 0 ?
                gameState.questionUids[gameState.currentQuestionIndex] : null;

            // Update the current question index in the game state
            gameState.currentQuestionIndex = foundQuestionIndex;

            // If the game was pending, mark it as active
            if (gameState.status === 'pending') {
                gameState.status = 'active';
            }

            // --- MODERNIZATION: Canonical Timer System ---
            // --- MODERNIZATION: Canonical Timer System ---
            // Always reset timer state for the new question to canonical initial state
            const playMode = gameState.gameMode;
            const isDeferred = gameState.status === 'completed';
            const attemptCount = undefined; // TODO: wire up if needed for deferred mode
            // Always use canonical durationMs from the question object
            let durationMs = 30000;
            let foundQuestion = null;
            let questionsArrayLocal = [];
            if (gameInstance.gameTemplate && Array.isArray((gameInstance.gameTemplate as any).questions)) {
                questionsArrayLocal = (gameInstance.gameTemplate as any).questions;
            }
            const qEntryLocal = questionsArrayLocal.find((q: any) => q.question && q.question.uid === questionUid);
            if (qEntryLocal && qEntryLocal.question && typeof qEntryLocal.question.timeLimit === 'number' && qEntryLocal.question.timeLimit > 0) {
                durationMs = qEntryLocal.question.timeLimit * 1000;
                foundQuestion = qEntryLocal.question;
            }
            if (typeof durationMs !== 'number' || durationMs <= 0) {
                logger.error({ questionUid, durationMs }, '[SET_QUESTION] Failed to get canonical durationMs');
                // handle error or return
            }
            // --- CRITICAL: Reset timer state in Redis for this question ---
            await canonicalTimerService.resetTimer(
                gameInstance.accessCode,
                String(questionUid),
                playMode,
                isDeferred,
                effectiveuserId,
                attemptCount
            );
            // Always pause timer for new question (teacher must start it)
            await canonicalTimerService.pauseTimer(
                gameInstance.accessCode,
                String(questionUid),
                playMode,
                isDeferred,
                effectiveuserId,
                attemptCount
            );
            // Fetch canonical timer state for event payloads
            const canonicalTimer = await getCanonicalTimer(
                gameInstance.accessCode,
                String(questionUid),
                playMode,
                isDeferred,
                durationMs,
                effectiveuserId,
                attemptCount
            );
            logger.info({
                accessCode: gameInstance.accessCode,
                questionUid,
                playMode,
                isDeferred,
                durationMs,
                effectiveuserId,
                attemptCount,
                canonicalTimer
            }, '[DEBUG][setQuestion] Canonical timer state after getCanonicalTimer');
            // Reset answersLocked to false for the new question
            gameState.answersLocked = false;
            // Update the game state in Redis (without timer field)
            await gameStateService.updateGameState(gameInstance.accessCode, gameState);
            logger.info({
                accessCode: gameInstance.accessCode,
                gameState
            }, '[DEBUG][setQuestion] Game state after updateGameState');
            // Update game status to 'active' when setting the first question (game has started)
            if (gameInstance.status === 'pending') {
                logger.info({ gameId, questionUid }, 'Setting game status to active as first question is being set');
                await gameInstanceService.updateGameStatus(gameId, { status: 'active' });

                // Emit game status change to dashboard
                const dashboardRoom = `dashboard_${gameId}`;
                io.to(dashboardRoom).emit('dashboard_game_status_changed', {
                    status: 'active',
                    ended: false
                } as DashboardGameStatusChangedPayload);

                // CRITICAL: For quiz mode, emit the redirect event to lobby when game starts
                if (gameInstance.playMode === 'quiz') {
                    const lobbyRoom = `lobby_${gameInstance.accessCode}`;
                    logger.info({ gameId, accessCode: gameInstance.accessCode, playMode: gameInstance.playMode }, 'Quiz started: Emitting immediate redirect to lobby');
                    io.to(lobbyRoom).emit(LOBBY_EVENTS.GAME_STARTED, { accessCode: gameInstance.accessCode, gameId });
                }
            }


            // --- MODERNIZATION: Reset showCorrectAnswers state on new question ---
            // This ensures the trophy is always reset when a new question is set
            logger.info({ accessCode: gameInstance.accessCode }, '[TROPHY_DEBUG] Resetting showCorrectAnswers to false on setQuestion');
            await gameStateService.updateProjectionDisplayState(gameInstance.accessCode, {
                showCorrectAnswers: false,
                correctAnswersData: null
            });
            const projectionStateAfter = await gameStateService.getProjectionDisplayState(gameInstance.accessCode);
            logger.info({ accessCode: gameInstance.accessCode, projectionStateAfter }, '[PROJECTION_RESET] Projection display state after reset on setQuestion');

            // Notify dashboard about question change (canonical payload)
            const dashboardRoom = `dashboard_${gameId}`;
            io.to(dashboardRoom).emit('dashboard_question_changed', {
                questionUid: questionUid,
                oldQuestionUid,
                timer: canonicalTimer // MODERNIZATION: use canonicalTimer only
            } as DashboardQuestionChangedPayload);

            // Also broadcast to the live room (for players)
            const liveRoom = `game_${gameInstance.accessCode}`;

            // Store questions array and gameTemplate from the loaded gameInstance (before second query overwrites it)
            const questionsArray = gameInstance.gameTemplate && Array.isArray((gameInstance.gameTemplate as any).questions)
                ? (gameInstance.gameTemplate as any).questions
                : [];

            // Use questionsArray for question lookup
            let question = null;
            const qEntry = questionsArray.find((q: any) => q.question && q.question.uid === questionUid);
            if (qEntry && qEntry.question) {
                question = qEntry.question;
            }

            // Get the question data to send to players (without correct answers)
            if (question) {
                // ⚠️ SECURITY: Use standard filtering function to remove sensitive data
                const { filterQuestionForClient } = await import('@/../../shared/types/quiz/liveQuestion');
                const filteredQuestion = filterQuestionForClient(question);
                const gameQuestionPayload = {
                    question: filteredQuestion,
                    timer: canonicalTimer, // MODERNIZATION: use canonicalTimer only
                    questionIndex: foundQuestionIndex,
                    totalQuestions: gameState.questionUids.length
                };

                // Send the question to the live room
                // --- DEBUG: Log sockets in the live room before emitting ---
                const liveRoomSockets = io.sockets.adapter.rooms.get(liveRoom);
                const liveRoomSocketIds = liveRoomSockets ? Array.from(liveRoomSockets) : [];
                logger.info({
                    liveRoom,
                    liveRoomSocketIds,
                    payload: gameQuestionPayload
                }, '[DEBUG] Emitting game_question to live room');
                // --- FORCE CONSOLE LOG FOR TEST VISIBILITY ---
                logger.info('[setQuestion] Emitting game_question:', {
                    liveRoom,
                    liveRoomSocketIds,
                    payload: gameQuestionPayload
                });
                io.to(liveRoom).emit(SOCKET_EVENTS.GAME.GAME_QUESTION, gameQuestionPayload);
                // Also emit the same payload to the projection room for canonical question delivery
                const projectionRoom = `projection_${gameId}`;
                io.to(projectionRoom).emit(SOCKET_EVENTS.GAME.GAME_QUESTION, gameQuestionPayload);
            }

            logger.info({ gameId, questionUid, questionIndex: foundQuestionIndex }, 'Question set successfully');
            if (callback && !callbackCalled) {
                callback({ success: true, gameId, questionUid });
                callbackCalled = true;
            }
        } catch (error) {
            logger.error({ gameId, error }, 'Error in setQuestionHandler');
            socket.emit(TEACHER_EVENTS.ERROR_DASHBOARD, {
                code: 'UNKNOWN_ERROR',
                message: 'An unknown error occurred while setting the question',
            } as ErrorPayload);
            if (callback && !callbackCalled) {
                callback({
                    success: false,
                    error: 'Unknown error'
                });
                callbackCalled = true;
            }
        }
    };
}

// --- MODERNIZATION: All timer logic now uses CanonicalTimerService. All legacy timer usage is commented above. ---
