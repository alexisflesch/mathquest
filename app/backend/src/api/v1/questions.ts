import express, { Request, Response } from 'express';
import { QuestionService, QuestionCreationData, QuestionUpdateData } from '@/core/services/questionService';
import { teacherAuth } from '@/middleware/auth';
import createLogger from '@/utils/logger';
import { questionSchema, questionCreationSchema } from '../../../../shared/types/quiz/question.zod';

// Create a route-specific logger
const logger = createLogger('QuestionsAPI');

const router = express.Router();

// Create a singleton instance or allow injection for testing
let questionServiceInstance: QuestionService | null = null;

const getQuestionService = (): QuestionService => {
    if (!questionServiceInstance) {
        questionServiceInstance = new QuestionService();
    }
    return questionServiceInstance;
};

// For testing purposes only - allows tests to inject a mock service
export const __setQuestionServiceForTesting = (mockService: QuestionService): void => {
    questionServiceInstance = mockService;
};

/**
 * Create a new question
 * POST /api/v1/questions
 * Requires teacher authentication
 */
router.post('/', teacherAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user?.userId || req.user?.role !== 'TEACHER') {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        // Zod validation for question creation using questionCreationSchema
        const parseResult = questionCreationSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({ error: 'Required fields missing', details: parseResult.error.errors });
            return;
        }
        // Ensure `themes` defaults to an empty array if undefined
        const questionData: QuestionCreationData = {
            ...parseResult.data,
            themes: parseResult.data.themes || []
        };

        const question = await getQuestionService().createQuestion(req.user.userId, questionData);
        res.status(201).json({ question });
    } catch (error) {
        logger.error({ error }, 'Error creating question');
        res.status(500).json({ error: 'An error occurred while creating the question' });
    }
});

/**
 * Get a question by ID
 * GET /api/v1/questions/:uid
 */
router.get('/:uid', async (req: Request, res: Response): Promise<void> => {
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
    } catch (error) {
        logger.error({ error }, 'Error fetching question');
        res.status(500).json({ error: 'An error occurred while fetching the question' });
    }
});

/**
 * Get all questions with filtering and pagination
 * GET /api/v1/questions
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            discipline,
            themes,
            difficulty,
            gradeLevel,
            tags,
            questionType,
            includeHidden,
            page = '1',
            pageSize = '20'
        } = req.query;

        // Convert to appropriate types
        const filters: any = {};

        if (discipline) filters.discipline = discipline as string;

        if (themes) {
            filters.themes = Array.isArray(themes)
                ? themes as string[]
                : [themes as string];
        }

        if (difficulty) filters.difficulty = Number(difficulty);
        if (gradeLevel) filters.gradeLevel = gradeLevel as string;

        if (tags) {
            filters.tags = Array.isArray(tags)
                ? tags as string[]
                : [tags as string];
        }

        if (questionType) filters.questionType = questionType as string;

        // Only teachers can see hidden questions
        filters.includeHidden = req.user?.userId && req.user?.role === 'TEACHER' && includeHidden === 'true';

        const pagination = {
            skip: (Number(page) - 1) * Number(pageSize),
            take: Number(pageSize)
        };

        const result = await getQuestionService().getQuestions(filters, pagination);

        res.status(200).json(result);
    } catch (error) {
        logger.error({ error }, 'Error fetching questions');
        res.status(500).json({ error: 'An error occurred while fetching questions' });
    }
});

/**
 * Update a question
 * PUT /api/v1/questions/:uid
 * Requires teacher authentication
 */
router.put('/:uid', teacherAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user?.userId || req.user?.role !== 'TEACHER') {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        // Zod validation for question update (partial allowed, using questionSchema.partial())
        // It's important that the input to updateQuestion matches QuestionUpdateData
        const updateParseResult = questionSchema.partial().safeParse(req.body);
        if (!updateParseResult.success) {
            res.status(400).json({ error: 'Validation failed', details: updateParseResult.error.errors });
            return;
        }

        // Construct the updateData object carefully to match QuestionUpdateData
        const { uid: bodyUid, ...restOfBody } = updateParseResult.data;
        const updateData: QuestionUpdateData = {
            uid: req.params.uid,
            ...restOfBody,
        };

        const updatedQuestion = await getQuestionService().updateQuestion(updateData);
        res.status(200).json({ question: updatedQuestion });
    } catch (error) {
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
router.delete('/:uid', teacherAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user?.userId || req.user?.role !== 'TEACHER') {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const { uid } = req.params;

        await getQuestionService().deleteQuestion(uid);

        res.status(200).json({ success: true });
    } catch (error) {
        logger.error({ error }, 'Error deleting question');
        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'An error occurred while deleting the question' });
    }
});

export default router;
