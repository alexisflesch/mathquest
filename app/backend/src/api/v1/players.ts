import express, { Request, Response } from 'express';
import { UserService } from '@/core/services/userService';
import { UserRole } from '@/db/generated/client';
import createLogger from '@/utils/logger';
import type {
    UserByCookieResponse
} from '@shared/types/api/responses';
import type {
    ErrorResponse
} from '@shared/types/api/requests';

// Create a route-specific logger
const logger = createLogger('PlayersAPI');

const router = express.Router();

// Create a singleton instance or allow injection for testing
let userServiceInstance: UserService | null = null;

const getUserService = (): UserService => {
    if (!userServiceInstance) {
        userServiceInstance = new UserService();
    }
    return userServiceInstance;
};

// For testing purposes only - allows tests to inject a mock service
export const __setUserServiceForTesting = (mockService: UserService): void => {
    userServiceInstance = mockService;
};

/**
 * Get student by cookieId
 * GET /api/v1/players/cookie/:cookieId
 */
router.get('/cookie/:cookieId', async (req: Request, res: Response<UserByCookieResponse | ErrorResponse>): Promise<void> => {
    try {
        const { cookieId } = req.params;

        if (!cookieId) {
            res.status(400).json({ error: 'Cookie ID is required' });
            return;
        }

        const user = await getUserService().getUserByCookieId(cookieId);

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.status(200).json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email || undefined,
                role: user.role,
                avatarEmoji: user.avatarEmoji || '�',
                createdAt: user.createdAt.toISOString()
            }
        });
    } catch (error) {
        logger.error({ error }, 'Error fetching user by cookieId');
        res.status(500).json({ error: 'An error occurred fetching the user' });
    }
});

// The deprecated POST /api/v1/players/register endpoint and its handler have been removed as part of legacy cleanup.

export default router;
