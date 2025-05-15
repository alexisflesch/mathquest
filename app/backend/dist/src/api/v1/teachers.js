"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.__setTeacherServiceForTesting = void 0;
const express_1 = __importDefault(require("express"));
const teacherService_1 = require("@/core/services/teacherService");
const auth_1 = require("@/middleware/auth");
const logger_1 = __importDefault(require("@/utils/logger"));
// Create a route-specific logger
const logger = (0, logger_1.default)('TeachersAPI');
const router = express_1.default.Router();
// Create a singleton instance or allow injection for testing
let teacherServiceInstance = null;
const getTeacherService = () => {
    if (!teacherServiceInstance) {
        teacherServiceInstance = new teacherService_1.TeacherService();
    }
    return teacherServiceInstance;
};
// For testing purposes only - allows tests to inject a mock service
const __setTeacherServiceForTesting = (mockService) => {
    teacherServiceInstance = mockService;
};
exports.__setTeacherServiceForTesting = __setTeacherServiceForTesting;
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
        const result = await getTeacherService().registerTeacher({
            username,
            email,
            password,
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
 * Login a teacher
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
        const result = await getTeacherService().loginTeacher({
            email,
            password,
        });
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
        if (!req.user?.teacherId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const teacher = await getTeacherService().getTeacherById(req.user.teacherId);
        if (!teacher) {
            res.status(404).json({ error: 'Teacher not found' });
            return;
        }
        res.status(200).json({ teacher });
    }
    catch (error) {
        logger.error({ error }, 'Error fetching teacher profile');
        res.status(500).json({ error: 'An error occurred fetching the profile' });
    }
});
exports.default = router;
