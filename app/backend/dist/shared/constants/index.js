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
exports.isValidQuestionType = exports.TIMEOUT_CONSTANTS = exports.QUESTION_TYPES = void 0;
__exportStar(require("./questionTypes"), exports);
// Re-export commonly used constants for convenience
var questionTypes_1 = require("./questionTypes");
Object.defineProperty(exports, "QUESTION_TYPES", { enumerable: true, get: function () { return questionTypes_1.QUESTION_TYPES; } });
Object.defineProperty(exports, "TIMEOUT_CONSTANTS", { enumerable: true, get: function () { return questionTypes_1.TIMEOUT_CONSTANTS; } });
Object.defineProperty(exports, "isValidQuestionType", { enumerable: true, get: function () { return questionTypes_1.isValidQuestionType; } });
