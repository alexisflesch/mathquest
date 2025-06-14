"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.__setQuestionServiceForTesting = void 0;
const express_1 = __importDefault(require("express"));
const questionService_1 = require("@/core/services/questionService");
const auth_1 = require("@/middleware/auth");
const validation_1 = require("@/middleware/validation");
const logger_1 = __importDefault(require("@/utils/logger"));
const question_zod_1 = require("../../../../shared/types/quiz/question.zod");
const schemas_1 = require("@shared/types/api/schemas");
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
router.post('/', auth_1.teacherAuth, (0, validation_1.validateRequestBody)(schemas_1.CreateQuestionRequestSchema), async (req, res) => {
    try {
        if (!req.user?.userId || req.user?.role !== 'TEACHER') {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        // Zod validation for question creation using questionCreationSchema
        const parseResult = question_zod_1.questionCreationSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({ error: 'Required fields missing', details: parseResult.error.errors });
            return;
        }
        // Ensure `themes` defaults to an empty array if undefined
        const questionData = {
            ...parseResult.data,
            themes: parseResult.data.themes || []
        };
        const question = await getQuestionService().createQuestion(req.user.userId, questionData);
        res.status(201).json({ question });
    }
    catch (error) {
        logger.error({ error }, 'Error creating question');
        res.status(500).json({ error: 'An error occurred while creating the question' });
    }
});
/**
 * Get available filter values (unique disciplines, grade levels, themes)
 * GET /api/v1/questions/filters
 * Optional query parameters: niveau, discipline to filter cascading results
 */
router.get('/filters', async (req, res) => {
    try {
        const { gradeLevel, discipline } = req.query;
        const filterCriteria = {};
        if (niveau)
            filterCriteria.gradeLevel = niveau;
        if (discipline)
            filterCriteria.discipline = discipline;
        const filters = await getQuestionService().getAvailableFilters(filterCriteria);
        res.status(200).json(filters);
    }
    catch (error) {
        logger.error({ error }, 'Error fetching filters');
        res.status(500).json({ error: 'An error occurred while fetching filters' });
    }
});
/**
 * Get question UIDs with filtering (public endpoint for students)
 * GET /api/v1/questions/list
 * Query parameters: niveau, discipline, themes (comma-separated), limit
 * Returns only question UIDs without sensitive data
 */
router.get('/list', async (req, res) => {
    try {
        const { gradeLevel, discipline, themes, limit } = req.query;
        // Convert to appropriate types for filtering
        const filters = {};
        if (niveau)
            filters.gradeLevel = niveau;
        if (discipline)
            filters.discipline = discipline;
        if (themes) {
            filters.themes = Array.isArray(themes)
                ? themes
                : themes.split(',').map(t => t.trim()).filter(t => t.length > 0);
        }
        // Students can only see non-hidden questions
        filters.includeHidden = false;
        const pagination = {
            skip: 0,
            take: limit ? Number(limit) : 1000 // Default to large number if no limit specified
        };
        const result = await getQuestionService().getQuestions(filters, pagination);
        // Return only UIDs as simple string array for privacy/security
        const questionUIDs = result.questions.map(q => q.uid);
        res.status(200).json(questionUIDs);
    }
    catch (error) {
        logger.error({ error }, 'Error fetching question list');
        res.status(500).json({ error: 'An error occurred while fetching question list' });
    }
});
/**
 * Get a question by ID
 * GET /api/v1/questions/:uid
 */
router.get('/:uid', auth_1.optionalAuth, async (req, res) => {
    try {
        const { uid } = req.params;
        const question = await getQuestionService().getQuestionById(uid);
        if (!question) {
            res.status(404).json({ error: 'Question not found' });
            return;
        }
        // If the question is hidden and the user is not a teacher, don't show it
        if (question.isHidden && (!req.user?.userId || req.user?.role !== 'TEACHER')) {
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
 * REQUIRES TEACHER AUTHENTICATION - Contains complete question data including answers
 */
router.get('/', auth_1.teacherAuth, async (req, res) => {
    try {
        const { discipline, theme, // Frontend sends 'theme', not 'themes'
        themes, level, // Frontend sends 'level', not 'gradeLevel'
        gradeLevel, author, // Frontend sends 'author'
        difficulty, tags, questionType, includeHidden, // req.query.includeHidden (string | undefined)
        page = '1', pageSize = '20' } = req.query;
        // Convert to appropriate types
        const filters = {};
        if (discipline) {
            // Handle multiple disciplines as comma-separated values
            if (typeof discipline === 'string' && discipline.includes(',')) {
                filters.disciplines = discipline.split(',').map(d => d.trim()).filter(d => d.length > 0);
            }
            else {
                filters.discipline = discipline;
            }
        }
        // Handle themes from both 'theme' and 'themes' parameters
        const themeParam = theme || themes;
        if (themeParam) {
            filters.themes = Array.isArray(themeParam)
                ? themeParam
                : themeParam.split(',').map(t => t.trim()).filter(t => t.length > 0);
        }
        if (difficulty)
            filters.difficulty = Number(difficulty);
        // Handle grade level from both 'level' and 'gradeLevel' parameters
        const levelParam = level || gradeLevel;
        if (levelParam) {
            // Handle multiple grade levels as comma-separated values
            if (typeof levelParam === 'string' && levelParam.includes(',')) {
                filters.gradeLevels = levelParam.split(',').map(g => g.trim()).filter(g => g.length > 0);
            }
            else {
                filters.gradeLevel = levelParam;
            }
        }
        if (author) {
            // Handle multiple authors as comma-separated values
            if (typeof author === 'string' && author.includes(',')) {
                filters.authors = author.split(',').map(a => a.trim()).filter(a => a.length > 0);
            }
            else {
                filters.author = author;
            }
        }
        if (tags) {
            filters.tags = Array.isArray(tags)
                ? tags
                : tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
        }
        if (questionType)
            filters.questionType = questionType;
        // Handle includeHidden filter
        // If includeHidden query param is provided (e.g., 'true' or 'false')
        if (typeof includeHidden === 'string') {
            if (req.user?.role === 'TEACHER') {
                filters.includeHidden = (includeHidden === 'true');
            }
            else {
                // Non-teachers cannot request hidden questions.
                // If they specify includeHidden, it's treated as false.
                filters.includeHidden = false;
            }
        }
        // If includeHidden query param is NOT provided (is undefined),
        // filters.includeHidden remains undefined on the filters object.
        // The service layer will handle the default visibility.
        const pagination = {
            skip: (Number(page) - 1) * Number(pageSize),
            take: Number(pageSize)
        };
        const result = await getQuestionService().getQuestions(filters, pagination);
        // Debug logging
        logger.info(`Returning ${result.questions.length} questions for API request`);
        if (result.questions.length > 0) {
            logger.info(`First question sample: ${JSON.stringify(result.questions[0], null, 2)}`);
        }
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
router.put('/:uid', auth_1.teacherAuth, (0, validation_1.validateRequestBody)(schemas_1.UpdateQuestionRequestSchema), async (req, res) => {
    try {
        if (!req.user?.userId || req.user?.role !== 'TEACHER') {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        // Zod validation for question update (partial allowed, using questionSchema.partial())
        // It's important that the input to updateQuestion matches QuestionUpdateData
        const updateParseResult = question_zod_1.questionSchema.partial().safeParse(req.body);
        if (!updateParseResult.success) {
            res.status(400).json({ error: 'Validation failed', details: updateParseResult.error.errors });
            return;
        }
        // Construct the updateData object carefully to match QuestionUpdateData
        const { uid: bodyUid, ...restOfBody } = updateParseResult.data;
        const updateData = {
            uid: req.params.uid,
            ...restOfBody,
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
        if (!req.user?.userId || req.user?.role !== 'TEACHER') {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const { uid } = req.params;
        await getQuestionService().deleteQuestion(uid);
        res.status(200).json({ success: true, message: 'Question deleted successfully' });
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
