"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitQuestionHandler = emitQuestionHandler;
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
const events_1 = require("@shared/types/socket/events");
const canonicalTimerService_1 = require("@/core/services/canonicalTimerService");
const redis_1 = require("@/config/redis");
const projectionShowStats_1 = require("@shared/types/socket/projectionShowStats");
const liveQuestion_1 = require("@shared/types/quiz/liveQuestion");
const logger = (0, logger_1.default)('EmitQuestionHandler');
function emitQuestionHandler(io, socket) {
    return async (payload) => {
        logger.info({ payload }, '[DEBUG] emitQuestionHandler called');
        const { accessCode, userId, questionUid } = payload;
        // 1. Get game instance
        const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
            where: { accessCode },
            select: {
                id: true,
                playMode: true,
                isDiffered: true,
                gameTemplateId: true
            }
        });
        if (!gameInstance) {
            const errorPayload = { message: 'Game not found.' };
            socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, errorPayload);
            return;
        }
        // 2. Get participant
        const participant = await prisma_1.prisma.gameParticipant.findFirst({
            where: { gameInstanceId: gameInstance.id, userId }
        });
        if (!participant) {
            const errorPayload = { message: 'Participant not found.' };
            socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, errorPayload);
            return;
        }
        // 3. Get all questions
        const allQuestions = await prisma_1.prisma.questionsInGameTemplate.findMany({
            where: { gameTemplateId: gameInstance.gameTemplateId },
            orderBy: { sequence: 'asc' },
            include: { question: true }
        });
        let targetQuestion = null;
        if (questionUid) {
            // Find the question by UID
            const found = allQuestions.find(q => q.questionUid === questionUid);
            if (found)
                targetQuestion = found.question;
        }
        else {
            // Default: emit the first unanswered or next question
            targetQuestion = allQuestions[0]?.question;
        }
        if (!targetQuestion) {
            const errorPayload = { message: 'Question not found.' };
            socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, errorPayload);
            return;
        }
        // Modern timer logic
        const canonicalTimerService = new canonicalTimerService_1.CanonicalTimerService(redis_1.redisClient);
        let timerPayload = null;
        logger.info({
            accessCode,
            userId,
            questionUid: targetQuestion.uid,
            playMode: gameInstance.playMode,
            isDiffered: gameInstance.isDiffered
        }, '[TIMER_DEBUG] About to start timer in emitQuestionHandler');
        // Always reset and start timer for all modes except practice
        if ((gameInstance.playMode === 'quiz' || gameInstance.playMode === 'tournament') && !gameInstance.isDiffered) {
            // Global timer for quiz and live tournament
            await canonicalTimerService.resetTimer(accessCode, targetQuestion.uid, gameInstance.playMode, gameInstance.isDiffered);
            await canonicalTimerService.startTimer(accessCode, targetQuestion.uid, gameInstance.playMode, gameInstance.isDiffered);
            const elapsed = await canonicalTimerService.getElapsedTimeMs(accessCode, targetQuestion.uid, gameInstance.playMode, gameInstance.isDiffered);
            logger.info({
                accessCode,
                userId,
                questionUid: targetQuestion.uid,
                playMode: gameInstance.playMode,
                isDiffered: gameInstance.isDiffered,
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
        }
        else if (gameInstance.playMode === 'tournament' && gameInstance.isDiffered) {
            // Per-user session timer for differed tournaments
            await canonicalTimerService.resetTimer(accessCode, targetQuestion.uid, gameInstance.playMode, gameInstance.isDiffered, userId);
            await canonicalTimerService.startTimer(accessCode, targetQuestion.uid, gameInstance.playMode, gameInstance.isDiffered, userId);
            const elapsed = await canonicalTimerService.getElapsedTimeMs(accessCode, targetQuestion.uid, gameInstance.playMode, gameInstance.isDiffered, userId);
            logger.info({
                accessCode,
                userId,
                questionUid: targetQuestion.uid,
                playMode: gameInstance.playMode,
                isDiffered: gameInstance.isDiffered,
                elapsed
            }, '[TIMER_DEBUG] Timer reset, started, and elapsed calculated in emitQuestionHandler (differed)');
            timerPayload = {
                status: 'play',
                timeLeftMs: (targetQuestion.timeLimit || 30) * 1000 - elapsed,
                durationMs: (targetQuestion.timeLimit || 30) * 1000,
                questionUid: targetQuestion.uid,
                timestamp: Date.now() - elapsed,
                localTimeLeftMs: (targetQuestion.timeLimit || 30) * 1000 - elapsed
            };
        }
        else if (gameInstance.playMode === 'practice') {
            // No timer for practice mode
            timerPayload = null;
        }
        // Modernized: Prepare canonical, flat payload for game_question
        const questionIndex = allQuestions.findIndex(q => q.questionUid === targetQuestion.uid);
        const totalQuestions = allQuestions.length;
        let filteredQuestion = (0, liveQuestion_1.filterQuestionForClient)(targetQuestion);
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
        const { questionDataForStudentSchema } = await Promise.resolve().then(() => __importStar(require('@shared/types/socketEvents.zod')));
        const questionParseResult = questionDataForStudentSchema.safeParse(canonicalPayload);
        if (!questionParseResult.success) {
            logger.error({
                errors: questionParseResult.error.errors,
                canonicalPayload,
                schema: 'questionDataForStudentSchema',
                payloadKeys: Object.keys(canonicalPayload),
                payload: canonicalPayload
            }, '[MODERNIZATION] Invalid GAME_QUESTION payload, not emitting');
        }
        else {
            socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_QUESTION, canonicalPayload);
            logger.info({ accessCode, userId, questionUid: targetQuestion.uid, canonicalPayload }, '[MODERNIZATION] Emitted canonical GAME_QUESTION to user (student flow)');
        }
        // [MODERNIZATION] Emit canonical stats for new question to both projection and dashboard rooms
        const projectionRoom = `projection_${gameInstance.id}`;
        const dashboardRoom = `dashboard_${gameInstance.id}`;
        let answerStats = {};
        let showStats = false;
        try {
            // Canonical: get stats for this question if any exist
            const { getAnswerStats } = await Promise.resolve().then(() => __importStar(require('../teacherControl/helpers')));
            answerStats = await getAnswerStats(accessCode, targetQuestion.uid);
            // Defensive: always ensure answerStats is a non-null object
            if (!answerStats || typeof answerStats !== 'object')
                answerStats = {};
            showStats = answerStats && Object.keys(answerStats).length > 0;
        }
        catch (err) {
            logger.warn({ err, accessCode, questionUid: targetQuestion.uid }, '[PROJECTION] Could not fetch answer stats for new question, sending empty stats');
            answerStats = {};
            showStats = false;
        }
        // Canonical: use shared type and runtime validation for projection_show_stats event
        const statsPayload = {
            questionUid: targetQuestion.uid,
            show: showStats,
            stats: answerStats || {}, // Defensive: always non-null object
            timestamp: Date.now()
        };
        // Validate at runtime before emitting
        const statsParseResult = projectionShowStats_1.ProjectionShowStatsPayloadSchema.safeParse(statsPayload);
        if (!statsParseResult.success) {
            logger.error({ errors: statsParseResult.error.errors, statsPayload }, '[PROJECTION] Invalid PROJECTION_SHOW_STATS payload, not emitting');
        }
        else {
            io.to(projectionRoom).emit("projection_show_stats", statsPayload);
            io.to(dashboardRoom).emit("projection_show_stats", statsPayload);
            logger.info({ projectionRoom, dashboardRoom, questionUid: targetQuestion.uid, showStats, answerStats }, '[PROJECTION] Emitted PROJECTION_SHOW_STATS (canonical stats) to both projection and dashboard rooms for new question');
        }
    };
}
