import { Server as SocketIOServer, Socket } from 'socket.io';
import { joinGameHandler } from './joinGame';
import { gameAnswerHandler } from './gameAnswer';
import { requestParticipantsHandler } from './requestParticipants';
import { disconnectHandler } from './disconnect';
import { requestNextQuestionHandler } from './requestNextQuestion';
import { GAME_EVENTS } from '@shared/types/socket/events';
import createLogger from '@/utils/logger';
import type { ErrorPayload } from '@shared/types/socketEvents';
import { startGamePayloadSchema } from '@shared/types/socketEvents.zod';
import { toCanonicalTimer } from '@/core/services/toCanonicalTimer';

const logger = createLogger('GameHandlers');

export function registerGameHandlers(io: SocketIOServer, socket: Socket) {
    logger.info({ socketId: socket.id }, 'Registering game handlers');

    // Register direct handlers on socket instance using shared constants
    socket.on(GAME_EVENTS.JOIN_GAME, joinGameHandler(io, socket));

    // Modernized GAME_ANSWER handler: resolve canonical context and pass to DRY handler
    socket.on(GAME_EVENTS.GAME_ANSWER, async (payload) => {
        console.log('[DEBUG] GAME_ANSWER handler triggered', { payload });
        // Extract accessCode, userId, questionUid from payload (validate with Zod if needed)
        let accessCode, userId, questionUid;
        try {
            // Use the same schema as in the handler for validation
            const { AnswerSubmissionPayloadSchema } = await import('@shared/types/core/answer');
            const parseResult = AnswerSubmissionPayloadSchema.safeParse(payload);
            if (!parseResult.success) {
                console.log('[DEBUG] Early return: invalid answer submission payload', { payload, error: parseResult.error });
                socket.emit(GAME_EVENTS.GAME_ERROR, { message: 'Invalid answer submission payload.' });
                return;
            }
            accessCode = parseResult.data.accessCode;
            userId = parseResult.data.userId;
            questionUid = parseResult.data.questionUid;
        } catch (err) {
            console.log('[DEBUG] Early return: malformed answer submission', { payload, err });
            socket.emit(GAME_EVENTS.GAME_ERROR, { message: 'Malformed answer submission.' });
            return;
        }

        // Canonical context resolution (no legacy/branching logic)
        const { CanonicalTimerService } = await import('@/core/services/canonicalTimerService');
        const { getFullGameState } = await import('@/core/services/gameStateService');
        const { prisma } = await import('@/db/prisma');
        const timerService = new CanonicalTimerService((await import('@/config/redis')).redisClient);

        // Fetch gameInstance
        const gameInstance = await prisma.gameInstance.findUnique({ where: { accessCode } });
        if (!gameInstance) {
            console.log('[DEBUG] Early return: gameInstance not found', { accessCode });
            socket.emit(GAME_EVENTS.GAME_ERROR, { message: 'Game instance not found.' });
            return;
        }
        // Fetch participant (by gameInstanceId, userId, and participationType)
        let participant;
        if (gameInstance.playMode === 'tournament') {
            // Determine participationType from session intent
            // If the user is in a deferred session, use 'DEFERRED', else 'LIVE'
            const isDeferred = !!(gameInstance.differedAvailableFrom && gameInstance.differedAvailableTo && gameInstance.status === 'completed' && payload && payload.deferred === true);
            if (isDeferred || (typeof payload === 'object' && payload.deferred === true)) {
                participant = await prisma.gameParticipant.findFirst({ where: { gameInstanceId: gameInstance.id, userId, participationType: 'DEFERRED' } });
            } else {
                participant = await prisma.gameParticipant.findFirst({ where: { gameInstanceId: gameInstance.id, userId, participationType: 'LIVE' } });
            }
        } else {
            participant = await prisma.gameParticipant.findFirst({ where: { gameInstanceId: gameInstance.id, userId } });
        }
        if (!participant) {
            // Defensive: Try to create participant row if missing
            console.log('[DEBUG] Participant not found, attempting to create', { accessCode, userId });
            const { joinGame: joinGameModular } = await import('@/core/services/gameParticipant/joinService');
            let username = payload?.username || `guest-${userId?.substring(0, 8)}`;
            let avatarEmoji = payload?.avatarEmoji || null;
            const joinResult = await joinGameModular({ userId, accessCode, username, avatarEmoji });
            if (!joinResult.success || !joinResult.participant) {
                console.log('[DEBUG] Early return: participant creation failed', { accessCode, userId, error: joinResult.error });
                socket.emit(GAME_EVENTS.GAME_ERROR, { message: 'Could not create participant.' });
                return;
            }
            participant = joinResult.participant;
        }
        // Fetch game state (by correct session key)
        // Canonical deferred detection: status === 'completed' and within deferred window
        const now = Date.now();
        const deferredWindowOpen = gameInstance.differedAvailableFrom && gameInstance.differedAvailableTo &&
            now >= new Date(gameInstance.differedAvailableFrom).getTime() &&
            now <= new Date(gameInstance.differedAvailableTo).getTime();
        let isDeferred = false;
        let contextGameInstance = gameInstance;
        if (gameInstance.playMode === 'tournament' && gameInstance.status === 'completed' && deferredWindowOpen) {
            contextGameInstance = { ...gameInstance, isDiffered: true };
            isDeferred = true;
        }
        // Always use per-user session key and timer for deferred
        let sessionKey;
        let attemptCount = 1;
        if (isDeferred || (gameInstance.playMode === 'tournament' && participant.participationType === 'DEFERRED')) {
            // Use socket-stored attemptCount if present (set at session start), else fetch from DB
            if (socket.data.deferredAttemptCount) {
                attemptCount = socket.data.deferredAttemptCount;
            } else {
                const deferredParticipant = await prisma.gameParticipant.findFirst({ where: { gameInstanceId: gameInstance.id, userId, participationType: 'DEFERRED' }, select: { attemptCount: true } });
                attemptCount = deferredParticipant?.attemptCount || 1;
                // Store for this socket/session
                socket.data.deferredAttemptCount = attemptCount;
            }
            sessionKey = `deferred_session:${accessCode}:${userId}:${attemptCount}`;
            // Log the attemptCount and sessionKey for deferred answer submission
            console.log('[DEBUG][DEFERRED_ANSWER_ATTEMPT]', { accessCode, userId, attemptCount, sessionKey, questionUid });
        } else {
            sessionKey = accessCode;
        }
        const gameState = await getFullGameState(sessionKey);
        // Diagnostic: Always log sessionKey and gameState after fetching, before any returns
        console.log('[DEBUG] Loaded gameState for answer submission', { accessCode, userId, sessionKey, gameState, gameInstance });
        if (!gameState) {
            // Defensive: if in deferred mode and gameState is missing, clear socket-stored attemptCount to allow recovery on next attempt
            if (isDeferred && socket.data.deferredAttemptCount) {
                delete socket.data.deferredAttemptCount;
            }
            console.log('[DEBUG] Early return: gameState not found', { sessionKey });
            socket.emit(GAME_EVENTS.GAME_ERROR, { message: 'Game state not found.' });
            return;
        }
        // Always canonicalize timer before passing to answer handler
        // durationMs: get from question (if available), else fallback to 30s
        let durationMs = 0;
        if (gameState && gameState.gameState && Array.isArray(gameState.gameState.questionUids)) {
            const idx = gameState.gameState.questionUids.findIndex((uid: string) => uid === questionUid);
            if (idx !== -1 && Array.isArray(gameState.gameState.questionUids)) {
                // Try to get timeLimit from DB for this questionUid
                const questionUidToFetch = gameState.gameState.questionUids[idx];
                try {
                    const question = await prisma.question.findUnique({ where: { uid: questionUidToFetch } });
                    if (question && typeof question.timeLimit === 'number') durationMs = question.timeLimit * 1000;
                } catch (err) {
                    // fallback below
                }
            }
        }
        if (!durationMs) durationMs = 0; // no fallback allowed
        // Debug: log timer fetch context
        console.log('[DEBUG][TIMER_FETCH] Fetching timer for answer', {
            accessCode,
            questionUid,
            playMode: gameInstance.playMode,
            isDeferred,
            userId,
            attemptCount,
            logPoint: 'DEFERRED_ANSWER_TIMER_FETCH'
        });
        // Fetch timer (canonical: always resolve here, never in handler)
        let timer = null;
        let canonicalTimer = null;
        if (gameInstance.playMode === 'practice') {
            timer = null;
            canonicalTimer = null;
        } else if (isDeferred || (gameInstance.playMode === 'tournament' && participant.participationType === 'DEFERRED')) {
            timer = await timerService.getTimer(accessCode, questionUid, gameInstance.playMode, true, userId, attemptCount, durationMs);
        } else {
            timer = await timerService.getTimer(accessCode, questionUid, gameInstance.playMode, false, undefined, undefined, durationMs);
        }
        console.log('[DEBUG][TIMER_FETCH] Raw timer loaded:', timer);
        canonicalTimer = toCanonicalTimer(timer, durationMs);
        console.log('[DEBUG][TIMER_FETCH] Canonical timer:', canonicalTimer);
        const context = { timer: canonicalTimer, gameState, participant, gameInstance: contextGameInstance };
        // Call the DRY handler
        return gameAnswerHandler(io, socket, context)(payload);
    });

    socket.on(GAME_EVENTS.REQUEST_PARTICIPANTS, requestParticipantsHandler(io, socket));
    socket.on(GAME_EVENTS.REQUEST_NEXT_QUESTION, requestNextQuestionHandler(io, socket));
    socket.on('disconnect', disconnectHandler(io, socket));

    // Direct handler for start_game in practice mode
    socket.on(GAME_EVENTS.START_GAME, async (payload: any) => {
        // Runtime validation with Zod
        const parseResult = startGamePayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            const errorDetails = parseResult.error.format();
            logger.warn({
                socketId: socket.id,
                error: 'Invalid startGame payload',
                details: errorDetails,
                payload
            }, 'Socket payload validation failed');

            const errorPayload: ErrorPayload = {
                message: 'Invalid startGame payload',
                code: 'VALIDATION_ERROR',
                details: errorDetails
            };

            socket.emit(GAME_EVENTS.GAME_ERROR, errorPayload);
            return;
        }

        const { accessCode, userId } = parseResult.data;
        logger.info({ socketId: socket.id, accessCode, userId }, 'Start game event received');

        try {
            const prismaInstance = (await import('@/db/prisma')).prisma;
            const gameInstance = await prismaInstance.gameInstance.findUnique({
                where: { accessCode },
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

            if (!gameInstance || !gameInstance.gameTemplate) {
                logger.warn({ socketId: socket.id, accessCode }, 'Game instance or template not found');
                socket.emit(GAME_EVENTS.GAME_ERROR, { message: 'Game not found or template missing.' } as ErrorPayload);
                return;
            }

            if (gameInstance.playMode !== 'practice') {
                logger.warn({ socketId: socket.id, playMode: gameInstance.playMode }, 'start_game is only for practice mode');
                socket.emit(GAME_EVENTS.GAME_ERROR, { message: 'start_game only allowed in practice mode.' } as ErrorPayload);
                return;
            }

            // Update game status
            await prismaInstance.gameInstance.update({
                where: { id: gameInstance.id },
                data: { status: 'active', startedAt: new Date() }
            });

            // Check if we have questions
            if (gameInstance.gameTemplate.questions.length === 0) {
                logger.warn({ socketId: socket.id, accessCode }, 'No questions in template');
                socket.emit(GAME_EVENTS.GAME_ERROR, { message: 'No questions available in this game.' } as ErrorPayload);
                return;
            }

            // Get first question
            const firstQuestionInTemplate = gameInstance.gameTemplate.questions[0];
            const firstQuestion = firstQuestionInTemplate.question;

            // Send first question
            logger.info({ socketId: socket.id, questionUid: firstQuestion.uid }, 'Sending first question');

            // ⚠️ SECURITY: Filter question to remove sensitive data (correctAnswers, explanation, etc.)
            const { filterQuestionForClient } = await import('@/../../shared/types/quiz/liveQuestion');
            const filteredQuestion = filterQuestionForClient(firstQuestion);

            // Send first question data using filtered question
            socket.emit(GAME_EVENTS.GAME_QUESTION, {
                question: filteredQuestion,
                timer: firstQuestion.timeLimit || 30,
                questionIndex: 0,
                totalQuestions: gameInstance.gameTemplate.questions.length,
                questionState: 'active' as const
            });

        } catch (err) {
            logger.error({ socketId: socket.id, error: err }, 'Error in start_game handler');
            socket.emit(GAME_EVENTS.GAME_ERROR, { message: 'Failed to start game: ' + (err as Error).message } as ErrorPayload);
        }
    });
}

export { registerTournamentHandlers } from '../tournament/index';
