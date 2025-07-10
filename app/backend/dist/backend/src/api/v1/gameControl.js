"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("@/middleware/auth");
const validation_1 = require("@/middleware/validation");
const logger_1 = __importDefault(require("@/utils/logger"));
const gameStateService_1 = __importStar(require("@/core/services/gameStateService"));
const sockets_1 = require("@/sockets");
const prisma_1 = require("@/db/prisma");
const socketEvents_zod_1 = require("@shared/types/socketEvents.zod");
const schemas_1 = require("@shared/types/api/schemas");
// Create a route-specific logger
const logger = (0, logger_1.default)('GameControlAPI');
const router = express_1.default.Router();
/**
 * Get full game state
 * GET /api/v1/game-control/:accessCode
 * Requires teacher authentication
 */
router.get('/:accessCode', auth_1.teacherAuth, async (req, res) => {
    try {
        if (!req.user?.userId || req.user.role !== 'TEACHER') {
            res.status(401).json({ error: 'Teacher authentication required' });
            return;
        }
        const { accessCode } = req.params;
        // Verify the game exists and belongs to this teacher
        const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
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
        const gameState = await gameStateService_1.default.getFullGameState(accessCode);
        if (!gameState) {
            res.status(404).json({ error: 'Game state not found' });
            return;
        }
        res.status(200).json({ gameState });
    }
    catch (error) {
        logger.error({ error }, 'Error fetching game state');
        res.status(500).json({ error: 'An error occurred while fetching game state' });
    }
});
/**
 * Set current question
 * POST /api/v1/game-control/:accessCode/question
 * Requires teacher authentication
 */
router.post('/:accessCode/question', auth_1.teacherAuth, (0, validation_1.validateRequestBody)(schemas_1.SetQuestionRequestSchema), async (req, res) => {
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
        const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
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
        const updatedGameState = await gameStateService_1.default.setCurrentQuestion(accessCode, questionIndex);
        if (!updatedGameState) {
            res.status(500).json({ error: 'Failed to set current question' });
            return;
        }
        // Get Socket.IO instance to emit events
        const io = (0, sockets_1.getIO)();
        if (io) {
            // --- MODERNIZATION: Use canonical timer system ---
            // Fetch canonical timer for the current question
            // Always use canonical durationMs from the question object (no fallback allowed)
            const question = await prisma_1.prisma.question.findUnique({ where: { uid: updatedGameState.questionUids[questionIndex] } });
            const durationMs = question && typeof question.timeLimit === 'number' && question.timeLimit > 0 ? question.timeLimit * 1000 : 0;
            if (durationMs <= 0) {
                logger.error({ question, durationMs }, '[API_GAME_CONTROL] Failed to get canonical durationMs');
                // handle error or return
            }
            const canonicalTimer = await (0, gameStateService_1.getCanonicalTimer)(accessCode, updatedGameState.questionUids[questionIndex], updatedGameState.gameMode, updatedGameState.status === 'completed', durationMs);
            // Validate canonical timer
            const timerValidation = socketEvents_zod_1.gameTimerStateSchema.safeParse(canonicalTimer);
            if (!timerValidation.success) {
                logger.error({ error: timerValidation.error.format(), canonicalTimer }, '[TIMER] Invalid canonical timer payload, not emitting');
            }
            else {
                // Emit the question to all players in the game and projection using canonical timer
                const liveRoom = `game_${accessCode}`;
                const projectionRoom = `projection_${gameInstance.id}`;
                const payload = {
                    question: {
                        uid: updatedGameState.questionData.uid,
                        text: updatedGameState.questionData.text,
                        questionType: updatedGameState.questionData.questionType,
                        answerOptions: updatedGameState.questionData.answerOptions
                    },
                    timer: canonicalTimer, // [MODERNIZATION] Canonical timer state
                    questionIndex: questionIndex,
                    totalQuestions: updatedGameState.questionUids.length,
                    questionState: 'active'
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
    }
    catch (error) {
        logger.error({ error }, 'Error setting current question');
        res.status(500).json({ error: 'An error occurred while setting current question' });
    }
});
/**
 * End current question and process answers
 * POST /api/v1/game-control/:accessCode/end-question
 * Requires teacher authentication
 */
router.post('/:accessCode/end-question', auth_1.teacherAuth, async (req, res) => {
    try {
        if (!req.user?.userId || req.user.role !== 'TEACHER') {
            res.status(401).json({ error: 'Teacher authentication required' });
            return;
        }
        const { accessCode } = req.params;
        // Verify the game exists and belongs to this teacher
        const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
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
        const updatedGameState = await gameStateService_1.default.endCurrentQuestion(accessCode);
        if (!updatedGameState) {
            res.status(500).json({ error: 'Failed to end current question' });
            return;
        }
        // [MODERNIZATION] Removed legacy call to gameStateService.calculateScores.
        // All scoring is now handled via ScoringService.submitAnswerWithScoring or canonical participant service.
        // If batch scoring is needed, refactor to use canonical logic per participant/answer.
        // Get updated game state with leaderboard
        const fullGameState = await gameStateService_1.default.getFullGameState(accessCode);
        // Get Socket.IO instance to emit events
        const io = (0, sockets_1.getIO)();
        if (io && fullGameState) {
            // --- MODERNIZATION: Use canonical timer system ---
            // Fetch canonical timer for the current question
            const question = await prisma_1.prisma.question.findUnique({ where: { uid: updatedGameState.questionUids[updatedGameState.currentQuestionIndex] } });
            const durationMs = question && typeof question.timeLimit === 'number' && question.timeLimit > 0 ? question.timeLimit * 1000 : 0;
            if (durationMs <= 0) {
                logger.error({ question, durationMs }, '[API_GAME_CONTROL] Failed to get canonical durationMs (endCurrentQuestion)');
                // handle error or return
            }
            const canonicalTimer = await (0, gameStateService_1.getCanonicalTimer)(accessCode, updatedGameState.questionUids[updatedGameState.currentQuestionIndex], updatedGameState.gameMode, updatedGameState.status === 'completed', durationMs);
            // Validate canonical timer
            const timerValidation = socketEvents_zod_1.gameTimerStateSchema.safeParse(canonicalTimer);
            const liveRoom = `game_${accessCode}`;
            const projectionRoom = `projection_${gameInstance.id}`;
            if (!timerValidation.success) {
                logger.error({ error: timerValidation.error.format(), canonicalTimer }, '[TIMER] Invalid canonical timer payload, not emitting');
            }
            else {
                // Tell all players and projection that question time is up, using canonical timer
                const payload = {
                    questionIndex: updatedGameState.currentQuestionIndex,
                    questionUid: canonicalTimer?.questionUid || undefined,
                    timer: canonicalTimer // [MODERNIZATION] Canonical timer state
                };
                io.to([liveRoom, projectionRoom]).emit('question_ended', payload);
            }
            // Send leaderboard update to both live and projection
            if (fullGameState.leaderboard.length > 0) {
                io.to([liveRoom, projectionRoom]).emit('leaderboard_update', {
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
    }
    catch (error) {
        logger.error({ error }, 'Error ending current question');
        res.status(500).json({ error: 'An error occurred while ending the question' });
    }
});
/**
 * End the game
 * POST /api/v1/game-control/:accessCode/end-game
 * Requires teacher authentication
 */
router.post('/:accessCode/end-game', auth_1.teacherAuth, async (req, res) => {
    try {
        if (!req.user?.userId || req.user.role !== 'TEACHER') {
            res.status(401).json({ error: 'Teacher authentication required' });
            return;
        }
        const { accessCode } = req.params;
        // Verify the game exists and belongs to this teacher
        const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
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
        await prisma_1.prisma.gameInstance.update({
            where: { id: gameInstance.id },
            data: { status: 'completed' }
        });
        // Get final game state with leaderboard
        const finalGameState = await gameStateService_1.default.getFullGameState(accessCode);
        // Get Socket.IO instance to emit events
        const io = (0, sockets_1.getIO)();
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
    }
    catch (error) {
        logger.error({ error }, 'Error ending game');
        res.status(500).json({ error: 'An error occurred while ending the game' });
    }
});
exports.default = router;
