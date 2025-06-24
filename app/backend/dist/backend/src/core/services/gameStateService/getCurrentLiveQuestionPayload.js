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
const timerUtils_1 = require("@/core/services/timerUtils");
/**
 * Returns the canonical LiveQuestionPayload for a given game state and questions array.
 * Always uses timer.questionUid as the source of truth, patching from currentQuestionIndex if needed.
 * Used for both projection and live join/reload flows.
 */
async function getCurrentLiveQuestionPayload({ gameState, questionsArr, forceActiveState = false }) {
    let questionUid = gameState.timer?.questionUid;
    let questionIndex = -1;
    let currentQuestion = null;
    // Patch timer.questionUid from currentQuestionIndex if missing
    if (!questionUid && typeof gameState.currentQuestionIndex === 'number' && gameState.currentQuestionIndex >= 0 && gameState.currentQuestionIndex < questionsArr.length) {
        questionIndex = gameState.currentQuestionIndex;
        questionUid = questionsArr[questionIndex]?.question?.uid;
        // Patch timer.questionUid in memory (does not persist)
        gameState.timer = {
            ...gameState.timer,
            questionUid
        };
    }
    // Always use questionUid as canonical
    if (questionUid) {
        const found = questionsArr.findIndex((q) => q.question.uid === questionUid);
        if (found !== -1) {
            currentQuestion = questionsArr[found].question;
            questionIndex = found;
        }
    }
    if (currentQuestion) {
        const { filterQuestionForClient } = await Promise.resolve().then(() => __importStar(require('@shared/types/quiz/liveQuestion')));
        const filteredQuestion = filterQuestionForClient(currentQuestion);
        const totalQuestions = questionsArr.length;
        const actualTimer = (0, timerUtils_1.calculateTimerForLateJoiner)(gameState.timer);
        const liveQuestionPayload = {
            question: filteredQuestion,
            timer: actualTimer || gameState.timer,
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
