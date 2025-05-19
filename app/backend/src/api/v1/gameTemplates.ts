import express, { Request, Response } from 'express';
import { GameTemplateService } from '@/core/services/gameTemplateService';
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
 * Student-driven GameTemplate creation
 * POST /api/v1/game-templates
 * Allows a student to create a game template by specifying userId, gradeLevel, discipline, themes, nbOfQuestions
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, gradeLevel, discipline, themes, nbOfQuestions } = req.body;
        if (!userId || !gradeLevel || !discipline || !themes || !nbOfQuestions) {
            res.status(400).json({ error: 'Missing required fields', required: ['userId', 'gradeLevel', 'discipline', 'themes', 'nbOfQuestions'] });
            return;
        }
        const gameTemplate = await getGameTemplateService().createStudentGameTemplate({
            userId,
            gradeLevel,
            discipline,
            themes,
            nbOfQuestions
        });
        res.status(201).json({ gameTemplate });
    } catch (error) {
        logger.error({ error }, 'Error creating game template');
        res.status(500).json({ error: 'An error occurred while creating the game template' });
    }
});

export default router;
