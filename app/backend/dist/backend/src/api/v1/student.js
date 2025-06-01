"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userService_1 = require("@/core/services/userService");
const client_1 = require("@/db/generated/client");
const logger_1 = __importDefault(require("@/utils/logger"));
// Create a route-specific logger
const logger = (0, logger_1.default)('StudentAPI');
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
 * Generic student endpoint that handles multiple actions
 * POST /api/v1/student
 */
router.post('/', async (req, res) => {
    try {
        const { action, username, avatar, cookie_id } = req.body;
        switch (action) {
            case 'join':
                await handleStudentJoin(req, res);
                break;
            default:
                res.status(400).json({ error: 'Invalid action' });
        }
    }
    catch (error) {
        logger.error({ error }, 'Error in student endpoint');
        res.status(500).json({ error: 'An error occurred during student operation' });
    }
});
/**
 * Handle student join (registration)
 */
async function handleStudentJoin(req, res) {
    const { username, avatar, cookie_id } = req.body;
    // Basic validation
    if (!username) {
        res.status(400).json({ error: 'Username is required' });
        return;
    }
    if (!avatar) {
        res.status(400).json({ error: 'Avatar is required' });
        return;
    }
    try {
        // Register the user as a STUDENT (anonymous registration)
        const result = await getUserService().registerUser({
            username,
            email: undefined, // Students don't need email
            password: undefined, // Students don't need password
            role: client_1.UserRole.STUDENT,
        });
        logger.info('Student registered successfully', {
            username,
            avatar,
            cookie_id,
            userId: result.user.id
        });
        // Return success message
        res.status(201).json({
            message: 'Student registered successfully',
            user: {
                id: result.user.id,
                username: result.user.username,
                avatar: avatar
            }
        });
    }
    catch (error) {
        logger.error({ error }, 'Error in student join');
        // Handle specific errors
        if (error instanceof Error && error.message.includes('already exists')) {
            res.status(409).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'An error occurred during student registration' });
    }
}
exports.default = router;
