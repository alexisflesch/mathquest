import type { GameState } from '@shared/types/core/game';
import type { Question } from '@shared/types/quiz/question';
import * as gameStateService from '@/core/services/gameStateService';

/**
 * Returns the canonical LiveQuestionPayload for a given game state and questions array.
 * Always uses questionUid as the source of truth, never mutates gameState.timer.
 * Used for both projection and live join/reload flows.
 */
export async function getCurrentLiveQuestionPayload({
    gameState,
    questionsArr,
    forceActiveState = false
}: {
    gameState: GameState;
    questionsArr: { question: Question }[];
    forceActiveState?: boolean;
}) {
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
        const { filterQuestionForClient } = await import('@shared/types/quiz/liveQuestion');
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
        const canonicalTimer = await gameStateService.getCanonicalTimer(
            gameState.accessCode,
            questionUid,
            gameState.gameMode,
            gameState.status === 'completed',
            durationMs,
            undefined
        );
        const liveQuestionPayload: any = {
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
