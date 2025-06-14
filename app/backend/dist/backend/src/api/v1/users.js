"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userService_1 = require("@/core/services/userService");
const auth_1 = require("@/middleware/auth");
const logger_1 = __importDefault(require("@/utils/logger"));
const logger = (0, logger_1.default)('UsersAPI');
const router = express_1.default.Router();
// Create a singleton instance or allow injection for testing
let userServiceInstance = null;
const getUserService = () => {
    if (!userServiceInstance) {
        userServiceInstance = new userService_1.UserService();
    }
    return userServiceInstance;
};
// GET /api/v1/users/:userId - Get user by ID
router.get('/:userId', auth_1.optionalAuth, async (req, res) => {
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
            email: user.email || undefined,
            role: user.role, // Type assertion for enum compatibility
            avatarEmoji: user.avatarEmoji || '🐼', // Fallback to default for legacy data
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.createdAt.toISOString() // Use createdAt if updatedAt doesn't exist
        };
        res.json(publicUser);
    }
    catch (error) {
        logger.error({ error }, 'Error fetching user');
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
