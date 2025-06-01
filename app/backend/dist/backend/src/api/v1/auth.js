"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("@/middleware/auth");
const userService_1 = require("@/core/services/userService");
const client_1 = require("@/db/generated/client");
const logger_1 = __importDefault(require("@/utils/logger"));
// Create a route-specific logger
const logger = (0, logger_1.default)('AuthAPI');
const router = express_1.default.Router();
// Create a singleton instance or allow injection for testing
let userServiceInstance = null;
const getUserService = () => {
    if (!userServiceInstance) {
        userServiceInstance = new userService_1.UserService();
    }
    return userServiceInstance;
};
/**
 * Generic auth endpoint that handles multiple actions
 * POST /api/v1/auth
 */
router.post('/', async (req, res) => {
    try {
        const { action, email, password, username } = req.body;
        switch (action) {
            case 'teacher_login':
                await handleTeacherLogin(req, res);
                break;
            case 'teacher_register':
            case 'teacher_signup':
                await handleTeacherRegister(req, res);
                break;
            default:
                res.status(400).json({ error: 'Invalid action' });
        }
    }
    catch (error) {
        logger.error({ error }, 'Error in auth endpoint');
        res.status(500).json({ error: 'An error occurred during authentication' });
    }
});
/**
 * Handle teacher login
 */
async function handleTeacherLogin(req, res) {
    const { email, password } = req.body;
    // Basic validation
    if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
    }
    try {
        const result = await getUserService().loginUser({
            email,
            password,
        });
        if (result.user.role !== client_1.UserRole.TEACHER) {
            res.status(403).json({ error: 'Not a teacher account' });
            return;
        }
        // Return in the format expected by frontend
        res.status(200).json({
            message: 'Login successful',
            enseignant: {
                id: result.user.id,
                username: result.user.username
            },
            enseignantId: result.user.id,
            username: result.user.username,
            avatar: 'avatar1.png', // Default avatar for now
            cookie_id: `teacher_${result.user.id}_${Date.now()}`,
            token: result.token
        });
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
}
/**
 * Handle teacher registration
 */
async function handleTeacherRegister(req, res) {
    const { username, email, password, nom, prenom, adminPassword, avatar } = req.body;
    // Basic validation
    if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required' });
        return;
    }
    if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters long' });
        return;
    }
    // For now, we'll ignore the admin password check
    // In a real implementation, you might want to validate adminPassword
    try {
        // Register the user as a TEACHER
        const result = await getUserService().registerUser({
            username,
            email,
            password,
            role: client_1.UserRole.TEACHER,
        });
        // Return in the format expected by frontend
        res.status(201).json({
            message: 'Registration successful',
            enseignant: {
                id: result.user.id,
                username: result.user.username
            },
            enseignantId: result.user.id,
            username: result.user.username,
            avatar: avatar || 'avatar1.png', // Use provided avatar or default
            cookie_id: `teacher_${result.user.id}_${Date.now()}`,
            token: result.token
        });
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
}
/**
 * Password reset request endpoint
 * POST /api/v1/auth/reset-password
 */
router.post('/reset-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }
        // For now, just return success regardless of whether email exists
        // In a real implementation, you would send an email with reset link
        logger.info('Password reset requested for email', { email });
        res.status(200).json({
            message: 'Password reset email sent if account exists'
        });
    }
    catch (error) {
        logger.error({ error }, 'Error in password reset');
        res.status(500).json({ error: 'An error occurred during password reset' });
    }
});
/**
 * Check authentication status
 * GET /api/v1/auth/status
 * Returns authentication status for the current user
 */
router.get('/status', auth_1.optionalAuth, async (req, res) => {
    try {
        // Check if user is authenticated and is a teacher
        const isTeacher = !!(req.user?.userId && req.user?.role === 'TEACHER');
        const teacherId = isTeacher ? req.user?.userId : undefined;
        logger.debug('Auth status check', {
            isTeacher,
            teacherId,
            userRole: req.user?.role,
            userId: req.user?.userId
        });
        res.status(200).json({
            isTeacher,
            teacherId
        });
    }
    catch (error) {
        logger.error({ error }, 'Error checking auth status');
        res.status(500).json({ error: 'An error occurred while checking authentication status' });
    }
});
exports.default = router;
