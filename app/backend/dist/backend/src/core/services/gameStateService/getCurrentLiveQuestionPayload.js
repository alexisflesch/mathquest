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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentLiveQuestionPayload = getCurrentLiveQuestionPayload;
const gameStateService = __importStar(require("@/core/services/gameStateService"));
/**
 * Returns the canonical LiveQuestionPayload for a given game state and questions array.
 * Always uses questionUid as the source of truth, never mutates gameState.timer.
 * Used for both projection and live join/reload flows.
 */
async function getCurrentLiveQuestionPayload({ gameState, questionsArr, forceActiveState = false }) {
    // --- MODERNIZATION: Use only canonical timer system, never mutate gameState.timer ---
    // LEGACY: let questionUid = gameState.timer?.questionUid;
    let questionUid = undefined;
    let questionIndex = -1;
    let currentQuestion = null;
    // Always use currentQuestionIndex as canonical
    if (typeof gameState.currentQuestionIndex === 'number' && gameState.currentQuestionIndex >= 0 && gameState.currentQuestionIndex < questionsArr.length) {
        questionIndex = gameState.currentQuestionIndex;
        currentQuestion = questionsArr[questionIndex]?.question;
        questionUid = currentQuestion?.uid;
    }
    if (currentQuestion && questionUid) {
        const { filterQuestionForClient } = await Promise.resolve().then(() => __importStar(require('@shared/types/quiz/liveQuestion')));
        const filteredQuestion = filterQuestionForClient(currentQuestion);
        const totalQuestions = questionsArr.length;
        // --- MODERNIZATION: Use canonical timer system ---
        // Always use canonical durationMs from the question object (no fallback allowed)
        const durationMs = typeof currentQuestion.timeLimit === 'number' && currentQuestion.timeLimit > 0 ? currentQuestion.timeLimit * 1000 : 0;
        if (durationMs <= 0) {
            // eslint-disable-next-line no-console
            console.error({ currentQuestion, durationMs }, '[GET_CURRENT_LIVE_QUESTION_PAYLOAD] Failed to get canonical durationMs');
            // handle error or return
        }
        const canonicalTimer = await gameStateService.getCanonicalTimer(gameState.accessCode, questionUid, gameState.gameMode, gameState.status === 'completed', durationMs, undefined);
        const liveQuestionPayload = {
            question: filteredQuestion,
            timer: canonicalTimer, // Only canonical timer
            questionIndex,
            totalQuestions
        };
        if (forceActiveState) {
            liveQuestionPayload.questionState = 'active';
        }
        return liveQuestionPayload;
    }
    return null;
}
