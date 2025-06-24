import type { GameState } from '@shared/types/core/game';
import type { Question } from '@shared/types/quiz/question';
import { calculateTimerForLateJoiner } from '@/core/services/timerUtils';

/**
 * Returns the canonical LiveQuestionPayload for a given game state and questions array.
 * Always uses timer.questionUid as the source of truth, patching from currentQuestionIndex if needed.
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
        const found = questionsArr.findIndex((q: any) => q.question.uid === questionUid);
        if (found !== -1) {
            currentQuestion = questionsArr[found].question;
            questionIndex = found;
        }
    }

    if (currentQuestion) {
        const { filterQuestionForClient } = await import('@shared/types/quiz/liveQuestion');
        const filteredQuestion = filterQuestionForClient(currentQuestion);
        const totalQuestions = questionsArr.length;
        const actualTimer = calculateTimerForLateJoiner(gameState.timer);
        const liveQuestionPayload: any = {
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
