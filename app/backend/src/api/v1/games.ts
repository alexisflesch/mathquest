import express, { Request, Response } from 'express';
import { GameInstanceService } from '@/core/services/gameInstanceService';
import { GameParticipantService } from '@/core/services/gameParticipantService';
import { GameTemplateService } from '@/core/services/gameTemplateService';
// Import specific functions from gameStateService
import { initializeGameState, getFullGameState, getFormattedLeaderboard } from '@/core/services/gameStateService';
import { redisClient } from '@/config/redis';
import { prisma } from '@/db/prisma';
import { teacherAuth, optionalAuth } from '@/middleware/auth';
import { validateRequestBody } from '@/middleware/validation';
import createLogger from '@/utils/logger';
// Import modular join service to replace legacy joinGame
import { joinGame as joinGameModular } from '@/core/services/gameParticipant/joinService';
import type {
    GameInstanceResponse,
    GameJoinResponse,
    GameStatusUpdateResponse,
    GameStateResponse,
    LeaderboardResponse,
    TeacherActiveGamesResponse,
    GameInstancesByTemplateResponse
} from '@shared/types/api/responses';
import type { GameCreationResponse } from '@shared/types/api/schemas';
import type {
    GameCreationRequest,
    GameJoinRequest,
    RenameGameInstanceRequest,
    ErrorResponse
} from '@shared/types/api/requests';
import {
    CreateGameRequestSchema,
    GameJoinRequestSchema,
    GameStatusUpdateRequestSchema,
    RenameGameInstanceRequestSchema
} from '@shared/types/api/schemas';

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
router.post('/', optionalAuth, validateRequestBody(CreateGameRequestSchema), async (req: Request<{}, GameCreationResponse | ErrorResponse, GameCreationRequest>, res: Response<GameCreationResponse | ErrorResponse>): Promise<void> => {
    try {
        // Debug: Log the full request body, user, and headers
        logger.info('Games POST request body debug', {
            fullBody: req.body,
            keys: Object.keys(req.body),
            user: req.user,
            headers: req.headers
        });

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
        // Allow GUEST users as well as STUDENT and TEACHER
        if (!userId || !role || !['STUDENT', 'TEACHER', 'GUEST'].includes(role.toUpperCase())) {
            res.status(401).json({ error: 'Authentication required (teacher, student, or guest)' });
            return;
        }

        let finalgameTemplateId = gameTemplateId;
        // If no gameTemplateId but student tournament/practice params are provided, create GameTemplate on-the-fly
        if (!gameTemplateId && (playMode === 'tournament' || playMode === 'practice') && gradeLevel && discipline && Array.isArray(themes) && nbOfQuestions) {
            try {
                const gameTemplateService = new GameTemplateService();

                // Extract username from settings if available
                const username = settings?.username || undefined;

                const template = await gameTemplateService.createStudentGameTemplate({
                    userId: userId!,
                    username: username,
                    playMode: playMode,
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
        let status: 'pending' | 'completed' | undefined = undefined;
        if (playMode === 'tournament' && !gameTemplateId) {
            status = 'pending';
        }
        const gameInstance = await getGameInstanceService().createGameInstanceUnified({
            name,
            gameTemplateId: finalgameTemplateId,
            playMode: playMode as any, // Type assertion for now
            settings: settings,
            initiatorUserId: userId,
            ...(status ? { status } : {})
        });

        logger.info('GamesAPI created gameInstance debug', { gameInstanceSettings: gameInstance.settings });

        // Clean up any stale Redis data for this access code before initializing fresh state
        const accessCode = gameInstance.accessCode;
        const redisPatterns = [
            `mathquest:game:*${accessCode}*`,           // Game state and participants
            `mathquest:timer:${accessCode}:*`,          // Timer states for all questions
            `mathquest:projection:display:${accessCode}`, // Projection display state (stats/trophy toggles)
            `mathquest:explanation_sent:${accessCode}:*`, // Explanation tracking
            `mathquest:lobby:${accessCode}`,            // Lobby state
            `leaderboard:snapshot:${accessCode}`,       // Leaderboard snapshots
            `*${accessCode}*`                           // Catch any remaining keys with accessCode
        ];
        for (const pattern of redisPatterns) {
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                logger.info({ pattern, keys, accessCode }, 'Cleaning stale Redis keys before game initialization');
                await redisClient.del(...keys);
            }
        }

        // Initialize game state in Redis immediately after game instance creation
        await initializeGameState(gameInstance.id);

        res.status(201).json({ gameInstance });
    } catch (error) {
        logger.error({ error }, 'Error creating game instance');
        res.status(500).json({ error: 'An error occurred while creating the game instance' });
    }
});

/**
 * Get a game by access code
 * GET /api/v1/games/:accessCode
 * Public endpoint - no authentication required
 */
router.get('/:accessCode', async (req: Request, res: Response<GameInstanceResponse | ErrorResponse>): Promise<void> => {
    try {
        const { accessCode } = req.params;

        // Validate access code format
        if (!accessCode || accessCode.length < 4) {
            res.status(400).json({ error: 'Invalid access code format' });
            return;
        }

        // Always fetch the game instance (no participants, no questions)
        const gameInstance = await getGameInstanceService().getGameInstanceByAccessCode(accessCode, false);

        if (!gameInstance) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }

        // Canonical: Only return minimal public info for lobby/public consumers
        // Use shared PublicGameInstance type
        // linkedQuizId is always in settings (object or JSON), never top-level
        let linkedQuizId: string | null = null;
        if (gameInstance.settings && typeof gameInstance.settings === 'object' && 'linkedQuizId' in gameInstance.settings) {
            linkedQuizId = (gameInstance.settings as any).linkedQuizId ?? null;
        }

        // If this is a practice session, extract canonical practiceSettings
        let practiceSettings = undefined;
        if (gameInstance.playMode === 'practice') {
            // Prefer settings.practiceSettings if present, else fallback to gameTemplate
            if (gameInstance.settings && typeof gameInstance.settings === 'object' && 'practiceSettings' in gameInstance.settings) {
                practiceSettings = (gameInstance.settings as any).practiceSettings;
            } else if ('gameTemplate' in gameInstance && gameInstance.gameTemplate) {
                const template = gameInstance.gameTemplate as any;
                practiceSettings = {
                    discipline: template.discipline || '',
                    gradeLevel: template.gradeLevel || '',
                    themes: template.themes || [],
                    questionCount: Array.isArray(template.questions) ? template.questions.length : 10,
                    showImmediateFeedback: true,
                    allowRetry: true,
                    randomizeQuestions: false,
                    gameTemplateId: template.id
                };
            }
        }

        const publicGameInstance = {
            accessCode: gameInstance.accessCode,
            playMode: gameInstance.playMode,
            linkedQuizId,
            status: gameInstance.status,
            name: gameInstance.name,
            ...(practiceSettings ? { practiceSettings } : {})
        };
        res.status(200).json({ gameInstance: publicGameInstance });
    } catch (error) {
        logger.error({ error }, 'Error fetching game instance');
        res.status(500).json({ error: 'An error occurred while fetching the game' });
    }
});

/**
 * Get a game instance by ID
 * GET /api/v1/games/id/:id
 * Requires teacher authentication
 */
router.get('/id/:id', teacherAuth, async (req: Request, res: Response<GameInstanceResponse | ErrorResponse>): Promise<void> => {
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
    } catch (error) {
        logger.error({ error }, 'Error fetching game instance by ID');
        res.status(500).json({ error: 'An error occurred while fetching the game' });
    }
});

/**
 * Join a game as a player
 * POST /api/v1/games/:accessCode/join
 * Requires player ID in request
 */
router.post('/:accessCode/join', validateRequestBody(GameJoinRequestSchema), async (req: Request<{ accessCode: string }, GameJoinResponse | ErrorResponse, GameJoinRequest>, res: Response<GameJoinResponse | ErrorResponse>): Promise<void> => {
    try {
        const { accessCode } = req.params;
        const { userId } = req.body;

        if (!userId) {
            res.status(400).json({ error: 'Player ID is required' });
            return;
        }

        const joinResult = await joinGameModular({
            userId,
            accessCode,
            username: undefined, // API doesn't provide username
            avatarEmoji: undefined // API doesn't provide avatarEmoji
        });

        if (!joinResult.success) {
            res.status(400).json({ error: joinResult.error || 'Failed to join game' });
            return;
        }

        if (!joinResult.gameInstance || !joinResult.participant) {
            res.status(500).json({ error: 'Incomplete join result' });
            return;
        }

        // Map the gameInstance to include required fields
        const gameInstance = {
            ...joinResult.gameInstance,
            accessCode: accessCode, // Use the access code from the route parameter
            createdAt: new Date(), // Add missing createdAt field
            gameTemplateId: 'unknown', // Add missing gameTemplateId field
            gameTemplate: {
                id: 'unknown',
                name: joinResult.gameInstance.gameTemplate?.name || 'Unknown Template',
                themes: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                creatorId: 'unknown'
            }
        };

        // Map the participant to include required fields
        const isDeferred = joinResult.participant.status === 'ACTIVE' && joinResult.gameInstance.status === 'completed';
        const participant = {
            id: joinResult.participant.id,
            userId: joinResult.participant.userId,
            username: joinResult.participant.user?.username || 'Unknown',
            avatarEmoji: joinResult.participant.user?.avatarEmoji || '🐼',
            score: isDeferred ? (joinResult.participant.deferredScore || 0) : (joinResult.participant.liveScore || 0),
            joinedAt: joinResult.participant.joinedAt?.toISOString() || new Date().toISOString(),
            participationType: isDeferred ? 'DEFERRED' : 'LIVE',
            attemptCount: joinResult.participant.nbAttempts || 1,
            online: true
        };

        res.status(200).json({
            success: true,
            gameInstance,
            participant
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
router.put('/:id/status', optionalAuth, validateRequestBody(GameStatusUpdateRequestSchema), async (req: Request, res: Response<GameStatusUpdateResponse | ErrorResponse>): Promise<void> => {
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
 * ANTI-CHEATING: Only accessible after game ends (status = 'completed')
 */
// Modernized: Accepts optional userId query param and marks isCurrentUser in leaderboard
router.get('/:code/leaderboard', async (req: Request, res: Response<LeaderboardResponse | ErrorResponse>) => {
    const { code } = req.params;
    const userId = req.query.userId as string | undefined;
    try {
        const gameInstance = await getGameInstanceService().getGameInstanceByAccessCode(code);
        if (!gameInstance) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }

        // ANTI-CHEATING: Block leaderboard access during active games
        if (gameInstance.status !== 'completed') {
            logger.warn({
                accessCode: code,
                gameStatus: gameInstance.status,
                userId: userId || 'anonymous'
            }, '[ANTI-CHEATING] Blocked leaderboard access during active game');
            res.status(403).json({
                error: 'Leaderboard not available during active game. Please wait for the game to end.'
            });
            return;
        }

        let leaderboard = await getFormattedLeaderboard(code);
        if (userId) {
            leaderboard = leaderboard.map(entry => ({
                ...entry,
                isCurrentUser: entry.userId === userId
            }));
        }
        res.json({ leaderboard });
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
                const gameStateRaw = await getFullGameState(code);
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
            } catch (redisError) {
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
 * Get a game instance by ID with full template data (for editing)
 * GET /api/v1/games/instance/:id/edit
 * Requires teacher authentication
 */
router.get('/instance/:id/edit', teacherAuth, async (req: Request, res: Response): Promise<void> => {
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
    } catch (error) {
        logger.error({ error }, 'Error fetching game instance for editing');
        res.status(500).json({ error: 'An error occurred while fetching the game for editing' });
    }
});

/**
 * Update a game instance
 * PUT /api/v1/games/instance/:id
 * Requires teacher authentication
 */
router.put('/instance/:id', teacherAuth, async (req: Request, res: Response): Promise<void> => {
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
    } catch (error) {
        logger.error({ error }, 'Error updating game instance');
        res.status(500).json({ error: 'An error occurred while updating the game instance' });
    }
});

/**
 * Rename a game instance
 * PATCH /api/v1/games/instance/:id/name
 * Requires teacher authentication
 */
router.patch('/instance/:id/name', teacherAuth, validateRequestBody(RenameGameInstanceRequestSchema), async (req: Request<{ id: string }, GameInstanceResponse | ErrorResponse, RenameGameInstanceRequest>, res: Response<GameInstanceResponse | ErrorResponse>): Promise<void> => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const user = req.user;

        if (!id) {
            res.status(400).json({ error: 'ID de la session requis' });
            return;
        }

        // Check if the game exists and the user is the creator
        const existingGame = await getGameInstanceService().getGameInstanceById(id);
        if (!existingGame) {
            res.status(404).json({ error: 'Session non trouvée' });
            return;
        }

        const isCreator = user && user.userId && existingGame.initiatorUserId === user.userId;
        if (!isCreator) {
            res.status(403).json({ error: 'Vous n\'avez pas la permission de renommer cette session' });
            return;
        }

        logger.info({ gameId: id, userId: user.userId, newName: name }, 'Renaming game instance');

        // Update only the name
        const updatedGame = await getGameInstanceService().updateGameInstance(id, {
            name
        });

        res.status(200).json({ gameInstance: updatedGame });
    } catch (error) {
        logger.error({ error }, 'Error renaming game instance');
        res.status(500).json({ error: 'Une erreur s\'est produite lors du renommage de la session' });
    }
});

/**
 * Get game instances by template ID (teacher only)
 * GET /api/v1/games/template/:templateId/instances
 * Requires teacher authentication
 */
router.get('/template/:templateId/instances', teacherAuth, async (req: Request, res: Response): Promise<void> => {
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
    } catch (error) {
        logger.error({ error, templateId: req.params.templateId }, 'Error fetching game instances by template');
        res.status(500).json({ error: 'An error occurred while fetching game instances' });
    }
});

/**
 * Delete a game instance (teacher only)
 * DELETE /api/v1/games/:id
 * Requires teacher authentication
 */
router.delete('/:id', teacherAuth, async (req: Request, res: Response): Promise<void> => {
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

        // Fetch the game instance to get the accessCode
        const gameInstance = await getGameInstanceService().getGameInstanceById(id);
        if (!gameInstance) {
            res.status(404).json({ error: 'Game instance not found' });
            return;
        }
        const accessCode = gameInstance.accessCode;

        // Delete all Redis keys related to this game instance
        const redisPatterns = [
            `mathquest:game:*${accessCode}*`,           // Game state and participants
            `mathquest:timer:${accessCode}:*`,          // Timer states for all questions
            `mathquest:projection:display:${accessCode}`, // Projection display state (stats/trophy toggles)
            `mathquest:explanation_sent:${accessCode}:*`, // Explanation tracking
            `mathquest:lobby:${accessCode}`,            // Lobby state
            `leaderboard:snapshot:${accessCode}`,       // Leaderboard snapshots
            `*${accessCode}*`                           // Catch any remaining keys with accessCode
        ];
        for (const pattern of redisPatterns) {
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                logger.info({ pattern, keys, accessCode }, 'Deleting Redis keys for game deletion');
                await redisClient.del(...keys);
            }
        }

        // Delete the game instance from the database
        await getGameInstanceService().deleteGameInstance(req.user.userId, id);

        logger.info({ instanceId: id, userId: req.user.userId, accessCode }, 'Game instance and Redis state deleted');

        // Return 204 No Content for successful deletion
        res.status(204).send();
    } catch (error) {
        const err = error as Error;
        logger.error({
            error: err.message,
            instanceId: req.params.id,
            userId: req.user?.userId
        }, 'Error deleting game instance');

        if (err.message.includes('not found')) {
            res.status(404).json({ error: err.message });
        } else if (err.message.includes('permission')) {
            res.status(403).json({ error: err.message });
        } else {
            res.status(500).json({ error: 'An error occurred while deleting the game instance' });
        }
    }
});

/**
 * Check if a user can play a game in differed mode
 * GET /api/v1/games/:code/can-play-differed?userId=:userId
 * Public endpoint - no authentication required
 */
router.get('/:code/can-play-differed', async (req: Request, res: Response) => {
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

        // Check if the game is configured for differed play (completed tournaments with differed availability)
        if (gameInstance.status !== 'completed' || !gameInstance.differedAvailableTo) {
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
        const existingParticipation = await prisma.gameParticipant.findFirst({
            where: {
                gameInstanceId: gameInstance.id,
                userId: userId as string
            }
        });

        // User can always play now since we removed the completedAt field
        // For deferred tournaments, we allow unlimited replays
        const canPlay = true;
        res.json({ canPlay });
    } catch (error) {
        logger.error('Failed to check differed play availability', error);
        res.status(500).json({ error: 'Failed to check differed play availability' });
    }
});

// The legacy POST /api/v1/games/tournament endpoint and its handler have been removed as part of legacy cleanup.

export default router;
