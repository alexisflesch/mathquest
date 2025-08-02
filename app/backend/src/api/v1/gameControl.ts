import express, { Request, Response } from 'express';
import { teacherAuth } from '@/middleware/auth';
import { validateRequestBody } from '@/middleware/validation';
import createLogger from '@/utils/logger';
import gameStateService, { getCanonicalTimer } from '@/core/services/gameStateService';
import { getIO } from '@/sockets';
import { prisma } from '@/db/prisma';
import { gameTimerStateSchema, gameTimerUpdatePayloadSchema } from '@shared/types/socketEvents.zod';
import type {
    GameControlStateResponse,
    QuestionSetResponse,
    QuestionEndedResponse,
    GameEndedResponse,
    ErrorResponse
} from '@shared/types/api/responses';
import type {
    SetQuestionRequest
} from '@shared/types/api/requests';
import {
    SetQuestionRequestSchema
} from '@shared/types/api/schemas';

// Create a route-specific logger
const logger = createLogger('GameControlAPI');

const router = express.Router();

/**
 * Get full game state 
 * GET /api/v1/game-control/:accessCode
 * Requires teacher authentication
 */
router.get('/:accessCode', teacherAuth, async (req: Request, res: Response<GameControlStateResponse | ErrorResponse>): Promise<void> => {
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

        res.status(200).json({ gameState });
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
router.post('/:accessCode/question', teacherAuth, validateRequestBody(SetQuestionRequestSchema), async (req: Request<{ accessCode: string }, QuestionSetResponse | ErrorResponse, SetQuestionRequest>, res: Response<QuestionSetResponse | ErrorResponse>): Promise<void> => {
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
            // --- MODERNIZATION: Use canonical timer system ---
            // Fetch canonical timer for the current question
            // Always use canonical durationMs from the question object (no fallback allowed)
            const question = await prisma.question.findUnique({ where: { uid: updatedGameState.questionUids[questionIndex] } });
            const durationMs = question && typeof question.timeLimit === 'number' && question.timeLimit > 0 ? question.timeLimit * 1000 : 0;
            if (durationMs <= 0) {
                logger.error({ question, durationMs }, '[API_GAME_CONTROL] Failed to get canonical durationMs');
                // handle error or return
            }
            const canonicalTimer = await getCanonicalTimer(accessCode, updatedGameState.questionUids[questionIndex], updatedGameState.gameMode, updatedGameState.status === 'completed', durationMs);
            // Validate canonical timer
            const timerValidation = gameTimerStateSchema.safeParse(canonicalTimer);
            if (!timerValidation.success) {
                logger.error({ error: timerValidation.error.format(), canonicalTimer }, '[TIMER] Invalid canonical timer payload, not emitting');
            } else {
                // Emit the question to all players in the game and projection using canonical timer
                const liveRoom = `game_${accessCode}`;
                const projectionRoom = `projection_${gameInstance.id}`;
                const payload = {
                    question: {
                        uid: updatedGameState.questionData.uid,
                        text: updatedGameState.questionData.text,
                        questionType: updatedGameState.questionData.questionType,
                        timeLimit: updatedGameState.questionData.timeLimit || 30, // Add mandatory timeLimit
                        answerOptions: updatedGameState.questionData.answerOptions
                    },
                    timer: canonicalTimer, // [MODERNIZATION] Canonical timer state
                    questionIndex: questionIndex,
                    totalQuestions: updatedGameState.questionUids.length,
                    questionState: 'active' as const
                };
                io.to([liveRoom, projectionRoom]).emit('game_question', payload);
            }
            // [LEGACY-TIMER-MIGRATION] The following legacy emission is deprecated and commented out:
            // io.to(`teacher_control_${updatedGameState.gameId}`).emit('game_control_question_set', {
            //     questionIndex,
            //     timer: updatedGameState.timer
            // });
        }

        res.status(200).json({
            success: true,
            questionIndex,
            questionUid: updatedGameState.questionUids[questionIndex],
            // [LEGACY-TIMER-MIGRATION] timer: updatedGameState.timer,
            timer: undefined // [MODERNIZATION] timer field is deprecated, use canonical timer system only
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
router.post('/:accessCode/end-question', teacherAuth, async (req: Request, res: Response<QuestionEndedResponse | ErrorResponse>): Promise<void> => {
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

        // [MODERNIZATION] Removed legacy call to gameStateService.calculateScores.
        // All scoring is now handled via ScoringService.submitAnswerWithScoring or canonical participant service.
        // If batch scoring is needed, refactor to use canonical logic per participant/answer.

        // Get updated game state with leaderboard
        const fullGameState = await gameStateService.getFullGameState(accessCode);

        // Get Socket.IO instance to emit events
        const io = getIO();

        if (io && fullGameState) {
            // --- MODERNIZATION: Use canonical timer system ---
            // Fetch canonical timer for the current question
            const question = await prisma.question.findUnique({ where: { uid: updatedGameState.questionUids[updatedGameState.currentQuestionIndex] } });
            const durationMs = question && typeof question.timeLimit === 'number' && question.timeLimit > 0 ? question.timeLimit * 1000 : 0;
            if (durationMs <= 0) {
                logger.error({ question, durationMs }, '[API_GAME_CONTROL] Failed to get canonical durationMs (endCurrentQuestion)');
                // handle error or return
            }
            const canonicalTimer = await getCanonicalTimer(accessCode, updatedGameState.questionUids[updatedGameState.currentQuestionIndex], updatedGameState.gameMode, updatedGameState.status === 'completed', durationMs);
            // Validate canonical timer
            const timerValidation = gameTimerStateSchema.safeParse(canonicalTimer);
            const liveRoom = `game_${accessCode}`;
            const projectionRoom = `projection_${gameInstance.id}`;
            if (!timerValidation.success) {
                logger.error({ error: timerValidation.error.format(), canonicalTimer }, '[TIMER] Invalid canonical timer payload, not emitting');
            } else {
                // Tell all players and projection that question time is up, using canonical timer
                const payload = {
                    questionIndex: updatedGameState.currentQuestionIndex,
                    questionUid: canonicalTimer?.questionUid || undefined,
                    timer: canonicalTimer // [MODERNIZATION] Canonical timer state
                };
                io.to([liveRoom, projectionRoom]).emit('question_ended', payload);
            }
            // 🔒 SECURITY FIX: Send leaderboard update using snapshot for students, live for projection
            if (fullGameState.leaderboard.length > 0) {
                // Import snapshot service
                const { getLeaderboardSnapshot } = await import('@/core/services/gameParticipant/leaderboardSnapshotService');

                // Send snapshot to students (live room) to prevent score cheating
                const studentSnapshot = await getLeaderboardSnapshot(accessCode);
                if (studentSnapshot.length > 0) {
                    io.to(liveRoom).emit('leaderboard_update', {
                        leaderboard: studentSnapshot
                    });
                }

                // Send live data to projection room (teachers need current state)
                io.to(projectionRoom).emit('leaderboard_update', {
                    leaderboard: fullGameState.leaderboard
                });
            }
            // Update teacher control panel (modernized, but legacy field commented)
            io.to(`teacher_control_${updatedGameState.gameId}`).emit('game_control_question_ended', {
                questionIndex: updatedGameState.currentQuestionIndex,
                answers: fullGameState.answers,
                leaderboard: fullGameState.leaderboard
                // timer: canonicalTimer // [LEGACY-TIMER-MIGRATION] Deprecated, not allowed by canonical type
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
router.post('/:accessCode/end-game', teacherAuth, async (req: Request, res: Response<GameEndedResponse | ErrorResponse>): Promise<void> => {
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
            // Tell all players and projection the game has ended
            const liveRoom = `game_${accessCode}`;
            const projectionRoom = `projection_${gameInstance.id}`;
            io.to([liveRoom, projectionRoom]).emit('game_ended', {
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
