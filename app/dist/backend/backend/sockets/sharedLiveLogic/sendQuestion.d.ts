/**
 * sendQuestion.ts - Centralized helper to emit filtered questions to clients (students, projector)
 *
 * This function ensures only the minimal, non-sensitive fields are sent.
 * It standardizes the question payload for both quiz and tournament modes.
 */
import { Server } from 'socket.io';
import type { Question } from '../../../shared/types/quiz/question';
/**
 * Sends a filtered question to the specified room using a pre-configured emitter.
 *
 * @param io - Socket.IO Server instance
 * @param roomName - The name of the room to emit to (e.g., `live_${code}`, `projection_${quizId}`)
 * @param questionObject - The full question object
 * @param timer - Optional timer duration for this question
 * @param questionIndex - Optional index of the current question
 * @param totalQuestions - Optional total number of questions
 * @param modeSpecificData - Optional additional data specific to the mode (quiz/tournament)
 * @param questionState - Optional state of the question (active, paused, etc.)
 */
export declare function sendQuestion(io: Server, roomName: string, questionObject: Question, timer?: number, questionIndex?: number, totalQuestions?: number, modeSpecificData?: Record<string, any>, questionState?: 'pending' | 'active' | 'paused' | 'stopped' | 'finished'): void;
