"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.__setQuizTemplateServiceForTesting = void 0;
const express_1 = __importDefault(require("express"));
const quizTemplateService_1 = require("@/core/services/quizTemplateService");
const auth_1 = require("@/middleware/auth");
const logger_1 = __importDefault(require("@/utils/logger"));
// Create a route-specific logger
const logger = (0, logger_1.default)('QuizTemplatesAPI');
const router = express_1.default.Router();
// Create a singleton instance or allow injection for testing
let quizTemplateServiceInstance = null;
const getQuizTemplateService = () => {
    if (!quizTemplateServiceInstance) {
        quizTemplateServiceInstance = new quizTemplateService_1.QuizTemplateService();
    }
    return quizTemplateServiceInstance;
};
// For testing purposes only - allows tests to inject a mock service
const __setQuizTemplateServiceForTesting = (mockService) => {
    quizTemplateServiceInstance = mockService;
};
exports.__setQuizTemplateServiceForTesting = __setQuizTemplateServiceForTesting;
/**
 * Create a new quiz template
 * POST /api/v1/quiz-templates
 * Requires teacher authentication
 */
router.post('/', auth_1.teacherAuth, async (req, res) => {
    try {
        if (!req.user?.teacherId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const { name, gradeLevel, themes, discipline, description, defaultMode, questions } = req.body;
        // Basic validation
        if (!name || !themes) {
            res.status(400).json({
                error: 'Required fields missing',
                required: ['name', 'themes']
            });
            return;
        }
        const quizTemplate = await getQuizTemplateService().createQuizTemplate(req.user.teacherId, {
            name,
            gradeLevel,
            themes,
            discipline,
            description,
            defaultMode,
            questions
        });
        res.status(201).json({ quizTemplate });
    }
    catch (error) {
        logger.error({ error }, 'Error creating quiz template');
        res.status(500).json({ error: 'An error occurred while creating the quiz template' });
    }
});
/**
 * Get a quiz template by ID
 * GET /api/v1/quiz-templates/:id
 * Requires teacher authentication
 */
router.get('/:id', auth_1.teacherAuth, async (req, res) => {
    try {
        if (!req.user?.teacherId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const { id } = req.params;
        const includeQuestions = req.query.includeQuestions === 'true';
        const quizTemplate = await getQuizTemplateService().getQuizTemplateById(id, includeQuestions);
        if (!quizTemplate) {
            res.status(404).json({ error: 'Quiz template not found' });
            return;
        }
        // Check if the quiz template belongs to the requesting teacher
        if (quizTemplate.creatorTeacherId !== req.user.teacherId) {
            res.status(403).json({ error: 'You do not have permission to access this quiz template' });
            return;
        }
        res.status(200).json({ quizTemplate });
    }
    catch (error) {
        logger.error({ error }, 'Error fetching quiz template');
        res.status(500).json({ error: 'An error occurred while fetching the quiz template' });
    }
});
/**
 * Get all quiz templates for a teacher with filtering and pagination
 * GET /api/v1/quiz-templates
 * Requires teacher authentication
 */
router.get('/', auth_1.teacherAuth, async (req, res) => {
    try {
        if (!req.user?.teacherId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const { discipline, themes, gradeLevel, page = '1', pageSize = '20' } = req.query;
        // Convert to appropriate types
        const filters = {};
        if (discipline)
            filters.discipline = discipline;
        if (themes) {
            filters.themes = Array.isArray(themes)
                ? themes
                : [themes];
        }
        if (gradeLevel)
            filters.gradeLevel = gradeLevel;
        const pagination = {
            skip: (Number(page) - 1) * Number(pageSize),
            take: Number(pageSize)
        };
        const result = await getQuizTemplateService().getQuizTemplates(req.user.teacherId, filters, pagination);
        res.status(200).json(result);
    }
    catch (error) {
        logger.error({ error }, 'Error fetching quiz templates');
        res.status(500).json({ error: 'An error occurred while fetching quiz templates' });
    }
});
/**
 * Update a quiz template
 * PUT /api/v1/quiz-templates/:id
 * Requires teacher authentication
 */
router.put('/:id', auth_1.teacherAuth, async (req, res) => {
    try {
        if (!req.user?.teacherId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const { id } = req.params;
        const updateData = {
            id,
            ...req.body
        };
        const updatedQuizTemplate = await getQuizTemplateService().updateQuizTemplate(req.user.teacherId, updateData);
        res.status(200).json({ quizTemplate: updatedQuizTemplate });
    }
    catch (error) {
        logger.error({ error }, 'Error updating quiz template');
        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
            return;
        }
        if (error instanceof Error && error.message.includes('permission')) {
            res.status(403).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'An error occurred while updating the quiz template' });
    }
});
/**
 * Delete a quiz template
 * DELETE /api/v1/quiz-templates/:id
 * Requires teacher authentication
 */
router.delete('/:id', auth_1.teacherAuth, async (req, res) => {
    try {
        if (!req.user?.teacherId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const { id } = req.params;
        await getQuizTemplateService().deleteQuizTemplate(req.user.teacherId, id);
        res.status(200).json({ success: true });
    }
    catch (error) {
        logger.error({ error }, 'Error deleting quiz template');
        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
            return;
        }
        if (error instanceof Error && error.message.includes('permission')) {
            res.status(403).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'An error occurred while deleting the quiz template' });
    }
});
/**
 * Add a question to a quiz template
 * POST /api/v1/quiz-templates/:id/questions
 * Requires teacher authentication
 */
router.post('/:id/questions', auth_1.teacherAuth, async (req, res) => {
    try {
        if (!req.user?.teacherId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const { id } = req.params;
        const { questionUid, sequence } = req.body;
        if (!questionUid) {
            res.status(400).json({ error: 'Question ID is required' });
            return;
        }
        const updatedQuizTemplate = await getQuizTemplateService().addQuestionToQuizTemplate(req.user.teacherId, id, questionUid, sequence);
        res.status(200).json({ quizTemplate: updatedQuizTemplate });
    }
    catch (error) {
        logger.error({ error }, 'Error adding question to quiz template');
        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
            return;
        }
        if (error instanceof Error && error.message.includes('permission')) {
            res.status(403).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'An error occurred while adding the question' });
    }
});
/**
 * Remove a question from a quiz template
 * DELETE /api/v1/quiz-templates/:id/questions/:questionUid
 * Requires teacher authentication
 */
router.delete('/:id/questions/:questionUid', auth_1.teacherAuth, async (req, res) => {
    try {
        if (!req.user?.teacherId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const { id, questionUid } = req.params;
        const updatedQuizTemplate = await getQuizTemplateService().removeQuestionFromQuizTemplate(req.user.teacherId, id, questionUid);
        res.status(200).json({ quizTemplate: updatedQuizTemplate });
    }
    catch (error) {
        logger.error({ error }, 'Error removing question from quiz template');
        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
            return;
        }
        if (error instanceof Error && error.message.includes('permission')) {
            res.status(403).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'An error occurred while removing the question' });
    }
});
/**
 * Update question sequence in a quiz template
 * PUT /api/v1/quiz-templates/:id/questions-sequence
 * Requires teacher authentication
 */
router.put('/:id/questions-sequence', auth_1.teacherAuth, async (req, res) => {
    try {
        if (!req.user?.teacherId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const { id } = req.params;
        const { updates } = req.body;
        if (!updates || !Array.isArray(updates) || updates.length === 0) {
            res.status(400).json({ error: 'Updates array is required' });
            return;
        }
        const updatedQuizTemplate = await getQuizTemplateService().updateQuestionSequence(req.user.teacherId, id, updates);
        res.status(200).json({ quizTemplate: updatedQuizTemplate });
    }
    catch (error) {
        logger.error({ error }, 'Error updating question sequence');
        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
            return;
        }
        if (error instanceof Error && error.message.includes('permission')) {
            res.status(403).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'An error occurred while updating question sequence' });
    }
});
exports.default = router;
