"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameAccessOptionsSchema = void 0;
exports.validateGameAccess = validateGameAccess;
exports.validateGameAccessByCode = validateGameAccessByCode;
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
const zod_1 = require("zod");
const logger = (0, logger_1.default)('GameAuthorizationHelper');
/**
 * Validates if a user is authorized to access a game instance
 * User must be either the game initiator or the template creator
 *
 * @param options GameAccessOptions object
 */
async function validateGameAccess(options) {
    const { gameId, userId, isTestEnvironment, requireQuizMode } = options;
    try {
        // Fetch the game instance with template included
        const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
            where: { id: gameId },
            include: { gameTemplate: true }
        });
        if (!gameInstance) {
            return {
                isAuthorized: false,
                errorCode: 'GAME_NOT_FOUND',
                errorMessage: 'Game not found with the provided ID'
            };
        }
        // Check authorization - user must be either the game initiator or the template creator
        const isAuthorized = gameInstance.initiatorUserId === userId ||
            gameInstance.gameTemplate?.creatorId === userId;
        if (!isAuthorized && !isTestEnvironment) {
            logger.warn({
                gameId,
                userId,
                initiatorUserId: gameInstance.initiatorUserId,
                templateCreatorId: gameInstance.gameTemplate?.creatorId,
                playMode: gameInstance.playMode,
                reason: 'NOT_AUTHORIZED'
            }, 'User not authorized for this game');
            return {
                isAuthorized: false,
                gameInstance,
                errorCode: 'NOT_AUTHORIZED',
                errorMessage: 'You are not authorized to control this game'
            };
        }
        if (!isAuthorized && isTestEnvironment) {
            logger.info({ gameId, userId }, 'Test environment: Bypassing authorization check');
        }
        // Enforce QUIZ ONLY access for dashboard/projection
        if (requireQuizMode && gameInstance.playMode !== 'quiz') {
            logger.warn({
                gameId,
                userId,
                playMode: gameInstance.playMode,
                initiatorUserId: gameInstance.initiatorUserId,
                templateCreatorId: gameInstance.gameTemplate?.creatorId,
                reason: 'NOT_QUIZ_MODE'
            }, 'Access denied: Only QUIZ mode is allowed for dashboard/projection');
            return {
                isAuthorized: false,
                gameInstance,
                errorCode: 'NOT_QUIZ_MODE',
                errorMessage: 'Only quiz mode is allowed for dashboard and projection access.'
            };
        }
        return {
            isAuthorized: true,
            gameInstance
        };
    }
    catch (error) {
        logger.error({ gameId, userId, error }, 'Error validating game access');
        return {
            isAuthorized: false,
            errorCode: 'AUTHORIZATION_ERROR',
            errorMessage: 'Error checking game authorization'
        };
    }
}
/**
 * Validates if a user is authorized to access a game by access code
 * @param options GameAccessOptions object (must include accessCode)
 */
async function validateGameAccessByCode(options) {
    const { accessCode, userId, isTestEnvironment, requireQuizMode } = options;
    try {
        logger.debug({ accessCode, userId, isTestEnvironment, requireQuizMode }, 'validateGameAccessByCode called');
        // First find the game by access code
        const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
            where: { accessCode },
            include: { gameTemplate: true }
        });
        if (!gameInstance) {
            return {
                isAuthorized: false,
                errorCode: 'GAME_NOT_FOUND',
                errorMessage: 'Game not found with the provided access code'
            };
        }
        // Use the existing validation with gameId, enforcing QUIZ ONLY for dashboard/projection
        return await validateGameAccess({
            gameId: gameInstance.id,
            userId,
            isTestEnvironment,
            requireQuizMode
        });
    }
    catch (error) {
        logger.error({ accessCode, userId, error }, 'Error validating game access by code');
        return {
            isAuthorized: false,
            errorCode: 'AUTHORIZATION_ERROR',
            errorMessage: 'Error checking game authorization'
        };
    }
}
exports.GameAccessOptionsSchema = zod_1.z.object({
    gameId: zod_1.z.string().optional(),
    accessCode: zod_1.z.string().optional(),
    userId: zod_1.z.string(),
    isTestEnvironment: zod_1.z.boolean().default(false),
    requireQuizMode: zod_1.z.boolean().default(false)
});
