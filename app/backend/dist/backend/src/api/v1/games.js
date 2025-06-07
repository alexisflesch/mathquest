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
const gameStateService_1 = require("@/core/gameStateService");
const auth_1 = require("@/middleware/auth");
const logger_1 = __importDefault(require("@/utils/logger"));
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
router.post('/', auth_1.optionalAuth, async (req, res) => {
    try {
        // Debug: Log the full request body
        logger.info('Games POST request body debug', {
            fullBody: req.body,
            keys: Object.keys(req.body)
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
        // If no gameTemplateId but student tournament params are provided, create GameTemplate on-the-fly
        if (!gameTemplateId && playMode === 'tournament' && gradeLevel && discipline && Array.isArray(themes) && nbOfQuestions) {
            try {
                const gameTemplateService = new gameTemplateService_1.GameTemplateService();
                const template = await gameTemplateService.createStudentGameTemplate({
                    userId: userId,
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
        const gameInstance = await getGameInstanceService().createGameInstanceUnified({
            name,
            gameTemplateId: finalgameTemplateId,
            playMode,
            settings,
            initiatorUserId: userId
        });
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
 * Legacy route for backward compatibility
 * GET /api/v1/games/game-status?code=XXXXX
 * @deprecated Use GET /api/v1/games/:code/state instead
 */
router.get('/game-status', async (req, res) => {
    logger.info('GET /api/v1/games/game-status called (DEPRECATED - use /:code/state instead)', { query: req.query });
    try {
        const { code } = req.query;
        if (!code || typeof code !== 'string') {
            res.status(400).json({ error: 'Access code is required' });
            return;
        }
        // Forward to the consolidated state route by making an internal call
        // Create a new request object for the state route
        const stateReq = {
            ...req,
            params: { code },
            url: `/api/v1/games/${code}/state`
        };
        // Get the consolidated state data
        const gameInstance = await getGameInstanceService().getGameInstanceByAccessCode(code);
        if (!gameInstance) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }
        // Map status to legacy format
        let legacyStatus = 'en préparation';
        switch (gameInstance.status) {
            case 'pending':
                legacyStatus = 'en préparation';
                break;
            case 'active':
                legacyStatus = 'en cours';
                break;
            case 'completed':
            case 'archived':
                legacyStatus = 'terminé';
                break;
            case 'paused':
                legacyStatus = 'en pause';
                break;
        }
        // Return legacy format for backward compatibility
        res.status(200).json({
            status: gameInstance.status,
            statut: legacyStatus,
            currentQuestionIndex: gameInstance.currentQuestionIndex || 0,
            accessCode: gameInstance.accessCode,
            name: gameInstance.name
        });
    }
    catch (error) {
        logger.error({ error }, 'Error in legacy game-status route');
        res.status(500).json({ error: 'An error occurred while fetching game status' });
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
        const { userId } = req.body;
        if (!userId) {
            res.status(400).json({ error: 'Player ID is required' });
            return;
        }
        const joinResult = await getGameParticipantService().joinGame(userId, accessCode);
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
router.put('/:id/status', auth_1.optionalAuth, async (req, res) => {
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
        res.json(leaderboard);
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
        if (!code || code.length < 6) {
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
        // Map the new status to legacy format for frontend compatibility
        let legacyStatus = 'en préparation'; // Default
        switch (gameInstance.status) {
            case 'pending':
                legacyStatus = 'en préparation';
                break;
            case 'active':
                legacyStatus = 'en cours';
                break;
            case 'completed':
            case 'archived':
                legacyStatus = 'terminé';
                break;
            case 'paused':
                legacyStatus = 'en pause';
                break;
        }
        // Try to get detailed game state from Redis (for active games)
        let gameStateData = null;
        let redisGameState = null;
        if (gameInstance.status === 'active') {
            try {
                const gameStateRaw = await (0, gameStateService_1.getFullGameState)(code);
                if (gameStateRaw && gameStateRaw.gameState) {
                    redisGameState = gameStateRaw.gameState;
                    const { currentQuestionIndex, questionIds, questionData, timer, status } = redisGameState;
                    gameStateData = {
                        currentQuestionIndex,
                        questionId: questionIds && questionIds[currentQuestionIndex] ? questionIds[currentQuestionIndex] : null,
                        questionData,
                        timer,
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
        // Return comprehensive response that includes both basic info and detailed state
        const response = {
            // Basic game info (from database) - for backward compatibility with /game-status
            status: gameInstance.status,
            statut: legacyStatus,
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
 * Create a tournament (legacy format support for existing frontend)
 * POST /api/v1/games/tournament
 * Supports the legacy frontend format with action: 'create'
 */
router.post('/tournament', auth_1.optionalAuth, async (req, res) => {
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
        const gameTemplateService = new gameTemplateService_1.GameTemplateService();
        const gameTemplate = await gameTemplateService.createStudentGameTemplate({
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
exports.default = router;
