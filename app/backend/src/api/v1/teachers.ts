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
 * Register a new teacher
 * POST /api/v1/teachers/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, email, password } = req.body;

        // Basic validation
        if (!username || !password) {
            res.status(400).json({ error: 'Username and password are required' });
            return;
        }

        if (password.length < 6) {
            res.status(400).json({ error: 'Password must be at least 6 characters long' });
            return;
        }

        // Register the user as a TEACHER
        const result = await getUserService().registerUser({
            username,
            email,
            password,
            role: UserRole.TEACHER,
        });

        res.status(201).json(result);
    } catch (error) {
        logger.error({ error }, 'Error in teacher registration');

        // Handle specific errors
        if (error instanceof Error && error.message.includes('already exists')) {
            res.status(409).json({ error: error.message });
            return;
        }

        res.status(500).json({ error: 'An error occurred during registration' });
    }
});

/**
 * Login a teacher (now generic user login)
 * POST /api/v1/teachers/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const result = await getUserService().loginUser({
            email,
            password,
        });

        if (result.user.role !== UserRole.TEACHER) {
            res.status(403).json({ error: 'Not a teacher account' });
            return;
        }

        res.status(200).json(result);
    } catch (error) {
        logger.error({ error }, 'Error in teacher login');

        // Handle authentication errors
        if (error instanceof Error && (
            error.message.includes('Invalid email') ||
            error.message.includes('Invalid password')
        )) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        res.status(500).json({ error: 'An error occurred during login' });
    }
});

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
