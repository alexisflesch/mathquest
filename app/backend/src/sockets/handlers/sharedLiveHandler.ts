// Shared handler for joining and answering in both quiz and tournament modes
import { Server as SocketIOServer, Socket } from 'socket.io';
import { calculateLeaderboard } from './sharedLeaderboard';
import { collectAnswers } from './sharedAnswers';
import { calculateScore } from './sharedScore';
import createLogger from '@/utils/logger';
import { getFullGameState, GameState } from '@/core/gameStateService';
import { redisClient as redis } from '@/config/redis';
import { GAME_EVENTS, TOURNAMENT_EVENTS } from '@shared/types/socket/events';
import type {
    GameJoinedPayload,
    GameTimerUpdatePayload,
    ErrorPayload,
    ServerToClientEvents,
    ParticipantData
} from '@shared/types/socketEvents';
// TODO: Import or define types for:
// - answer_feedback
// - participant_joined
// - feedback
// - correct_answers
// - leaderboard_update (already present)
// - GAME_PARTICIPANTS

const logger = createLogger('SharedLiveHandler');

interface JoinPayload {
    accessCode: string;
    userId: string;
    username: string;
    avatarEmoji?: string;
    playMode: 'quiz' | 'tournament' | 'practice';
}

interface AnswerPayload {
    accessCode: string;
    userId: string;
    questionUid: string;
    answer: any;
    timeSpent: number;
    playMode?: 'quiz' | 'tournament' | 'practice'; // playMode is optional
}

export function registerSharedLiveHandlers(io: SocketIOServer, socket: Socket) {
    const joinHandler = async (payload: JoinPayload) => {
        const { accessCode, userId, username, avatarEmoji } = payload;
        let { playMode } = payload;

        // Determine playMode if not provided
        if (!playMode) {
            try {
                const prisma = await import('@/db/prisma').then(m => m.prisma);
                const gameInstance = await prisma.gameInstance.findUnique({
                    where: { accessCode },
                    select: { playMode: true }
                });
                if (gameInstance && gameInstance.playMode) {
                    playMode = gameInstance.playMode as 'quiz' | 'tournament' | 'practice';
                    logger.info({ accessCode, userId, determinedPlayMode: playMode }, 'Determined playMode from game instance');
                } else {
                    logger.warn({ accessCode, userId }, 'Could not determine playMode from game instance, defaulting to quiz');
                    playMode = 'quiz'; // Default playMode
                }
            } catch (error) {
                logger.error({ accessCode, userId, error }, 'Error fetching game instance to determine playMode, defaulting to quiz');
                playMode = 'quiz'; // Default playMode on error
            }
        }

        const room = `game_${accessCode}`;
        const participantUsername = typeof username === 'string' ? username : 'Anonymous';
        const participantAvatarEmoji = typeof avatarEmoji === 'string' ? avatarEmoji : undefined;

        // Populate socket.data for disconnectHandler and other potential uses
        socket.data.userId = userId;
        socket.data.accessCode = accessCode;
        socket.data.username = participantUsername;
        socket.data.currentGameRoom = room;

        logger.info({ accessCode, userId, room, playMode, username: participantUsername, avatarEmoji: participantAvatarEmoji }, '[DEBUG] Attempting to join room');
        await socket.join(room); // Use await for join
        logger.info({ accessCode, userId, room, playMode }, '[DEBUG] Joined room');

        const gameStateRaw = await getFullGameState(accessCode);

        // Create participant data for the GameJoinedPayload
        const participantData = {
            id: socket.id, // Use socket ID as participant ID for now
            userId: userId,
            username: participantUsername,
            avatar: participantAvatarEmoji || '👤', // Default avatar if none provided
            score: 0, // Initial score
            socketId: socket.id,
            online: true,
            joinedAt: new Date().toISOString(),
            isDeferred: false, // TODO: Determine from game instance data
            avatarEmoji: participantAvatarEmoji // For backward compatibility
        };

        // Create the correct GameJoinedPayload structure
        let gameJoinedPayload: GameJoinedPayload = {
            accessCode: accessCode,
            participant: participantData,
            gameStatus: 'pending', // Default to pending
            isDiffered: false // TODO: Determine from game instance data
        };

        // Update gameStatus based on game state
        if (gameStateRaw && gameStateRaw.gameState) {
            const gs = gameStateRaw.gameState;

            // Map internal status to the expected gameStatus values
            if (gs.status === 'active') {
                gameJoinedPayload.gameStatus = 'active';
            } else if (gs.status === 'completed') {
                gameJoinedPayload.gameStatus = 'completed';
            } else if (gs.status === 'paused') {
                // Map paused to active since paused is still an active game
                gameJoinedPayload.gameStatus = 'active';
            } else {
                gameJoinedPayload.gameStatus = 'pending';
            }

            // Send current question and timer state separately if game is active
            if (gs.currentQuestionIndex >= 0 && gs.currentQuestionIndex < gs.questionUids.length) {
                const prisma = await import('@/db/prisma').then(m => m.prisma);
                const questionUid = gs.questionUids[gs.currentQuestionIndex];
                const question = await prisma.question.findUnique({ where: { uid: questionUid } });

                if (question) {
                    const patchedQuestion = {
                        ...question,
                        defaultMode: question.questionType || 'single_correct',
                        answers: Array.isArray(question.answerOptions)
                            ? question.answerOptions.map((text, idx) => ({
                                text,
                                correct: Array.isArray(question.correctAnswers) ? !!question.correctAnswers[idx] : false
                            }))
                            : [],
                        difficulty: question.difficulty === null ? undefined : question.difficulty,
                        gradeLevel: question.gradeLevel === null ? undefined : question.gradeLevel,
                        title: question.title === null ? undefined : question.title,
                        explanation: question.explanation === null ? undefined : question.explanation,
                    };
                    const { filterQuestionForClient } = await import('@/../../shared/types/quiz/liveQuestion');
                    const filteredQuestion = filterQuestionForClient(patchedQuestion);

                    // Send the question as a separate event
                    socket.emit('game_question', {
                        question: filteredQuestion,
                        questionIndex: gs.currentQuestionIndex,
                        totalQuestions: gs.questionUids.length
                    });

                    // Send timer state as a separate event
                    if (gs.timer) {
                        // With shared GameTimerState, timeLeftMs is already calculated and available
                        const timeLeftMs = gs.timer.timeLeftMs || 0;

                        // When emitting game_timer_updated, use the correct structure:
                        socket.emit('game_timer_updated', {
                            timer: {
                                isPaused: gs.timer.status === 'pause',
                                timeLeftMs: gs.timer.timeLeftMs,
                                startedAt: gs.timer.timestamp,
                                durationMs: gs.timer.durationMs
                            },
                            questionUid: questionUid
                        } as GameTimerUpdatePayload);
                    }

                    // Handle feedback and correct answers timing
                    let shouldSendCorrectAnswers = false;
                    let shouldSendFeedback = false;
                    let feedbackRemaining = 0;

                    if (gs.timer && gs.timer.durationMs) {
                        const timeLeftMs = gs.timer.timeLeftMs || 0;

                        if (timeLeftMs <= 0) {
                            shouldSendCorrectAnswers = true;
                            if (patchedQuestion.feedbackWaitTime && patchedQuestion.feedbackWaitTime > 0) {
                                // For feedback timing, we need to track when feedback phase started
                                // Since shared timer doesn't have startedAt, we'll use timestamp if available
                                const now = Date.now();
                                const feedbackDurationMs = patchedQuestion.feedbackWaitTime * 1000;
                                // Simplified: assume feedback just started if timer expired
                                shouldSendFeedback = true;
                                feedbackRemaining = Math.ceil(feedbackDurationMs / 1000);
                            }
                        }
                    }

                    if (shouldSendCorrectAnswers) {
                        socket.emit('correct_answers', {
                            questionUid,
                            correctAnswers: question.correctAnswers || []
                        } as { questionUid: string; correctAnswers: boolean[] }); // TODO: Define shared type if missing
                    }
                    if (shouldSendFeedback) {
                        const safeFeedbackRemaining = Number.isFinite(feedbackRemaining) ? Math.max(0, Math.ceil(feedbackRemaining)) : 0;
                        socket.emit('feedback', { questionUid: questionUid, feedbackRemaining: safeFeedbackRemaining } as { questionUid: string; feedbackRemaining: number }); // TODO: Define shared type if missing
                    }
                }
            }
        }

        socket.emit('game_joined', gameJoinedPayload as GameJoinedPayload);
        logger.info({ accessCode, userId, room, playMode, gameJoinedPayload }, '[DEBUG] Emitted game_joined with correct payload structure');

        // const participantUsername = typeof username === 'string' ? username : 'Anonymous'; // Moved up
        // const participantavatarEmoji = typeof avatarEmoji === 'string' ? avatarEmoji : undefined; // Moved up

        io.to(room).emit('participant_joined', { userId, username: participantUsername, avatarEmoji: participantAvatarEmoji, playMode });

        try {
            // Redis keys
            const participantsKey = `mathquest:game:participants:${accessCode}`;
            const userIdToSocketIdKey = `mathquest:game:userIdToSocketId:${accessCode}`;
            const socketIdToUserIdKey = `mathquest:game:socketIdToUserId:${accessCode}`;

            logger.debug({ userIdToSocketIdKey, userId, socketId: socket.id }, 'Updating userIdToSocketId mapping in sharedLiveHandler');
            await redis.hset(userIdToSocketIdKey, userId, socket.id);
            logger.debug({ socketIdToUserIdKey, socketId: socket.id, userId }, 'Updating socketIdToUserId mapping in sharedLiveHandler');
            await redis.hset(socketIdToUserIdKey, socket.id, userId);

            const participantDataForRedis = {
                userId,
                username: participantUsername,
                avatarEmoji: participantAvatarEmoji,
                score: 0, // Initial score, can be updated by answers
                answers: [], // For tracking answers within the live session
                online: true,
                lastSocketId: socket.id,
                joinedAt: new Date().toISOString()
            };
            logger.debug({ participantsKey, userId, participantDataForRedis }, 'Storing participant in Redis by userId in sharedLiveHandler');
            await redis.hset(
                participantsKey,
                userId, // Use userId as the key
                JSON.stringify(participantDataForRedis)
            );
        } catch (err) {
            logger.error({ err, accessCode, userId }, 'Failed to add participant to Redis in sharedLiveHandler');
        }

        logger.info({ accessCode, userId, playMode }, 'Participant joined live room via sharedLiveHandler');
    };

    const answerHandler = async (payload: AnswerPayload) => {
        const { accessCode, userId, questionUid, answer, timeSpent } = payload;
        let { playMode } = payload;

        logger.info({ accessCode, userId, questionUid, answer, timeSpent, receivedPlayMode: playMode, socketId: socket.id }, '[SHARED_LIVE_HANDLER] game_answer received');

        if (!playMode) {
            try {
                const prisma = await import('@/db/prisma').then(m => m.prisma);
                const gameInstance = await prisma.gameInstance.findUnique({
                    where: { accessCode },
                    select: { playMode: true, status: true }
                });
                if (gameInstance && gameInstance.playMode) {
                    playMode = gameInstance.playMode as 'quiz' | 'tournament' | 'practice';
                    logger.info({ accessCode, userId, determinedPlayMode: playMode, gameStatus: gameInstance.status }, 'Determined playMode from game instance for answer');
                    if (playMode === 'practice') {
                        logger.info({ accessCode, userId, playMode }, 'Practice mode answer, bypassing sharedLiveHandler logic. GameAnswer.ts should handle.');
                        return;
                    }
                } else {
                    logger.warn({ accessCode, userId }, 'Could not determine playMode from game instance for answer, defaulting to quiz');
                    playMode = 'quiz';
                }
            } catch (error) {
                logger.error({ accessCode, userId, error }, 'Error fetching game instance to determine playMode for answer, defaulting to quiz');
                playMode = 'quiz';
            }
        }

        logger.info({ accessCode, userId, questionUid, answer, timeSpent, finalPlayMode: playMode, socketId: socket.id }, '[SHARED_LIVE_HANDLER] Processing game_answer with playMode');

        const currentPlayMode = playMode || 'quiz';
        const room = `game_${accessCode}`;

        const fullGameState = await getFullGameState(accessCode);
        if (!fullGameState || !fullGameState.gameState) {
            logger.warn({ accessCode, userId, questionUid }, 'Game state not found for answer validation.');
            socket.emit('answer_feedback', {
                status: 'error',
                code: 'GAME_NOT_FOUND',
                message: 'Jeu non trouvé. Impossible de soumettre la réponse.'
            });
            return;
        }

        const { gameState } = fullGameState;

        if (gameState.status !== 'active') {
            logger.warn({ accessCode, userId, questionUid, gameStatus: gameState.status, playMode: currentPlayMode }, 'Answer submitted but game is not active.');
            socket.emit('answer_feedback', {
                status: 'error',
                code: 'GAME_NOT_ACTIVE',
                message: 'Le jeu n\'est pas actif ou est terminé.'
            });
            return;
        }

        if (gameState.answersLocked) {
            logger.warn({ accessCode, userId, questionUid }, 'Answers are locked. Submission rejected.');
            socket.emit('answer_feedback', {
                status: 'error',
                code: 'ANSWERS_LOCKED',
                message: 'Les réponses sont verrouillées pour cette question.'
            });
            return;
        }

        // Check if timer has expired for this question (tournament mode)
        if (currentPlayMode === 'tournament') {
            const timerObj = gameState.timer;
            if (timerObj && timerObj.durationMs) {
                const timeLeftMs = timerObj.timeLeftMs || 0;
                if (timeLeftMs <= 0) {
                    logger.warn({ accessCode, userId, questionUid }, 'Answer submitted after timer expired (tournament mode).');
                    socket.emit('answer_feedback', {
                        status: 'error',
                        code: 'TIME_EXPIRED',
                        message: 'Le temps est écoulé pour cette question.'
                    });
                    return;
                }
            }
        }

        if (!gameState.questionUids || gameState.currentQuestionIndex === undefined || questionUid !== gameState.questionUids[gameState.currentQuestionIndex]) {
            logger.warn({ accessCode, userId, questionUid, currentQId: gameState.questionUids ? gameState.questionUids[gameState.currentQuestionIndex] : 'N/A' }, 'Answer submitted for wrong question.');
            socket.emit('answer_feedback', {
                status: 'error',
                code: 'WRONG_QUESTION',
                message: 'Réponse soumise pour une question incorrecte ou non active.'
            });
            return;
        }

        try {
            const participantKey = `mathquest:game:participants:${accessCode}`;
            const participantJson = await redis.hget(participantKey, userId);
            let participantData;
            if (participantJson) {
                participantData = JSON.parse(participantJson);
                // Ensure answers array exists
                if (!participantData.answers) {
                    participantData.answers = [];
                }
            } else {
                logger.warn({ accessCode, userId }, "Participant not found in Redis for answer submission. Creating entry.");
                participantData = { userId, username: 'Unknown (from answer)', score: 0, answers: [] };
            }

            const existingAnswer = participantData.answers.find((a: any) => a.questionUid === questionUid);
            if (existingAnswer) {
                logger.info({ accessCode, userId, questionUid }, 'Participant already answered this question. Updating answer.');
                existingAnswer.answer = answer;
                existingAnswer.timeSpent = timeSpent;
            } else {
                participantData.answers.push({ questionUid, answer, timeSpent });
            }

            await redis.hset(participantKey, userId, JSON.stringify(participantData));

            // Fetch question details to pass to calculateScore
            const prisma = await import('@/db/prisma').then(m => m.prisma);
            const question = await prisma.question.findUnique({ where: { uid: questionUid } });

            if (!question) {
                logger.error({ accessCode, userId, questionUid }, "Question not found for scoring");
                socket.emit('answer_feedback', {
                    status: 'error',
                    code: 'QUESTION_NOT_FOUND',
                    message: 'Question non trouvée pour le calcul du score.'
                });
                return;
            }

            // Determine if the answer is correct
            // This is a simplified check, adapt as per your actual answer structure and correctness logic
            let isCorrect = false;
            if (question.correctAnswers && Array.isArray(question.correctAnswers)) {
                // Example for multiple choice where answer is an index or array of indices
                if (Array.isArray(answer)) { // multiple answers possible
                    isCorrect = JSON.stringify(answer.sort()) === JSON.stringify(question.correctAnswers.sort());
                } else { // single answer
                    isCorrect = question.correctAnswers.includes(answer);
                }
            } else if (question.correctAnswers) { // single correct answer not in an array
                isCorrect = question.correctAnswers === answer;
            }


            const answerForScoring = {
                isCorrect,
                timeSpent, // timeSpent from payload
                // Add any other properties 'calculateScore' might need from the 'answer' payload
                value: answer
            };

            const score = calculateScore(answerForScoring, question); // Corrected call
            participantData.score = (participantData.score || 0) + score;
            await redis.hset(participantKey, userId, JSON.stringify(participantData));

            await redis.zadd(`mathquest:game:leaderboard:${accessCode}`, 'INCR', score, userId);

            socket.emit('answer_feedback', { status: 'ok', questionUid, scoreAwarded: score });
            logger.info({ accessCode, userId, questionUid, scoreAwarded: score }, 'Answer processed, feedback sent');

            if (currentPlayMode === 'quiz') {
                const collected = await collectAnswers(accessCode, questionUid);
                io.to(`teacher_control_${gameState.gameId}`).emit('quiz_answer_update', collected);
            }

            const leaderboard = await calculateLeaderboard(accessCode);
            io.to(room).emit('leaderboard_update', { leaderboard } as { leaderboard: ParticipantData[] });

        } catch (error: any) {
            logger.error({ accessCode: payload.accessCode, userId: payload.userId, questionUid: payload.questionUid, error: error.message, stack: error.stack }, 'Error processing answer in sharedLiveHandler');
            socket.emit('answer_feedback', {
                status: 'error',
                code: 'PROCESSING_ERROR',
                message: 'Erreur lors du traitement de la réponse.'
            });
        }
    };

    socket.on(GAME_EVENTS.REQUEST_PARTICIPANTS, async (payload: { accessCode: string }) => {
        try {
            const participants = await redis.hvals(`mathquest:game:participants:${payload.accessCode}`);
            socket.emit(GAME_EVENTS.GAME_PARTICIPANTS, { participants: participants.map(p => JSON.parse(p)) } as { participants: ParticipantData[] });
        } catch (error) {
            logger.error({ accessCode: payload.accessCode, error }, 'Error fetching participants');
            socket.emit(GAME_EVENTS.GAME_PARTICIPANTS, { participants: [] });
        }
    });

    socket.on(GAME_EVENTS.JOIN_GAME, (payload: JoinPayload) => joinHandler(payload));
    socket.on(TOURNAMENT_EVENTS.JOIN_TOURNAMENT, (payload: JoinPayload) => joinHandler({ ...payload, playMode: 'tournament' }));

    // Ensure game_answer is handled by answerHandler if not practice mode
    // For practice mode, gameAnswer.ts (registered in game/index.ts) should take precedence.
    socket.on(GAME_EVENTS.GAME_ANSWER, (payload: AnswerPayload) => {
        // This registration will be called if gameAnswer.ts doesn't stop propagation or if it's not practice.
        // The logic inside answerHandler now checks for playMode === 'practice' and returns early.
        answerHandler(payload);
    });
    socket.on(TOURNAMENT_EVENTS.TOURNAMENT_ANSWER, (payload: AnswerPayload) => answerHandler({ ...payload, playMode: 'tournament' }));
}
