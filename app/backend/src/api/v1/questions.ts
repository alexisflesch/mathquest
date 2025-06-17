import express, { Request, Response } from 'express';
import { QuestionService, QuestionCreationData, QuestionUpdateData } from '@/core/services/questionService';
import { teacherAuth, optionalAuth } from '@/middleware/auth';
import { validateRequestBody } from '@/middleware/validation';
import createLogger from '@/utils/logger';
import { questionSchema, questionCreationSchema } from '../../../../shared/types/quiz/question.zod';
import type { Question } from '@shared/types/quiz/question';
import type {
    QuestionCreationRequest,
    QuestionUpdateRequest,
    QuestionSearchRequest,
    ErrorResponse
} from '@shared/types/api/requests';
import {
    CreateQuestionRequestSchema,
    UpdateQuestionRequestSchema
} from '@shared/types/api/schemas';

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
router.post('/', teacherAuth, validateRequestBody(CreateQuestionRequestSchema), async (req: Request<{}, { question: any } | ErrorResponse, QuestionCreationRequest>, res: Response<{ question: any } | ErrorResponse>): Promise<void> => {
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
 * Get available filter values with compatibility information
 * GET /api/v1/questions/filters
 * Optional query parameters: gradeLevel, discipline, theme, author to filter cascading results
 * Returns both compatible and incompatible options with isCompatible flags
 */
router.get('/filters', async (req: Request, res: Response<any>): Promise<void> => {
    try {
        const { gradeLevel, discipline, theme, author } = req.query;
        const filterCriteria: any = {};
        if (gradeLevel) {
            filterCriteria.gradeLevel = Array.isArray(gradeLevel) ? gradeLevel : [gradeLevel as string];
        }
        if (discipline) {
            filterCriteria.discipline = Array.isArray(discipline) ? discipline : [discipline as string];
        }
        if (theme) {
            filterCriteria.theme = Array.isArray(theme) ? theme : [theme as string];
        }
        if (author) {
            filterCriteria.author = Array.isArray(author) ? author : [author as string];
        }
        const compatibleFilters = await getQuestionService().getAvailableFilters(filterCriteria);
        // Return only compatible filters for each field
        res.status(200).json({
            gradeLevel: (compatibleFilters.gradeLevel || []).filter((v: any) => typeof v === 'string'),
            disciplines: (compatibleFilters.disciplines || []).filter((v: any) => typeof v === 'string'),
            themes: (compatibleFilters.themes || []).filter((v: any) => typeof v === 'string'),
            authors: (compatibleFilters.authors || []).filter((v: any) => typeof v === 'string'),
        });
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
router.get('/list', async (req: Request, res: Response<string[] | ErrorResponse>): Promise<void> => {
    try {
        const { gradeLevel, discipline, themes, limit } = req.query;

        // Convert to appropriate types for filtering
        const filters: any = {};
        if (gradeLevel) filters.gradeLevel = gradeLevel as string;
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
router.get('/:uid', optionalAuth, async (req: Request, res: Response<{ question: any } | ErrorResponse>): Promise<void> => {
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
router.get('/', teacherAuth, async (req: Request, res: Response<{ questions: any[], total: number, page: number, pageSize: number, totalPages: number } | ErrorResponse>): Promise<void> => {
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
            pageSize = '20',
            limit, // Frontend uses 'limit' instead of 'pageSize'
            offset // Frontend uses 'offset' for pagination
        } = req.query;

        // Convert to appropriate types
        const filters: any = {};

        if (discipline) {
            // Handle both single values and arrays (consistent with filters endpoint)
            if (Array.isArray(discipline)) {
                filters.disciplines = discipline as string[];
            } else {
                filters.discipline = discipline as string;
            }
        }

        // Handle themes from both 'theme' and 'themes' parameters
        const themeParam = theme || themes;
        if (themeParam) {
            if (Array.isArray(themeParam)) {
                filters.themes = themeParam as string[];
            } else {
                filters.themes = [themeParam as string];
            }
        }

        if (difficulty) filters.difficulty = Number(difficulty);

        // Handle grade level from both 'level' and 'gradeLevel' parameters
        const levelParam = level || gradeLevel;
        if (levelParam) {
            // Handle both single values and arrays (consistent with filters endpoint)
            if (Array.isArray(levelParam)) {
                filters.gradeLevels = levelParam as string[];
            } else {
                filters.gradeLevel = levelParam as string;
            }
        }

        if (author) {
            // Handle both single values and arrays (consistent with filters endpoint)
            if (Array.isArray(author)) {
                filters.authors = author as string[];
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

        // Handle pagination - support both page/pageSize and offset/limit formats
        let pagination;
        if (offset !== undefined || limit !== undefined) {
            // Frontend offset-based pagination
            pagination = {
                skip: Number(offset) || 0,
                take: Number(limit) || Number(pageSize)
            };
        } else {
            // Traditional page-based pagination
            pagination = {
                skip: (Number(page) - 1) * Number(pageSize),
                take: Number(pageSize)
            };
        }

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
router.put('/:uid', teacherAuth, validateRequestBody(UpdateQuestionRequestSchema), async (req: Request, res: Response<{ question: any } | ErrorResponse>): Promise<void> => {
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
router.delete('/:uid', teacherAuth, async (req: Request, res: Response<{ success: boolean, message: string } | ErrorResponse>): Promise<void> => {
    try {
        if (!req.user?.userId || req.user?.role !== 'TEACHER') {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const { uid } = req.params;

        await getQuestionService().deleteQuestion(uid);

        res.status(200).json({ success: true, message: 'Question deleted successfully' });
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
