import express, { Request, Response } from 'express';
import { GameInstanceService } from '@/core/services/gameInstanceService';
import { GameParticipantService } from '@/core/services/gameParticipantService';
import { GameTemplateService } from '@/core/services/gameTemplateService';
// Import specific functions from gameStateService
import { initializeGameState, getFullGameState, getFormattedLeaderboard } from '@/core/gameStateService';
import { redisClient } from '@/config/redis';
import { teacherAuth, optionalAuth } from '@/middleware/auth';
import createLogger from '@/utils/logger';

// Create a route-specific logger
const logger = createLogger('GamesAPI');

const router = express.Router();

// Create singleton instances or allow injection for testing
let gameInstanceServiceInstance: GameInstanceService | null = null;
let gameParticipantServiceInstance: GameParticipantService | null = null;

const getGameInstanceService = (): GameInstanceService => {
    if (!gameInstanceServiceInstance) {
        gameInstanceServiceInstance = new GameInstanceService();
    }
    return gameInstanceServiceInstance;
};

const getGameParticipantService = (): GameParticipantService => {
    if (!gameParticipantServiceInstance) {
        gameParticipantServiceInstance = new GameParticipantService();
    }
    return gameParticipantServiceInstance;
};

// For testing purposes only
export const __setGameInstanceServiceForTesting = (mockService: GameInstanceService): void => {
    gameInstanceServiceInstance = mockService;
};

export const __setGameParticipantServiceForTesting = (mockService: GameParticipantService): void => {
    gameParticipantServiceInstance = mockService;
};

/**
 * Create a new game instance (quiz, tournament, or practice)
 * POST /api/v1/games
 * Allows teacher or student authentication
 */
router.post('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            name,
            gameTemplateId,
            playMode,
            settings,
            gradeLevel,
            discipline,
            themes,
            nbOfQuestions,
            initiatorStudentId
        } = req.body;

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
        let userId: string | undefined = undefined;
        let role: string | undefined = undefined;
        if (req.user) {
            userId = req.user.userId;
            role = req.user.role;
        } else if (initiatorStudentId) {
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
                const gameTemplateService = new GameTemplateService();
                const template = await gameTemplateService.createStudentGameTemplate({
                    userId: userId!,
                    gradeLevel,
                    discipline,
                    themes,
                    nbOfQuestions
                });
                finalgameTemplateId = template.id;
            } catch (err: any) {
                res.status(400).json({ error: err.message || 'Failed to create game template' });
                return;
            }
        }

        // Basic validation for required fields
        if (!name || !finalgameTemplateId || !playMode) {
            res.status(400).json({
                error: 'Required fields missing',
                required: ['name', 'gameTemplateId', 'playMode']
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
        await initializeGameState(gameInstance.id);

        res.status(201).json({ gameInstance });
    } catch (error) {
        logger.error({ error }, 'Error creating game instance');
        res.status(500).json({ error: 'An error occurred while creating the game instance' });
    }
});

/**
 * Legacy route for backward compatibility
 * GET /api/v1/games/game-status?code=XXXXX
 * @deprecated Use GET /api/v1/games/:code/state instead
 */
router.get('/game-status', async (req: Request, res: Response): Promise<void> => {
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
    } catch (error) {
        logger.error({ error }, 'Error in legacy game-status route');
        res.status(500).json({ error: 'An error occurred while fetching game status' });
    }
});

/**
 * Get a game by access code
 * GET /api/v1/games/:accessCode
 * Public endpoint - no authentication required
 */
router.get('/:accessCode', async (req: Request, res: Response): Promise<void> => {
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
    } catch (error) {
        logger.error({ error }, 'Error fetching game instance');
        res.status(500).json({ error: 'An error occurred while fetching the game' });
    }
});

/**
 * Join a game as a player
 * POST /api/v1/games/:accessCode/join
 * Requires player ID in request
 */
router.post('/:accessCode/join', async (req: Request, res: Response): Promise<void> => {
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
    } catch (error) {
        logger.error({ error }, 'Error joining game');
        res.status(500).json({ error: 'An error occurred while joining the game' });
    }
});

/**
 * Update game status (teacher only)
 * PUT /api/v1/games/:id/status
 * Requires teacher authentication
 */
router.put('/:id/status', optionalAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;
        const studentId = req.headers['x-student-id'] as string | undefined;
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
    } catch (error) {
        logger.error({ error }, 'Error updating game status');
        res.status(500).json({ error: 'An error occurred while updating the game status' });
    }
});

/**
 * Update game status (teacher only)
 */
router.patch('/:id/status', optionalAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;
        const studentId = req.headers['x-student-id'] as string | undefined;
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
            const gameState = await initializeGameState(id);
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
    } catch (error) {
        logger.error({ error }, 'Error updating game status');
        res.status(500).json({ error: 'An error occurred while updating the game status' });
    }
});

/**
 * Update differed mode and window (teacher only)
 * PATCH /api/v1/games/:id/differed
 * Requires teacher authentication
 */
router.patch('/:id/differed', teacherAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user?.userId || req.user?.role !== 'TEACHER') {
            res.status(401).json({ error: 'Teacher authentication required' });
            return;
        }

        const games = await getGameInstanceService().getTeacherActiveGames(req.user.userId);

        res.status(200).json({ games });
    } catch (error) {
        logger.error({ error }, 'Error fetching teacher active games');
        res.status(500).json({ error: 'An error occurred while fetching active games' });
    }
});

/**
 * GET /api/v1/games/:code/leaderboard
 * Returns the leaderboard for a given game instance (by access code)
 */
router.get('/:code/leaderboard', async (req: Request, res: Response) => {
    const { code } = req.params;
    try {
        const gameInstance = await getGameInstanceService().getGameInstanceByAccessCode(code);
        if (!gameInstance) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }
        // Use the new getFormattedLeaderboard function
        const leaderboard = await getFormattedLeaderboard(code);

        // If gameInstance.leaderboard is the source of truth and needs to be updated,
        // consider doing that here or in a separate sync process.
        // For now, we return the Redis-based leaderboard directly.

        res.json(leaderboard);
    } catch (error) {
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
router.get('/:code/state', async (req: Request, res: Response) => {
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
                const gameStateRaw = await getFullGameState(code);
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
            } catch (redisError) {
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
    } catch (err: any) {
        logger.error('Failed to fetch comprehensive game state', { accessCode: code, error: err });
        res.status(500).json({ error: 'Failed to fetch game state' });
    }
});

// Add missing route for teacher active games
router.get('/teacher/active', teacherAuth, async (req: Request, res: Response) => {
    try {
        if (!req.user?.userId || req.user?.role !== 'TEACHER') {
            res.status(401).json({ error: 'Teacher authentication required' });
            return;
        }
        const games = await getGameInstanceService().getTeacherActiveGames(req.user.userId);
        res.status(200).json({ games });
    } catch (error) {
        logger.error({ error }, 'Error fetching teacher active games');
        res.status(500).json({ error: 'An error occurred while fetching active games' });
    }
});

/**
 * Create a tournament (legacy format support for existing frontend)
 * POST /api/v1/games/tournament
 * Supports the legacy frontend format with action: 'create'
 */
router.post('/tournament', optionalAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            action,
            nom,
            questions_ids,
            type,
            niveau,
            categorie,
            themes,
            cree_par_id,
            username,
            avatar
        } = req.body;

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
        const gameTemplateService = new GameTemplateService();
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
        await initializeGameState(gameInstance.id);

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

    } catch (error) {
        logger.error({ error }, 'Error creating tournament');
        res.status(500).json({ error: 'An error occurred while creating the tournament' });
    }
});

export default router;
