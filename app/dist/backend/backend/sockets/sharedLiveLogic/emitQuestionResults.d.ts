/**
 * emitQuestionResults.ts - Shared logic for emitting question results.
 */
import { Server } from 'socket.io';
/**
 * Interface for question result parameters
 */
export interface QuestionResultsParams {
    questionUid: string;
    correctAnswers: string[] | number[];
    leaderboard?: Array<{
        id: string;
        name: string;
        score: number;
        rank: number;
    }>;
    participantAnswers?: Record<string, any>;
}
export type TournamentRoomName = `live_${string}` | `differed_${string}` | `live_${string}_${string}`;
export type QuizRoomName = `dashboard_${string}` | `quiz_${string}` | `quiz_projector_${string}`;
/**
 * Emits the results of a question to the specified room.
 *
 * @param io - The Socket.IO server instance.
 * @param roomName - The name of the room (quiz or tournament room)
 * @param params - Object containing question results parameters
 */
export declare function emitQuestionResults(io: Server, roomName: TournamentRoomName | QuizRoomName, params: QuestionResultsParams): void;
