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
 * Teacher/Admin-driven GameTemplate creation
 * POST /api/v1/game-templates
 * Allows a teacher/admin to create a game template with specific details.
 * This route should be protected by teacherAuth middleware to ensure req.user is populated.
 */
router.post('/', async (req: Request, res: Response): Promise<void> => { // Use standard Request type
    try {
        // Log the received request body for debugging
        logger.info({ body: req.body, user: req.user }, 'Received request for game template creation');

        const { name, discipline, gradeLevel, themes, questions, description, defaultMode } = req.body as GameTemplateCreationData;

        // req.user should be populated by the auth middleware (e.g., teacherAuth)
        const userId = req.user?.userId; // Corrected: JwtPayload uses userId

        // Validate required fields
        const missingFields = [];
        if (!userId) {
            // This case should ideally be caught by auth middleware returning 401 earlier
            logger.warn('User ID missing from request after auth middleware. Ensure route is protected.');
            missingFields.push('userId (from authenticated token - missing after auth)');
        }
        if (!name) missingFields.push('name (string)');
        if (!discipline) missingFields.push('discipline (string)');
        if (!gradeLevel) missingFields.push('gradeLevel (string)');
        if (!themes || !Array.isArray(themes) || themes.length === 0) missingFields.push('themes (array of strings)');

        // Validate questions structure if provided, as per GameTemplateCreationData and service expectations
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

export default router;
