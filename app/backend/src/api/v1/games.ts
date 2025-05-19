import express, { Request, Response } from 'express';
import { GameInstanceService } from '@/core/services/gameInstanceService';
import { GameParticipantService } from '@/core/services/gameParticipantService';
import { GameTemplateService } from '@/core/services/gameTemplateService';
import { teacherAuth, optionalAuth } from '@/middleware/auth';
import createLogger from '@/utils/logger';
import gameStateService from '@/core/gameStateService';

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
            nbOfQuestions
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

        // Use unified user model
        let userId: string | undefined = undefined;
        let role: string | undefined = undefined;
        if (req.user) {
            userId = req.user.userId;
            role = req.user.role;
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
            const gameState = await gameStateService.initializeGameState(id);
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
        // Return leaderboard from DB (or empty array if not set)
        res.json({ leaderboard: gameInstance.leaderboard || [] });
    } catch (err: any) {
        logger.error('Failed to fetch leaderboard', err);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

/**
 * GET /api/v1/games/:code/state
 * Returns the current question and timer state for a live game (for late joiners)
 */
router.get('/:code/state', async (req: Request, res: Response) => {
    const { code } = req.params;
    try {
        // Use gameStateService to get full game state
        const gameStateRaw = await gameStateService.getFullGameState(code);
        if (!gameStateRaw || !gameStateRaw.gameState) {
            res.status(404).json({ error: 'Game not found or not live' });
            return;
        }
        // Return current question, timer, and status
        const { currentQuestionIndex, questionIds, questionData, timer, status } = gameStateRaw.gameState;
        res.json({
            currentQuestionIndex,
            questionId: questionIds[currentQuestionIndex],
            questionData,
            timer,
            status
        });
    } catch (err: any) {
        logger.error('Failed to fetch game state', err);
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

export default router;
