"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const gameInstanceService_1 = require("@/core/services/gameInstanceService");
const gameTemplateService_1 = require("@/core/services/gameTemplateService");
const gameStateService_1 = require("@/core/gameStateService");
const auth_1 = require("@/middleware/auth");
const logger_1 = __importDefault(require("@/utils/logger"));
// Create a route-specific logger
const logger = (0, logger_1.default)('TournamentAPI');
const router = express_1.default.Router();
// Create singleton instances
let gameInstanceServiceInstance = null;
let gameTemplateServiceInstance = null;
const getGameInstanceService = () => {
    if (!gameInstanceServiceInstance) {
        gameInstanceServiceInstance = new gameInstanceService_1.GameInstanceService();
    }
    return gameInstanceServiceInstance;
};
const getGameTemplateService = () => {
    if (!gameTemplateServiceInstance) {
        gameTemplateServiceInstance = new gameTemplateService_1.GameTemplateService();
    }
    return gameTemplateServiceInstance;
};
/**
 * Create a tournament (legacy format support)
 * POST /api/v1/tournament
 * Supports the legacy frontend format with action: 'create'
 */
router.post('/', auth_1.optionalAuth, async (req, res) => {
    try {
        const { action, nom, questions_ids, type, niveau, categorie, themes, cree_par_id, username, avatar } = req.body;
        // Validate required fields for legacy format
        if (action !== 'create') {
            res.status(400).json({ error: 'Invalid action. Expected "create"' });
            return;
        }
        if (!nom || !questions_ids || !Array.isArray(questions_ids) || questions_ids.length === 0) {
            res.status(400).json({
                error: 'Required fields missing',
                required: ['nom', 'questions_ids (array)']
            });
            return;
        }
        // Get or set user ID
        let userId = req.user?.userId;
        if (!userId && cree_par_id) {
            // For student-created tournaments, use cookie ID as user identifier
            userId = cree_par_id;
        }
        if (!userId) {
            res.status(401).json({ error: 'User identification required' });
            return;
        }
        logger.info('Creating tournament with legacy format', {
            nom,
            questionCount: questions_ids.length,
            niveau,
            categorie,
            themes,
            userId
        });
        // Create a game template on-the-fly for this tournament
        const gameTemplate = await getGameTemplateService().createStudentGameTemplate({
            userId,
            gradeLevel: niveau,
            discipline: categorie,
            themes: Array.isArray(themes) ? themes : [themes].filter(Boolean),
            nbOfQuestions: questions_ids.length
        });
        // Create the game instance
        const gameInstance = await getGameInstanceService().createGameInstanceUnified({
            name: nom,
            gameTemplateId: gameTemplate.id,
            playMode: 'tournament',
            settings: {
                type,
                avatar,
                username
            },
            initiatorUserId: userId
        });
        // Initialize game state in Redis
        await (0, gameStateService_1.initializeGameState)(gameInstance.id);
        logger.info('Tournament created successfully', {
            gameInstanceId: gameInstance.id,
            accessCode: gameInstance.accessCode,
            templateId: gameTemplate.id
        });
        // Return in the format expected by the frontend
        res.status(201).json({
            code: gameInstance.accessCode,
            message: 'Tournament created successfully'
        });
    }
    catch (error) {
        logger.error({ error }, 'Error creating tournament');
        res.status(500).json({ error: 'An error occurred while creating the tournament' });
    }
});
exports.default = router;
