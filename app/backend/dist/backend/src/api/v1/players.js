"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.__setUserServiceForTesting = void 0;
const express_1 = __importDefault(require("express"));
const userService_1 = require("@/core/services/userService");
const client_1 = require("@/db/generated/client");
const logger_1 = __importDefault(require("@/utils/logger"));
// Create a route-specific logger
const logger = (0, logger_1.default)('PlayersAPI');
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
 * Deprecated: Register a new student (anonymous or with account)
 * POST /api/v1/players/register
 * Use /api/v1/auth/register instead
 */
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, cookie_id, avatar } = req.body;
        // Basic validation
        if (!username) {
            res.status(400).json({ error: 'Username is required' });
            return;
        }
        // Validate password if provided (for authenticated accounts)
        if (password && password.length < 6) {
            res.status(400).json({ error: 'Password must be at least 6 characters long' });
            return;
        }
        // Use UserService directly instead of making HTTP calls
        const result = await getUserService().registerUser({
            username,
            email,
            password,
            role: client_1.UserRole.STUDENT,
            cookieId: cookie_id,
            avatarEmoji: avatar // Map avatar to avatarEmoji
        });
        logger.info('Student registered successfully via deprecated endpoint', {
            userId: result.user.id,
            username,
            hasEmail: !!email,
            hasCookieId: !!cookie_id
        });
        res.status(201).json(result);
    }
    catch (error) {
        logger.error({ error }, 'Error in deprecated players/register endpoint');
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
/**
 * Get student by cookieId
 * GET /api/v1/players/cookie/:cookieId
 */
router.get('/cookie/:cookieId', async (req, res) => {
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
        res.status(200).json({ user });
    }
    catch (error) {
        logger.error({ error }, 'Error fetching user by cookieId');
        res.status(500).json({ error: 'An error occurred fetching the user' });
    }
});
exports.default = router;
