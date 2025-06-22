"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logParticipationEvent = logParticipationEvent;
const logger_1 = __importDefault(require("@/utils/logger"));
const logger = (0, logger_1.default)('GameParticipantLoggingService');
/**
 * Log a participation event (join, answer, finish, etc.)
 * This should be called for all major participant actions for audit/debug.
 */
function logParticipationEvent({ event, userId, gameInstanceId, details }) {
    logger.info({
        event,
        userId,
        gameInstanceId,
        ...details
    }, `GameParticipant event: ${event}`);
}
