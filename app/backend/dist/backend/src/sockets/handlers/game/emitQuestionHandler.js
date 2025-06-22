"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitQuestionHandler = emitQuestionHandler;
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
const events_1 = require("@shared/types/socket/events");
const questionTypes_1 = require("@shared/constants/questionTypes");
const timingService_1 = require("@/services/timingService");
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
        // Track timing for this question
        try {
            const wasSet = await timingService_1.TimingService.trackQuestionStart(accessCode, targetQuestion.uid, userId);
            logger.info({ accessCode, userId, questionUid: targetQuestion.uid, wasSet }, '[DEBUG] TimingService.trackQuestionStart result');
        }
        catch (err) {
            logger.error({ accessCode, userId, questionUid: targetQuestion.uid, err }, '[ERROR] TimingService.trackQuestionStart failed');
        }
        // Prepare payload
        const questionIndex = allQuestions.findIndex(q => q.questionUid === targetQuestion.uid);
        const totalQuestions = allQuestions.length;
        const liveQuestionPayload = {
            question: {
                uid: targetQuestion.uid,
                text: targetQuestion.text,
                questionType: targetQuestion.questionType || questionTypes_1.QUESTION_TYPES.MULTIPLE_CHOICE_SINGLE_ANSWER,
                answerOptions: targetQuestion.answerOptions || []
            },
            timer: {
                status: 'play',
                timeLeftMs: (targetQuestion.timeLimit || 30) * 1000,
                durationMs: (targetQuestion.timeLimit || 30) * 1000,
                questionUid: targetQuestion.uid,
                timestamp: Date.now(),
                localTimeLeftMs: (targetQuestion.timeLimit || 30) * 1000
            },
            questionIndex: questionIndex,
            totalQuestions: totalQuestions,
            questionState: 'active'
        };
        // Emit to the socket (or room as needed)
        socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_QUESTION, liveQuestionPayload);
        logger.info({ accessCode, userId, questionUid: targetQuestion.uid }, '[DEBUG] Emitted question to user');
    };
}
