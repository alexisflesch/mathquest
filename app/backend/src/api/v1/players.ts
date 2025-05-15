import express, { Request, Response } from 'express';
import { PlayerService } from '@/core/services/playerService';
import createLogger from '@/utils/logger';

// Create a route-specific logger
const logger = createLogger('PlayersAPI');

const router = express.Router();

// Create a singleton instance or allow injection for testing
let playerServiceInstance: PlayerService | null = null;

const getPlayerService = (): PlayerService => {
    if (!playerServiceInstance) {
        playerServiceInstance = new PlayerService();
    }
    return playerServiceInstance;
};

// For testing purposes only - allows tests to inject a mock service
export const __setPlayerServiceForTesting = (mockService: PlayerService): void => {
    playerServiceInstance = mockService;
};

/**
 * Register a new player (anonymous or with account)
 * POST /api/v1/players/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, email, password } = req.body;

        // Basic validation
        if (!username) {
            res.status(400).json({ error: 'Username is required' });
            return;
        }

        // If password is provided, validate it
        if (password && password.length < 6) {
            res.status(400).json({ error: 'Password must be at least 6 characters long' });
            return;
        }

        // Register the player
        const player = await getPlayerService().registerPlayer({
            username,
            email,
            password,
        });

        res.status(201).json({ player });
    } catch (error) {
        logger.error({ error }, 'Error in player registration');

        // Handle specific errors
        if (error instanceof Error && error.message.includes('already exists')) {
            res.status(409).json({ error: error.message });
            return;
        }

        res.status(500).json({ error: 'An error occurred during registration' });
    }
});

/**
 * Get player by cookieId
 * GET /api/v1/players/cookie/:cookieId
 */
router.get('/cookie/:cookieId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { cookieId } = req.params;

        if (!cookieId) {
            res.status(400).json({ error: 'Cookie ID is required' });
            return;
        }

        const player = await getPlayerService().getPlayerByCookieId(cookieId);

        if (!player) {
            res.status(404).json({ error: 'Player not found' });
            return;
        }

        res.status(200).json({ player });
    } catch (error) {
        logger.error({ error }, 'Error fetching player by cookieId');
        res.status(500).json({ error: 'An error occurred fetching the player' });
    }
});

export default router;
