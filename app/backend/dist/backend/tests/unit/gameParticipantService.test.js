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
            create: globals_1.jest.fn(),
            findUnique: globals_1.jest.fn(),
            update: globals_1.jest.fn(), // Add this mock
        },
        user: {
            upsert: globals_1.jest.fn(),
        },
    },
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
describe('Game Participant Service', () => {
    globals_1.jest.setTimeout(3000);
    let gameParticipantService;
    beforeEach(() => {
        gameParticipantService = new gameParticipantService_1.GameParticipantService();
        globals_1.jest.clearAllMocks();
        // Mock prisma.player.upsert for participant creation
        prisma_1.prisma.player = { upsert: globals_1.jest.fn() };
    });
    describe('joinGame', () => {
        it('should allow a player to join a game successfully', async () => {
            const userId = 'player-123';
            const accessCode = 'ABC123';
            // Mock the game instance
            const mockGameInstance = {
                id: 'game-123',
                accessCode,
                status: 'pending',
                gameTemplate: { name: 'Test Quiz' }
            };
            prisma_1.prisma.gameInstance.findUnique.mockResolvedValue(mockGameInstance);
            prisma_1.prisma.gameParticipant.findFirst.mockResolvedValue(null);
            prisma_1.prisma.user.upsert.mockResolvedValue({ id: userId });
            prisma_1.prisma.gameParticipant.create.mockResolvedValue({ id: 'participant-123', userId, gameInstanceId: 'game-123' });
            prisma_1.prisma.gameParticipant.findUnique.mockResolvedValue({
                id: 'participant-123',
                gameInstanceId: 'game-123',
                userId,
                score: 0,
                answers: [],
                user: { username: 'testplayer', avatarEmoji: 'avatar.png' },
                createdAt: new Date(),
                updatedAt: new Date(),
                rank: null,
                timeTakenMs: null,
                joinedAt: new Date(),
                completedAt: null
            });
            const result = await gameParticipantService.joinGame(userId, accessCode);
            expect(result.success).toBe(true);
            expect(prisma_1.prisma.gameInstance.findUnique).toHaveBeenCalledWith({
                where: { accessCode },
                select: expect.any(Object)
            });
        });
        it('should return player is already in the game', async () => {
            const userId = 'player-123';
            const accessCode = 'ABC123';
            // Mock the game instance
            const mockGameInstance = {
                id: 'game-123',
                accessCode,
                status: 'pending',
                gameTemplate: { name: 'Test Quiz' }
            };
            const mockExistingParticipant = {
                id: 'participant-123',
                gameInstanceId: 'game-123',
                userId,
                score: 0,
                answers: [],
                user: { username: 'testplayer', avatarEmoji: 'avatar.png' },
                createdAt: new Date(),
                updatedAt: new Date(),
                rank: null,
                timeTakenMs: null,
                joinedAt: new Date(),
                completedAt: null
            };
            prisma_1.prisma.gameInstance.findUnique.mockResolvedValue(mockGameInstance);
            prisma_1.prisma.gameParticipant.findFirst.mockResolvedValue(mockExistingParticipant);
            // Mock the update call that happens when a participant already exists
            prisma_1.prisma.gameParticipant.update.mockResolvedValue({
                ...mockExistingParticipant,
                joinedAt: new Date() // Updated joinedAt timestamp
            });
            const result = await gameParticipantService.joinGame(userId, accessCode);
            expect(result.success).toBe(true); // Idempotent join: should return true if already joined
            // Optionally, check for a message or flag if your service provides it
            // expect(result.alreadyJoined).toBe(true);
        });
        it('should return error for non-existent game', async () => {
            const userId = 'player-123';
            const accessCode = 'INVALID';
            prisma_1.prisma.gameInstance.findUnique.mockResolvedValue(null);
            const result = await gameParticipantService.joinGame(userId, accessCode);
            expect(result).toEqual({
                success: false,
                error: 'Game not found'
            });
            expect(prisma_1.prisma.gameParticipant.findFirst).not.toHaveBeenCalled();
        });
        it('should not allow joining a completed game if not deferred', async () => {
            // This test ensures that joining a completed game is blocked unless it is a deferred game within the allowed window.
            const userId = 'player-123';
            const accessCode = 'ABC123';
            // Mock a completed, non-deferred game instance
            const mockCompletedGame = {
                id: 'game-123',
                accessCode,
                status: 'completed',
                isDiffered: false,
                gameTemplate: { name: 'Test Quiz' }
            };
            prisma_1.prisma.gameInstance.findUnique.mockResolvedValue(mockCompletedGame);
            const result = await gameParticipantService.joinGame(userId, accessCode);
            expect(result.success).toBe(false);
            expect(result.error).toMatch(/completed/);
            expect(prisma_1.prisma.gameParticipant.findFirst).not.toHaveBeenCalled();
        });
        it('should allow joining a completed game if deferred and within window', async () => {
            // This test ensures that joining a completed game is allowed if it is deferred and the join is within the allowed window.
            const userId = 'player-123';
            const accessCode = 'ABC123';
            const now = new Date();
            const from = new Date(now.getTime() - 1000 * 60); // 1 min ago
            const to = new Date(now.getTime() + 1000 * 60 * 60); // 1 hour from now
            // Mock a completed, deferred game instance
            const mockCompletedDeferredGame = {
                id: 'game-123',
                accessCode,
                status: 'completed',
                isDiffered: true,
                differedAvailableFrom: from,
                differedAvailableTo: to,
                gameTemplate: { name: 'Test Quiz' }
            };
            prisma_1.prisma.gameInstance.findUnique.mockResolvedValue(mockCompletedDeferredGame);
            prisma_1.prisma.gameParticipant.findFirst.mockResolvedValue(null);
            prisma_1.prisma.user.upsert.mockResolvedValue({ id: userId });
            prisma_1.prisma.gameParticipant.create.mockResolvedValue({ id: 'participant-123', userId, gameInstanceId: 'game-123' });
            prisma_1.prisma.gameParticipant.findUnique.mockResolvedValue({
                id: 'participant-123',
                gameInstanceId: 'game-123',
                userId,
                score: 0,
                answers: [],
                user: { username: 'testplayer', avatarEmoji: 'avatar.png' },
                createdAt: now,
                updatedAt: now,
                rank: null,
                timeTakenMs: null,
                joinedAt: now,
                completedAt: null
            });
            const result = await gameParticipantService.joinGame(userId, accessCode);
            expect(result.success).toBe(true);
            expect(result.participant).toBeDefined();
        });
        it('should handle errors during join attempt', async () => {
            const userId = 'player-123';
            const accessCode = 'ABC123';
            const mockError = new Error('Database error');
            prisma_1.prisma.gameInstance.findUnique.mockRejectedValue(mockError);
            const result = await gameParticipantService.joinGame(userId, accessCode);
            expect(result).toEqual({
                success: false,
                error: 'An error occurred while joining the game'
            });
        });
    });
    describe('createParticipant', () => {
        it('should create a participant successfully', async () => {
            const gameInstanceId = 'game-123';
            const userId = 'player-123';
            const mockCreatedParticipant = {
                id: 'participant-123',
                gameInstanceId,
                userId,
                score: 0,
                answers: [],
                user: {
                    username: 'testplayer',
                    avatarEmoji: 'avatar.png'
                }
            };
            prisma_1.prisma.gameParticipant.create.mockResolvedValue(mockCreatedParticipant);
            const result = await gameParticipantService.createParticipant(gameInstanceId, userId);
            expect(prisma_1.prisma.gameParticipant.create).toHaveBeenCalledWith({
                data: {
                    score: 0,
                    answers: [],
                    gameInstance: { connect: { id: gameInstanceId } },
                    user: {
                        connectOrCreate: {
                            where: { id: userId },
                            create: {
                                username: `guest-${userId}`,
                                role: 'STUDENT',
                                studentProfile: { create: { cookieId: `cookie-${userId}` } },
                                avatarEmoji: null,
                            }
                        }
                    }
                }
            });
            expect(result).toEqual({ success: true, participant: mockCreatedParticipant });
        });
        it('should handle errors during participant creation', async () => {
            const gameInstanceId = 'game-123';
            const userId = 'player-123';
            const mockError = new Error('Database error');
            prisma_1.prisma.gameParticipant.create.mockRejectedValue(mockError);
            const result = await gameParticipantService.createParticipant(gameInstanceId, userId);
            expect(result).toEqual({ success: false, error: 'An error occurred while creating the participant' });
        });
    });
    describe('submitAnswer', () => {
        it('should submit an answer and update score', async () => {
            const participantId = 'participant-123';
            const answerData = {
                accessCode: 'test-code',
                userId: 'player-123',
                questionUid: 'question-1',
                answer: 'option-B',
                timeSpent: 5000
            };
            // Mock the existing participant
            const mockParticipant = {
                id: participantId,
                gameInstanceId: 'game-123',
                userId: 'player-123',
                score: 100, // Already has some score
                answers: [
                    // Already has one answer
                    {
                        questionUid: 'question-0',
                        answer: 'option-A',
                        isCorrect: true,
                        timeSpent: 3000,
                        score: 100
                    }
                ],
                gameInstance: { id: 'game-123' },
                createdAt: new Date(),
                updatedAt: new Date(),
                rank: null,
                timeTakenMs: 3000,
                joinedAt: new Date(),
                completedAt: null,
                user: { username: 'testplayer', avatarEmoji: 'avatar.png' }
            };
            prisma_1.prisma.gameParticipant.findFirst.mockResolvedValue(mockParticipant);
            prisma_1.prisma.gameParticipant.update.mockResolvedValue({ ...mockParticipant, score: 200 });
            const result = await gameParticipantService.submitAnswer("game-123", participantId, answerData);
            expect(prisma_1.prisma.gameParticipant.update).toHaveBeenCalledWith({
                where: { id: participantId },
                data: expect.objectContaining({
                    answers: expect.any(Array)
                })
            });
            expect(result.success).toBe(true);
            if (result.success && result.scoreResult) {
                expect(result.scoreResult.totalScore).toBeDefined();
                expect(result.scoreResult.scoreUpdated).toBeDefined();
            }
            else {
                expect(result.error).toBeDefined();
            }
        });
        it('should throw error if participant not found', async () => {
            const participantId = 'invalid-id';
            const answerData = {
                accessCode: 'test-code',
                userId: 'invalid-id',
                questionUid: 'question-1',
                answer: 'option-B',
                timeSpent: 5000
            };
            // Participant not found
            prisma_1.prisma.gameParticipant.findFirst.mockResolvedValue(null);
            const result = await gameParticipantService.submitAnswer("game-123", participantId, answerData);
            expect(result.success).toBe(false);
            expect(result.error).toMatch(/participant not found/i);
        });
        it('should handle errors during answer submission', async () => {
            const participantId = 'participant-123';
            const answerData = {
                accessCode: 'test-code',
                userId: 'participant-123',
                questionUid: 'question-1',
                answer: 'option-B',
                timeSpent: 5000
            };
            const mockError = new Error('Database error');
            prisma_1.prisma.gameParticipant.findFirst.mockRejectedValue(mockError);
            const result = await gameParticipantService.submitAnswer("game-123", participantId, answerData);
            expect(result.success).toBe(false);
            expect(result.error).toMatch(/error/i);
        });
    });
    describe('getParticipantById', () => {
        it('should return participant with game and user info', async () => {
            const participantId = 'participant-123';
            const mockParticipant = {
                id: participantId,
                gameInstanceId: 'game-123',
                userId: 'player-123',
                score: 200,
                answers: [],
                user: { username: 'testplayer', avatarEmoji: 'avatar.png' },
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
                include: expect.objectContaining({ user: true })
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
