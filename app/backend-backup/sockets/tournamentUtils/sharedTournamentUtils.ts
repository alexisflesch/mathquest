/**
 * sharedTournamentUtils.ts - Shared logic for tournament operations
 *
 * This module contains shared functions used by multiple tournament modules.
 */

import { BroadcastOperator } from 'socket.io';
import { Question } from '../types/quizTypes';
import createLogger from '../../logger';

const logger = createLogger('SharedTournamentUtils');

/**
 * Sends a filtered tournament question to students using a pre-configured emitter.
 *
 * @param targetEmitter - Socket.IO BroadcastOperator (e.g., io.to(room))
 * @param payload - Question payload with tournament data
 */
export function sendTournamentQuestion(
    targetEmitter: BroadcastOperator<any, any>,
    payload: {
        code: string;
        question: Question;
        timer: number;
        tournoiState: 'running' | 'paused' | 'stopped';
        questionIndex: number;
        questionUid: string;
    }
): void {
    const { code, questionUid } = payload;

    // Create filtered payload without sensitive data
    const filteredPayload = {
        type: payload.question.type,
        uid: payload.question.uid,
        question: payload.question.question ?? '',
        answers: Array.isArray(payload.question.answers)
            ? payload.question.answers.map(r => r.text)
            : [],
        index: payload.questionIndex,
        tournoiState: payload.tournoiState,
        timer: payload.timer,
    };

    // Log what we're sending
    logger.info(`[sendTournamentQuestion] Emitting tournament_question to tournament ${code} with question ${questionUid}`);

    // Emit to the already targeted emitter
    targetEmitter.emit('tournament_question', filteredPayload);
}
