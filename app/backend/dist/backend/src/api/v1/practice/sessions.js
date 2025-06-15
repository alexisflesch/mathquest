"use strict";
/**
 * Practice Session API Routes
 *
 * Express.js routes for practice session management.
 * These complement the socket events for stateless HTTP operations.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const practiceSessionService_1 = require("@/core/services/practiceSessionService");
const validation_1 = require("@/middleware/validation");
const schemas_1 = require("@shared/types/api/schemas");
const logger_1 = __importDefault(require("@/utils/logger"));
const logger = (0, logger_1.default)('PracticeSessionAPI');
const router = express_1.default.Router();
/**
 * POST /api/v1/practice/sessions
 * Create a new practice session
 */
router.post('/', (0, validation_1.validateRequestBody)(schemas_1.CreatePracticeSessionRequestSchema), async (req, res) => {
    try {
        const userId = 'temp-user-123'; // TODO: Extract from authentication middleware
        const { settings } = req.body;
        logger.info({ userId, settings }, 'Creating new practice session');
        const session = await practiceSessionService_1.practiceSessionService.createSession(userId, settings);
        logger.info({ sessionId: session.sessionId, userId }, 'Practice session created successfully');
        res.status(201).json({
            success: true,
            session
        });
    }
    catch (error) {
        logger.error({ error }, 'Failed to create practice session');
        if (error instanceof Error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'Failed to create practice session'
        });
    }
});
/**
 * GET /api/v1/practice/sessions/:sessionId
 * Get practice session details
 */
router.get('/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        if (!sessionId) {
            res.status(400).json({
                success: false,
                error: 'Session ID is required'
            });
            return;
        }
        const session = await practiceSessionService_1.practiceSessionService.getSession(sessionId);
        if (!session) {
            res.status(404).json({
                success: false,
                error: 'Practice session not found'
            });
            return;
        }
        res.json({
            success: true,
            session
        });
    }
    catch (error) {
        logger.error({ error }, 'Failed to get practice session');
        if (error instanceof Error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'Failed to get practice session'
        });
    }
});
/**
 * DELETE /api/v1/practice/sessions/:sessionId
 * End and delete practice session
 */
router.delete('/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        if (!sessionId) {
            res.status(400).json({
                success: false,
                error: 'Session ID is required'
            });
            return;
        }
        // End the session first to get final statistics
        const finalSession = await practiceSessionService_1.practiceSessionService.endSession(sessionId);
        // Delete the session
        await practiceSessionService_1.practiceSessionService.deleteSession(sessionId);
        logger.info({ sessionId }, 'Practice session ended and deleted via API');
        res.json({
            success: true,
            session: finalSession,
            message: 'Practice session ended successfully'
        });
    }
    catch (error) {
        logger.error({ error }, 'Failed to end practice session');
        if (error instanceof Error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'Failed to end practice session'
        });
    }
});
exports.default = router;
