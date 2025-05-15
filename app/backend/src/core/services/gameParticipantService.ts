import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';

// Create a service-specific logger
const logger = createLogger('GameParticipantService');

export interface JoinGameResult {
    success: boolean;
    gameInstance?: any;
    participant?: any;
    error?: string;
}

export interface SubmitAnswerData {
    questionUid: string;
    answer: any;
    timeTakenMs: number;
}

/**
 * GameParticipant service class for managing game participants
 */
export class GameParticipantService {
    /**
     * Join a game using access code
     * @param playerId The ID of the player joining the game
     * @param accessCode The access code of the game to join
     * @returns Result of the join attempt
     */
    async joinGame(playerId: string, accessCode: string): Promise<JoinGameResult> {
        try {
            // Find the game instance
            const gameInstance = await prisma.gameInstance.findUnique({
                where: { accessCode },
                include: {
                    quizTemplate: {
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

            // Check if game is in a joinable state
            if (gameInstance.status !== 'pending' && gameInstance.status !== 'active') {
                return {
                    success: false,
                    error: `Cannot join game in '${gameInstance.status}' status`
                };
            }

            // Check if player is already in this game
            const existingParticipant = await prisma.gameParticipant.findFirst({
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
        } catch (error) {
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
    async createParticipant(gameInstanceId: string, playerId: string) {
        try {
            // Create the participant record
            const participant = await prisma.gameParticipant.create({
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
        } catch (error) {
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
    async submitAnswer(participantId: string, data: SubmitAnswerData) {
        try {
            // Get the current participant and their answers
            const participant = await prisma.gameParticipant.findUnique({
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
            const updatedParticipant = await prisma.gameParticipant.update({
                where: { id: participantId },
                data: {
                    // Use explicit number type
                    score: totalScore as number,
                    timeTakenMs: totalTimeTakenMs as number,
                    // Prisma accepts JSON array for the answers field
                    answers: answersArray
                }
            });

            // Update rankings for participants in this game
            await this.updateRankings(participant.gameInstanceId);

            return updatedParticipant;
        } catch (error) {
            logger.error({ error, participantId }, 'Error submitting answer');
            throw error;
        }
    }

    /**
     * Update rankings for all participants in a game
     * @param gameInstanceId The ID of the game instance
     */
    private async updateRankings(gameInstanceId: string): Promise<void> {
        try {
            // Get all participants sorted by score (desc) and time (asc)
            const participants = await prisma.gameParticipant.findMany({
                where: { gameInstanceId },
                orderBy: [
                    { score: 'desc' },
                    { timeTakenMs: 'asc' }
                ]
            });

            // Update ranks
            for (let i = 0; i < participants.length; i++) {
                const rank = i + 1; // Ranks start at 1
                await prisma.gameParticipant.update({
                    where: { id: participants[i].id },
                    data: { rank }
                });
            }
        } catch (error) {
            logger.error({ error, gameInstanceId }, 'Error updating rankings');
            // Don't throw, just log - this is a background operation
        }
    }

    /**
     * Get a participant by ID
     * @param participantId The ID of the participant
     * @returns The participant with game and player info
     */
    async getParticipantById(participantId: string) {
        try {
            return await prisma.gameParticipant.findUnique({
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
                            quizTemplate: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            logger.error({ error, participantId }, 'Error getting participant');
            throw error;
        }
    }
}
