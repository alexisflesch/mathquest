import express, { Request, Response } from 'express';
import { UserService } from '@/core/services/userService';
import { UserRole } from '@/db/generated/client';
import { teacherAuth } from '@/middleware/auth';
import createLogger from '@/utils/logger';
import type {
    ErrorResponse,
    TeacherProfileResponse
} from '@shared/types/api/responses';

// Create a route-specific logger
const logger = createLogger('TeachersAPI');

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
 * Get the authenticated teacher's profile
 * GET /api/v1/teachers/profile
 */
router.get('/profile', teacherAuth, async (req: Request, res: Response<TeacherProfileResponse | ErrorResponse>): Promise<void> => {
    try {
        // Expect req.user to have userId (set by auth middleware)
        if (!req.user?.userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const user = await getUserService().getUserById(req.user.userId);
        if (!user || user.role !== UserRole.TEACHER) {
            res.status(404).json({ error: 'Teacher not found' });
            return;
        }
        // Return user data without sensitive information
        const publicUser = {
            id: user.id,
            username: user.username,
            email: user.email || undefined,
            role: user.role,
            avatarEmoji: user.avatarEmoji || '🐼', // Default to panda if null
            createdAt: user.createdAt.toISOString()
        };
        res.status(200).json({ user: publicUser });
    } catch (error) {
        logger.error({ error }, 'Error fetching teacher profile');
        res.status(500).json({ error: 'An error occurred fetching the profile' });
    }
});

// The deprecated POST /api/v1/teachers/register endpoint and its handler have been removed as part of legacy cleanup.

export default router;
