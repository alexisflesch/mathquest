"use strict";
/**
 * Shared Types for MathQuest
 *
 * This file serves as the main entry point for all shared types across frontend and backend.
 *
 * Import this file using:
 * import { Question, Answer, ... } from '@shared/types';
 */
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOCKET_EVENTS = exports.PROJECTOR_EVENTS = exports.LOBBY_EVENTS = exports.TOURNAMENT_EVENTS = exports.GAME_EVENTS = exports.TEACHER_EVENTS = void 0;
// Export consolidated core types (new unified type system)
__exportStar(require("./core"), exports);
// export type { Question as QuizQuestion } from './quiz/question'; // Removed - unused
__exportStar(require("./socket/payloads"), exports);
__exportStar(require("./socket/events"), exports); // Export socket event constants
__exportStar(require("./util/logger"), exports);
__exportStar(require("./util/typeMapping"), exports); // Export type mapping utilities
__exportStar(require("./util/schemaValidation"), exports); // Export schema validation utilities
__exportStar(require("./util/schemaDefinitions"), exports); // Export schema definitions
// Export event constants 
var events_1 = require("./socket/events");
Object.defineProperty(exports, "TEACHER_EVENTS", { enumerable: true, get: function () { return events_1.TEACHER_EVENTS; } });
Object.defineProperty(exports, "GAME_EVENTS", { enumerable: true, get: function () { return events_1.GAME_EVENTS; } });
Object.defineProperty(exports, "TOURNAMENT_EVENTS", { enumerable: true, get: function () { return events_1.TOURNAMENT_EVENTS; } });
Object.defineProperty(exports, "LOBBY_EVENTS", { enumerable: true, get: function () { return events_1.LOBBY_EVENTS; } });
Object.defineProperty(exports, "PROJECTOR_EVENTS", { enumerable: true, get: function () { return events_1.PROJECTOR_EVENTS; } });
Object.defineProperty(exports, "SOCKET_EVENTS", { enumerable: true, get: function () { return events_1.SOCKET_EVENTS; } });
// export type { TournamentState } from './tournament/state'; // Removed - unused
// Export shared constants
__exportStar(require("../constants"), exports);
