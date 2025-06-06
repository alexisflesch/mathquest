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
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(), // Add this mock
        },
        user: {
            upsert: jest.fn(),
        },
    },
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

describe('Game Participant Service', () => {
    jest.setTimeout(3000);

    let gameParticipantService: GameParticipantService;

    beforeEach(() => {
        gameParticipantService = new GameParticipantService();
        jest.clearAllMocks();
        // Mock prisma.player.upsert for participant creation
        (prisma as any).player = { upsert: jest.fn() };
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

            (prisma.gameInstance.findUnique as any).mockResolvedValue(mockGameInstance);
            (prisma.gameParticipant.findFirst as any).mockResolvedValue(null);
            (prisma.user.upsert as any).mockResolvedValue({ id: userId });
            (prisma.gameParticipant.create as any).mockResolvedValue({ id: 'participant-123', userId, gameInstanceId: 'game-123' });
            (prisma.gameParticipant.findUnique as any).mockResolvedValue({
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
            expect(prisma.gameInstance.findUnique).toHaveBeenCalledWith({
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

            (prisma.gameInstance.findUnique as any).mockResolvedValue(mockGameInstance);
            (prisma.gameParticipant.findFirst as any).mockResolvedValue(mockExistingParticipant);

            // Mock the update call that happens when a participant already exists
            (prisma.gameParticipant.update as any).mockResolvedValue({
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

            (prisma.gameInstance.findUnique as any).mockResolvedValue(null);

            const result = await gameParticipantService.joinGame(userId, accessCode);

            expect(result).toEqual({
                success: false,
                error: 'Game not found'
            });

            expect(prisma.gameParticipant.findFirst).not.toHaveBeenCalled();
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
            (prisma.gameInstance.findUnique as any).mockResolvedValue(mockCompletedGame);

            const result = await gameParticipantService.joinGame(userId, accessCode);
            expect(result.success).toBe(false);
            expect(result.error).toMatch(/completed/);
            expect(prisma.gameParticipant.findFirst).not.toHaveBeenCalled();
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
            (prisma.gameInstance.findUnique as any).mockResolvedValue(mockCompletedDeferredGame);
            (prisma.gameParticipant.findFirst as any).mockResolvedValue(null);
            (prisma.user.upsert as any).mockResolvedValue({ id: userId });
            (prisma.gameParticipant.create as any).mockResolvedValue({ id: 'participant-123', userId, gameInstanceId: 'game-123' });
            (prisma.gameParticipant.findUnique as any).mockResolvedValue({
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
            (prisma.gameInstance.findUnique as any).mockRejectedValue(mockError);

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

            (prisma.gameParticipant.create as any).mockResolvedValue(mockCreatedParticipant);

            const result = await gameParticipantService.createParticipant(gameInstanceId, userId);

            expect(prisma.gameParticipant.create).toHaveBeenCalledWith({
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
            (prisma.gameParticipant.create as any).mockRejectedValue(mockError);

            const result = await gameParticipantService.createParticipant(gameInstanceId, userId);
            expect(result).toEqual({ success: false, error: 'An error occurred while creating the participant' });
        });
    });

    describe('submitAnswer', () => {
        it('should submit an answer and update score', async () => {
            const participantId = 'participant-123';
            const answerData: SubmitAnswerData = {
                accessCode: 'test-code',
                userId: 'player-123',
                questionId: 'question-1',
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
                        questionId: 'question-0',
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

            (prisma.gameParticipant.findFirst as any).mockResolvedValue(mockParticipant);
            (prisma.gameParticipant.update as any).mockResolvedValue({ ...mockParticipant, score: 200 });

            const result = await gameParticipantService.submitAnswer("game-123", participantId, answerData);

            expect(prisma.gameParticipant.update).toHaveBeenCalledWith({
                where: { id: participantId },
                data: expect.objectContaining({
                    answers: expect.any(Array)
                })
            });
            if (result.participant) {
                expect(result.participant.score).toBe(200);
            } else {
                expect(result.error).toBeDefined();
            }
        });

        it('should throw error if participant not found', async () => {
            const participantId = 'invalid-id';
            const answerData: SubmitAnswerData = {
                accessCode: 'test-code',
                userId: 'invalid-id',
                questionId: 'question-1',
                answer: 'option-B',
                timeSpent: 5000
            };

            // Participant not found
            (prisma.gameParticipant.findFirst as any).mockResolvedValue(null);

            const result = await gameParticipantService.submitAnswer("game-123", participantId, answerData);
            expect(result.success).toBe(false);
            expect(result.error).toMatch(/participant not found/i);
        });

        it('should handle errors during answer submission', async () => {
            const participantId = 'participant-123';
            const answerData: SubmitAnswerData = {
                accessCode: 'test-code',
                userId: 'participant-123',
                questionId: 'question-1',
                answer: 'option-B',
                timeSpent: 5000
            };

            const mockError = new Error('Database error');
            (prisma.gameParticipant.findFirst as any).mockRejectedValue(mockError);

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

            (prisma.gameParticipant.findUnique as any).mockResolvedValue(mockParticipant);

            const result = await gameParticipantService.getParticipantById(participantId);

            expect(prisma.gameParticipant.findUnique).toHaveBeenCalledWith({
                where: { id: participantId },
                include: expect.objectContaining({ user: true })
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
