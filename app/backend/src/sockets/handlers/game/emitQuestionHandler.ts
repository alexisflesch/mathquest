import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData, ErrorPayload } from '@shared/types/socketEvents';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import { QUESTION_TYPES } from '@shared/constants/questionTypes';
import { CanonicalTimerService } from '@/core/services/canonicalTimerService';
import { redisClient } from '@/config/redis';
import { ProjectionShowStatsPayload, ProjectionShowStatsPayloadSchema } from '@shared/types/socket/projectionShowStats';
import { filterQuestionForClient } from '@shared/types/quiz/liveQuestion';
import { questionDataSchema } from '@shared/types/socketEvents.zod';

const logger = createLogger('EmitQuestionHandler');

export interface EmitQuestionPayload {
    accessCode: string;
    userId: string;
    questionUid?: string; // If omitted, will emit the next question after current
}

export function emitQuestionHandler(
    io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) {
    return async (payload: EmitQuestionPayload) => {
        logger.info({ payload }, '[DEBUG] emitQuestionHandler called');
        const { accessCode, userId, questionUid } = payload;
        // 1. Get game instance
        const gameInstance = await prisma.gameInstance.findUnique({
            where: { accessCode },
            select: {
                id: true,
                status: true,
                playMode: true,
                gameTemplateId: true
            }
        });
        if (!gameInstance) {
            const errorPayload: ErrorPayload = { message: 'Game not found.' };
            socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, errorPayload);
            return;
        }
        // 2. Get participant
        const participant = await prisma.gameParticipant.findFirst({
            where: { gameInstanceId: gameInstance.id, userId }
        });
        if (!participant) {
            const errorPayload: ErrorPayload = { message: 'Participant not found.' };
            socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, errorPayload);
            return;
        }
        // 3. Get all questions
        const allQuestions = await prisma.questionsInGameTemplate.findMany({
            where: { gameTemplateId: gameInstance.gameTemplateId },
            orderBy: { sequence: 'asc' },
            include: { question: true }
        });
        let targetQuestion = null;
        if (questionUid) {
            // Find the question by UID
            const found = allQuestions.find(q => q.questionUid === questionUid);
            if (found) targetQuestion = found.question;
        } else {
            // Default: emit the first unanswered or next question
            targetQuestion = allQuestions[0]?.question;
        }
        if (!targetQuestion) {
            const errorPayload: ErrorPayload = { message: 'Question not found.' };
            socket.emit(SOCKET_EVENTS.GAME.GAME_ERROR as any, errorPayload);
            return;
        }
        // Modern timer logic
        const canonicalTimerService = new CanonicalTimerService(redisClient);
        let timerPayload = null;
        // Determine if this is a deferred (completed) tournament
        const isDeferred = gameInstance.status === 'completed';

        logger.info({
            accessCode,
            userId,
            questionUid: targetQuestion.uid,
            playMode: gameInstance.playMode,
            isDeferred: isDeferred
        }, '[TIMER_DEBUG] About to start timer in emitQuestionHandler');

        // Always reset and start timer for all modes except practice
        if ((gameInstance.playMode === 'quiz' || gameInstance.playMode === 'tournament') && !isDeferred) {
            // Global timer for quiz and live tournament
            await canonicalTimerService.resetTimer(accessCode, targetQuestion.uid, gameInstance.playMode, isDeferred);
            await canonicalTimerService.startTimer(accessCode, targetQuestion.uid, gameInstance.playMode, isDeferred);
            const elapsed = await canonicalTimerService.getElapsedTimeMs(accessCode, targetQuestion.uid, gameInstance.playMode, isDeferred);
            logger.info({
                accessCode,
                userId,
                questionUid: targetQuestion.uid,
                playMode: gameInstance.playMode,
                isDeferred: isDeferred,
                elapsed
            }, '[TIMER_DEBUG] Timer reset, started, and elapsed calculated in emitQuestionHandler');
            timerPayload = {
                status: 'play',
                timeLeftMs: (targetQuestion.timeLimit || 30) * 1000 - elapsed,
                durationMs: (targetQuestion.timeLimit || 30) * 1000,
                questionUid: targetQuestion.uid,
                timestamp: Date.now() - elapsed,
                localTimeLeftMs: (targetQuestion.timeLimit || 30) * 1000 - elapsed
            };
        } else if (gameInstance.playMode === 'tournament' && isDeferred) {
            // Per-user session timer for deferred tournaments
            await canonicalTimerService.resetTimer(accessCode, targetQuestion.uid, gameInstance.playMode, isDeferred, userId);
            await canonicalTimerService.startTimer(accessCode, targetQuestion.uid, gameInstance.playMode, isDeferred, userId);
            const elapsed = await canonicalTimerService.getElapsedTimeMs(accessCode, targetQuestion.uid, gameInstance.playMode, isDeferred, userId);
            logger.info({
                accessCode,
                userId,
                questionUid: targetQuestion.uid,
                playMode: gameInstance.playMode,
                isDeferred: isDeferred,
                elapsed
            }, '[TIMER_DEBUG] Timer reset, started, and elapsed calculated in emitQuestionHandler (deferred)');
            timerPayload = {
                status: 'play',
                timeLeftMs: (targetQuestion.timeLimit || 30) * 1000 - elapsed,
                durationMs: (targetQuestion.timeLimit || 30) * 1000,
                questionUid: targetQuestion.uid,
                timestamp: Date.now() - elapsed,
                localTimeLeftMs: (targetQuestion.timeLimit || 30) * 1000 - elapsed
            };
        } else if (gameInstance.playMode === 'practice') {
            // No timer for practice mode
            timerPayload = null;
        }
        // Modernized: Prepare canonical, flat payload for game_question
        const questionIndex = allQuestions.findIndex(q => q.questionUid === targetQuestion.uid);
        const totalQuestions = allQuestions.length;
        let filteredQuestion = filterQuestionForClient(targetQuestion);
        // Remove timeLimit if null or undefined (schema expects it omitted, not null)
        if (filteredQuestion.timeLimit == null) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { timeLimit, ...rest } = filteredQuestion;
            filteredQuestion = rest;
        }
        const canonicalPayload = {
            ...filteredQuestion,
            currentQuestionIndex: questionIndex,
            totalQuestions: totalQuestions
        };
        // Use canonical student schema for student/game flows
        const { questionDataForStudentSchema } = await import('@shared/types/socketEvents.zod');
        const questionParseResult = questionDataForStudentSchema.safeParse(canonicalPayload);
        if (!questionParseResult.success) {
            logger.error({
                errors: questionParseResult.error.errors,
                canonicalPayload,
                schema: 'questionDataForStudentSchema',
                payloadKeys: Object.keys(canonicalPayload),
                payload: canonicalPayload
            }, '[MODERNIZATION] Invalid GAME_QUESTION payload, not emitting');
        } else {
            socket.emit(SOCKET_EVENTS.GAME.GAME_QUESTION as any, canonicalPayload);
            logger.info({ accessCode, userId, questionUid: targetQuestion.uid, canonicalPayload }, '[MODERNIZATION] Emitted canonical GAME_QUESTION to user (student flow)');
        }

        // [MODERNIZATION] Emit canonical stats for new question to both projection and dashboard rooms
        const projectionRoom = `projection_${gameInstance.id}`;
        const dashboardRoom = `dashboard_${gameInstance.id}`;
        let answerStats = {};
        let showStats = false;
        try {
            // Canonical: get stats for this question if any exist
            const { getAnswerStats } = await import('../teacherControl/helpers');
            answerStats = await getAnswerStats(accessCode, targetQuestion.uid);
            // Defensive: always ensure answerStats is a non-null object
            if (!answerStats || typeof answerStats !== 'object') answerStats = {};
            showStats = answerStats && Object.keys(answerStats).length > 0;
        } catch (err) {
            logger.warn({ err, accessCode, questionUid: targetQuestion.uid }, '[PROJECTION] Could not fetch answer stats for new question, sending empty stats');
            answerStats = {};
            showStats = false;
        }
        // Canonical: use shared type and runtime validation for projection_show_stats event
        const statsPayload: ProjectionShowStatsPayload = {
            questionUid: targetQuestion.uid,
            show: showStats,
            stats: answerStats || {}, // Defensive: always non-null object
            timestamp: Date.now()
        };
        // Validate at runtime before emitting
        const statsParseResult = ProjectionShowStatsPayloadSchema.safeParse(statsPayload);
        if (!statsParseResult.success) {
            logger.error({ errors: statsParseResult.error.errors, statsPayload }, '[PROJECTION] Invalid PROJECTION_SHOW_STATS payload, not emitting');
        } else {
            io.to(projectionRoom).emit(
                "projection_show_stats",
                statsPayload
            );
            io.to(dashboardRoom).emit(
                "projection_show_stats",
                statsPayload
            );
            logger.info({ projectionRoom, dashboardRoom, questionUid: targetQuestion.uid, showStats, answerStats }, '[PROJECTION] Emitted PROJECTION_SHOW_STATS (canonical stats) to both projection and dashboard rooms for new question');
        }
    };
}
