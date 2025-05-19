// Shared game flow logic for quiz and tournament modes
// Place all core progression, timer, answer reveal, feedback, and leaderboard logic here
// This module should be imported by both quiz and tournament handlers

import { Server as SocketIOServer, Socket } from 'socket.io';
import { redisClient } from '@/config/redis';
import createLogger from '@/utils/logger';

const logger = createLogger('SharedGameFlow');

export interface GameFlowOptions {
    playMode: 'quiz' | 'tournament';
    onQuestionStart?: (questionIndex: number) => void;
    onQuestionEnd?: (questionIndex: number) => void;
    onFeedback?: (questionIndex: number) => void;
    onGameEnd?: () => void;
    // Add more hooks as needed
}

/**
 * Shared function to orchestrate the game/tournament flow
 * Handles question progression, timers, answer reveal, feedback, and leaderboard
 * @param io Socket.IO server
 * @param accessCode Game access code (room)
 * @param questions Array of questions
 * @param options GameFlowOptions for mode-specific hooks
 */
export async function runGameFlow(
    io: SocketIOServer,
    accessCode: string,
    questions: any[],
    options: GameFlowOptions
) {
    // Example: iterate through questions, manage timers, emit events
    for (let i = 0; i < questions.length; i++) {
        // 1. Emit question to room, include feedbackWaitTime
        logger.info({ accessCode, questionIndex: i, questionUid: questions[i].uid }, '[DEBUG] Preparing to emit game_question');
        logger.info({ room: `live_${accessCode}`, event: 'game_question', payload: { question: questions[i], index: i, feedbackWaitTime: questions[i].feedbackWaitTime || (options.playMode === 'tournament' ? 1.5 : 1) } }, '[DEBUG] Emitting game_question');
        io.to(`live_${accessCode}`).emit('game_question', {
            question: questions[i],
            index: i,
            feedbackWaitTime: questions[i].feedbackWaitTime || (options.playMode === 'tournament' ? 1.5 : 1)
        });
        options.onQuestionStart?.(i);

        // 2. Start timer (simulate with setTimeout for now, replace with real timer logic)
        await new Promise((resolve) => setTimeout(resolve, questions[i].timeLimit * 1000));

        // 3. Emit correct answers
        logger.info({ room: `live_${accessCode}`, event: 'correct_answers', questionId: questions[i].uid }, '[DEBUG] Emitting correct_answers');
        io.to(`live_${accessCode}`).emit('correct_answers', { questionId: questions[i].uid });
        options.onQuestionEnd?.(i);

        // 4. Wait for feedback (use feedbackWaitTime from question, fallback to default)
        const feedbackWait = (typeof questions[i].feedbackWaitTime === 'number' && questions[i].feedbackWaitTime > 0)
            ? questions[i].feedbackWaitTime
            : (options.playMode === 'tournament' ? 1.5 : 1);
        await new Promise((resolve) => setTimeout(resolve, feedbackWait * 1000));
        logger.info({ room: `live_${accessCode}`, event: 'feedback', questionId: questions[i].uid }, '[DEBUG] Emitting feedback');
        io.to(`live_${accessCode}`).emit('feedback', { questionId: questions[i].uid });
        options.onFeedback?.(i);
    }
    // 5. End game
    logger.info({ room: `live_${accessCode}`, event: 'game_end' }, '[DEBUG] Emitting game_end');
    io.to(`live_${accessCode}`).emit('game_end');
    options.onGameEnd?.();
}
