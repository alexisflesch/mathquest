import { GameParticipantService, JoinGameResult, SubmitAnswerData } from '@/core/services/gameParticipantService';
import { prisma } from '@/db/prisma';
import { jest } from '@jest/globals';

// Mock the prisma client
jest.mock('@/db/prisma', () => ({
    prisma: {
        gameInstance: {
            findUnique: jest.fn(),
        },
        gameParticipant: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn()
        }
    }
}));

// Mock the logger
jest.mock('@/utils/logger', () => {
    return jest.fn().mockImplementation(() => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    }));
});

describe('GameParticipantService', () => {
    let gameParticipantService: GameParticipantService;

    beforeEach(() => {
        gameParticipantService = new GameParticipantService();
        jest.clearAllMocks();
    });

    describe('joinGame', () => {
        it('should allow a player to join a game successfully', async () => {
            const playerId = 'player-123';
            const accessCode = 'ABC123';

            // Mock the game instance
            const mockGameInstance = {
                id: 'game-123',
                accessCode,
                status: 'pending',
                quizTemplate: { name: 'Test Quiz' }
            };

            (prisma.gameInstance.findUnique as any).mockResolvedValue(mockGameInstance);

            // Player is not yet in the game
            (prisma.gameParticipant.findFirst as any).mockResolvedValue(null);

            // Mock creating a participant
            const mockParticipant = {
                id: 'participant-123',
                gameInstanceId: 'game-123',
                playerId,
                score: 0,
                answers: [],
                player: { username: 'testplayer', avatarUrl: 'avatar.png' }
            };

            // Mock the create participant method with any for type safety
            jest.spyOn(gameParticipantService, 'createParticipant').mockResolvedValue(mockParticipant as any);

            const result = await gameParticipantService.joinGame(playerId, accessCode);

            expect(result).toEqual({
                success: true,
                gameInstance: mockGameInstance,
                participant: mockParticipant
            });

            expect(prisma.gameInstance.findUnique).toHaveBeenCalledWith({
                where: { accessCode },
                include: expect.any(Object)
            });

            expect(gameParticipantService.createParticipant).toHaveBeenCalledWith('game-123', playerId);
        });

        it('should return player is already in the game', async () => {
            const playerId = 'player-123';
            const accessCode = 'ABC123';

            // Mock the game instance
            const mockGameInstance = {
                id: 'game-123',
                accessCode,
                status: 'pending',
                quizTemplate: { name: 'Test Quiz' }
            };

            (prisma.gameInstance.findUnique as any).mockResolvedValue(mockGameInstance);

            // Player is already in the game
            const mockExistingParticipant = {
                id: 'participant-123',
                gameInstanceId: 'game-123',
                playerId
            };

            (prisma.gameParticipant.findFirst as any).mockResolvedValue(mockExistingParticipant);

            const result = await gameParticipantService.joinGame(playerId, accessCode);

            expect(result).toEqual({
                success: true,
                gameInstance: mockGameInstance,
                participant: mockExistingParticipant
            });

            // createParticipant should not be called if player is already in game
            expect(prisma.gameParticipant.create).not.toHaveBeenCalled();
        });

        it('should return error for non-existent game', async () => {
            const playerId = 'player-123';
            const accessCode = 'INVALID';

            (prisma.gameInstance.findUnique as any).mockResolvedValue(null);

            const result = await gameParticipantService.joinGame(playerId, accessCode);

            expect(result).toEqual({
                success: false,
                error: 'Game not found'
            });

            expect(prisma.gameParticipant.findFirst).not.toHaveBeenCalled();
        });

        it('should not allow joining a completed game', async () => {
            const playerId = 'player-123';
            const accessCode = 'ABC123';

            // Mock a completed game instance
            const mockCompletedGame = {
                id: 'game-123',
                accessCode,
                status: 'completed',
                quizTemplate: { name: 'Test Quiz' }
            };

            (prisma.gameInstance.findUnique as any).mockResolvedValue(mockCompletedGame);

            const result = await gameParticipantService.joinGame(playerId, accessCode);

            expect(result).toEqual({
                success: false,
                error: "Cannot join game in 'completed' status"
            });

            expect(prisma.gameParticipant.findFirst).not.toHaveBeenCalled();
        });

        it('should handle errors during join attempt', async () => {
            const playerId = 'player-123';
            const accessCode = 'ABC123';

            const mockError = new Error('Database error');
            (prisma.gameInstance.findUnique as any).mockRejectedValue(mockError);

            const result = await gameParticipantService.joinGame(playerId, accessCode);

            expect(result).toEqual({
                success: false,
                error: 'An error occurred while joining the game'
            });
        });
    });

    describe('createParticipant', () => {
        it('should create a participant successfully', async () => {
            const gameInstanceId = 'game-123';
            const playerId = 'player-123';

            const mockCreatedParticipant = {
                id: 'participant-123',
                gameInstanceId,
                playerId,
                score: 0,
                answers: [],
                player: {
                    username: 'testplayer',
                    avatarUrl: 'avatar.png'
                }
            };

            (prisma.gameParticipant.create as any).mockResolvedValue(mockCreatedParticipant);

            const result = await gameParticipantService.createParticipant(gameInstanceId, playerId);

            expect(prisma.gameParticipant.create).toHaveBeenCalledWith({
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

            expect(result).toEqual(mockCreatedParticipant);
        });

        it('should handle errors during participant creation', async () => {
            const gameInstanceId = 'game-123';
            const playerId = 'player-123';

            const mockError = new Error('Database error');
            (prisma.gameParticipant.create as any).mockRejectedValue(mockError);

            await expect(gameParticipantService.createParticipant(gameInstanceId, playerId)).rejects.toThrow(mockError);
        });
    });

    describe('submitAnswer', () => {
        it('should submit an answer and update score', async () => {
            const participantId = 'participant-123';
            const answerData: SubmitAnswerData = {
                questionUid: 'question-1',
                answer: 'option-B',
                timeTakenMs: 5000
            };

            // Mock the existing participant
            const mockParticipant = {
                id: participantId,
                gameInstanceId: 'game-123',
                playerId: 'player-123',
                score: 100, // Already has some score
                answers: [
                    // Already has one answer
                    {
                        questionUid: 'question-0',
                        answer: 'option-A',
                        isCorrect: true,
                        timeTakenMs: 3000,
                        score: 100
                    }
                ],
                gameInstance: { id: 'game-123' },
                // Add missing required properties with default values
                createdAt: new Date(),
                updatedAt: new Date(),
                rank: null,
                timeTakenMs: 3000,
                joinedAt: new Date(),
                completedAt: null
            };

            (prisma.gameParticipant.findUnique as any).mockResolvedValue(mockParticipant);

            // Mock the updated participant
            const mockUpdatedParticipant = {
                ...mockParticipant,
                score: 200, // Score increased
                timeTakenMs: 8000, // Total time
                answers: [
                    ...mockParticipant.answers,
                    {
                        questionUid: answerData.questionUid,
                        answer: answerData.answer,
                        isCorrect: true, // Assumed correct in this test
                        timeTakenMs: answerData.timeTakenMs,
                        score: 100
                    }
                ]
            };

            (prisma.gameParticipant.update as any).mockResolvedValue(mockUpdatedParticipant);

            // Mock updateRankings (private method) by spying 
            const updateRankingsSpy = jest.spyOn(gameParticipantService as any, 'updateRankings')
                .mockImplementation(() => Promise.resolve());

            const result = await gameParticipantService.submitAnswer(participantId, answerData);

            expect(prisma.gameParticipant.update).toHaveBeenCalledWith({
                where: { id: participantId },
                data: expect.objectContaining({
                    score: 200,
                    timeTakenMs: 8000,
                    answers: expect.arrayContaining([
                        expect.objectContaining({
                            questionUid: answerData.questionUid,
                            answer: answerData.answer
                        })
                    ])
                })
            });

            expect(updateRankingsSpy).toHaveBeenCalledWith('game-123');
            expect(result).toEqual(mockUpdatedParticipant);
        });

        it('should throw error if participant not found', async () => {
            const participantId = 'invalid-id';
            const answerData: SubmitAnswerData = {
                questionUid: 'question-1',
                answer: 'option-B',
                timeTakenMs: 5000
            };

            // Participant not found
            (prisma.gameParticipant.findUnique as any).mockResolvedValue(null);

            await expect(gameParticipantService.submitAnswer(participantId, answerData))
                .rejects.toThrow('Participant not found');

            expect(prisma.gameParticipant.update).not.toHaveBeenCalled();
        });

        it('should handle errors during answer submission', async () => {
            const participantId = 'participant-123';
            const answerData: SubmitAnswerData = {
                questionUid: 'question-1',
                answer: 'option-B',
                timeTakenMs: 5000
            };

            const mockError = new Error('Database error');
            (prisma.gameParticipant.findUnique as any).mockRejectedValue(mockError);

            await expect(gameParticipantService.submitAnswer(participantId, answerData)).rejects.toThrow(mockError);
        });
    });

    describe('getParticipantById', () => {
        it('should return participant with game and player info', async () => {
            const participantId = 'participant-123';

            const mockParticipant = {
                id: participantId,
                gameInstanceId: 'game-123',
                playerId: 'player-123',
                score: 200,
                answers: [],
                player: { username: 'testplayer', avatarUrl: 'avatar.png' },
                gameInstance: {
                    id: 'game-123',
                    name: 'Test Game',
                    status: 'active',
                    playMode: 'class',
                    quizTemplate: { name: 'Test Quiz' }
                }
            };

            (prisma.gameParticipant.findUnique as any).mockResolvedValue(mockParticipant);

            const result = await gameParticipantService.getParticipantById(participantId);

            expect(prisma.gameParticipant.findUnique).toHaveBeenCalledWith({
                where: { id: participantId },
                include: expect.objectContaining({
                    player: expect.any(Object),
                    gameInstance: expect.any(Object)
                })
            });

            expect(result).toEqual(mockParticipant);
        });

        it('should handle errors when fetching participant', async () => {
            const participantId = 'participant-123';

            const mockError = new Error('Database error');
            (prisma.gameParticipant.findUnique as any).mockRejectedValue(mockError);

            await expect(gameParticipantService.getParticipantById(participantId)).rejects.toThrow(mockError);
        });
    });
});
