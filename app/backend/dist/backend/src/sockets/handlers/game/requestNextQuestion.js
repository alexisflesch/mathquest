"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestNextQuestionHandler = requestNextQuestionHandler;
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
const events_1 = require("@shared/types/socket/events");
const questionTypes_1 = require("@shared/constants/questionTypes");
const socketEvents_zod_1 = require("@shared/types/socketEvents.zod");
const logger = (0, logger_1.default)('RequestNextQuestionHandler');
function requestNextQuestionHandler(io, socket) {
    return async (payload) => {
        // Runtime validation with Zod
        const parseResult = socketEvents_zod_1.requestNextQuestionPayloadSchema.safeParse(payload);
        if (!parseResult.success) {
            const errorDetails = parseResult.error.format();
            logger.warn({
                socketId: socket.id,
                error: 'Invalid requestNextQuestion payload',
                details: errorDetails,
                payload
            }, 'Socket payload validation failed');
            const errorPayload = {
                message: 'Invalid requestNextQuestion payload',
                code: 'VALIDATION_ERROR',
                details: errorDetails
            };
            socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, errorPayload);
            return;
        }
        const validPayload = parseResult.data;
        const { accessCode, userId, currentQuestionUid } = validPayload;
        try {
            logger.info({ socketId: socket.id, event: 'request_next_question', accessCode, userId, currentQuestionUid }, 'Player requested next question');
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
            // Allow request_next_question for practice mode
            if (gameInstance.playMode !== 'practice') {
                logger.warn({ accessCode, userId }, 'Request next question is only for practice mode.');
                const errorPayload = { message: 'This operation is only for practice mode.' };
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
                include: {
                    question: true
                }
            });
            // 4. Use participant.answers to determine which questions are answered
            const answersArr = Array.isArray(participant.answers) ? participant.answers : [];
            const answeredSet = new Set(answersArr
                .filter(a => a && typeof a === 'object' && 'questionUid' in a)
                .map((a) => a.questionUid));
            // 5. Find next unanswered question - skip the current one
            let nextQuestion = null;
            if (currentQuestionUid) {
                // Find the current question's index
                const currentIndex = allQuestions.findIndex(q => q.questionUid === currentQuestionUid);
                if (currentIndex !== -1 && currentIndex < allQuestions.length - 1) {
                    // Get the next question
                    const nextQ = allQuestions[currentIndex + 1];
                    nextQuestion = nextQ.question;
                }
            }
            if (nextQuestion) {
                // Send next question
                logger.info({ accessCode, userId, nextQuestionUid: nextQuestion.uid }, 'Sending next question');
                // Log what we're about to send for debugging
                console.log('[REQUEST_NEXT_QUESTION] About to send question:', {
                    uid: nextQuestion.uid,
                    text: nextQuestion.text,
                    index: allQuestions.findIndex(q => q.questionUid === nextQuestion.uid)
                });
                // Create a properly formatted question payload according to QuestionData type
                const questionData = {
                    uid: nextQuestion.uid,
                    text: nextQuestion.text,
                    answerOptions: nextQuestion.answerOptions || [],
                    correctAnswers: nextQuestion.correctAnswers || [],
                    questionType: nextQuestion.questionType || questionTypes_1.QUESTION_TYPES.MULTIPLE_CHOICE_SINGLE_ANSWER,
                    timeLimit: nextQuestion.timeLimit || 30,
                    themes: nextQuestion.themes || [],
                    difficulty: nextQuestion.difficulty || 1,
                    discipline: nextQuestion.discipline || 'math',
                    title: nextQuestion.title || undefined
                };
                // Add current question index to the payload
                const questionIndex = allQuestions.findIndex(q => q.questionUid === nextQuestion.uid);
                const totalQuestions = allQuestions.length;
                // Create the proper LiveQuestionPayload structure
                const liveQuestionPayload = {
                    question: {
                        uid: nextQuestion.uid,
                        text: nextQuestion.text,
                        questionType: nextQuestion.questionType || questionTypes_1.QUESTION_TYPES.MULTIPLE_CHOICE_SINGLE_ANSWER,
                        answerOptions: nextQuestion.answerOptions || []
                    },
                    timer: {
                        status: 'play',
                        timeLeftMs: (nextQuestion.timeLimit || 30) * 1000,
                        durationMs: (nextQuestion.timeLimit || 30) * 1000,
                        questionUid: nextQuestion.uid,
                        timestamp: Date.now(),
                        localTimeLeftMs: (nextQuestion.timeLimit || 30) * 1000
                    },
                    questionIndex: questionIndex,
                    totalQuestions: totalQuestions,
                    questionState: 'active'
                };
                // Send the question data using the proper LiveQuestionPayload structure
                socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_QUESTION, liveQuestionPayload);
            }
            else {
                // All questions answered: compute and send final score
                const total = allQuestions.length;
                // Count correct answers for this participant
                let correctCount = 0;
                for (const a of answersArr) {
                    if (a && typeof a === 'object' && 'questionUid' in a && typeof a.questionUid === 'string' && 'answer' in a) {
                        const q = await prisma_1.prisma.question.findUnique({ where: { uid: a.questionUid } });
                        if (q && Array.isArray(q.correctAnswers) && typeof a.answer === 'number') {
                            if (q.correctAnswers[a.answer] === true)
                                correctCount++;
                        }
                    }
                }
                // Send final score
                logger.info({ accessCode, userId, correctCount, total }, 'Practice mode completed, sending final score');
                const gameEndedPayload = {
                    accessCode,
                    score: correctCount,
                    totalQuestions: total,
                    correct: correctCount,
                    total: total
                };
                socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ENDED, gameEndedPayload);
                // Update participant as completed
                await prisma_1.prisma.gameParticipant.update({
                    where: { id: participant.id },
                    data: { completedAt: new Date() }
                });
            }
        }
        catch (err) {
            logger.error({ err, socketId: socket.id }, 'Error handling request_next_question');
            const errorPayload = { message: 'Error processing next question request.' };
            socket.emit(events_1.SOCKET_EVENTS.GAME.GAME_ERROR, errorPayload);
        }
    };
}
