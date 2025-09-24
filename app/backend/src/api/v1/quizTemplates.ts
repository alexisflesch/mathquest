import express, { Request, Response } from 'express';
import { GameTemplateService, GameTemplateCreationData, GameTemplateUpdateData } from '@/core/services/gameTemplateService';
import { teacherAuth } from '@/middleware/auth';
import { validateRequestBody } from '@/middleware/validation';
import createLogger from '@/utils/logger';
import type { GameTemplate } from '@shared/types/core/game';
import type {
    GameTemplateCreationRequest,
    GameTemplateUpdateRequest,
    ErrorResponse
} from '@shared/types/api/requests';
import type {
    GameTemplateCreationResponse,
    GameTemplateResponse,
    GameTemplatesResponse,
    GameTemplateUpdateResponse
} from '@shared/types/api/responses';
import {
    CreateQuizTemplateRequestSchema,
    UpdateQuizTemplateRequestSchema
} from '@shared/types/api/schemas';

// Create a route-specific logger
const logger = createLogger('gameTemplatesAPI');

const router = express.Router();

// Create a singleton instance or allow injection for testing
let gameTemplateServiceInstance: GameTemplateService | null = null;

const getGameTemplateService = (): GameTemplateService => {
    if (gameTemplateServiceInstance) {
        return gameTemplateServiceInstance;
    }
    return new GameTemplateService();
};

// For testing purposes only - allows tests to inject a mock service
export const __setGameTemplateServiceForTesting = (mockService: GameTemplateService): void => {
    gameTemplateServiceInstance = mockService;
};

/**
 * Create a new quiz template
 * POST /api/v1/quiz-templates
 * Requires teacher authentication
 */
router.post('/', teacherAuth, validateRequestBody(CreateQuizTemplateRequestSchema), async (req: Request<{}, GameTemplateCreationResponse | ErrorResponse, GameTemplateCreationRequest>, res: Response<GameTemplateCreationResponse | ErrorResponse>): Promise<void> => {
    try {
        if (!req.user?.userId || req.user.role !== 'TEACHER') {
            res.status(401).type('application/json').json({ error: 'Authentication required' });
            return;
        }

        const {
            name,
            gradeLevel,
            themes,
            discipline,
            description,
            defaultMode,
            questionUids
        } = req.body;

        // Basic validation
        if (!name || !themes || !questionUids) {
            res.status(400).type('application/json').json({
                error: 'Required fields missing',
                required: ['name', 'themes', 'questionUids']
            });
            return;
        }

        const gameTemplate = await getGameTemplateService().creategameTemplate(req.user.userId, {
            name,
            gradeLevel: gradeLevel || '',
            themes,
            discipline: discipline || '',
            description,
            defaultMode,
            questionUids
        });

        res.status(201).type('application/json').json({ gameTemplate });
    } catch (error) {
        logger.error({ error }, 'Error creating quiz template');
        res.status(500).type('application/json').json({ error: 'An error occurred while creating the quiz template' });
    }
});

/**
 * Get a quiz template by ID
 * GET /api/v1/quiz-templates/:id
 * Requires teacher authentication
 */
router.get('/:id', teacherAuth, async (req: Request, res: Response<GameTemplateResponse | ErrorResponse>): Promise<void> => {
    try {
        if (!req.user?.userId || req.user.role !== 'TEACHER') {
            res.status(401).type('application/json').json({ error: 'Authentication required' });
            return;
        }

        const { id } = req.params;
        const includeQuestions = req.query.includeQuestions === 'true';

        const gameTemplate = await getGameTemplateService().getgameTemplateById(id, includeQuestions);

        if (gameTemplate == null) {
            res.status(404).type('application/json').json({ error: 'Quiz template not found' });
            return;
        }

        // Check if the quiz template belongs to the requesting teacher
        if ((gameTemplate as any).creatorId !== req.user.userId) {
            res.status(403).type('application/json').json({ error: 'You do not have permission to access this quiz template' });
            return;
        }

        res.status(200).type('application/json').json({ gameTemplate });
    } catch (error) {
        logger.error({ error }, 'Error fetching quiz template');
        res.status(500).type('application/json').json({ error: 'An error occurred while fetching the quiz template' });
    }
});

/**
 * Get all quiz templates for a teacher with filtering and pagination
 * GET /api/v1/quiz-templates
 * Requires teacher authentication
 */
router.get('/', teacherAuth, async (req: Request, res: Response<GameTemplatesResponse | ErrorResponse>): Promise<void> => {
    try {
        if (!req.user?.userId || req.user.role !== 'TEACHER') {
            res.status(401).type('application/json').json({ error: 'Authentication required' });
            return;
        }

        const {
            discipline,
            themes,
            gradeLevel,
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

        if (gradeLevel) filters.gradeLevel = gradeLevel as string;

        const pagination = {
            skip: (Number(page) - 1) * Number(pageSize),
            take: Number(pageSize)
        };

        const result = await getGameTemplateService().getgameTemplates(
            req.user.userId,
            filters,
            pagination
        );

        // Transform to match GameTemplatesResponse structure
        const response: GameTemplatesResponse = {
            gameTemplates: result.gameTemplates,
            meta: {
                total: result.total,
                page: Number(page),
                pageSize: Number(pageSize),
                totalPages: result.totalPages
            }
        };

        res.status(200).type('application/json').json(response);
    } catch (error) {
        logger.error({ error }, 'Error fetching quiz templates');
        res.status(500).type('application/json').json({ error: 'An error occurred while fetching quiz templates' });
    }
});

/**
 * Update a quiz template
 * PUT /api/v1/quiz-templates/:id
 * Requires teacher authentication
 */
router.put('/:id', teacherAuth, validateRequestBody(UpdateQuizTemplateRequestSchema), async (req: Request<{ id: string }, GameTemplateUpdateResponse | ErrorResponse, GameTemplateUpdateRequest>, res: Response<GameTemplateUpdateResponse | ErrorResponse>): Promise<void> => {
    try {
        if (!req.user?.userId || req.user.role !== 'TEACHER') {
            res.status(401).type('application/json').json({ error: 'Authentication required' });
            return;
        }

        const { id } = req.params;
        const updateData = {
            id,
            ...req.body
        };

        const updatedgameTemplate = await getGameTemplateService().updategameTemplate(
            req.user.userId,
            updateData
        );

        res.status(200).type('application/json').json({
            message: 'Quiz template updated successfully',
            gameTemplate: updatedgameTemplate
        });
    } catch (error) {
        logger.error({ error }, 'Error updating quiz template');

        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).type('application/json').json({ error: error.message });
            return;
        }

        if (error instanceof Error && error.message.includes('permission')) {
            res.status(403).type('application/json').json({ error: error.message });
            return;
        }

        res.status(500).type('application/json').json({ error: 'An error occurred while updating the quiz template' });
    }
});

/**
 * Delete a quiz template
 */
router.delete('/:id', teacherAuth, async (req: Request, res: Response<{ success: boolean, message: string } | ErrorResponse>): Promise<void> => {
    // ...existing code...
});

/**
 * Add questions to quiz template
 */
router.post('/:id/questions', teacherAuth, async (req: Request, res: Response<GameTemplateResponse | ErrorResponse>): Promise<void> => {
    // ...existing code...
});

/**
 * Remove question from quiz template
 */
router.delete('/:id/questions/:questionUid', teacherAuth, async (req: Request, res: Response<{ success: boolean, message: string } | ErrorResponse>): Promise<void> => {
    // ...existing code...
});

/**
 * Update questions sequence in quiz template
 */
router.put('/:id/questions-sequence', teacherAuth, async (req: Request, res: Response<GameTemplateResponse | ErrorResponse>): Promise<void> => {
    try {
        if (!req.user?.userId || req.user.role !== 'TEACHER') {
            res.status(401).type('application/json').json({ error: 'Authentication required' });
            return;
        }

        const { id } = req.params;
        const updateData = {
            id,
            ...req.body
        };

        const updatedgameTemplate = await getGameTemplateService().updategameTemplate(
            req.user.userId,
            updateData
        );

        res.status(200).type('application/json').json({ gameTemplate: updatedgameTemplate });
    } catch (error) {
        logger.error({ error }, 'Error updating quiz template');

        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).type('application/json').json({ error: error.message });
            return;
        }

        if (error instanceof Error && error.message.includes('permission')) {
            res.status(403).type('application/json').json({ error: error.message });
            return;
        }

        res.status(500).type('application/json').json({ error: 'An error occurred while updating the quiz template' });
    }
});

/**
 * Delete a quiz template
 * DELETE /api/v1/quiz-templates/:id
 * Requires teacher authentication
 */
router.delete('/:id', teacherAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user?.userId || req.user.role !== 'TEACHER') {
            res.status(401).type('application/json').json({ error: 'Authentication required' });
            return;
        }

        const { id } = req.params;

        await getGameTemplateService().deletegameTemplate(req.user.userId, id);

        res.status(200).type('application/json').json({ success: true });
    } catch (error) {
        logger.error({ error }, 'Error deleting quiz template');

        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).type('application/json').json({ error: error.message });
            return;
        }

        if (error instanceof Error && error.message.includes('permission')) {
            res.status(403).type('application/json').json({ error: error.message });
            return;
        }

        res.status(500).type('application/json').json({ error: 'An error occurred while deleting the quiz template' });
    }
});

/**
 * Add a question to a quiz template
 * POST /api/v1/quiz-templates/:id/questions
 * Requires teacher authentication
 */
router.post('/:id/questions', teacherAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user?.userId || req.user.role !== 'TEACHER') {
            res.status(401).type('application/json').json({ error: 'Authentication required' });
            return;
        }

        const { id } = req.params;
        const { questionUid, sequence } = req.body;

        if (!questionUid) {
            res.status(400).type('application/json').json({ error: 'Question ID is required' });
            return;
        }

        const updatedgameTemplate = await getGameTemplateService().addQuestionTogameTemplate(
            req.user.userId,
            id,
            questionUid,
            sequence
        );

        res.status(200).type('application/json').json({ gameTemplate: updatedgameTemplate });
    } catch (error) {
        logger.error({ error }, 'Error adding question to quiz template');

        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).type('application/json').json({ error: error.message });
            return;
        }

        if (error instanceof Error && error.message.includes('permission')) {
            res.status(403).type('application/json').json({ error: error.message });
            return;
        }

        res.status(500).type('application/json').json({ error: 'An error occurred while adding the question' });
    }
});

/**
 * Remove a question from a quiz template
 * DELETE /api/v1/quiz-templates/:id/questions/:questionUid
 * Requires teacher authentication
 */
router.delete('/:id/questions/:questionUid', teacherAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user?.userId || req.user.role !== 'TEACHER') {
            res.status(401).type('application/json').json({ error: 'Authentication required' });
            return;
        }

        const { id, questionUid } = req.params;

        const updatedgameTemplate = await getGameTemplateService().removeQuestionFromgameTemplate(
            req.user.userId,
            id,
            questionUid
        );

        res.status(200).type('application/json').json({ gameTemplate: updatedgameTemplate });
    } catch (error) {
        logger.error({ error }, 'Error removing question from quiz template');

        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).type('application/json').json({ error: error.message });
            return;
        }

        if (error instanceof Error && error.message.includes('permission')) {
            res.status(403).type('application/json').json({ error: error.message });
            return;
        }

        res.status(500).type('application/json').json({ error: 'An error occurred while removing the question' });
    }
});

/**
 * Update question sequence in a quiz template
 * PUT /api/v1/quiz-templates/:id/questions-sequence
 * Requires teacher authentication
 */
router.put('/:id/questions-sequence', teacherAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user?.userId || req.user.role !== 'TEACHER') {
            res.status(401).type('application/json').json({ error: 'Authentication required' });
            return;
        }

        const { id } = req.params;
        const { updates } = req.body;

        if (!updates || !Array.isArray(updates) || updates.length === 0) {
            res.status(400).type('application/json').json({ error: 'Updates array is required' });
            return;
        }

        const updatedgameTemplate = await getGameTemplateService().updateQuestionSequence(
            req.user.userId,
            id,
            updates
        );

        res.status(200).type('application/json').json({ gameTemplate: updatedgameTemplate });
    } catch (error) {
        logger.error({ error }, 'Error updating question sequence');

        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).type('application/json').json({ error: error.message });
            return;
        }

        if (error instanceof Error && error.message.includes('permission')) {
            res.status(403).type('application/json').json({ error: error.message });
            return;
        }

        res.status(500).type('application/json').json({ error: 'An error occurred while updating question sequence' });
    }
});

export default router;
