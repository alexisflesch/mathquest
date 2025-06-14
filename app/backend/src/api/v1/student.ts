import express, { Request, Response } from 'express';
import { UserService } from '@/core/services/userService';
import { UserRole } from '@/db/generated/client';
import { validateAvatar } from '@/utils/avatarUtils';
import createLogger from '@/utils/logger';
import type {
    RegisterResponse
} from '@shared/types/api/responses';
import type {
    ErrorResponse
} from '@shared/types/api/requests';

// Create a route-specific logger
const logger = createLogger('StudentAPI');

const router = express.Router();

// Create a singleton instance or allow injection for testing
let userServiceInstance: UserService | null = null;

const getUserService = (): UserService => {
    if (!userServiceInstance) {
        userServiceInstance = new UserService();
    }
    return userServiceInstance;
};

/**
 * Generic student endpoint that handles multiple actions
 * POST /api/v1/student
 */
router.post('/', async (req: Request, res: Response<RegisterResponse | ErrorResponse>): Promise<void> => {
    try {
        const { action, username, avatar, cookie_id } = req.body;

        switch (action) {
            case 'join':
                await handleStudentJoin(req, res);
                break;
            default:
                res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        logger.error({ error }, 'Error in student endpoint');
        res.status(500).json({ error: 'An error occurred during student operation' });
    }
});

/**
 * Handle student join (registration)
 */
async function handleStudentJoin(req: Request, res: Response<RegisterResponse | ErrorResponse>): Promise<void> {
    const { username, avatar, cookie_id } = req.body;

    // Basic validation
    if (!username) {
        res.status(400).json({ error: 'Username is required' });
        return;
    }

    try {
        // Validate avatar (ensures it's one of the allowed animal emojis)
        validateAvatar(avatar);
    } catch (error) {
        res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid avatar' });
        return;
    }

    try {
        // Register the user as a STUDENT (anonymous registration)
        const result = await getUserService().registerUser({
            username,
            email: undefined, // Students don't need email
            password: undefined, // Students don't need password
            role: UserRole.STUDENT,
            avatarEmoji: avatar
        });

        if (!result.user || !result.token) {
            res.status(500).json({ error: 'Student registration failed' });
            return;
        }

        logger.info('Student registered successfully', {
            username,
            avatar,
            cookie_id,
            userId: result.user.id
        });

        // Return success message
        res.status(201).json({
            success: true,
            message: 'Student registered successfully',
            token: result.token,
            user: {
                id: result.user.id,
                username: result.user.username,
                avatar: result.user.avatarEmoji, // Use the actual avatarEmoji
                role: result.user.role,
                email: result.user.email,
                // createdAt: result.user.createdAt,
                // updatedAt: result.user.updatedAt
            }
        });
    } catch (error) {
        logger.error({ error }, 'Error in student join');

        // Handle specific errors
        if (error instanceof Error && error.message.includes('already exists')) {
            res.status(409).json({ error: error.message });
            return;
        }

        res.status(500).json({ error: 'An error occurred during student registration' });
    }
}

export default router;
