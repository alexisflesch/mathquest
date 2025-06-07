import express, { Request, Response } from 'express'; // Use standard Request
import { GameTemplateService, GameTemplateCreationData } from '@/core/services/gameTemplateService';
import createLogger from '@/utils/logger';

const logger = createLogger('GameTemplatesAPI');
const router = express.Router();

// Singleton instance for service
let gameTemplateServiceInstance: GameTemplateService | null = null;
const getGameTemplateService = (): GameTemplateService => {
    if (!gameTemplateServiceInstance) {
        gameTemplateServiceInstance = new GameTemplateService();
    }
    return gameTemplateServiceInstance;
};

/**
 * Get game templates for the authenticated teacher
 * GET /api/v1/game-templates
 * Requires teacher authentication
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        // Extract user ID from either req.user (from middleware) or x-user-id header (from frontend API route)
        const userId = req.user?.userId || req.headers['x-user-id'] as string;
        const userRole = req.user?.role || req.headers['x-user-role'] as string;

        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        // Verify user is a teacher (either from middleware or headers)
        if (userRole !== 'TEACHER') {
            res.status(403).json({ error: 'Teacher access required' });
            return;
        }

        logger.info({ userId }, 'Fetching game templates for teacher');

        // Fetch templates created by this teacher
        const result = await getGameTemplateService().getgameTemplates(userId, {}, { skip: 0, take: 50 });

        res.status(200).json({
            gameTemplates: result.gameTemplates,
            meta: {
                total: result.total,
                page: result.page,
                pageSize: result.pageSize,
                totalPages: result.totalPages
            }
        });
    } catch (error) {
        logger.error({ error }, 'Error fetching game templates');
        res.status(500).json({ error: 'An error occurred while fetching game templates' });
    }
});

/**
 * Teacher/Admin-driven GameTemplate creation
 * POST /api/v1/game-templates
 * Allows a teacher/admin to create a game template with specific details.
 * This route should be protected by teacherAuth middleware to ensure req.user is populated.
 */
router.post('/', async (req: Request, res: Response): Promise<void> => { // Use standard Request type
    try {
        // Log the received request body for debugging
        logger.info({ body: req.body, user: req.user }, 'Received request for game template creation');

        const { name, discipline, gradeLevel, themes, questions, questionIds, description, defaultMode } = req.body as GameTemplateCreationData;

        // Try to get userId from req.user first, then from headers for frontend API route compatibility
        let userId = req.user?.userId;
        if (!userId && req.headers['x-user-id']) {
            userId = req.headers['x-user-id'] as string;
        }

        // Validate required fields
        const missingFields = [];
        if (!userId) {
            logger.warn('User ID missing from request. Ensure route is protected or user ID is provided.');
            missingFields.push('userId (from authenticated token or headers)');
        }
        if (!name) missingFields.push('name (string)');
        if (!discipline) missingFields.push('discipline (string)');
        if (!gradeLevel) missingFields.push('gradeLevel (string)');
        if (!themes || !Array.isArray(themes) || themes.length === 0) missingFields.push('themes (array of strings)');

        // Validate questions structure if provided, or questionIds
        if (questions) {
            if (!Array.isArray(questions)) {
                missingFields.push('questions (must be an array if provided)');
            } else {
                for (const q of questions) {
                    if (!q.questionUid || typeof q.questionUid !== 'string') {
                        missingFields.push('question.questionUid (string, required for each question)');
                        break; // Stop checking further questions if one is malformed
                    }
                    if (q.sequence === undefined || typeof q.sequence !== 'number') {
                        missingFields.push('question.sequence (number, required for each question)');
                        break;
                    }
                }
            }
        } else if (questionIds) {
            if (!Array.isArray(questionIds)) {
                missingFields.push('questionIds (must be an array if provided)');
            } else if (questionIds.some(id => typeof id !== 'string')) {
                missingFields.push('questionIds (must be array of strings)');
            }
        }

        if (missingFields.length > 0) {
            res.status(400).json({
                error: 'Missing or invalid required fields for teacher game template creation',
                missing: missingFields,
                received: req.body
            });
            return;
        }

        // Ensure userId is present before calling the service (double check after auth)
        if (!userId) {
            // This should have been caught by missingFields check, but as a safeguard:
            logger.error('User ID is missing from authenticated request. This should not happen if auth middleware is effective.');
            res.status(401).json({ error: 'Unauthorized: User ID not found in token.' });
            return;
        }

        const templateData: GameTemplateCreationData = {
            name,
            discipline,
            gradeLevel,
            themes,
            questions, // Pass questions through as validated
            questionIds, // Pass questionIds through as validated
            description,
            defaultMode
        };

        const gameTemplate = await getGameTemplateService().creategameTemplate(userId, templateData);
        res.status(201).json({ gameTemplate });

    } catch (error: any) {
        logger.error({
            error,
            errorMessage: error.message,
            errorName: error.name,
            errorStack: error.stack,
            errorCode: error.code,
            errorMeta: error.meta,
            requestBody: req.body
        }, 'Error creating game template');

        let responseMessage = 'An error occurred while creating the game template.';
        let statusCode = 500;
        const errorDetails: any = { name: error.name, message: error.message };

        if (error.name === 'PrismaClientValidationError') {
            responseMessage = `Prisma Validation Error: ${error.message}. Check input data against schema.`;
            statusCode = 400;
        } else if (error.code && typeof error.code === 'string' && error.code.startsWith('P')) {
            responseMessage = `Prisma Error (${error.code}): ${error.message}.`;
            errorDetails.code = error.code;
            errorDetails.meta = error.meta;
            // Potentially map specific P-codes to 4xx if they represent client errors (e.g., P2002 unique constraint)
            if (error.code === 'P2002') { // Unique constraint violation
                statusCode = 409; // Conflict
                responseMessage = `A record with the same unique value already exists. Fields: ${error.meta?.target?.join(', ')}`;
                errorDetails.target = error.meta?.target;
            }
        } else if (error instanceof Error) {
            responseMessage = error.message;
        }

        res.status(statusCode).json({ error: responseMessage, details: errorDetails });
    }
});

/**
 * Update an existing game template
 * PUT /api/v1/game-templates/:id
 * Allows a teacher to update their game template
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, discipline, gradeLevel, themes, description, defaultMode, questions } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ error: 'User ID is required' });
            return;
        }

        if (!id) {
            res.status(400).json({ error: 'Template ID is required' });
            return;
        }

        logger.info({ templateId: id, userId, body: req.body }, 'Updating game template');

        const updatedTemplate = await getGameTemplateService().updategameTemplate(userId, {
            id,
            name,
            discipline,
            gradeLevel,
            themes,
            description,
            defaultMode,
            questions
        });

        res.status(200).json({
            message: 'Game template updated successfully',
            gameTemplate: updatedTemplate
        });
    } catch (error: any) {
        logger.error({
            error: error.message,
            templateId: req.params.id,
            userId: req.user?.userId
        }, 'Error updating game template');

        if (error.message.includes('not found or you don\'t have permission')) {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'An error occurred while updating the game template' });
        }
    }
});

export default router;
