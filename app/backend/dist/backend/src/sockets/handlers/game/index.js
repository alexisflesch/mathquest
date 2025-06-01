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
exports.registerTournamentHandlers = void 0;
exports.registerGameHandlers = registerGameHandlers;
const joinGame_1 = require("./joinGame");
const gameAnswer_1 = require("./gameAnswer");
const requestParticipants_1 = require("./requestParticipants");
const disconnect_1 = require("./disconnect");
const requestNextQuestion_1 = require("./requestNextQuestion");
const events_1 = require("@shared/types/socket/events");
const logger_1 = __importDefault(require("@/utils/logger"));
const logger = (0, logger_1.default)('GameHandlers');
function registerGameHandlers(io, socket) {
    logger.info({ socketId: socket.id }, 'Registering game handlers');
    // Register direct handlers on socket instance using shared constants
    socket.on(events_1.GAME_EVENTS.JOIN_GAME, (0, joinGame_1.joinGameHandler)(io, socket));
    socket.on(events_1.GAME_EVENTS.GAME_ANSWER, (0, gameAnswer_1.gameAnswerHandler)(io, socket));
    socket.on(events_1.GAME_EVENTS.REQUEST_PARTICIPANTS, (0, requestParticipants_1.requestParticipantsHandler)(io, socket));
    socket.on(events_1.GAME_EVENTS.REQUEST_NEXT_QUESTION, (0, requestNextQuestion_1.requestNextQuestionHandler)(io, socket));
    socket.on('disconnect', (0, disconnect_1.disconnectHandler)(io, socket));
    // Direct handler for start_game in practice mode
    socket.on(events_1.GAME_EVENTS.START_GAME, async (payload) => {
        logger.info({ socketId: socket.id, payload }, 'Start game event received');
        try {
            const { accessCode, userId } = payload;
            const prismaInstance = (await Promise.resolve().then(() => __importStar(require('@/db/prisma')))).prisma;
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
                socket.emit(events_1.GAME_EVENTS.GAME_ERROR, { message: 'Game not found or template missing.' });
                return;
            }
            if (gameInstance.playMode !== 'practice') {
                logger.warn({ socketId: socket.id, playMode: gameInstance.playMode }, 'start_game is only for practice mode');
                socket.emit(events_1.GAME_EVENTS.GAME_ERROR, { message: 'start_game only allowed in practice mode.' });
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
                socket.emit(events_1.GAME_EVENTS.GAME_ERROR, { message: 'No questions available in this game.' });
                return;
            }
            // Get first question
            const firstQuestionInTemplate = gameInstance.gameTemplate.questions[0];
            const firstQuestion = firstQuestionInTemplate.question;
            // Send first question
            logger.info({ socketId: socket.id, questionId: firstQuestion.uid }, 'Sending first question');
            // Send first question data directly as per QuestionData type
            socket.emit(events_1.GAME_EVENTS.GAME_QUESTION, {
                uid: firstQuestion.uid,
                text: firstQuestion.text,
                answerOptions: firstQuestion.answerOptions,
                correctAnswers: firstQuestion.correctAnswers,
                timeLimit: firstQuestion.timeLimit,
                questionType: firstQuestion.questionType,
                themes: firstQuestion.themes,
                difficulty: firstQuestion.difficulty,
                discipline: firstQuestion.discipline,
                title: firstQuestion.title || undefined,
                currentQuestionIndex: 0,
                totalQuestions: gameInstance.gameTemplate.questions.length
            });
        }
        catch (err) {
            logger.error({ socketId: socket.id, error: err }, 'Error in start_game handler');
            socket.emit(events_1.GAME_EVENTS.GAME_ERROR, { message: 'Failed to start game: ' + err.message });
        }
    });
}
var index_1 = require("../tournament/index");
Object.defineProperty(exports, "registerTournamentHandlers", { enumerable: true, get: function () { return index_1.registerTournamentHandlers; } });
