/**
 * closeQuestionHandler.ts - Handles closing a quiz question, sending results, and locking further answers
 *
 * This handler processes the quiz_close_question event, which:
 * - Locks the question to prevent further answers
 * - Computes the correct answers
 * - Fetches the leaderboard
 * - Sends results to students, teacher, and projection screens
 */
import { Server, Socket } from 'socket.io';
import { CloseQuestionPayload } from '../types/socketTypes';
declare function handleCloseQuestion(io: Server, socket: Socket, { quizId, questionUid }: CloseQuestionPayload): void;
export default handleCloseQuestion;
