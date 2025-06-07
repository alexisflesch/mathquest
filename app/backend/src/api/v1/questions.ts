import express, { Request, Response } from 'express';
import { QuestionService, QuestionCreationData, QuestionUpdateData } from '@/core/services/questionService';
import { teacherAuth, optionalAuth } from '@/middleware/auth';
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
 * Get available filter values (unique disciplines, grade levels, themes)
 * GET /api/v1/questions/filters
 * Optional query parameters: niveau, discipline to filter cascading results
 */
router.get('/filters', async (req: Request, res: Response): Promise<void> => {
    try {
        const { niveau, discipline } = req.query;

        const filterCriteria: any = {};
        if (niveau) filterCriteria.gradeLevel = niveau as string;
        if (discipline) filterCriteria.discipline = discipline as string;

        const filters = await getQuestionService().getAvailableFilters(filterCriteria);
        res.status(200).json(filters);
    } catch (error) {
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
router.get('/list', async (req: Request, res: Response): Promise<void> => {
    try {
        const { niveau, discipline, themes, limit } = req.query;

        // Convert to appropriate types for filtering
        const filters: any = {};
        if (niveau) filters.gradeLevel = niveau as string;
        if (discipline) filters.discipline = discipline as string;
        if (themes) {
            filters.themes = Array.isArray(themes)
                ? themes as string[]
                : (themes as string).split(',').map(t => t.trim()).filter(t => t.length > 0);
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
    } catch (error) {
        logger.error({ error }, 'Error fetching question list');
        res.status(500).json({ error: 'An error occurred while fetching question list' });
    }
});

/**
 * Get a question by ID
 * GET /api/v1/questions/:uid
 */
router.get('/:uid', optionalAuth, async (req: Request, res: Response): Promise<void> => {
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
 * REQUIRES TEACHER AUTHENTICATION - Contains complete question data including answers
 */
router.get('/', teacherAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            discipline,
            theme,  // Frontend sends 'theme', not 'themes'
            themes,
            level,  // Frontend sends 'level', not 'gradeLevel'
            gradeLevel,
            author, // Frontend sends 'author'
            difficulty,
            tags,
            questionType,
            includeHidden, // req.query.includeHidden (string | undefined)
            page = '1',
            pageSize = '20'
        } = req.query;

        // Convert to appropriate types
        const filters: any = {};

        if (discipline) {
            // Handle multiple disciplines as comma-separated values
            if (typeof discipline === 'string' && discipline.includes(',')) {
                filters.disciplines = discipline.split(',').map(d => d.trim()).filter(d => d.length > 0);
            } else {
                filters.discipline = discipline as string;
            }
        }

        // Handle themes from both 'theme' and 'themes' parameters
        const themeParam = theme || themes;
        if (themeParam) {
            filters.themes = Array.isArray(themeParam)
                ? themeParam as string[]
                : (themeParam as string).split(',').map(t => t.trim()).filter(t => t.length > 0);
        }

        if (difficulty) filters.difficulty = Number(difficulty);

        // Handle grade level from both 'level' and 'gradeLevel' parameters
        const levelParam = level || gradeLevel;
        if (levelParam) {
            // Handle multiple grade levels as comma-separated values
            if (typeof levelParam === 'string' && levelParam.includes(',')) {
                filters.gradeLevels = levelParam.split(',').map(g => g.trim()).filter(g => g.length > 0);
            } else {
                filters.gradeLevel = levelParam as string;
            }
        }

        if (author) {
            // Handle multiple authors as comma-separated values
            if (typeof author === 'string' && author.includes(',')) {
                filters.authors = author.split(',').map(a => a.trim()).filter(a => a.length > 0);
            } else {
                filters.author = author as string;
            }
        }

        if (tags) {
            filters.tags = Array.isArray(tags)
                ? tags as string[]
                : (tags as string).split(',').map(t => t.trim()).filter(t => t.length > 0);
        }

        if (questionType) filters.questionType = questionType as string;

        // Handle includeHidden filter
        // If includeHidden query param is provided (e.g., 'true' or 'false')
        if (typeof includeHidden === 'string') {
            if (req.user?.role === 'TEACHER') {
                filters.includeHidden = (includeHidden === 'true');
            } else {
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
