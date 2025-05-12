/**
 * sharedTournamentUtils.ts - Shared logic for tournament operations
 *
 * This module contains shared functions used by multiple tournament modules.
 */
import { BroadcastOperator } from 'socket.io';
import { Question } from '../types/quizTypes';
/**
 * Sends a filtered tournament question to students using a pre-configured emitter.
 *
 * @param targetEmitter - Socket.IO BroadcastOperator (e.g., io.to(room))
 * @param payload - Question payload with tournament data
 */
export declare function sendTournamentQuestion(targetEmitter: BroadcastOperator<any, any>, payload: {
    code: string;
    question: Question;
    timer: number;
    tournoiState: 'running' | 'paused' | 'stopped';
    questionIndex: number;
    questionId: string;
}): void;
