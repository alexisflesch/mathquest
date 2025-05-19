"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gameParticipantService_1 = require("@/core/services/gameParticipantService");
const prisma_1 = require("@/db/prisma");
const globals_1 = require("@jest/globals");
// Mock the prisma client
globals_1.jest.mock('@/db/prisma', () => ({
    prisma: {
        gameInstance: {
            findUnique: globals_1.jest.fn(),
        },
        gameParticipant: {
            findFirst: globals_1.jest.fn(),
            findUnique: globals_1.jest.fn(),
            create: globals_1.jest.fn(),
            findMany: globals_1.jest.fn(),
            update: globals_1.jest.fn()
        }
    }
}));
// Mock the logger
globals_1.jest.mock('@/utils/logger', () => {
    return globals_1.jest.fn().mockImplementation(() => ({
        info: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
        debug: globals_1.jest.fn()
    }));
});
describe('GameParticipantService', () => {
    let gameParticipantService;
    beforeEach(() => {
        gameParticipantService = new gameParticipantService_1.GameParticipantService();
        globals_1.jest.clearAllMocks();
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
                gameTemplate: { name: 'Test Quiz' }
            };
            prisma_1.prisma.gameInstance.findUnique.mockResolvedValue(mockGameInstance);
            // Player is not yet in the game
            prisma_1.prisma.gameParticipant.findFirst.mockResolvedValue(null);
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
            globals_1.jest.spyOn(gameParticipantService, 'createParticipant').mockResolvedValue(mockParticipant);
            const result = await gameParticipantService.joinGame(playerId, accessCode);
            expect(result).toEqual({
                success: true,
                gameInstance: mockGameInstance,
                participant: mockParticipant
            });
            expect(prisma_1.prisma.gameInstance.findUnique).toHaveBeenCalledWith({
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
                gameTemplate: { name: 'Test Quiz' }
            };
            prisma_1.prisma.gameInstance.findUnique.mockResolvedValue(mockGameInstance);
            // Player is already in the game
            const mockExistingParticipant = {
                id: 'participant-123',
                gameInstanceId: 'game-123',
                playerId
            };
            prisma_1.prisma.gameParticipant.findFirst.mockResolvedValue(mockExistingParticipant);
            const result = await gameParticipantService.joinGame(playerId, accessCode);
            expect(result).toEqual({
                success: true,
                gameInstance: mockGameInstance,
                participant: mockExistingParticipant
            });
            // createParticipant should not be called if player is already in game
            expect(prisma_1.prisma.gameParticipant.create).not.toHaveBeenCalled();
        });
        it('should return error for non-existent game', async () => {
            const playerId = 'player-123';
            const accessCode = 'INVALID';
            prisma_1.prisma.gameInstance.findUnique.mockResolvedValue(null);
            const result = await gameParticipantService.joinGame(playerId, accessCode);
            expect(result).toEqual({
                success: false,
                error: 'Game not found'
            });
            expect(prisma_1.prisma.gameParticipant.findFirst).not.toHaveBeenCalled();
        });
        it('should not allow joining a completed game', async () => {
            const playerId = 'player-123';
            const accessCode = 'ABC123';
            // Mock a completed game instance
            const mockCompletedGame = {
                id: 'game-123',
                accessCode,
                status: 'completed',
                gameTemplate: { name: 'Test Quiz' }
            };
            prisma_1.prisma.gameInstance.findUnique.mockResolvedValue(mockCompletedGame);
            const result = await gameParticipantService.joinGame(playerId, accessCode);
            expect(result).toEqual({
                success: false,
                error: "Cannot join game in 'completed' status"
            });
            expect(prisma_1.prisma.gameParticipant.findFirst).not.toHaveBeenCalled();
        });
        it('should handle errors during join attempt', async () => {
            const playerId = 'player-123';
            const accessCode = 'ABC123';
            const mockError = new Error('Database error');
            prisma_1.prisma.gameInstance.findUnique.mockRejectedValue(mockError);
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
            prisma_1.prisma.gameParticipant.create.mockResolvedValue(mockCreatedParticipant);
            const result = await gameParticipantService.createParticipant(gameInstanceId, playerId);
            expect(prisma_1.prisma.gameParticipant.create).toHaveBeenCalledWith({
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
            prisma_1.prisma.gameParticipant.create.mockRejectedValue(mockError);
            await expect(gameParticipantService.createParticipant(gameInstanceId, playerId)).rejects.toThrow(mockError);
        });
    });
    describe('submitAnswer', () => {
        it('should submit an answer and update score', async () => {
            const participantId = 'participant-123';
            const answerData = {
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
            prisma_1.prisma.gameParticipant.findUnique.mockResolvedValue(mockParticipant);
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
            prisma_1.prisma.gameParticipant.update.mockResolvedValue(mockUpdatedParticipant);
            // Mock updateRankings (private method) by spying 
            const updateRankingsSpy = globals_1.jest.spyOn(gameParticipantService, 'updateRankings')
                .mockImplementation(() => Promise.resolve());
            const result = await gameParticipantService.submitAnswer(participantId, answerData);
            expect(prisma_1.prisma.gameParticipant.update).toHaveBeenCalledWith({
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
            const answerData = {
                questionUid: 'question-1',
                answer: 'option-B',
                timeTakenMs: 5000
            };
            // Participant not found
            prisma_1.prisma.gameParticipant.findUnique.mockResolvedValue(null);
            await expect(gameParticipantService.submitAnswer(participantId, answerData))
                .rejects.toThrow('Participant not found');
            expect(prisma_1.prisma.gameParticipant.update).not.toHaveBeenCalled();
        });
        it('should handle errors during answer submission', async () => {
            const participantId = 'participant-123';
            const answerData = {
                questionUid: 'question-1',
                answer: 'option-B',
                timeTakenMs: 5000
            };
            const mockError = new Error('Database error');
            prisma_1.prisma.gameParticipant.findUnique.mockRejectedValue(mockError);
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
                    playMode: 'quiz',
                    gameTemplate: { name: 'Test Quiz' }
                }
            };
            prisma_1.prisma.gameParticipant.findUnique.mockResolvedValue(mockParticipant);
            const result = await gameParticipantService.getParticipantById(participantId);
            expect(prisma_1.prisma.gameParticipant.findUnique).toHaveBeenCalledWith({
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
            prisma_1.prisma.gameParticipant.findUnique.mockRejectedValue(mockError);
            await expect(gameParticipantService.getParticipantById(participantId)).rejects.toThrow(mockError);
        });
    });
});
