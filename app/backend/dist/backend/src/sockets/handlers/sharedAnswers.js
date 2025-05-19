"use strict";
// Shared answer collection logic for quiz and tournament modes
// This module should be imported by both quiz and tournament handlers
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectAnswers = collectAnswers;
const redis_1 = require("@/config/redis");
const logger_1 = __importDefault(require("@/utils/logger"));
const logger = (0, logger_1.default)('AnswerUtils');
/**
 * Collect all answers for a given question in a game
 * @param accessCode Game access code
 * @param questionUid Question UID
 * @returns Array of answer objects
 */
async function collectAnswers(accessCode, questionUid) {
    const answersRaw = await redis_1.redisClient.hgetall(`mathquest:game:answers:${accessCode}:${questionUid}`);
    if (!answersRaw)
        return [];
    return Object.values(answersRaw).map((json) => JSON.parse(json));
}
