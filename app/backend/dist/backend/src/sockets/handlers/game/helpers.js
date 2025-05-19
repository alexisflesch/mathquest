"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANSWERS_KEY_PREFIX = exports.PARTICIPANTS_KEY_PREFIX = exports.GAME_KEY_PREFIX = void 0;
exports.getAllParticipants = getAllParticipants;
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
