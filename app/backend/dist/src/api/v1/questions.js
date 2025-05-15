"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.__setQuestionServiceForTesting = void 0;
const express_1 = __importDefault(require("express"));
const questionService_1 = require("@/core/services/questionService");
const auth_1 = require("@/middleware/auth");
const logger_1 = __importDefault(require("@/utils/logger"));
// Create a route-specific logger
const logger = (0, logger_1.default)('QuestionsAPI');
const router = express_1.default.Router();
// Create a singleton instance or allow injection for testing
let questionServiceInstance = null;
const getQuestionService = () => {
    if (!questionServiceInstance) {
        questionServiceInstance = new questionService_1.QuestionService();
    }
    return questionServiceInstance;
};
// For testing purposes only - allows tests to inject a mock service
const __setQuestionServiceForTesting = (mockService) => {
    questionServiceInstance = mockService;
};
exports.__setQuestionServiceForTesting = __setQuestionServiceForTesting;
/**
 * Create a new question
 * POST /api/v1/questions
 * Requires teacher authentication
 */
router.post('/', auth_1.teacherAuth, async (req, res) => {
    try {
        if (!req.user?.teacherId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const { title, text, responses, questionType, discipline, themes, difficulty, gradeLevel, author, explanation, tags, timeLimit, isHidden } = req.body;
        // Basic validation
        if (!text || !questionType || !discipline || !responses || !themes) {
            res.status(400).json({
                error: 'Required fields missing',
                required: ['text', 'questionType', 'discipline', 'responses', 'themes']
            });
            return;
        }
        // Validate responses based on questionType (simplified validation)
        if (typeof responses !== 'object') {
            res.status(400).json({ error: 'Responses must be an object' });
            return;
        }
        const question = await getQuestionService().createQuestion(req.user.teacherId, {
            title,
            text,
            responses,
            questionType,
            discipline,
            themes,
            difficulty,
            gradeLevel,
            author,
            explanation,
            tags,
            timeLimit,
            isHidden
        });
        res.status(201).json({ question });
    }
    catch (error) {
        logger.error({ error }, 'Error creating question');
        res.status(500).json({ error: 'An error occurred while creating the question' });
    }
});
/**
 * Get a question by ID
 * GET /api/v1/questions/:uid
 */
router.get('/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        const question = await getQuestionService().getQuestionById(uid);
        if (!question) {
            res.status(404).json({ error: 'Question not found' });
            return;
        }
        // If the question is hidden and the user is not a teacher, don't show it
        if (question.isHidden && !req.user?.teacherId) {
            res.status(404).json({ error: 'Question not found' });
            return;
        }
        res.status(200).json({ question });
    }
    catch (error) {
        logger.error({ error }, 'Error fetching question');
        res.status(500).json({ error: 'An error occurred while fetching the question' });
    }
});
/**
 * Get all questions with filtering and pagination
 * GET /api/v1/questions
 */
router.get('/', async (req, res) => {
    try {
        const { discipline, themes, difficulty, gradeLevel, tags, questionType, includeHidden, page = '1', pageSize = '20' } = req.query;
        // Convert to appropriate types
        const filters = {};
        if (discipline)
            filters.discipline = discipline;
        if (themes) {
            filters.themes = Array.isArray(themes)
                ? themes
                : [themes];
        }
        if (difficulty)
            filters.difficulty = Number(difficulty);
        if (gradeLevel)
            filters.gradeLevel = gradeLevel;
        if (tags) {
            filters.tags = Array.isArray(tags)
                ? tags
                : [tags];
        }
        if (questionType)
            filters.questionType = questionType;
        // Only teachers can see hidden questions
        filters.includeHidden = req.user?.teacherId && includeHidden === 'true';
        const pagination = {
            skip: (Number(page) - 1) * Number(pageSize),
            take: Number(pageSize)
        };
        const result = await getQuestionService().getQuestions(filters, pagination);
        res.status(200).json(result);
    }
    catch (error) {
        logger.error({ error }, 'Error fetching questions');
        res.status(500).json({ error: 'An error occurred while fetching questions' });
    }
});
/**
 * Update a question
 * PUT /api/v1/questions/:uid
 * Requires teacher authentication
 */
router.put('/:uid', auth_1.teacherAuth, async (req, res) => {
    try {
        if (!req.user?.teacherId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const { uid } = req.params;
        const updateData = {
            uid,
            ...req.body
        };
        const updatedQuestion = await getQuestionService().updateQuestion(updateData);
        res.status(200).json({ question: updatedQuestion });
    }
    catch (error) {
        logger.error({ error }, 'Error updating question');
        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'An error occurred while updating the question' });
    }
});
/**
 * Delete a question
 * DELETE /api/v1/questions/:uid
 * Requires teacher authentication
 */
router.delete('/:uid', auth_1.teacherAuth, async (req, res) => {
    try {
        if (!req.user?.teacherId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const { uid } = req.params;
        await getQuestionService().deleteQuestion(uid);
        res.status(200).json({ success: true });
    }
    catch (error) {
        logger.error({ error }, 'Error deleting question');
        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'An error occurred while deleting the question' });
    }
});
exports.default = router;
