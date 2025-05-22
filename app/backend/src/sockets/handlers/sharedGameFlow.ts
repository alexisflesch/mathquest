// Shared game flow logic for quiz and tournament modes
// Place all core progression, timer, answer reveal, feedback, and leaderboard logic here
// This module should be imported by both quiz and tournament handlers

import { Server as SocketIOServer, Socket } from 'socket.io';
import { redisClient } from '@/config/redis';
import createLogger from '@/utils/logger';
import gameStateService from '@/core/gameStateService'; // Added import

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
    logger.info({ accessCode }, `[SharedGameFlow] runGameFlow entry`);
    logger.info({ accessCode, playMode: options.playMode, questionCount: questions.length }, `[SharedGameFlow] Starting game flow. Initial delay removed as countdown is now handled by caller.`);
    logger.info({ accessCode }, `[SharedGameFlow] Proceeding with first question immediately.`);
    for (let i = 0; i < questions.length; i++) {
        // Set and persist timer in game state before emitting question
        const timeLimitSec = questions[i].timeLimit || 30;
        const timer = {
            startedAt: Date.now(),
            duration: timeLimitSec * 1000,
            isPaused: false
        };
        // Fetch and update game state
        const currentState = await gameStateService.getFullGameState(accessCode);
        if (currentState && currentState.gameState) {
            const updatedState = {
                ...currentState.gameState,
                currentQuestionIndex: i,
                timer
            };
            await gameStateService.updateGameState(accessCode, updatedState);
        }
        if (i === 0) {
            const room = io.sockets.adapter.rooms.get(`live_${accessCode}`);
            const socketIds = room ? Array.from(room) : [];
            logger.info({ accessCode, room: `live_${accessCode}`, socketIds }, '[DEBUG] Sockets in live room before emitting first game_question');
        }
        logger.info({ accessCode, questionIndex: i, questionUid: questions[i].uid }, '[DEBUG] Preparing to emit game_question');
        logger.info({ room: `live_${accessCode}`, event: 'game_question', payload: { question: questions[i], index: i, feedbackWaitTime: questions[i].feedbackWaitTime || (options.playMode === 'tournament' ? 1.5 : 1) } }, '[DEBUG] Emitting game_question');
        io.to(`live_${accessCode}`).emit('game_question', {
            question: questions[i],
            index: i,
            feedbackWaitTime: questions[i].feedbackWaitTime || (options.playMode === 'tournament' ? 1.5 : 1)
        });
        logger.info({ accessCode, event: 'game_question', questionUid: questions[i].uid }, '[TRACE] Emitted game_question');
        options.onQuestionStart?.(i);
        await new Promise((resolve) => setTimeout(resolve, questions[i].timeLimit * 1000));
        logger.info({ room: `live_${accessCode}`, event: 'correct_answers', questionId: questions[i].uid }, '[DEBUG] Emitting correct_answers');
        io.to(`live_${accessCode}`).emit('correct_answers', { questionId: questions[i].uid });
        logger.info({ accessCode, event: 'correct_answers', questionUid: questions[i].uid }, '[TRACE] Emitted correct_answers');
        options.onQuestionEnd?.(i);
        if (questions[i] && questions[i].uid) {
            logger.info({ accessCode, questionId: questions[i].uid }, '[SharedGameFlow] Calculating scores for question');
            await gameStateService.calculateScores(accessCode, questions[i].uid);
            logger.info({ accessCode, questionId: questions[i].uid }, '[SharedGameFlow] Scores calculated');
        } else {
            logger.warn({ accessCode, questionIndex: i }, '[SharedGameFlow] Question UID missing, cannot calculate scores.');
        }
        const feedbackWait = (typeof questions[i].feedbackWaitTime === 'number' && questions[i].feedbackWaitTime > 0)
            ? questions[i].feedbackWaitTime
            : (options.playMode === 'tournament' ? 1.5 : 1);
        // Compute feedbackRemaining based on feedback phase timing
        const feedbackStart = Date.now();
        const feedbackEnd = feedbackStart + feedbackWait * 1000;
        const feedbackRemaining = Math.max(0, Math.round((feedbackEnd - Date.now()) / 1000));
        await new Promise((resolve) => setTimeout(resolve, feedbackWait * 1000));
        logger.info({ room: `live_${accessCode}`, event: 'feedback', questionId: questions[i].uid }, '[DEBUG] Emitting feedback');
        io.to(`live_${accessCode}`).emit('feedback', { questionId: questions[i].uid, feedbackRemaining });
        logger.info({ accessCode, event: 'feedback', questionUid: questions[i].uid }, '[TRACE] Emitted feedback');
        options.onFeedback?.(i);
    }
    logger.info({ room: `live_${accessCode}`, event: 'game_end' }, '[DEBUG] Emitting game_end');
    io.to(`live_${accessCode}`).emit('game_end');
    logger.info({ accessCode, event: 'game_end' }, '[TRACE] Emitted game_end');
    options.onGameEnd?.();
}
