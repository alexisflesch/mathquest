/**
 * emitQuestionResults.ts - Shared logic for emitting question results.
 */

import { Server } from 'socket.io';
import createLogger from '../../logger'; // Adjust path as necessary
// import { Question } from '../types/quizTypes'; // Or a shared Question type if available

const logger = createLogger('EmitQuestionResults');

/**
 * Interface for question result parameters
 */
export interface QuestionResultsParams {
    questionUid: string;
    correctAnswers: string[] | number[]; // Allow string[] for text answers or number[] for indices
    leaderboard?: Array<{ id: string, name: string, score: number, rank: number }>;
    participantAnswers?: Record<string, any>; // Optional detailed breakdown of participant answers
}

// Define types for room names to help with type safety
export type TournamentRoomName = `game_${string}` | `differed_${string}` | `game_${string}_${string}`;
export type QuizRoomName = `dashboard_${string}` | `quiz_${string}` | `quiz_projector_${string}`;

/**
 * Emits the results of a question to the specified room.
 *
 * @param io - The Socket.IO server instance.
 * @param roomName - The name of the room (quiz or tournament room)
 * @param params - Object containing question results parameters
 */
export function emitQuestionResults(
    io: Server,
    roomName: TournamentRoomName | QuizRoomName,
    params: QuestionResultsParams
): void {
    const { questionUid, correctAnswers, leaderboard, participantAnswers } = params;

    if (!questionUid) {
        logger.error('[emitQuestionResults] Attempted to emit results with no questionUid.');
        return;
    }
    if (!roomName) {
        logger.error(`[emitQuestionResults] Attempted to emit results for Q_UID ${questionUid} with no roomName.`);
        return;
    }

    logger.info(`[emitQuestionResults] Emitting 'question_results' to room '${roomName}' for Q_UID ${questionUid}`);

    // Send the complete payload with all provided parameters
    io.to(roomName).emit('question_results', {
        questionUid,
        correctAnswers,
        ...(leaderboard && { leaderboard }),
        ...(participantAnswers && { participantAnswers })
    });
}
