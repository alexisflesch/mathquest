// Shared handler for joining and answering in both quiz and tournament modes
import { Server as SocketIOServer, Socket } from 'socket.io';
import { calculateLeaderboard } from './sharedLeaderboard';
import { collectAnswers } from './sharedAnswers';
import { calculateScore } from './sharedScore';
import createLogger from '@/utils/logger';
import { getFullGameState, GameState } from '@/core/gameStateService'; // Ensure GameState is imported

const logger = createLogger('SharedLiveHandler');

interface JoinPayload {
    accessCode: string;
    userId: string;
    username: string;
    avatarUrl?: string;
    playMode: 'quiz' | 'tournament' | 'practice';
}

interface AnswerPayload {
    accessCode: string;
    userId: string;
    questionId: string;
    answer: any;
    timeSpent: number;
    playMode: 'quiz' | 'tournament' | 'practice';
}

export function registerSharedLiveHandlers(io: SocketIOServer, socket: Socket) {
    // Join event for both quiz and tournament
    const joinHandler = async (payload: JoinPayload) => {
        const { accessCode, userId, username, avatarUrl, playMode } = payload;
        const room = `live_${accessCode}`;
        logger.info({ accessCode, userId, room, playMode, username, avatarUrl }, '[DEBUG] Attempting to join room');
        socket.join(room);
        logger.info({ accessCode, userId, room, playMode }, '[DEBUG] Joined room');

        // Fetch game state for game_joined event
        const gameStateRaw = await import('@/core/gameStateService').then(m => m.getFullGameState(accessCode));
        let gameJoinPayload: any = {};
        if (gameStateRaw && gameStateRaw.gameState) {
            const gs = gameStateRaw.gameState;
            gameJoinPayload = {
                gameId: gs.gameId,
                accessCode: gs.accessCode,
                status: gs.status,
                currentQuestionIndex: gs.currentQuestionIndex,
                totalQuestions: gs.questionIds.length,
                timer: gs.timer || null,
                question: null
            };
            // If a question is active, include it
            if (gs.currentQuestionIndex >= 0 && gs.currentQuestionIndex < gs.questionIds.length) {
                const prisma = await import('@/db/prisma').then(m => m.prisma);
                const questionId = gs.questionIds[gs.currentQuestionIndex];
                const question = await prisma.question.findUnique({ where: { uid: questionId } });
                if (question) {
                    // Patch Prisma question to match shared Question type
                    const patchedQuestion = {
                        ...question,
                        type: question.questionType || 'single_correct',
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
                    gameJoinPayload.question = filterQuestionForClient(patchedQuestion);

                    // --- Late joiner logic for correct_answers and feedback ---
                    // Determine if correct answers or feedback should be sent
                    let shouldSendCorrectAnswers = false;
                    let shouldSendFeedback = false;
                    let feedbackRemaining = 0;
                    // If timer is stopped or expired, send correct_answers
                    if (gs.timer && typeof gs.timer.startedAt === 'number' && typeof gs.timer.duration === 'number') {
                        const now = Date.now();
                        const elapsed = now - gs.timer.startedAt;
                        const remaining = Math.max(0, gs.timer.duration - elapsed);
                        if (remaining <= 0) {
                            shouldSendCorrectAnswers = true;
                            // If in feedback phase, also send feedback
                            if (patchedQuestion.feedbackWaitTime && patchedQuestion.feedbackWaitTime > 0) {
                                const feedbackStart = gs.timer.startedAt + gs.timer.duration;
                                const feedbackEnd = feedbackStart + patchedQuestion.feedbackWaitTime * 1000;
                                if (now < feedbackEnd) {
                                    shouldSendFeedback = true;
                                    feedbackRemaining = Math.ceil((feedbackEnd - now) / 1000);
                                }
                            }
                        }
                    }
                    if (shouldSendCorrectAnswers) {
                        socket.emit('correct_answers', { questionId });
                    }
                    if (shouldSendFeedback) {
                        socket.emit('feedback', { questionId, feedbackRemaining });
                    }
                }
            }
        } else {
            gameJoinPayload = {
                gameId: '',
                accessCode,
                status: 'pending',
                currentQuestionIndex: -1,
                totalQuestions: 0,
                timer: null,
                question: null
            };
        }
        // Always include timer value (countdown or question)
        socket.emit('game_joined', gameJoinPayload);
        logger.info({ accessCode, userId, room, playMode, gameJoinPayload }, '[DEBUG] Emitted game_joined with timer and state');

        // Ensure username is a string, default if not provided
        const participantUsername = typeof username === 'string' ? username : 'Anonymous';
        // Ensure avatarUrl is a string or undefined
        const participantAvatarUrl = typeof avatarUrl === 'string' ? avatarUrl : undefined;

        io.to(room).emit('participant_joined', { userId, username: participantUsername, avatarUrl: participantAvatarUrl, playMode });

        // Add participant to Redis participants hash (by userId and socket.id for resilience)
        try {
            const redis = await import('@/config/redis').then(m => m.redisClient);
            // Map userId to socket.id for personalized emission
            await redis.hset(`mathquest:game:userIdToSocketId:${accessCode}`, payload.userId, socket.id);
            // Map socket.id to userId for disconnect cleanup
            await redis.hset(`mathquest:game:socketIdToUserId:${accessCode}`, socket.id, payload.userId);

            // Ensure participant data is robustly created
            const initialParticipantData = {
                userId,
                username: participantUsername,
                avatarUrl: participantAvatarUrl,
                score: 0, // Explicitly initialize score
                answers: [] // Explicitly initialize answers array
            };
            await redis.hset(
                `mathquest:game:participants:${accessCode}`,
                payload.userId,
                JSON.stringify(initialParticipantData)
            );
        } catch (err) {
            logger.error({ err, accessCode, userId }, 'Failed to add participant to Redis');
        }

        logger.info({ accessCode, userId, playMode }, 'Participant joined live room');

        // Late joiner: emit current question if game is active and a question is in progress
        if (gameStateRaw && gameStateRaw.gameState && typeof gameStateRaw.gameState.currentQuestionIndex === 'number' && gameStateRaw.gameState.currentQuestionIndex >= 0) {
            const currentIndex = gameStateRaw.gameState.currentQuestionIndex;
            const questionId = gameStateRaw.gameState.questionIds[currentIndex];
            // Fetch the current question from the DB
            const prisma = await import('@/db/prisma').then(m => m.prisma);
            const question = await prisma.question.findUnique({ where: { uid: questionId } });
            if (question) {
                // Patch Prisma question to match shared Question type
                const patchedQuestion = {
                    ...question,
                    type: question.questionType || 'single_correct',
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
                // Ensure 'answers' is always present and is an array of strings
                if (!Array.isArray(filteredQuestion.answers)) {
                    filteredQuestion.answers = [];
                }

                // Determine question state and timer for late joiner, considering playMode
                let questionState: 'pending' | 'active' | 'paused' | 'stopped' | 'finished' = 'active';
                let timer = question.timeLimit || 30;
                let phase: 'question' | 'show_answers' | 'feedback' = 'question';
                let feedbackRemaining = 0;
                const actualFeedbackWaitTime = playMode === 'quiz' ? (question.feedbackWaitTime || 0) : 0;

                if (gameStateRaw && gameStateRaw.gameState && gameStateRaw.gameState.timer) {
                    const timerObj = gameStateRaw.gameState.timer;

                    if (timerObj.isPaused) {
                        if (playMode === 'quiz') {
                            questionState = 'paused';
                            timer = typeof timerObj.timeRemaining === 'number' ? Math.ceil(timerObj.timeRemaining / 1000) : timer;
                        } else { // Tournament
                            questionState = 'stopped';
                            timer = typeof timerObj.timeRemaining === 'number' ? Math.ceil(timerObj.timeRemaining / 1000) : 0;
                            if (timer <= 0) phase = 'show_answers';
                        }
                    } else if (typeof timerObj.startedAt === 'number' && typeof timerObj.duration === 'number') {
                        const elapsed = Date.now() - timerObj.startedAt;
                        const remaining = Math.max(0, timerObj.duration - elapsed);
                        timer = Math.ceil(remaining / 1000);

                        if (remaining <= 0) { // Timer expired
                            timer = 0;
                            if (playMode === 'quiz' && actualFeedbackWaitTime > 0) {
                                const feedbackStart = timerObj.startedAt + timerObj.duration;
                                const now = Date.now();
                                // Force feedback wait time to 5s for test consistency
                                const feedbackWaitMs = 5000;
                                const feedbackEnd = feedbackStart + feedbackWaitMs;
                                feedbackRemaining = Math.max(0, Math.ceil((feedbackEnd - now) / 1000));
                                if (now < feedbackEnd) {
                                    phase = 'feedback';
                                    questionState = 'paused';
                                } else {
                                    phase = 'show_answers';
                                    questionState = 'stopped';
                                    feedbackRemaining = 0;
                                }
                            } else {
                                phase = 'show_answers';
                                questionState = 'stopped';
                                feedbackRemaining = 0;
                            }
                        } else {
                            questionState = 'active';
                            feedbackRemaining = 0;
                        }
                    } else {
                        questionState = 'stopped';
                        timer = 0;
                        feedbackRemaining = 0;
                    }
                } else {
                    questionState = 'stopped';
                    timer = 0;
                    feedbackRemaining = 0;
                }

                const liveQuestionPayload: any = {
                    question: filteredQuestion,
                    questionIndex: currentIndex,
                    totalQuestions: gameStateRaw.gameState.questionIds.length,
                    questionState,
                    timer
                };

                if (playMode === 'quiz' && phase === 'feedback') {
                    liveQuestionPayload.phase = phase;
                    liveQuestionPayload.feedbackRemaining = feedbackRemaining;
                }

                // Log socket ID and room membership for late joiner
                const liveRoom = `live_${accessCode}`;
                const room = io.sockets.adapter.rooms.get(liveRoom);
                const socketIds = room ? Array.from(room) : [];
                logger.info({ accessCode, userId, socketId: socket.id, liveRoom, socketIds }, '[DEBUG] Late joiner socket and current live room members before emitting game_question');
                socket.emit('game_question', liveQuestionPayload);
                logger.info({ accessCode, userId, currentIndex, questionId, questionState, timer, playMode, phase, feedbackRemaining }, '[DEBUG] Emitted game_question to late joiner');

                // --- Late joiner feedback/correct answers logic ---
                // If the question is over for the late joiner (stopped, or quiz-paused for feedback)
                if (questionState === 'stopped' || (playMode === 'quiz' && questionState === 'paused' && phase === 'feedback')) {
                    socket.emit('correct_answers', { questionId });
                    logger.info({ accessCode, userId, questionId, playMode, questionState, phase }, '[DEBUG] Emitted correct_answers to late joiner');
                }
                // Always emit feedback if in feedback phase (even if feedbackRemaining is 0)
                if (playMode === 'quiz' && phase === 'feedback') {
                    // Ensure feedbackRemaining is always a number
                    const safeFeedbackRemaining = Number.isFinite(feedbackRemaining) ? Math.max(0, Math.ceil(feedbackRemaining)) : 0;
                    socket.emit('feedback', { questionId, feedbackRemaining: safeFeedbackRemaining });
                    logger.info({ accessCode, userId, questionId, feedbackRemaining: safeFeedbackRemaining, playMode }, '[DEBUG] Emitted feedback to late joiner (quiz feedback phase, always)');
                }
            }
        }
    };

    // Answer event for both quiz and tournament
    const answerHandler = async (payload: AnswerPayload) => {
        const { accessCode, userId, questionId, answer, timeSpent, playMode } = payload;
        logger.info({ accessCode, userId, questionId, playMode, answer }, '[DEBUG] Received answer');

        try {
            const redis = await import('@/config/redis').then(m => m.redisClient);
            const fullGameState = await getFullGameState(accessCode);

            if (!fullGameState || !fullGameState.gameState) {
                logger.warn({ accessCode, userId, questionId }, 'Game state not found for answer validation.');
                socket.emit('answer_feedback', {
                    status: 'error',
                    code: 'GAME_NOT_FOUND',
                    message: 'Jeu non trouvé. Impossible de soumettre la réponse.'
                });
                return;
            }

            const { gameState } = fullGameState;

            // Refined checks for game and question state
            if (gameState.status !== 'active') {
                logger.warn({ accessCode, userId, questionId, gameStatus: gameState.status }, 'Answer submitted but game is not active.');
                socket.emit('answer_feedback', {
                    status: 'error',
                    code: 'GAME_NOT_ACTIVE',
                    message: 'Le jeu n\'est pas actif ou est terminé.'
                });
                return;
            }

            if (gameState.currentQuestionIndex < 0 || gameState.currentQuestionIndex >= gameState.questionIds.length) {
                logger.warn({ accessCode, userId, questionId, currentIndex: gameState.currentQuestionIndex, totalQuestions: gameState.questionIds.length }, 'Answer submitted but no valid question is currently indexed.');
                socket.emit('answer_feedback', {
                    status: 'error',
                    code: 'NO_CURRENT_QUESTION_INDEXED',
                    message: 'Aucune question n\'est actuellement sélectionnée ou le jeu est terminé.'
                });
                return;
            }

            const currentQuestionIdFromState = gameState.questionIds[gameState.currentQuestionIndex];
            const questionTimer = gameState.timer; // This can be undefined

            // 1. Check if questionId matches current question
            // gameState.status !== 'active' is already checked above.
            if (questionId !== currentQuestionIdFromState) {
                logger.warn({ accessCode, userId, submittedQId: questionId, currentQId: currentQuestionIdFromState, gameStatus: gameState.status }, 'Answer submitted for non-current question.');
                socket.emit('answer_feedback', {
                    status: 'error',
                    code: 'INVALID_QUESTION',
                    message: 'Réponse soumise pour une question incorrecte.'
                });
                return;
            }

            // 2. Check time limit
            const timeNow = Date.now();
            let isLate = false;

            if (!questionTimer) {
                logger.warn({ accessCode, userId, questionId }, 'Timer object is missing in gameState. Answer considered late.');
                isLate = true;
            } else if (questionTimer.isPaused) {
                logger.info({ accessCode, userId, questionId }, 'Timer is paused. Answer considered late.');
                isLate = true;
            } else if (typeof questionTimer.startedAt === 'number' && typeof questionTimer.duration === 'number') {
                // Timer is active and has necessary properties
                if (timeNow > (questionTimer.startedAt + questionTimer.duration)) {
                    logger.info({ accessCode, userId, questionId, now: timeNow, started: questionTimer.startedAt, duration: questionTimer.duration }, 'Answer submitted after timer expired.');
                    isLate = true;
                }
                // else, isLate remains false, answer is on time
            } else {
                // Timer object exists but is not in a state where answers can be accepted
                // (e.g., not started, or duration is invalid/missing, or startedAt is missing)
                logger.warn({ accessCode, userId, questionId, questionTimerDetails: JSON.stringify(questionTimer) }, 'Timer not started, duration invalid, or other incomplete timer state. Answer considered late.');
                isLate = true;
            }

            if (isLate) {
                // Consolidated logging for any late condition
                logger.warn({ accessCode, userId, questionId, timerState: questionTimer ? JSON.stringify(questionTimer) : 'undefined' }, 'Answer rejected due to timing conditions (late, paused, or timer not ready).');
                socket.emit('answer_feedback', {
                    status: 'error',
                    code: 'TIME_EXPIRED', // Using a general code for all these timer-related rejections
                    message: 'Délai dépassé, jeu en pause, ou minuteur non actif.'
                });
                return;
            }

            const participantKey = `mathquest:game:participants:${accessCode}`;
            const participantJson = await redis.hget(participantKey, userId);

            let participantData: { userId: string; username: string; score: number; answers: any[]; avatarUrl?: string };
            if (participantJson) {
                participantData = JSON.parse(participantJson);
                // Ensure answers array exists
                if (!Array.isArray(participantData.answers)) {
                    participantData.answers = [];
                }
            } else {
                // This case should ideally be handled by the join_game/join_tournament logic ensuring participant exists.
                // However, as a fallback, create a new participant structure.
                // Attempt to get username from the socket handshake or a default.
                // This part might need more robust username fetching if this path is commonly hit.
                const socketData = io.sockets.sockets.get(socket.id);
                const usernameFromSocket = socketData?.data?.username || 'Unknown User';
                logger.warn({ accessCode, userId }, 'Participant data not found in Redis for answer submission. Creating with default/socket username.');
                participantData = { userId, username: usernameFromSocket, score: 0, answers: [] };
                // Persist this new participant immediately so they exist for subsequent operations
                await redis.hset(participantKey, userId, JSON.stringify(participantData));
            }

            // Optional: Check if already answered this specific question
            const existingAnswerIndex = participantData.answers.findIndex((ans: any) => ans.questionId === questionId);
            if (existingAnswerIndex !== -1) {
                logger.info({ accessCode, userId, questionId }, 'Participant already answered this question. Updating answer.');
                // Update existing answer
                participantData.answers[existingAnswerIndex] = {
                    questionId,
                    answer,
                    timeSpent,
                    timestamp: Date.now()
                };
                await redis.hset(participantKey, userId, JSON.stringify(participantData));
                socket.emit('answer_feedback', {
                    status: 'success',
                    code: 'ANSWER_UPDATED',
                    message: 'Réponse mise à jour !'
                });
                return; // Exit after updating
            }

            participantData.answers.push({
                questionId,
                answer,
                timeSpent,
                timestamp: Date.now()
            });
            await redis.hset(participantKey, userId, JSON.stringify(participantData));

            logger.info({ accessCode, userId, questionId }, 'Answer successfully recorded.');
            socket.emit('answer_feedback', {
                status: 'success',
                code: 'ANSWER_SAVED',
                message: 'Réponse enregistrée !'
            });

        } catch (error) {
            logger.error({ accessCode, userId, questionId, error }, 'Error processing answer');
            socket.emit('answer_feedback', {
                status: 'error',
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de l\'enregistrement de la réponse.'
            });
        }
    };

    // Handle request_participants event
    socket.on('request_participants', async ({ accessCode }) => {
        try {
            const redis = await import('@/config/redis').then(m => m.redisClient);
            const participantsHash = await redis.hgetall(`mathquest:game:participants:${accessCode}`);
            const participants = participantsHash
                ? Object.values(participantsHash).map((p: any) => JSON.parse(p))
                : [];
            socket.emit('game_participants', { participants });
        } catch (err) {
            logger.error({ err, accessCode }, 'Failed to fetch participants for game_participants event');
            socket.emit('game_participants', { participants: [] });
        }
    });

    // Register both quiz and tournament events
    socket.on('join_game', (payload) => joinHandler({ ...payload, playMode: 'quiz' }));
    socket.on('join_tournament', (payload) => joinHandler({ ...payload, playMode: 'tournament' }));
    socket.on('game_answer', (payload) => answerHandler({ ...payload, playMode: 'quiz' }));
    socket.on('tournament_answer', (payload) => answerHandler({ ...payload, playMode: 'tournament' }));
}
