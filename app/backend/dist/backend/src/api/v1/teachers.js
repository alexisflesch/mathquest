"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.__setUserServiceForTesting = void 0;
const express_1 = __importDefault(require("express"));
const userService_1 = require("@/core/services/userService");
const client_1 = require("@/db/generated/client");
const auth_1 = require("@/middleware/auth");
const logger_1 = __importDefault(require("@/utils/logger"));
// Create a route-specific logger
const logger = (0, logger_1.default)('TeachersAPI');
const router = express_1.default.Router();
// Create a singleton instance or allow injection for testing
let userServiceInstance = null;
const getUserService = () => {
    if (!userServiceInstance) {
        userServiceInstance = new userService_1.UserService();
    }
    return userServiceInstance;
};
// For testing purposes only - allows tests to inject a mock service
const __setUserServiceForTesting = (mockService) => {
    userServiceInstance = mockService;
};
exports.__setUserServiceForTesting = __setUserServiceForTesting;
/**
 * Register a new teacher
 * POST /api/v1/teachers/register
 */
router.post('/register', async (req, res) => {
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
            role: client_1.UserRole.TEACHER,
        });
        res.status(201).json(result);
    }
    catch (error) {
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
router.post('/login', async (req, res) => {
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
        if (result.user.role !== client_1.UserRole.TEACHER) {
            res.status(403).json({ error: 'Not a teacher account' });
            return;
        }
        res.status(200).json(result);
    }
    catch (error) {
        logger.error({ error }, 'Error in teacher login');
        // Handle authentication errors
        if (error instanceof Error && (error.message.includes('Invalid email') ||
            error.message.includes('Invalid password'))) {
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
router.get('/profile', auth_1.teacherAuth, async (req, res) => {
    try {
        // Expect req.user to have userId (set by auth middleware)
        if (!req.user?.userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const user = await getUserService().getUserById(req.user.userId);
        if (!user || user.role !== client_1.UserRole.TEACHER) {
            res.status(404).json({ error: 'Teacher not found' });
            return;
        }
        res.status(200).json({ user });
    }
    catch (error) {
        logger.error({ error }, 'Error fetching teacher profile');
        res.status(500).json({ error: 'An error occurred fetching the profile' });
    }
});
exports.default = router;
