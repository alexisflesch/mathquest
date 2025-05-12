/**
 * sendTournamentQuestion.ts - Centralized helper to emit filtered tournament questions to students
 *
 * This function ensures only the minimal, non-sensitive fields are sent to students:
 * - type: question type (e.g., 'choix_simple', 'choix_multiple')
 * - uid: question unique id
 * - question: question text
 * - answers: array of answer texts (no 'correct' field)
 *
 * Usage:
 *   import { sendTournamentQuestion } from './tournamentUtils/sendTournamentQuestion';
 *   sendTournamentQuestion(targetEmitter, payload); // targetEmitter is io.to(room) or socket.to(room)
 */
import { BroadcastOperator } from 'socket.io';
import type { Question } from '../types/quizTypes';
/**
 * Question payload for tournament questions sent to students
 */
export interface TournamentQuestionPayload {
    code: string;
    question: Question;
    timer: number;
    tournoiState: 'running' | 'paused' | 'stopped';
    questionIndex: number;
    questionId: string;
}
/**
 * Filtered question data sent to students (no answers with correct information)
 */
interface FilteredQuestionData {
    type: string;
    uid: string;
    question: string;
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
declare function createFilteredQuestionData(payload: TournamentQuestionPayload): FilteredQuestionData;
/**
 * Sends a filtered tournament question to students using a pre-configured emitter.
 *
 * @param targetEmitter - Socket.IO BroadcastOperator (e.g., io.to(room))
 * @param payload - Question payload with tournament data
 */
declare function localSendTournamentQuestion(targetEmitter: BroadcastOperator<any, any>, // Provide the required type arguments
payload: TournamentQuestionPayload): void;
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
declare function legacySendTournamentQuestion(targetEmitter: BroadcastOperator<any, any>, // Changed type to BroadcastOperator
questionObj: Question, index?: number, total?: number, remainingTime?: number, questionState?: string, isQuizMode?: boolean): void;
export { localSendTournamentQuestion as sendTournamentQuestion, legacySendTournamentQuestion, createFilteredQuestionData };
export default localSendTournamentQuestion;
