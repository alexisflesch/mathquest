"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const gameTemplateService_1 = require("@/core/services/gameTemplateService");
const logger_1 = __importDefault(require("@/utils/logger"));
const logger = (0, logger_1.default)('GameTemplatesAPI');
const router = express_1.default.Router();
// Singleton instance for service
let gameTemplateServiceInstance = null;
const getGameTemplateService = () => {
    if (!gameTemplateServiceInstance) {
        gameTemplateServiceInstance = new gameTemplateService_1.GameTemplateService();
    }
    return gameTemplateServiceInstance;
};
/**
 * Student-driven GameTemplate creation
 * POST /api/v1/game-templates
 * Allows a student to create a game template by specifying userId, gradeLevel, discipline, themes, nbOfQuestions
 */
router.post('/', async (req, res) => {
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
    }
    catch (error) {
        logger.error({ error }, 'Error creating game template');
        res.status(500).json({ error: 'An error occurred while creating the game template' });
    }
});
exports.default = router;
