"use strict";
/**
 * Shared Constants Index
 *
 * Central export point for all shared constants used throughout MathQuest
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
exports.getFeedbackDisplayTime = exports.getCorrectAnswersDisplayTime = exports.GAME_TIMING = exports.QUESTION_TYPES = void 0;
__exportStar(require("./questionTypes"), exports);
__exportStar(require("./gameTimings"), exports);
// Re-export commonly used constants for convenience
var questionTypes_1 = require("./questionTypes");
Object.defineProperty(exports, "QUESTION_TYPES", { enumerable: true, get: function () { return questionTypes_1.QUESTION_TYPES; } });
var gameTimings_1 = require("./gameTimings");
Object.defineProperty(exports, "GAME_TIMING", { enumerable: true, get: function () { return gameTimings_1.GAME_TIMING; } });
Object.defineProperty(exports, "getCorrectAnswersDisplayTime", { enumerable: true, get: function () { return gameTimings_1.getCorrectAnswersDisplayTime; } });
Object.defineProperty(exports, "getFeedbackDisplayTime", { enumerable: true, get: function () { return gameTimings_1.getFeedbackDisplayTime; } });
