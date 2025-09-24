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
    }
    catch (error) {
        logger.error({ error }, 'Error fetching teacher profile');
        res.status(500).json({ error: 'An error occurred fetching the profile' });
    }
});
// The deprecated POST /api/v1/teachers/register endpoint and its handler have been removed as part of legacy cleanup.
exports.default = router;
