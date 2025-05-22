"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANSWERS_KEY_PREFIX = exports.PARTICIPANTS_KEY_PREFIX = exports.GAME_KEY_PREFIX = void 0;
exports.getAllParticipants = getAllParticipants;
exports.sendFirstQuestionAndStartTimer = sendFirstQuestionAndStartTimer;
const redis_1 = require("@/config/redis");
const logger_1 = __importDefault(require("@/utils/logger"));
// Create a helper-specific logger
const logger = (0, logger_1.default)('GameHelpers');
// Redis key prefixes
exports.GAME_KEY_PREFIX = 'mathquest:game:';
exports.PARTICIPANTS_KEY_PREFIX = 'mathquest:game:participants:';
exports.ANSWERS_KEY_PREFIX = 'mathquest:game:answers:';
/**
 * Helper to get all participants for a game
 * @param accessCode The game access code
 * @returns Array of participant objects
 */
async function getAllParticipants(accessCode) {
    const participantsRaw = await redis_1.redisClient.hgetall(`${exports.PARTICIPANTS_KEY_PREFIX}${accessCode}`);
    if (!participantsRaw) {
        return [];
    }
    return Object.values(participantsRaw).map(json => JSON.parse(json));
}
/**
 * Send the first question to a socket (practice) or room (quiz), and start timer if needed.
 * @param io Socket.IO server
 * @param target Socket or room string
 * @param gameInstance Prisma gameInstance (with template)
 * @param questionsInTemplate Ordered list of questions
 * @param mode 'practice' | 'quiz'
 */
async function sendFirstQuestionAndStartTimer({ io, target, gameInstance, questionsInTemplate, mode }) {
    logger.info({ gameInstanceId: gameInstance.id, targetId: target.id, mode, questionsCount: questionsInTemplate.length }, 'Inside sendFirstQuestionAndStartTimer');
    if (!questionsInTemplate.length) {
        logger.warn({ gameInstanceId: gameInstance.id, mode }, 'No questions in template, cannot send first question.');
        return;
    }
    const firstQ = questionsInTemplate[0].question;
    const payload = {
        question: {
            uid: firstQ.uid,
            text: firstQ.text,
            answerOptions: firstQ.answerOptions,
            correctAnswers: firstQ.correctAnswers,
            timeLimit: firstQ.timeLimit,
            questionType: firstQ.questionType,
            themes: firstQ.themes,
            difficulty: firstQ.difficulty,
            discipline: firstQ.discipline,
            title: firstQ.title || undefined
        },
        index: 0
    };
    if (mode === 'practice') {
        // target is a socket
        logger.info({ targetSocketId: target.id, event: 'game_question', payloadJson: JSON.stringify(payload) }, 'Emitting game_question to practice mode socket');
        // Check if the socket is connected and valid
        logger.info({ socketConnected: target.connected, socketId: target.id }, 'Socket connection state');
        try {
            // Emit with an explicit acknowledgement callback
            target.emit('game_question', payload, (ack) => {
                logger.info({ ack }, 'game_question acknowledged');
            });
            logger.info('game_question event emitted');
        }
        catch (err) {
            logger.error({ err }, 'Error emitting game_question');
        }
    }
    else {
        // target is a room string
        io.to(target).emit('game_question', payload);
    }
    // Timer logic (if needed)
    // For practice, timer is per-player; for quiz, timer is per-room/teacher controlled
    // (Implement timer logic here if required)
}
