"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameParticipantService = void 0;
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
// Create a service-specific logger
const logger = (0, logger_1.default)('GameParticipantService');
/**
 * GameParticipant service class for managing game participants
 */
class GameParticipantService {
    /**
     * Join a game using access code
     * @param playerId The ID of the player joining the game
     * @param accessCode The access code of the game to join
     * @returns Result of the join attempt
     */
    async joinGame(playerId, accessCode) {
        try {
            // Find the game instance
            const gameInstance = await prisma_1.prisma.gameInstance.findUnique({
                where: { accessCode },
                select: {
                    id: true,
                    name: true,
                    status: true,
                    isDiffered: true,
                    differedAvailableFrom: true,
                    differedAvailableTo: true,
                    gameTemplate: {
                        select: {
                            name: true
                        }
                    }
                }
            });
            // Game not found or invalid access code
            if (!gameInstance) {
                return {
                    success: false,
                    error: 'Game not found'
                };
            }
            // Differed mode join logic
            const now = new Date();
            const isDiffered = !!gameInstance.isDiffered;
            const from = gameInstance.differedAvailableFrom ? new Date(gameInstance.differedAvailableFrom) : null;
            const to = gameInstance.differedAvailableTo ? new Date(gameInstance.differedAvailableTo) : null;
            const inDifferedWindow = isDiffered && (!from || now >= from) && (!to || now <= to);
            if (gameInstance.status !== 'pending' &&
                gameInstance.status !== 'active' &&
                !inDifferedWindow) {
                return {
                    success: false,
                    error: `Cannot join game in '${gameInstance.status}' status` + (isDiffered ? ' (differed window closed or not started)' : '')
                };
            }
            // Check if player is already in this game
            const existingParticipant = await prisma_1.prisma.gameParticipant.findFirst({
                where: {
                    gameInstanceId: gameInstance.id,
                    playerId
                }
            });
            if (existingParticipant) {
                // Player is already in the game, just return success
                return {
                    success: true,
                    gameInstance,
                    participant: existingParticipant
                };
            }
            // Create new participant
            const participant = await this.createParticipant(gameInstance.id, playerId);
            return {
                success: true,
                gameInstance,
                participant
            };
        }
        catch (error) {
            logger.error({ error, playerId, accessCode }, 'Error joining game');
            return {
                success: false,
                error: 'An error occurred while joining the game'
            };
        }
    }
    /**
     * Create a new game participant
     * @param gameInstanceId The ID of the game instance
     * @param playerId The ID of the player
     * @returns The created participant
     */
    async createParticipant(gameInstanceId, playerId) {
        try {
            // Create the participant record
            const participant = await prisma_1.prisma.gameParticipant.create({
                data: {
                    gameInstanceId,
                    playerId,
                    score: 0,
                    answers: []
                },
                include: {
                    player: {
                        select: {
                            username: true,
                            avatarUrl: true
                        }
                    }
                }
            });
            return participant;
        }
        catch (error) {
            logger.error({ error, gameInstanceId, playerId }, 'Error creating game participant');
            throw error;
        }
    }
    /**
     * Submit an answer for a question in a game
     * @param participantId The ID of the participant
     * @param data The answer submission data
     * @returns The updated participant with score
     */
    async submitAnswer(participantId, data) {
        try {
            // Get the current participant and their answers
            const participant = await prisma_1.prisma.gameParticipant.findUnique({
                where: { id: participantId },
                include: {
                    gameInstance: true
                }
            });
            if (!participant) {
                throw new Error('Participant not found');
            }
            // Calculate score for this answer (simplified version)
            // In a real implementation, this would check against correct answers
            // For now, we're just using a placeholder scoring system
            const isCorrect = true; // Placeholder - would be determined by comparing to correct answer
            const scoreForQuestion = isCorrect ? 100 : 0; // Basic scoring
            // Get current answers array or initialize empty if null
            const answersArray = Array.isArray(participant.answers) ? [...participant.answers] : [];
            // Create a new answer object
            const newAnswer = {
                questionUid: data.questionUid,
                answer: data.answer,
                isCorrect,
                timeTakenMs: data.timeTakenMs,
                score: scoreForQuestion
            };
            // Add new answer to the array
            answersArray.push(newAnswer);
            // Calculate total score safely
            let totalScore = 0;
            for (const ans of answersArray) {
                if (ans && typeof ans === 'object' && 'score' in ans) {
                    totalScore += (typeof ans.score === 'number') ? ans.score : 0;
                }
            }
            // Calculate total time taken safely
            let totalTimeTakenMs = 0;
            for (const ans of answersArray) {
                if (ans && typeof ans === 'object' && 'timeTakenMs' in ans) {
                    totalTimeTakenMs += (typeof ans.timeTakenMs === 'number') ? ans.timeTakenMs : 0;
                }
            }
            // Update the participant record
            const updatedParticipant = await prisma_1.prisma.gameParticipant.update({
                where: { id: participantId },
                data: {
                    // Use explicit number type
                    score: totalScore,
                    timeTakenMs: totalTimeTakenMs,
                    // Prisma accepts JSON array for the answers field
                    answers: answersArray
                }
            });
            // Update rankings for participants in this game
            await this.updateRankings(participant.gameInstanceId);
            return updatedParticipant;
        }
        catch (error) {
            logger.error({ error, participantId }, 'Error submitting answer');
            throw error;
        }
    }
    /**
     * Update rankings for all participants in a game
     * @param gameInstanceId The ID of the game instance
     */
    async updateRankings(gameInstanceId) {
        try {
            // Get all participants sorted by score (desc) and time (asc)
            const participants = await prisma_1.prisma.gameParticipant.findMany({
                where: { gameInstanceId },
                orderBy: [
                    { score: 'desc' },
                    { timeTakenMs: 'asc' }
                ]
            });
            // Update ranks
            for (let i = 0; i < participants.length; i++) {
                const rank = i + 1; // Ranks start at 1
                await prisma_1.prisma.gameParticipant.update({
                    where: { id: participants[i].id },
                    data: { rank }
                });
            }
        }
        catch (error) {
            logger.error({ error, gameInstanceId }, 'Error updating rankings');
            // Don't throw, just log - this is a background operation
        }
    }
    /**
     * Get a participant by ID
     * @param participantId The ID of the participant
     * @returns The participant with game and player info
     */
    async getParticipantById(participantId) {
        try {
            return await prisma_1.prisma.gameParticipant.findUnique({
                where: { id: participantId },
                include: {
                    player: {
                        select: {
                            username: true,
                            avatarUrl: true
                        }
                    },
                    gameInstance: {
                        select: {
                            id: true,
                            name: true,
                            status: true,
                            playMode: true,
                            currentQuestionIndex: true,
                            gameTemplate: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            });
        }
        catch (error) {
            logger.error({ error, participantId }, 'Error getting participant');
            throw error;
        }
    }
}
exports.GameParticipantService = GameParticipantService;
