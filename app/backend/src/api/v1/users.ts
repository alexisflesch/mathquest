import express, { Request, Response } from 'express';
import { UserService } from '@/core/services/userService';
import { optionalAuth } from '@/middleware/auth';
import createLogger from '@/utils/logger';
import type { PublicUser } from '@shared/types/core/user';
import type {
    ErrorResponse
} from '@shared/types/api/requests';

const logger = createLogger('UsersAPI');
const router = express.Router();

// Create a singleton instance or allow injection for testing
let userServiceInstance: UserService | null = null;

const getUserService = (): UserService => {
    if (!userServiceInstance) {
        userServiceInstance = new UserService();
    }
    return userServiceInstance;
};

// GET /api/v1/users/:userId - Get user by ID
router.get('/:userId', optionalAuth, async (req: Request, res: Response<PublicUser | ErrorResponse>): Promise<void> => {
    try {
        const { userId } = req.params;

        if (!userId) {
            res.status(400).json({ error: 'User ID is required' });
            return;
        }

        const userService = getUserService();
        const user = await userService.getUserById(userId);

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Return user data without sensitive information
        const publicUser: PublicUser = {
            id: user.id,
            username: user.username,
            email: user.email || undefined,
            role: user.role as any, // Type assertion for enum compatibility
            avatarEmoji: user.avatarEmoji || '🐼', // Fallback to default for legacy data
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.createdAt.toISOString() // Use createdAt if updatedAt doesn't exist
        };

        res.json(publicUser);
    } catch (error) {
        logger.error({ error }, 'Error fetching user');
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
