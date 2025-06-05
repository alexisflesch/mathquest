import express, { Request, Response } from 'express';
import { UserService } from '@/core/services/userService';
import { optionalAuth } from '@/middleware/auth';
import createLogger from '@/utils/logger';

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
router.get('/:userId', optionalAuth, async (req: Request, res: Response): Promise<void> => {
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
        const publicUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            avatarEmoji: user.avatarEmoji,
            createdAt: user.createdAt
        };

        res.json(publicUser);
    } catch (error) {
        logger.error({ error }, 'Error fetching user');
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
