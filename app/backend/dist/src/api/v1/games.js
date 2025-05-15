"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.__setGameParticipantServiceForTesting = exports.__setGameInstanceServiceForTesting = void 0;
const express_1 = __importDefault(require("express"));
const gameInstanceService_1 = require("@/core/services/gameInstanceService");
const gameParticipantService_1 = require("@/core/services/gameParticipantService");
const auth_1 = require("@/middleware/auth");
const logger_1 = __importDefault(require("@/utils/logger"));
const gameStateService_1 = __importDefault(require("@/core/gameStateService"));
// Create a route-specific logger
const logger = (0, logger_1.default)('GamesAPI');
const router = express_1.default.Router();
// Create singleton instances or allow injection for testing
let gameInstanceServiceInstance = null;
let gameParticipantServiceInstance = null;
const getGameInstanceService = () => {
    if (!gameInstanceServiceInstance) {
        gameInstanceServiceInstance = new gameInstanceService_1.GameInstanceService();
    }
    return gameInstanceServiceInstance;
};
const getGameParticipantService = () => {
    if (!gameParticipantServiceInstance) {
        gameParticipantServiceInstance = new gameParticipantService_1.GameParticipantService();
    }
    return gameParticipantServiceInstance;
};
// For testing purposes only
const __setGameInstanceServiceForTesting = (mockService) => {
    gameInstanceServiceInstance = mockService;
};
exports.__setGameInstanceServiceForTesting = __setGameInstanceServiceForTesting;
const __setGameParticipantServiceForTesting = (mockService) => {
    gameParticipantServiceInstance = mockService;
};
exports.__setGameParticipantServiceForTesting = __setGameParticipantServiceForTesting;
/**
 * Create a new game instance (teacher only)
 * POST /api/v1/games
 * Requires teacher authentication
 */
router.post('/', auth_1.teacherAuth, async (req, res) => {
    try {
        if (!req.user?.teacherId) {
            res.status(401).json({ error: 'Teacher authentication required' });
            return;
        }
        const { name, quizTemplateId, playMode, settings } = req.body;
        // Basic validation
        if (!name || !quizTemplateId || !playMode) {
            res.status(400).json({
                error: 'Required fields missing',
                required: ['name', 'quizTemplateId', 'playMode']
            });
            return;
        }
        // Valid playMode values
        const validPlayModes = ['class', 'tournament', 'practice'];
        if (!validPlayModes.includes(playMode)) {
            res.status(400).json({
                error: 'Invalid playMode value',
                allowedValues: validPlayModes
            });
            return;
        }
        const gameInstance = await getGameInstanceService().createGameInstance(req.user.teacherId, {
            name,
            quizTemplateId,
            playMode,
            settings
        });
        res.status(201).json({ gameInstance });
    }
    catch (error) {
        logger.error({ error }, 'Error creating game instance');
        res.status(500).json({ error: 'An error occurred while creating the game instance' });
    }
});
/**
 * Get a game by access code
 * GET /api/v1/games/:accessCode
 * Public endpoint - no authentication required
 */
router.get('/:accessCode', async (req, res) => {
    try {
        const { accessCode } = req.params;
        // Validate access code format
        if (!accessCode || accessCode.length < 6) {
            res.status(400).json({ error: 'Invalid access code format' });
            return;
        }
        const includeParticipants = req.query.includeParticipants === 'true';
        const gameInstance = await getGameInstanceService().getGameInstanceByAccessCode(accessCode, includeParticipants);
        if (!gameInstance) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }
        res.status(200).json({ gameInstance });
    }
    catch (error) {
        logger.error({ error }, 'Error fetching game instance');
        res.status(500).json({ error: 'An error occurred while fetching the game' });
    }
});
/**
 * Join a game as a player
 * POST /api/v1/games/:accessCode/join
 * Requires player ID in request
 */
router.post('/:accessCode/join', async (req, res) => {
    try {
        const { accessCode } = req.params;
        const { playerId } = req.body;
        if (!playerId) {
            res.status(400).json({ error: 'Player ID is required' });
            return;
        }
        const joinResult = await getGameParticipantService().joinGame(playerId, accessCode);
        if (!joinResult.success) {
            res.status(400).json({ error: joinResult.error });
            return;
        }
        res.status(200).json({
            success: true,
            gameInstance: joinResult.gameInstance,
            participant: joinResult.participant
        });
    }
    catch (error) {
        logger.error({ error }, 'Error joining game');
        res.status(500).json({ error: 'An error occurred while joining the game' });
    }
});
/**
 * Update game status (teacher only)
 * PUT /api/v1/games/:id/status
 * Requires teacher authentication
 */
router.put('/:id/status', auth_1.teacherAuth, async (req, res) => {
    try {
        if (!req.user?.teacherId) {
            res.status(401).json({ error: 'Teacher authentication required' });
            return;
        }
        const { id } = req.params;
        const { status, currentQuestionIndex } = req.body;
        if (!status) {
            res.status(400).json({ error: 'Status is required' });
            return;
        }
        // Valid status values
        const validStatuses = ['pending', 'active', 'paused', 'completed', 'archived'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({
                error: 'Invalid status value',
                allowedValues: validStatuses
            });
            return;
        }
        // Verify the game belongs to this teacher
        const gameInstance = await getGameInstanceService().getGameInstanceById(id);
        if (!gameInstance) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }
        if (gameInstance.initiatorTeacherId !== req.user.teacherId) {
            res.status(403).json({ error: 'You do not have permission to update this game' });
            return;
        }
        const updatedGame = await getGameInstanceService().updateGameStatus(id, {
            status,
            currentQuestionIndex
        });
        res.status(200).json({ gameInstance: updatedGame });
    }
    catch (error) {
        logger.error({ error }, 'Error updating game status');
        res.status(500).json({ error: 'An error occurred while updating the game status' });
    }
});
/**
 * Update game status (teacher only)
 */
router.patch('/:id/status', auth_1.teacherAuth, async (req, res) => {
    try {
        if (!req.user?.teacherId) {
            res.status(401).json({ error: 'Teacher authentication required' });
            return;
        }
        const { id } = req.params;
        const { status, currentQuestionIndex } = req.body;
        // Validate required fields
        if (!status) {
            res.status(400).json({ error: 'Status is required' });
            return;
        }
        // Verify the game belongs to this teacher
        const gameInstance = await getGameInstanceService().getGameInstanceById(id);
        if (!gameInstance) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }
        if (gameInstance.initiatorTeacherId !== req.user.teacherId) {
            res.status(403).json({ error: 'You do not have permission to update this game' });
            return;
        }
        // If changing to active status, initialize game state in Redis
        if (status === 'active' && gameInstance.status !== 'active') {
            const gameState = await gameStateService_1.default.initializeGameState(id);
            if (!gameState) {
                res.status(500).json({ error: 'Failed to initialize game state' });
                return;
            }
            logger.info({ gameId: id, accessCode: gameInstance.accessCode }, 'Game state initialized');
        }
        const updatedGame = await getGameInstanceService().updateGameStatus(id, {
            status,
            currentQuestionIndex
        });
        res.status(200).json({ gameInstance: updatedGame });
    }
    catch (error) {
        logger.error({ error }, 'Error updating game status');
        res.status(500).json({ error: 'An error occurred while updating the game status' });
    }
});
/**
 * Get all active games for a teacher
 * GET /api/v1/games/teacher/active
 * Requires teacher authentication
 */
router.get('/teacher/active', auth_1.teacherAuth, async (req, res) => {
    try {
        if (!req.user?.teacherId) {
            res.status(401).json({ error: 'Teacher authentication required' });
            return;
        }
        const games = await getGameInstanceService().getTeacherActiveGames(req.user.teacherId);
        res.status(200).json({ games });
    }
    catch (error) {
        logger.error({ error }, 'Error fetching teacher active games');
        res.status(500).json({ error: 'An error occurred while fetching active games' });
    }
});
exports.default = router;
