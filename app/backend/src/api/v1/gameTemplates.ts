import express, { Request, Response } from 'express'; // Use standard Request
import { GameTemplateService, GameTemplateCreationData } from '@/core/services/gameTemplateService';
import { validateRequestBody } from '@/middleware/validation';
import createLogger from '@/utils/logger';
import type {
    GameTemplatesResponse,
    GameTemplateResponse,
    GameTemplateCreationResponse,
    GameTemplateUpdateResponse
} from '@shared/types/api/responses';
import type {
    GameTemplateCreationRequest,
    GameTemplateUpdateRequest,
    RenameGameTemplateRequest,
    ErrorResponse
} from '@shared/types/api/requests';
import {
    CreateGameTemplateRequestSchema,
    UpdateGameTemplateRequestSchema,
    RenameGameTemplateRequestSchema
} from '@shared/types/api/schemas';

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
router.get('/', async (req: Request, res: Response<GameTemplatesResponse | ErrorResponse>): Promise<void> => {
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

        // Fetch templates created by this teacher, excluding auto-generated ones
        // Include templates with null description OR description that is not the auto-generated text
        const filters = {
            OR: [
                { description: null },
                { description: { not: "AUTO: Created from student UI" } }
            ]
        };

        const result = await getGameTemplateService().getgameTemplates(userId, filters, { skip: 0, take: 50 });

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
 * Get a specific game template by ID
 * GET /api/v1/game-templates/:id
 * Requires teacher authentication
 */
router.get('/:id', async (req: Request, res: Response<GameTemplateResponse | ErrorResponse>): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId || req.headers['x-user-id'] as string;
        const userRole = req.user?.role || req.headers['x-user-role'] as string;

        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        // Verify user is a teacher
        if (userRole !== 'TEACHER') {
            res.status(403).json({ error: 'Teacher access required' });
            return;
        }

        if (!id) {
            res.status(400).json({ error: 'Game template ID is required' });
            return;
        }

        logger.info({ userId, templateId: id }, 'Fetching game template by ID');

        // Fetch the specific game template with questions
        const gameTemplate = await getGameTemplateService().getgameTemplateById(id, true);

        if (!gameTemplate) {
            res.status(404).json({ error: 'Game template not found' });
            return;
        }

        // Check if the user is the creator of this template
        if (gameTemplate.creatorId !== userId) {
            res.status(403).json({ error: 'You do not have permission to access this game template' });
            return;
        }

        res.status(200).json({ gameTemplate });
    } catch (error) {
        logger.error({ error }, 'Error fetching game template by ID');
        res.status(500).json({ error: 'An error occurred while fetching the game template' });
    }
});

/**
 * Teacher/Admin-driven GameTemplate creation
 * POST /api/v1/game-templates
 * Allows a teacher/admin to create a game template with specific details.
 * This route should be protected by teacherAuth middleware to ensure req.user is populated.
 */
router.post('/', validateRequestBody(CreateGameTemplateRequestSchema), async (req: Request<{}, GameTemplateCreationResponse | ErrorResponse, GameTemplateCreationRequest>, res: Response<GameTemplateCreationResponse | ErrorResponse>): Promise<void> => {
    try {
        // Log the received request body for debugging
        logger.info({ body: req.body, user: req.user }, 'Received request for game template creation');

        // Debug questionUids format specifically
        if (req.body.questionUids) {
            logger.info({
                questionUids: req.body.questionUids,
                questionUidsCount: req.body.questionUids.length,
                firstUid: req.body.questionUids[0],
                firstUidType: typeof req.body.questionUids[0],
                firstUidLength: req.body.questionUids[0]?.length,
                isFirstUidUuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(req.body.questionUids[0] || '')
            }, 'DEBUG: questionUids format analysis');
        }

        const { name, discipline, gradeLevel, themes, questions, questionUids, description, defaultMode } = req.body as GameTemplateCreationData;

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

        // Validate questions structure if provided, or questionUids
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
        } else if (questionUids) {
            if (!Array.isArray(questionUids)) {
                missingFields.push('questionUids (must be an array if provided)');
            } else if (questionUids.some(id => typeof id !== 'string')) {
                missingFields.push('questionUids (must be array of strings)');
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
            questionUids, // Pass questionUids through as validated
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
router.put('/:id', validateRequestBody(UpdateGameTemplateRequestSchema), async (req: Request<{ id: string }, GameTemplateUpdateResponse | ErrorResponse, GameTemplateUpdateRequest>, res: Response<GameTemplateUpdateResponse | ErrorResponse>): Promise<void> => {
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

/**
 * Rename a game template
 * PATCH /api/v1/game-templates/:id/name
 * Requires teacher authentication
 */
router.patch('/:id/name', validateRequestBody(RenameGameTemplateRequestSchema), async (req: Request<{ id: string }, GameTemplateResponse | ErrorResponse, RenameGameTemplateRequest>, res: Response<GameTemplateResponse | ErrorResponse>): Promise<void> => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        // Extract user ID from either req.user (from middleware) or x-user-id header (from frontend API route)
        const userId = req.user?.userId || req.headers['x-user-id'] as string;
        const userRole = req.user?.role || req.headers['x-user-role'] as string;

        if (!userId) {
            res.status(401).json({ error: 'Authentification requise' });
            return;
        }

        // Verify user is a teacher
        if (userRole !== 'TEACHER') {
            res.status(403).json({ error: 'Accès enseignant requis' });
            return;
        }

        if (!id) {
            res.status(400).json({ error: 'ID du modèle requis' });
            return;
        }

        logger.info({ templateId: id, userId, newName: name }, 'Renaming game template');

        // First check if the template exists and user has permission
        const existingTemplate = await getGameTemplateService().getgameTemplateById(id, false);

        if (!existingTemplate) {
            res.status(404).json({ error: 'Modèle d\'activité non trouvé' });
            return;
        }

        // Check if the user is the creator of this template
        if (existingTemplate.creatorId !== userId) {
            res.status(403).json({ error: 'Vous n\'avez pas la permission de renommer ce modèle d\'activité' });
            return;
        }

        // Update only the name using the existing update service
        const updatedTemplate = await getGameTemplateService().updategameTemplate(userId, {
            id,
            name
        });

        res.status(200).json({ gameTemplate: updatedTemplate });
    } catch (error: any) {
        logger.error({
            error: error.message,
            templateId: req.params.id,
            userId: req.user?.userId || req.headers['x-user-id']
        }, 'Error renaming game template');

        if (error.message.includes('not found or you don\'t have permission')) {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Une erreur s\'est produite lors du renommage du modèle d\'activité' });
        }
    }
});

/**
 * Delete a game template
 * DELETE /api/v1/game-templates/:id
 * Requires teacher authentication
 */
router.delete('/:id', async (req: Request, res: Response<void | ErrorResponse>): Promise<void> => {
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

        const templateId = req.params.id;
        if (!templateId) {
            res.status(400).json({ error: 'Template ID is required' });
            return;
        }

        logger.info({ templateId, userId }, 'Deleting game template');

        // Check if force delete is requested
        const forceDelete = req.query.force === 'true';

        // Delete the template
        await getGameTemplateService().deletegameTemplate(userId, templateId, forceDelete);

        // Return 204 No Content for successful deletion
        res.status(204).send();
    } catch (error) {
        const err = error as Error;
        logger.error({
            error: err.message,
            templateId: req.params.id,
            userId: req.user?.userId
        }, 'Error deleting game template');

        if (err.message.includes('not found or you don\'t have permission')) {
            res.status(404).json({ error: err.message });
        } else if (err.message.includes('Cannot delete template') && err.message.includes('game session')) {
            res.status(409).json({ error: err.message }); // 409 Conflict
        } else {
            res.status(500).json({ error: 'An error occurred while deleting the game template' });
        }
    }
});

export default router;
