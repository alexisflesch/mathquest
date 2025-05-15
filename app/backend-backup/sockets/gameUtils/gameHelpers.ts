/**
 * gameHelpers.ts - Game Helper Functions
 *
 * This module provides helper functions for game management, 
 * such as sending questions, computing scores, and generating leaderboards.
 * 
 * Previously known as tournamentHelpers.ts, now renamed to reflect the new
 * GameInstance model in the schema.
 */

import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { Question as PrismaQuestion } from '@shared/prisma-client';
import { Question as LocalQuestion } from '@sockets/types/quizTypes';
import { GameState } from '@sockets/types/gameTypes';
import { gameState } from '@sockets/gameUtils/gameState';
import { computeLeaderboard } from '@sockets/gameUtils/computeLeaderboard';

// Create logger for this module
import createLogger from '@logger';
const logger = createLogger('GameHelpers');

const prisma = new PrismaClient();

/**
 * Send a question to all participants in a game
 * 
 * @param io - Socket.IO server instance
 * @param accessCode - Access code for the game
 * @param questionIndex - Index of the question to send
 */
export async function sendQuestionWithState(
    io: Server,
    accessCode: string,
    questionIndex: number
): Promise<void> {
    const state = gameState[accessCode];
    if (!state) {
        logger.error(`Cannot send question: Game state not found for accessCode ${accessCode}`);
        return;
    }

    if (questionIndex >= state.questions.length) {
        logger.warn(`Question index ${questionIndex} out of bounds for game ${accessCode} with ${state.questions.length} questions`);

        // Handle end of game
        const leaderboard = computeLeaderboard(state);
        io.to(`game_${accessCode}`).emit("game_end", {
            finalScore: state.participants?.length > 0 ? leaderboard[0]?.score : 0,
            leaderboard
        });

        // Update game status in database
        try {
            await prisma.gameInstance.update({
                where: { accessCode },
                data: { status: 'completed', endedAt: new Date() }
            });
            logger.info(`Game ${accessCode} marked as completed in database`);
        } catch (err) {
            logger.error(`Failed to update game status for ${accessCode}:`, err);
        }

        return;
    }

    const question = state.questions[questionIndex];
    if (!question) {
        logger.error(`Question at index ${questionIndex} is undefined for game ${accessCode}`);
        return;
    }

    // Add question UID to asked questions if not already there
    if (question.uid && !state.askedQuestions.has(question.uid)) {
        state.askedQuestions.add(question.uid);
        logger.debug(`Added question UID ${question.uid} to askedQuestions for game ${accessCode}. Current set: ${Array.from(state.askedQuestions).join(', ')}`);
    }

    // Update current question information
    state.currentIndex = questionIndex;
    state.currentQuestionUid = question.uid;
    state.currentQuestionDuration = question.time || 20; // Default to 20 seconds if not specified
    state.previousQuestionUid = questionIndex > 0 ? state.questions[questionIndex - 1]?.uid : null;

    // Create a trimmed-down question object for clients
    const clientQuestion = {
        uid: question.uid,
        type: question.type,
        text: question.text,
        answers: question.answers,
        time: question.time
    };

    // Record question start time for scoring
    state.questionStart = Date.now();

    logger.info(`Sending question ${questionIndex + 1}/${state.questions.length} (${question.uid}) to game ${accessCode}`);

    // Emit the question to all participants
    io.to(`game_${accessCode}`).emit("game_question", {
        question: clientQuestion,
        index: questionIndex,
        total: state.questions.length,
        timeLimit: question.time,
        questionId: question.uid
    });
}
