import express, { Request, Response } from 'express';
import { UserService } from '@/core/services/userService';
import { UserRole } from '@/db/generated/client';
import { teacherAuth } from '@/middleware/auth';
import createLogger from '@/utils/logger';

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
 * Deprecated: Register a new teacher
 * POST /api/v1/teachers/register
 * Use /api/v1/auth/register instead
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, email, password, adminPassword } = req.body;

        // Basic validation
        if (!username) {
            res.status(400).json({ error: 'Username is required' });
            return;
        }

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required for teacher registration' });
            return;
        }

        if (password.length < 6) {
            res.status(400).json({ error: 'Password must be at least 6 characters long' });
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({ error: 'Invalid email format' });
            return;
        }

        // Check if email already exists
        try {
            const existingUser = await getUserService().getUserByEmail(email);
            if (existingUser) {
                res.status(400).json({ error: 'Email already exists' });
                return;
            }
        } catch (error) {
            // User not found is expected - continue with registration
        }

        // Use UserService directly instead of making HTTP calls
        const result = await getUserService().registerUser({
            username,
            email,
            password,
            role: UserRole.TEACHER
        });

        logger.info('Teacher registered successfully via deprecated endpoint', {
            userId: result.user.id,
            username,
            email
        });

        res.status(201).json(result);
    } catch (error) {
        logger.error({ error }, 'Error in deprecated teachers/register endpoint');

        // Handle specific user service errors
        if (error instanceof Error) {
            if (error.message.includes('already exists')) {
                res.status(400).json({ error: 'Email already exists' });
                return;
            }
        }

        res.status(500).json({ error: 'An error occurred during registration' });
    }
});

// Note: Teacher login has been consolidated into the unified /api/v1/auth endpoint
// Use POST /api/v1/auth with action: 'teacher_login' instead

/**
 * Get the authenticated teacher's profile
 * GET /api/v1/teachers/profile
 */
router.get('/profile', teacherAuth, async (req: Request, res: Response): Promise<void> => {
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
        res.status(200).json({ user });
    } catch (error) {
        logger.error({ error }, 'Error fetching teacher profile');
        res.status(500).json({ error: 'An error occurred fetching the profile' });
    }
});

export default router;
