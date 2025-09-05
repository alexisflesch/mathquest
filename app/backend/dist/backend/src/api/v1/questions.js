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
        // Ensure canonical durationMs is present (fallback to 30s if not provided)
        const questionData = {
            ...parseResult.data,
            themes: parseResult.data.themes || [],
            durationMs: typeof parseResult.data.durationMs === 'number' ? parseResult.data.durationMs : 30000
        };
        // Pass canonical object (with durationMs) to service
        const question = await getQuestionService().createQuestion(questionData);
        res.status(201).json({ question });
    }
    catch (error) {
        logger.error({ error }, 'Error creating question');
        res.status(500).json({ error: 'An error occurred while creating the question' });
    }
});
/**
 * Get available filter values with compatibility information
 * GET /api/v1/questions/filters
 * Optional query parameters: gradeLevel, discipline, theme, author to filter cascading results
 * Returns both compatible and incompatible options with isCompatible flags
 */
router.get('/filters', async (req, res) => {
    try {
        const { gradeLevel, discipline, theme, tag, mode } = req.query;
        const filterCriteria = {};
        if (gradeLevel) {
            filterCriteria.gradeLevel = Array.isArray(gradeLevel) ? gradeLevel : [gradeLevel];
        }
        if (discipline) {
            filterCriteria.discipline = Array.isArray(discipline) ? discipline : [discipline];
        }
        if (theme) {
            filterCriteria.theme = Array.isArray(theme) ? theme : [theme];
        }
        if (tag) {
            filterCriteria.tag = Array.isArray(tag) ? tag : [tag];
        }
        if (mode) {
            filterCriteria.mode = mode;
        }
        const compatibleFilters = await getQuestionService().getAvailableFilters(filterCriteria);
        // Return only compatible filters for each field
        res.status(200).json({
            gradeLevel: (compatibleFilters.gradeLevel || []).filter((v) => typeof v === 'string'),
            disciplines: (compatibleFilters.disciplines || []).filter((v) => typeof v === 'string'),
            themes: (compatibleFilters.themes || []).filter((v) => typeof v === 'string'),
            tags: (compatibleFilters.tags || []).filter((v) => typeof v === 'string'),
        });
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
        const { gradeLevel, discipline, themes, limit, mode } = req.query;
        // Convert to appropriate types for filtering
        const filters = {};
        if (gradeLevel)
            filters.gradeLevel = gradeLevel;
        if (discipline)
            filters.discipline = discipline;
        if (themes) {
            filters.themes = Array.isArray(themes)
                ? themes
                : themes.split(',').map(t => t.trim()).filter(t => t.length > 0);
        }
        // Add mode parameter for filtering based on excludedFrom
        if (mode) {
            filters.mode = mode;
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
        gradeLevel, tag, // Frontend sends 'tag'
        difficulty, tags, questionType, includeHidden, // req.query.includeHidden (string | undefined)
        mode, // mode parameter for filtering based on excludedFrom
        page = '1', pageSize = '20', limit, // Frontend uses 'limit' instead of 'pageSize'
        offset // Frontend uses 'offset' for pagination
         } = req.query;
        // Convert to appropriate types
        const filters = {};
        if (discipline) {
            // Handle both single values and arrays (consistent with filters endpoint)
            if (Array.isArray(discipline)) {
                filters.disciplines = discipline;
            }
            else {
                filters.discipline = discipline;
            }
        }
        // Handle themes from both 'theme' and 'themes' parameters
        const themeParam = theme || themes;
        if (themeParam) {
            if (Array.isArray(themeParam)) {
                filters.themes = themeParam;
            }
            else {
                filters.themes = [themeParam];
            }
        }
        if (difficulty)
            filters.difficulty = Number(difficulty);
        // Handle grade level from both 'level' and 'gradeLevel' parameters
        const levelParam = level || gradeLevel;
        if (levelParam) {
            // Handle both single values and arrays (consistent with filters endpoint)
            if (Array.isArray(levelParam)) {
                filters.gradeLevels = levelParam;
            }
            else {
                filters.gradeLevel = levelParam;
            }
        }
        // Handle tags from both 'tag' and 'tags' parameters
        const tagParam = tag || tags;
        if (tagParam) {
            if (Array.isArray(tagParam)) {
                filters.tags = tagParam;
            }
            else if (typeof tagParam === 'string') {
                filters.tags = tagParam.split(',').map(t => t.trim()).filter(t => t.length > 0);
            }
        }
        if (questionType)
            filters.questionType = questionType;
        // Handle mode parameter for excluding questions from specific modes
        if (mode) {
            filters.mode = mode;
        }
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
        // Handle pagination - support both page/pageSize and offset/limit formats
        let pagination;
        if (offset !== undefined || limit !== undefined) {
            // Frontend offset-based pagination
            pagination = {
                skip: Number(offset) || 0,
                take: Number(limit) || Number(pageSize)
            };
        }
        else {
            // Traditional page-based pagination
            pagination = {
                skip: (Number(page) - 1) * Number(pageSize),
                take: Number(pageSize)
            };
        }
        const result = await getQuestionService().getQuestions(filters, pagination);
        // Debug logging
        logger.info(`Filters used: ${JSON.stringify(filters)}`);
        logger.info(`Pagination used: ${JSON.stringify(pagination)}`);
        logger.info(`Returning ${result.questions.length} questions for API request`);
        if (result.questions.length > 0) {
            logger.info(`First question sample: ${JSON.stringify(result.questions[0], null, 2)}`);
        }
        res.status(200).json(result);
    }
    catch (error) {
        logger.error({ error: error instanceof Error ? { message: error.message, stack: error.stack } : error }, 'Error fetching questions');
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
        // Zod validation for question update (partial allowed, using questionUpdateSchema)
        // It's important that the input to updateQuestion matches QuestionUpdateData
        const updateParseResult = question_zod_1.questionUpdateSchema.safeParse(req.body);
        if (!updateParseResult.success) {
            res.status(400).json({ error: 'Validation failed', details: updateParseResult.error.errors });
            return;
        }
        // Construct the updateData object carefully to match QuestionUpdateData
        const { uid: bodyUid, ...restOfBody } = updateParseResult.data;
        // Convert null values to undefined to match TypeScript types
        const cleanedData = Object.fromEntries(Object.entries(restOfBody).map(([key, value]) => [key, value === null ? undefined : value]));
        const updateData = {
            uid: req.params.uid,
            ...cleanedData,
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
