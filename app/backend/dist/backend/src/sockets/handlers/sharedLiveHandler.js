"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSharedLiveHandlers = registerSharedLiveHandlers;
const logger_1 = __importDefault(require("@/utils/logger"));
const events_1 = require("@shared/types/socket/events");
const logger = (0, logger_1.default)('SharedLiveHandler');
function registerSharedLiveHandlers(io, socket) {
    // Only register tournament-specific handlers here.
    // All quiz and tournament answer/question events are now handled by canonical handlers in game/index.ts
    // Remove joinHandler and answerHandler for quiz mode.
    // Only keep tournament-specific event registration:
    socket.on(events_1.TOURNAMENT_EVENTS.JOIN_TOURNAMENT, (payload) => {
        // ...existing code for tournament join...
    });
    socket.on(events_1.TOURNAMENT_EVENTS.TOURNAMENT_ANSWER, (payload) => {
        // ...existing code for tournament answer...
    });
}
