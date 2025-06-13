import express, { Request, Response } from 'express';
import { teacherAuth } from '@/middleware/auth';
import createLogger from '@/utils/logger';
import gameStateService from '@/core/gameStateService';
import { getIO } from '@/sockets';
import { prisma } from '@/db/prisma';

// Create a route-specific logger
const logger = createLogger('GameControlAPI');

const router = express.Router();

/**
 * Get full game state 
 * GET /api/v1/game-control/:accessCode
 * Requires teacher authentication
 */
router.get('/:accessCode', teacherAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user?.userId || req.user.role !== 'TEACHER') {
            res.status(401).json({ error: 'Teacher authentication required' });
            return;
        }

        const { accessCode } = req.params;

        // Verify the game exists and belongs to this teacher
        const gameInstance = await prisma.gameInstance.findUnique({
            where: { accessCode }
        });

        if (!gameInstance) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }

        if (gameInstance.initiatorUserId !== req.user.userId) {
            res.status(403).json({ error: 'You do not have permission to access this game' });
            return;
        }

        // Get the full game state from Redis
        const gameState = await gameStateService.getFullGameState(accessCode);

        if (!gameState) {
            res.status(404).json({ error: 'Game state not found' });
            return;
        }

        res.status(200).json(gameState);
    } catch (error) {
        logger.error({ error }, 'Error fetching game state');
        res.status(500).json({ error: 'An error occurred while fetching game state' });
    }
});

/**
 * Set current question
 * POST /api/v1/game-control/:accessCode/question
 * Requires teacher authentication
 */
router.post('/:accessCode/question', teacherAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user?.userId || req.user.role !== 'TEACHER') {
            res.status(401).json({ error: 'Teacher authentication required' });
            return;
        }

        const { accessCode } = req.params;
        const { questionIndex } = req.body;

        if (questionIndex === undefined || questionIndex < 0) {
            res.status(400).json({ error: 'Valid questionIndex is required' });
            return;
        }

        // Verify the game exists and belongs to this teacher
        const gameInstance = await prisma.gameInstance.findUnique({
            where: { accessCode }
        });

        if (!gameInstance) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }

        if (gameInstance.initiatorUserId !== req.user.userId) {
            res.status(403).json({ error: 'You do not have permission to control this game' });
            return;
        }

        // Set the current question
        const updatedGameState = await gameStateService.setCurrentQuestion(accessCode, questionIndex);

        if (!updatedGameState) {
            res.status(500).json({ error: 'Failed to set current question' });
            return;
        }

        // Get Socket.IO instance to emit events
        const io = getIO();

        if (io) {
            // Emit the question to all players in the game using the proper LiveQuestionPayload structure
            io.to(`game_${accessCode}`).emit('game_question', {
                question: {
                    uid: updatedGameState.questionData.uid,
                    text: updatedGameState.questionData.text,
                    type: updatedGameState.questionData.questionType,
                    answerOptions: updatedGameState.questionData.answerOptions
                },
                timer: updatedGameState.timer.durationMs / 1000, // Convert ms to seconds
                questionIndex: questionIndex,
                totalQuestions: updatedGameState.questionUids.length,
                questionState: 'active'
            });

            // Emit to teacher control room as well
            io.to(`teacher_control_${updatedGameState.gameId}`).emit('game_control_question_set', {
                questionIndex,
                timer: updatedGameState.timer
            });
        }

        res.status(200).json({
            success: true,
            questionIndex,
            questionUid: updatedGameState.questionUids[questionIndex],
            timer: updatedGameState.timer
        });
    } catch (error) {
        logger.error({ error }, 'Error setting current question');
        res.status(500).json({ error: 'An error occurred while setting current question' });
    }
});

/**
 * End current question and process answers
 * POST /api/v1/game-control/:accessCode/end-question
 * Requires teacher authentication
 */
router.post('/:accessCode/end-question', teacherAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user?.userId || req.user.role !== 'TEACHER') {
            res.status(401).json({ error: 'Teacher authentication required' });
            return;
        }

        const { accessCode } = req.params;

        // Verify the game exists and belongs to this teacher
        const gameInstance = await prisma.gameInstance.findUnique({
            where: { accessCode }
        });

        if (!gameInstance) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }

        if (gameInstance.initiatorUserId !== req.user.userId) {
            res.status(403).json({ error: 'You do not have permission to control this game' });
            return;
        }

        // End the current question
        const updatedGameState = await gameStateService.endCurrentQuestion(accessCode);

        if (!updatedGameState) {
            res.status(500).json({ error: 'Failed to end current question' });
            return;
        }

        // Process and calculate scores
        if (updatedGameState.currentQuestionIndex >= 0) {
            const questionUid = updatedGameState.questionUids[updatedGameState.currentQuestionIndex];
            await gameStateService.calculateScores(accessCode, questionUid);
        }

        // Get updated game state with leaderboard
        const fullGameState = await gameStateService.getFullGameState(accessCode);

        // Get Socket.IO instance to emit events
        const io = getIO();

        if (io && fullGameState) {
            // Tell all players that question time is up
            io.to(`game_${accessCode}`).emit('question_ended', {
                questionIndex: updatedGameState.currentQuestionIndex
            });

            // Send leaderboard update
            if (fullGameState.leaderboard.length > 0) {
                io.to(`game_${accessCode}`).emit('leaderboard_update', {
                    leaderboard: fullGameState.leaderboard.slice(0, 10) // Top 10
                });
            }

            // Update teacher control panel
            io.to(`teacher_control_${updatedGameState.gameId}`).emit('game_control_question_ended', {
                questionIndex: updatedGameState.currentQuestionIndex,
                answers: fullGameState.answers,
                leaderboard: fullGameState.leaderboard
            });
        }

        res.status(200).json({
            success: true,
            questionIndex: updatedGameState.currentQuestionIndex,
            gameState: fullGameState
        });
    } catch (error) {
        logger.error({ error }, 'Error ending current question');
        res.status(500).json({ error: 'An error occurred while ending the question' });
    }
});

/**
 * End the game
 * POST /api/v1/game-control/:accessCode/end-game
 * Requires teacher authentication
 */
router.post('/:accessCode/end-game', teacherAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user?.userId || req.user.role !== 'TEACHER') {
            res.status(401).json({ error: 'Teacher authentication required' });
            return;
        }

        const { accessCode } = req.params;

        // Verify the game exists and belongs to this teacher
        const gameInstance = await prisma.gameInstance.findUnique({
            where: { accessCode }
        });

        if (!gameInstance) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }

        if (gameInstance.initiatorUserId !== req.user.userId) {
            res.status(403).json({ error: 'You do not have permission to control this game' });
            return;
        }

        // Update game status in the database
        await prisma.gameInstance.update({
            where: { id: gameInstance.id },
            data: { status: 'completed' }
        });

        // Get final game state with leaderboard
        const finalGameState = await gameStateService.getFullGameState(accessCode);

        // Get Socket.IO instance to emit events
        const io = getIO();

        if (io) {
            // Tell all players the game has ended
            io.to(`game_${accessCode}`).emit('game_ended', {
                accessCode
            });
        }

        res.status(200).json({
            success: true,
            gameState: finalGameState
        });
    } catch (error) {
        logger.error({ error }, 'Error ending game');
        res.status(500).json({ error: 'An error occurred while ending the game' });
    }
});

export default router;
