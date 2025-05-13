/**
 * sendTournamentQuestion.ts - Centralized helper to emit filtered tournament questions to students
 *
 * THIS FILE IS NOW DEPRECATED.
 * The shared logic has been moved to /sharedLiveLogic/sendQuestion.ts
 * This file is kept temporarily for reference during transition and will be removed.
 */

import { BroadcastOperator } from 'socket.io'; // Corrected import
import type { Question } from '../types/quizTypes';
import createLogger from '../../logger'; // Changed to ES6 import
// import { sendTournamentQuestion } from './sharedTournamentUtils'; // Old import, no longer needed

const logger = createLogger('SendTournamentQuestion_DEPRECATED');

logger.warn("DEPRECATION WARNING: sendTournamentQuestion.ts is deprecated and will be removed. Use sharedLiveLogic/sendQuestion.ts instead.");

/**
 * Question payload for tournament questions sent to students
 */
export interface TournamentQuestionPayload { // Added export
    code: string;
    question: Question;
    timer: number;
    tournoiState: 'running' | 'paused' | 'stopped';
    questionIndex: number;
    totalQuestions?: number; // Added totalQuestions
    questionId: string;
}

/**
 * Filtered question data sent to students (no answers with correct information)
 */
interface FilteredQuestionData {
    type: string | undefined; // Allow type to be undefined
    uid: string;
    question: string; // Ensure this is always a string
    answers: string[];
    index?: number;
    total?: number;
    remainingTime?: number;
    questionState?: string;
    isQuizMode?: boolean;
    tournoiState?: string;
    timer?: number;
}

/**
 * Creates filtered question data for sending to students. (Internal helper)
 *
 * @param payload - Question payload with tournament data
 * @returns Filtered question data
 */
function createFilteredQuestionData(payload: TournamentQuestionPayload): FilteredQuestionData {
    const { question, timer, tournoiState, questionIndex } = payload;

    return {
        type: question.type, // No change needed here as FilteredQuestionData now allows undefined
        uid: question.uid,
        question: question.question ?? '', // Handle potentially undefined question text
        answers: Array.isArray(question.reponses)
            ? question.reponses.map(r => r.texte)
            : [],
        index: questionIndex,
        tournoiState,
        timer
    };
}

/**
 * Sends a filtered tournament question to students using a pre-configured emitter.
 *
 * @param targetEmitter - Socket.IO BroadcastOperator (e.g., io.to(room))
 * @param payload - Question payload with tournament data
 */
// Rename the local function to avoid conflict
function localSendTournamentQuestion(
    targetEmitter: BroadcastOperator<any, any>, // Provide the required type arguments
    payload: TournamentQuestionPayload
): void {
    targetEmitter.emit('tournament_question', payload);
}

/**
 * Legacy format support for backwards compatibility during migration.
 * Sends a filtered tournament question using a pre-configured emitter.
 *
 * @param targetEmitter - Socket.IO BroadcastOperator
 * @param questionObj - The question object
 * @param index - Question index
 * @param total - Total questions
 * @param remainingTime - Remaining time for the question
 * @param questionState - Current state of the question
 * @param isQuizMode - Flag if in quiz mode
 */
function legacySendTournamentQuestion(
    targetEmitter: BroadcastOperator<any, any>, // Changed type to BroadcastOperator
    questionObj: Question,
    index?: number,
    total?: number,
    remainingTime?: number,
    questionState?: string,
    isQuizMode?: boolean
): void {
    const filteredPayload: FilteredQuestionData = {
        type: questionObj.type, // No change needed here
        uid: questionObj.uid,
        question: questionObj.question ?? '', // Handle potentially undefined question text
        answers: Array.isArray(questionObj.reponses)
            ? questionObj.reponses.map(r => r.texte)
            : [],
        index,
        total,
        remainingTime,
        questionState,
        isQuizMode
    };

    logger.info(`[legacySendTournamentQuestion] Emitting tournament_question (room derived by caller)`);
    targetEmitter.emit('tournament_question', filteredPayload);
}

// Update export to use the renamed function
export {
    localSendTournamentQuestion as sendTournamentQuestion,
    legacySendTournamentQuestion,
    createFilteredQuestionData
};

// Export default for default imports
export default localSendTournamentQuestion;

// Direct CommonJS export - simpler and more reliable pattern
if (typeof module !== 'undefined' && module.exports) {
    // Directly assign to module.exports rather than using a separate object
    module.exports = {
        sendTournamentQuestion: localSendTournamentQuestion,
        legacySendTournamentQuestion,
        createFilteredQuestionData,
        default: localSendTournamentQuestion // Keep default as the main function
    };
}