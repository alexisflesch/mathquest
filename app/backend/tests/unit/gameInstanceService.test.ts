import { GameInstanceService, GameInstanceCreationData, GameStatusUpdateData } from '@/core/services/gameInstanceService';
import { prisma } from '@/db/prisma';
import { jest } from '@jest/globals';

// Mock the prisma client
jest.mock('@/db/prisma', () => ({
    prisma: {
        gameInstance: {
            create: jest.fn(),
            findUnique: jest.fn(),
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

describe('GameInstanceService', () => {
    let gameInstanceService: GameInstanceService;
    const mockTeacherId = 'teacher-123';

    beforeEach(() => {
        gameInstanceService = new GameInstanceService();
        jest.clearAllMocks();
    });

    describe('createGameInstance', () => {
        it('should create a game instance successfully', async () => {
            const mockGameData: GameInstanceCreationData = {
                name: 'Test Game',
                quizTemplateId: 'quiz-123',
                playMode: 'class',
                settings: { timeLimit: 30 }
            };

            const mockCreatedGame = {
                id: 'game-123',
                initiatorTeacherId: mockTeacherId,
                accessCode: 'ABC123',
                status: 'pending',
                currentQuestionIndex: null,
                ...mockGameData,
                createdAt: new Date(),
                updatedAt: new Date(),
                quizTemplate: {
                    name: 'Test Quiz',
                    themes: ['algebra'],
                    discipline: 'math',
                    gradeLevel: '9'
                }
            };

            // Mock generateUniqueAccessCode to return a predictable value
            jest.spyOn(gameInstanceService, 'generateUniqueAccessCode').mockResolvedValue('ABC123');

            // Mock prisma create call
            (prisma.gameInstance.create as any).mockResolvedValue(mockCreatedGame);

            const result = await gameInstanceService.createGameInstance(mockTeacherId, mockGameData);

            expect(prisma.gameInstance.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    name: mockGameData.name,
                    quizTemplateId: mockGameData.quizTemplateId,
                    initiatorTeacherId: mockTeacherId,
                    accessCode: 'ABC123',
                    status: 'pending',
                    playMode: mockGameData.playMode,
                    settings: mockGameData.settings
                }),
                include: expect.any(Object)
            });

            expect(result).toEqual(mockCreatedGame);
        });

        it('should handle errors during game instance creation', async () => {
            const mockGameData: GameInstanceCreationData = {
                name: 'Test Game',
                quizTemplateId: 'quiz-123',
                playMode: 'class'
            };

            const mockError = new Error('Database error');
            (prisma.gameInstance.create as any).mockRejectedValue(mockError);

            await expect(gameInstanceService.createGameInstance(mockTeacherId, mockGameData)).rejects.toThrow(mockError);
        });
    });

    describe('getGameInstanceByAccessCode', () => {
        it('should return a game instance by access code', async () => {
            const mockAccessCode = 'ABC123';
            const mockGameInstance = {
                id: 'game-123',
                name: 'Test Game',
                accessCode: mockAccessCode,
                quizTemplate: { name: 'Test Quiz' }
            };

            (prisma.gameInstance.findUnique as any).mockResolvedValue(mockGameInstance);

            const result = await gameInstanceService.getGameInstanceByAccessCode(mockAccessCode);

            expect(prisma.gameInstance.findUnique).toHaveBeenCalledWith({
                where: { accessCode: mockAccessCode },
                include: expect.any(Object)
            });

            expect(result).toEqual(mockGameInstance);
        });

        it('should include participants when requested', async () => {
            const mockAccessCode = 'ABC123';
            const mockGameWithParticipants = {
                id: 'game-123',
                name: 'Test Game',
                accessCode: mockAccessCode,
                quizTemplate: { name: 'Test Quiz' },
                participants: [{ id: 'participant-1', player: { username: 'player1' } }]
            };

            (prisma.gameInstance.findUnique as any).mockResolvedValue(mockGameWithParticipants);

            const result = await gameInstanceService.getGameInstanceByAccessCode(mockAccessCode, true);

            expect(prisma.gameInstance.findUnique).toHaveBeenCalledWith({
                where: { accessCode: mockAccessCode },
                include: expect.objectContaining({
                    participants: expect.any(Object)
                })
            });

            expect(result).toEqual(mockGameWithParticipants);
        });

        it('should handle errors when fetching game by access code', async () => {
            const mockError = new Error('Database error');
            (prisma.gameInstance.findUnique as any).mockRejectedValue(mockError);

            await expect(gameInstanceService.getGameInstanceByAccessCode('ABC123')).rejects.toThrow(mockError);
        });
    });

    describe('getGameInstanceById', () => {
        it('should return a game instance by ID', async () => {
            const mockId = 'game-123';
            const mockGameInstance = {
                id: mockId,
                name: 'Test Game',
                quizTemplate: { name: 'Test Quiz' }
            };

            (prisma.gameInstance.findUnique as any).mockResolvedValue(mockGameInstance);

            const result = await gameInstanceService.getGameInstanceById(mockId);

            expect(prisma.gameInstance.findUnique).toHaveBeenCalledWith({
                where: { id: mockId },
                include: expect.any(Object)
            });

            expect(result).toEqual(mockGameInstance);
        });

        it('should handle errors when fetching game by ID', async () => {
            const mockError = new Error('Database error');
            (prisma.gameInstance.findUnique as any).mockRejectedValue(mockError);

            await expect(gameInstanceService.getGameInstanceById('game-123')).rejects.toThrow(mockError);
        });
    });

    describe('updateGameStatus', () => {
        it('should update game status', async () => {
            const gameId = 'game-123';
            const updateData: GameStatusUpdateData = {
                status: 'active',
                currentQuestionIndex: 1
            };

            const mockUpdatedGame = {
                id: gameId,
                status: 'active',
                currentQuestionIndex: 1
            };

            (prisma.gameInstance.update as any).mockResolvedValue(mockUpdatedGame);

            const result = await gameInstanceService.updateGameStatus(gameId, updateData);

            expect(prisma.gameInstance.update).toHaveBeenCalledWith({
                where: { id: gameId },
                data: expect.objectContaining({
                    status: updateData.status,
                    currentQuestionIndex: updateData.currentQuestionIndex
                })
            });

            expect(result).toEqual(mockUpdatedGame);
        });

        it('should set startedAt when first activating a game', async () => {
            const gameId = 'game-123';
            const updateData: GameStatusUpdateData = {
                status: 'active',
                currentQuestionIndex: 0 // First question
            };

            const mockUpdatedGame = {
                id: gameId,
                status: 'active',
                currentQuestionIndex: 0,
                startedAt: new Date()
            };

            // Mock that game doesn't have startedAt yet
            (prisma.gameInstance.findUnique as any).mockResolvedValue({
                id: gameId,
                startedAt: null
            });

            (prisma.gameInstance.update as any).mockResolvedValue(mockUpdatedGame);

            const result = await gameInstanceService.updateGameStatus(gameId, updateData);

            expect(prisma.gameInstance.update).toHaveBeenCalledWith({
                where: { id: gameId },
                data: expect.objectContaining({
                    status: 'active',
                    currentQuestionIndex: 0,
                    startedAt: expect.any(Date)
                })
            });

            expect(result).toEqual(mockUpdatedGame);
        });

        it('should set endedAt when completing a game', async () => {
            const gameId = 'game-123';
            const updateData: GameStatusUpdateData = {
                status: 'completed'
            };

            const mockUpdatedGame = {
                id: gameId,
                status: 'completed',
                endedAt: new Date()
            };

            (prisma.gameInstance.update as any).mockResolvedValue(mockUpdatedGame);

            const result = await gameInstanceService.updateGameStatus(gameId, updateData);

            expect(prisma.gameInstance.update).toHaveBeenCalledWith({
                where: { id: gameId },
                data: expect.objectContaining({
                    status: 'completed',
                    endedAt: expect.any(Date)
                })
            });

            expect(result).toEqual(mockUpdatedGame);
        });

        it('should handle errors when updating game status', async () => {
            const mockError = new Error('Database error');
            (prisma.gameInstance.update as any).mockRejectedValue(mockError);

            await expect(gameInstanceService.updateGameStatus('game-123', { status: 'active' })).rejects.toThrow(mockError);
        });
    });

    describe('generateUniqueAccessCode', () => {
        it('should generate a unique access code', async () => {
            // Mock that the first code is already taken, the second one is available
            (prisma.gameInstance.findUnique as any)
                .mockResolvedValueOnce({ id: 'existing-game' })
                .mockResolvedValueOnce(null);

            // Temporarily replace Math.random to make the test deterministic
            const originalMathRandom = Math.random;
            try {
                // First call to Math.random will generate a code that's already taken
                // Second call will generate an available code
                Math.random = jest.fn().mockImplementation(() => 0.1) as unknown as () => number;

                // We don't need to mock specific return values since we're just checking
                // the number of calls to findUnique

                // Call the method (don't need the actual result)
                await gameInstanceService.generateUniqueAccessCode();

                // Verify that findUnique was called twice (first code taken, second available)
                expect(prisma.gameInstance.findUnique).toHaveBeenCalledTimes(2);
            } finally {
                // Restore original Math.random
                Math.random = originalMathRandom;
            }
        });

        it('should throw error if unable to generate unique code', async () => {
            // Mock that all generated codes are already taken
            (prisma.gameInstance.findUnique as any).mockResolvedValue({ id: 'existing-game' });

            await expect(gameInstanceService.generateUniqueAccessCode()).rejects.toThrow('Unable to generate unique access code');
        });
    });

    describe('getTeacherActiveGames', () => {
        it('should return active games for a teacher', async () => {
            const mockTeacherId = 'teacher-123';
            const mockGames = [
                { id: 'game-1', status: 'pending', name: 'Game 1', participants: [] },
                { id: 'game-2', status: 'active', name: 'Game 2', participants: [{ id: 'p1' }] }
            ];

            (prisma.gameInstance.findMany as any).mockResolvedValue(mockGames);

            const result = await gameInstanceService.getTeacherActiveGames(mockTeacherId);

            expect(prisma.gameInstance.findMany).toHaveBeenCalledWith({
                where: {
                    initiatorTeacherId: mockTeacherId,
                    status: { in: ['pending', 'active', 'paused'] }
                },
                include: expect.any(Object),
                orderBy: { createdAt: 'desc' }
            });

            expect(result).toEqual(mockGames);
        });

        it('should handle errors when fetching teacher games', async () => {
            const mockError = new Error('Database error');
            (prisma.gameInstance.findMany as any).mockRejectedValue(mockError);

            await expect(gameInstanceService.getTeacherActiveGames('teacher-123')).rejects.toThrow(mockError);
        });
    });
});
