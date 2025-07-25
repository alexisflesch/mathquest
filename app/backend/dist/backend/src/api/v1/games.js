"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.__setGameParticipantServiceForTesting = exports.__setGameInstanceServiceForTesting = void 0;
const express_1 = __importDefault(require("express"));
const gameInstanceService_1 = require("@/core/services/gameInstanceService");
const gameParticipantService_1 = require("@/core/services/gameParticipantService");
const gameTemplateService_1 = require("@/core/services/gameTemplateService");
// Import specific functions from gameStateService
const gameStateService_1 = require("@/core/services/gameStateService");
const prisma_1 = require("@/db/prisma");
const auth_1 = require("@/middleware/auth");
const validation_1 = require("@/middleware/validation");
const logger_1 = __importDefault(require("@/utils/logger"));
const schemas_1 = require("@shared/types/api/schemas");
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
 * Create a new game instance (quiz, tournament, or practice)
 * POST /api/v1/games
 * Allows teacher or student authentication
 */
router.post('/', auth_1.optionalAuth, (0, validation_1.validateRequestBody)(schemas_1.CreateGameRequestSchema), async (req, res) => {
    try {
        // Debug: Log the full request body, user, and headers
        logger.info('Games POST request body debug', {
            fullBody: req.body,
            keys: Object.keys(req.body),
            user: req.user,
            headers: req.headers
        });
        const { name, gameTemplateId, playMode, settings, gradeLevel, discipline, themes, nbOfQuestions, initiatorStudentId } = req.body;
        // Strict playMode values
        const validPlayModes = ['quiz', 'tournament', 'practice'];
        if (!playMode || !validPlayModes.includes(playMode)) {
            res.status(400).json({
                error: 'Invalid or missing playMode value',
                allowedValues: validPlayModes
            });
            return;
        }
        // Use unified user model or allow student ID
        let userId = undefined;
        let role = undefined;
        if (req.user) {
            userId = req.user.userId;
            role = req.user.role;
        }
        else if (initiatorStudentId) {
            userId = initiatorStudentId;
            role = 'STUDENT';
        }
        if (!userId) {
            res.status(401).json({ error: 'Authentication required (teacher or student)' });
            return;
        }
        let finalgameTemplateId = gameTemplateId;
        // If no gameTemplateId but student tournament/practice params are provided, create GameTemplate on-the-fly
        if (!gameTemplateId && (playMode === 'tournament' || playMode === 'practice') && gradeLevel && discipline && Array.isArray(themes) && nbOfQuestions) {
            try {
                const gameTemplateService = new gameTemplateService_1.GameTemplateService();
                // Extract username from settings if available
                const username = settings?.username || undefined;
                const template = await gameTemplateService.createStudentGameTemplate({
                    userId: userId,
                    username: username,
                    playMode: playMode,
                    gradeLevel,
                    discipline,
                    themes,
                    nbOfQuestions
                });
                finalgameTemplateId = template.id;
            }
            catch (err) {
                res.status(400).json({ error: err.message || 'Failed to create game template' });
                return;
            }
        }
        // Debug logging for validation
        logger.info('Games validation debug', {
            name,
            finalgameTemplateId,
            playMode,
            nameCheck: !!name,
            templateIdCheck: !!finalgameTemplateId,
            playModeCheck: !!playMode
        });
        // Basic validation for required fields
        if (!name || !finalgameTemplateId || !playMode) {
            res.status(400).json({
                error: 'Required fields missing',
                required: ['name', 'gameTemplateId', 'playMode'],
                received: { name, finalgameTemplateId, playMode }
            });
            return;
        }
        // Modernization: Always set status to 'pending' for student-created tournaments (no gameTemplateId)
        let status = undefined;
        if (playMode === 'tournament' && !gameTemplateId) {
            status = 'pending';
        }
        const gameInstance = await getGameInstanceService().createGameInstanceUnified({
            name,
            gameTemplateId: finalgameTemplateId,
            playMode: playMode, // Type assertion for now
            settings: settings,
            initiatorUserId: userId,
            ...(status ? { status } : {})
        });
        logger.info('GamesAPI created gameInstance debug', { gameInstanceSettings: gameInstance.settings });
        // Initialize game state in Redis immediately after game instance creation
        await (0, gameStateService_1.initializeGameState)(gameInstance.id);
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
        if (!accessCode || accessCode.length < 4) {
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
 * Get a game instance by ID
 * GET /api/v1/games/id/:id
 * Requires teacher authentication
 */
router.get('/id/:id', auth_1.teacherAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        if (!id) {
            res.status(400).json({ error: 'Game ID is required' });
            return;
        }
        const gameInstance = await getGameInstanceService().getGameInstanceById(id);
        if (!gameInstance) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }
        // Check if the user is the creator of this game
        const isCreator = user && user.userId && gameInstance.initiatorUserId === user.userId;
        if (!isCreator) {
            res.status(403).json({ error: 'You do not have permission to access this game' });
            return;
        }
        res.status(200).json({ gameInstance });
    }
    catch (error) {
        logger.error({ error }, 'Error fetching game instance by ID');
        res.status(500).json({ error: 'An error occurred while fetching the game' });
    }
});
/**
 * Join a game as a player
 * POST /api/v1/games/:accessCode/join
 * Requires player ID in request
 */
router.post('/:accessCode/join', (0, validation_1.validateRequestBody)(schemas_1.GameJoinRequestSchema), async (req, res) => {
    try {
        const { accessCode } = req.params;
        const { userId } = req.body;
        if (!userId) {
            res.status(400).json({ error: 'Player ID is required' });
            return;
        }
        const joinResult = await getGameParticipantService().joinGame(userId, accessCode);
        if (!joinResult.success) {
            res.status(400).json({ error: joinResult.error || 'Failed to join game' });
            return;
        }
        if (!joinResult.gameInstance || !joinResult.participant) {
            res.status(500).json({ error: 'Incomplete join result' });
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
router.put('/:id/status', auth_1.optionalAuth, (0, validation_1.validateRequestBody)(schemas_1.GameStatusUpdateRequestSchema), async (req, res) => {
    try {
        const user = req.user;
        const studentId = req.headers['x-student-id'];
        if (!user && !studentId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const { id } = req.params;
        const { status, currentQuestionIndex } = req.body;
        if (!status) {
            res.status(400).json({ error: 'Status is required' });
            return;
        }
        const validStatuses = ['pending', 'active', 'paused', 'completed', 'archived'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({
                error: 'Invalid status value',
                allowedValues: validStatuses
            });
            return;
        }
        const gameInstance = await getGameInstanceService().getGameInstanceById(id);
        if (!gameInstance) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }
        // Only the creator (teacher or student) can update
        const isCreator = user && user.userId && gameInstance.initiatorUserId === user.userId;
        if (!isCreator) {
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
router.patch('/:id/status', auth_1.optionalAuth, async (req, res) => {
    try {
        const user = req.user;
        const studentId = req.headers['x-student-id'];
        if (!user && !studentId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const { id } = req.params;
        const { status, currentQuestionIndex } = req.body;
        if (!status) {
            res.status(400).json({ error: 'Status is required' });
            return;
        }
        const gameInstance = await getGameInstanceService().getGameInstanceById(id);
        if (!gameInstance) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }
        // Only the creator (teacher or student) can update
        const isCreator = user && user.userId && gameInstance.initiatorUserId === user.userId;
        if (!isCreator) {
            res.status(403).json({ error: 'You do not have permission to update this game' });
            return;
        }
        // If changing to active status, initialize game state in Redis
        if (status === 'active' && gameInstance.status !== 'active') {
            // Use the imported initializeGameState function directly
            const gameState = await (0, gameStateService_1.initializeGameState)(id);
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
 * Update differed mode and window (teacher only)
 * PATCH /api/v1/games/:id/differed
 * Requires teacher authentication
 */
router.patch('/:id/differed', auth_1.teacherAuth, async (req, res) => {
    try {
        if (!req.user?.userId || req.user?.role !== 'TEACHER') {
            res.status(401).json({ error: 'Teacher authentication required' });
            return;
        }
        const games = await getGameInstanceService().getTeacherActiveGames(req.user.userId);
        res.status(200).json({ games });
    }
    catch (error) {
        logger.error({ error }, 'Error fetching teacher active games');
        res.status(500).json({ error: 'An error occurred while fetching active games' });
    }
});
/**
 * GET /api/v1/games/:code/leaderboard
 * Returns the leaderboard for a given game instance (by access code)
 */
router.get('/:code/leaderboard', async (req, res) => {
    const { code } = req.params;
    try {
        const gameInstance = await getGameInstanceService().getGameInstanceByAccessCode(code);
        if (!gameInstance) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }
        // Use the new getFormattedLeaderboard function
        const leaderboard = await (0, gameStateService_1.getFormattedLeaderboard)(code);
        // If gameInstance.leaderboard is the source of truth and needs to be updated,
        // consider doing that here or in a separate sync process.
        // For now, we return the Redis-based leaderboard directly.
        res.json({ leaderboard });
    }
    catch (error) {
        logger.error('Failed to fetch leaderboard', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});
/**
 * GET /api/v1/games/:code/state
 * Returns comprehensive game state including current question, timer, and basic game info
 * Consolidates functionality from the deprecated /game-status route
 * Public endpoint - no authentication required
 */
router.get('/:code/state', async (req, res) => {
    const { code } = req.params;
    logger.info('GET /api/v1/games/:code/state called', { accessCode: code });
    try {
        // Validate access code format
        if (!code || code.length < 4) {
            res.status(400).json({ error: 'Invalid access code format' });
            return;
        }
        // First get basic game instance info from database
        const gameInstance = await getGameInstanceService().getGameInstanceByAccessCode(code);
        if (!gameInstance) {
            logger.warn('GameInstance not found for accessCode', { accessCode: code });
            res.status(404).json({ error: 'Game not found' });
            return;
        }
        // Try to get detailed game state from Redis (for active games)
        let gameStateData = null;
        let redisGameState = null;
        if (gameInstance.status === 'active') {
            try {
                const gameStateRaw = await (0, gameStateService_1.getFullGameState)(code);
                if (gameStateRaw && gameStateRaw.gameState) {
                    redisGameState = gameStateRaw.gameState;
                    const { currentQuestionIndex, questionUids, questionData, status } = redisGameState; // [MODERNIZATION] timer removed
                    gameStateData = {
                        currentQuestionIndex,
                        questionUids: questionUids && questionUids[currentQuestionIndex] ? questionUids[currentQuestionIndex] : null,
                        questionData,
                        // timer, // [MODERNIZATION] timer removed, use canonical timer system if needed
                        redisStatus: status
                    };
                }
            }
            catch (redisError) {
                logger.warn('Could not fetch Redis game state, falling back to database only', {
                    accessCode: code,
                    error: redisError
                });
            }
        }
        // Return comprehensive response with modern status format
        const response = {
            // Basic game info (from database)
            status: gameInstance.status,
            currentQuestionIndex: gameInstance.currentQuestionIndex || 0,
            accessCode: gameInstance.accessCode,
            name: gameInstance.name,
            // Extended game state info (from Redis) - for live game functionality
            ...(gameStateData && {
                gameState: gameStateData,
                isLive: true
            }),
            // If no Redis state, indicate it's not a live game
            ...(!gameStateData && { isLive: false })
        };
        res.status(200).json(response);
    }
    catch (err) {
        logger.error('Failed to fetch comprehensive game state', { accessCode: code, error: err });
        res.status(500).json({ error: 'Failed to fetch game state' });
    }
});
// Add missing route for teacher active games
router.get('/teacher/active', auth_1.teacherAuth, async (req, res) => {
    try {
        if (!req.user?.userId || req.user?.role !== 'TEACHER') {
            res.status(401).json({ error: 'Teacher authentication required' });
            return;
        }
        const games = await getGameInstanceService().getTeacherActiveGames(req.user.userId);
        res.status(200).json({ games });
    }
    catch (error) {
        logger.error({ error }, 'Error fetching teacher active games');
        res.status(500).json({ error: 'An error occurred while fetching active games' });
    }
});
/**
 * Get a game instance by ID with full template data (for editing)
 * GET /api/v1/games/instance/:id/edit
 * Requires teacher authentication
 */
router.get('/instance/:id/edit', auth_1.teacherAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        if (!id) {
            res.status(400).json({ error: 'Game ID is required' });
            return;
        }
        const gameInstance = await getGameInstanceService().getGameInstanceByIdWithTemplate(id);
        if (!gameInstance) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }
        // Check if the user is the creator of this game
        const isCreator = user && user.userId && gameInstance.initiatorUserId === user.userId;
        if (!isCreator) {
            res.status(403).json({ error: 'You do not have permission to edit this game' });
            return;
        }
        res.status(200).json({ gameInstance });
    }
    catch (error) {
        logger.error({ error }, 'Error fetching game instance for editing');
        res.status(500).json({ error: 'An error occurred while fetching the game for editing' });
    }
});
/**
 * Update a game instance
 * PUT /api/v1/games/instance/:id
 * Requires teacher authentication
 */
router.put('/instance/:id', auth_1.teacherAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, playMode, settings } = req.body;
        const user = req.user;
        if (!id) {
            res.status(400).json({ error: 'Game ID is required' });
            return;
        }
        // Check if the game exists and the user is the creator
        const existingGame = await getGameInstanceService().getGameInstanceById(id);
        if (!existingGame) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }
        const isCreator = user && user.userId && existingGame.initiatorUserId === user.userId;
        if (!isCreator) {
            res.status(403).json({ error: 'You do not have permission to update this game' });
            return;
        }
        // Only allow updates to pending games
        if (existingGame.status !== 'pending') {
            res.status(400).json({ error: 'Only pending games can be edited' });
            return;
        }
        const updatedGame = await getGameInstanceService().updateGameInstance(id, {
            name,
            playMode,
            settings
        });
        res.status(200).json({ gameInstance: updatedGame });
    }
    catch (error) {
        logger.error({ error }, 'Error updating game instance');
        res.status(500).json({ error: 'An error occurred while updating the game instance' });
    }
});
/**
 * Get game instances by template ID (teacher only)
 * GET /api/v1/games/template/:templateId/instances
 * Requires teacher authentication
 */
router.get('/template/:templateId/instances', auth_1.teacherAuth, async (req, res) => {
    try {
        if (!req.user?.userId || req.user?.role !== 'TEACHER') {
            res.status(401).json({ error: 'Teacher authentication required' });
            return;
        }
        const { templateId } = req.params;
        if (!templateId) {
            res.status(400).json({ error: 'Template ID is required' });
            return;
        }
        // Get all games for this teacher filtered by template ID
        const gameInstances = await getGameInstanceService().getGameInstancesByTemplateId(templateId, req.user.userId);
        res.status(200).json({ gameInstances });
    }
    catch (error) {
        logger.error({ error, templateId: req.params.templateId }, 'Error fetching game instances by template');
        res.status(500).json({ error: 'An error occurred while fetching game instances' });
    }
});
/**
 * Delete a game instance (teacher only)
 * DELETE /api/v1/games/:id
 * Requires teacher authentication
 */
router.delete('/:id', auth_1.teacherAuth, async (req, res) => {
    try {
        if (!req.user?.userId || req.user?.role !== 'TEACHER') {
            res.status(401).json({ error: 'Teacher authentication required' });
            return;
        }
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'Game instance ID is required' });
            return;
        }
        logger.info({ instanceId: id, userId: req.user.userId }, 'Deleting game instance');
        // Delete the game instance
        await getGameInstanceService().deleteGameInstance(req.user.userId, id);
        // Return 204 No Content for successful deletion
        res.status(204).send();
    }
    catch (error) {
        const err = error;
        logger.error({
            error: err.message,
            instanceId: req.params.id,
            userId: req.user?.userId
        }, 'Error deleting game instance');
        if (err.message.includes('not found')) {
            res.status(404).json({ error: err.message });
        }
        else if (err.message.includes('permission')) {
            res.status(403).json({ error: err.message });
        }
        else {
            res.status(500).json({ error: 'An error occurred while deleting the game instance' });
        }
    }
});
/**
 * Check if a user can play a game in differed mode
 * GET /api/v1/games/:code/can-play-differed?userId=:userId
 * Public endpoint - no authentication required
 */
router.get('/:code/can-play-differed', async (req, res) => {
    try {
        const { code } = req.params;
        const { userId } = req.query;
        if (!code || !userId) {
            res.status(400).json({ error: 'Missing required parameters: code and userId' });
            return;
        }
        // Get the game instance
        const gameInstance = await getGameInstanceService().getGameInstanceByAccessCode(code);
        if (!gameInstance) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }
        // Check if the game is configured for differed play
        if (!gameInstance.isDiffered || !gameInstance.differedAvailableTo) {
            res.json({ canPlay: false });
            return;
        }
        // Check if the differed window is still open
        const now = new Date();
        const isStillAvailable = new Date(gameInstance.differedAvailableTo) > now;
        if (!isStillAvailable) {
            res.json({ canPlay: false });
            return;
        }
        // Check if the user has already participated
        const existingParticipation = await prisma_1.prisma.gameParticipant.findFirst({
            where: {
                gameInstanceId: gameInstance.id,
                userId: userId
            }
        });
        // User can always play now since we removed the completedAt field
        // For deferred tournaments, we allow unlimited replays
        const canPlay = true;
        res.json({ canPlay });
    }
    catch (error) {
        logger.error('Failed to check differed play availability', error);
        res.status(500).json({ error: 'Failed to check differed play availability' });
    }
});
// The legacy POST /api/v1/games/tournament endpoint and its handler have been removed as part of legacy cleanup.
exports.default = router;
