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
    // ⚠️ SECURITY: Filter question to remove sensitive data (correctAnswers, explanation, etc.)
    const { filterQuestionForClient } = await Promise.resolve().then(() => __importStar(require('@/../../shared/types/quiz/liveQuestion')));
    const filteredQuestion = filterQuestionForClient(firstQ);
    // Modernized: Canonical, flat payload for game_question
    const { questionDataForStudentSchema } = await Promise.resolve().then(() => __importStar(require('@/../../shared/types/socketEvents.zod')));
    let canonicalPayload = {
        ...filteredQuestion,
        currentQuestionIndex: 0,
        totalQuestions: 1
    };
    // Ensure timeLimit is present and valid (schema requires positive integer)
    if (canonicalPayload.timeLimit == null || canonicalPayload.timeLimit <= 0) {
        logger.warn(`Question ${canonicalPayload.uid} has invalid timeLimit: ${canonicalPayload.timeLimit}, using default 30s`);
        canonicalPayload.timeLimit = 30; // Default to 30 seconds
    }
    const parseResult = questionDataForStudentSchema.safeParse(canonicalPayload);
    if (!parseResult.success) {
        logger.error({ errors: parseResult.error.errors, canonicalPayload }, '[MODERNIZATION] Invalid GAME_QUESTION payload, not emitting');
        return;
    }
    if (mode === 'practice') {
        // target is a socket
        logger.info({ targetSocketId: target.id, event: 'game_question', payloadJson: JSON.stringify(canonicalPayload) }, 'Emitting canonical game_question to practice mode socket');
        logger.info({ socketConnected: target.connected, socketId: target.id }, 'Socket connection state');
        try {
            target.emit('game_question', canonicalPayload);
            logger.info('game_question event emitted');
        }
        catch (err) {
            logger.error({ err }, 'Error emitting game_question');
        }
    }
    else {
        // target is a room string
        io.to(target).emit('game_question', canonicalPayload);
    }
    // Timer logic (if needed)
    // For practice, timer is per-player; for quiz, timer is per-room/teacher controlled
    // (Implement timer logic here if required)
}
