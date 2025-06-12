"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gameInstanceService_1 = require("@/core/services/gameInstanceService");
const prisma_1 = require("@/db/prisma");
const globals_1 = require("@jest/globals");
// Mock the prisma client
globals_1.jest.mock('@/db/prisma', () => ({
    prisma: {
        gameInstance: {
            create: globals_1.jest.fn(),
            findUnique: globals_1.jest.fn(),
            findFirst: globals_1.jest.fn(),
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
describe('GameInstanceService', () => {
    globals_1.jest.setTimeout(3000);
    let gameInstanceService;
    const mockuserId = 'teacher-123';
    beforeEach(() => {
        gameInstanceService = new gameInstanceService_1.GameInstanceService();
        globals_1.jest.clearAllMocks();
    });
    describe('createGameInstance', () => {
        it('should create a game instance successfully', async () => {
            const mockGameData = {
                name: 'Test Game',
                gameTemplateId: 'quiz-123',
                playMode: 'quiz',
                settings: { timeLimit: 30 }
            };
            const mockCreatedGame = {
                id: 'game-123',
                initiatorUserId: mockuserId, // was 
                accessCode: 'ABC123',
                status: 'pending',
                currentQuestionIndex: null,
                ...mockGameData,
                createdAt: new Date(),
                updatedAt: new Date(),
                gameTemplate: {
                    name: 'Test Quiz',
                    themes: ['algebra'],
                    discipline: 'math',
                    gradeLevel: '9'
                }
            };
            // Mock generateUniqueAccessCode to return a predictable value
            globals_1.jest.spyOn(gameInstanceService, 'generateUniqueAccessCode').mockResolvedValue('ABC123');
            // Mock prisma create call
            prisma_1.prisma.gameInstance.create.mockResolvedValue(mockCreatedGame);
            const result = await gameInstanceService.createGameInstance(mockuserId, mockGameData);
            expect(prisma_1.prisma.gameInstance.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    name: mockGameData.name,
                    gameTemplateId: mockGameData.gameTemplateId,
                    initiatorUserId: mockuserId, // was 
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
            const mockGameData = {
                name: 'Test Game',
                gameTemplateId: 'quiz-123',
                playMode: 'quiz'
            };
            const mockError = new Error('Database error');
            prisma_1.prisma.gameInstance.create.mockRejectedValue(mockError);
            await expect(gameInstanceService.createGameInstance(mockuserId, mockGameData)).rejects.toThrow(mockError);
        });
    });
    describe('getGameInstanceByAccessCode', () => {
        it('should return a game instance by access code', async () => {
            const mockAccessCode = 'ABC123';
            const mockGameInstance = {
                id: 'game-123',
                name: 'Test Game',
                accessCode: mockAccessCode,
                gameTemplate: { name: 'Test Quiz' }
            };
            prisma_1.prisma.gameInstance.findUnique.mockResolvedValue(mockGameInstance);
            const result = await gameInstanceService.getGameInstanceByAccessCode(mockAccessCode);
            expect(prisma_1.prisma.gameInstance.findUnique).toHaveBeenCalledWith({
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
                gameTemplate: { name: 'Test Quiz' },
                participants: [{ id: 'participant-1', player: { username: 'player1' } }]
            };
            prisma_1.prisma.gameInstance.findUnique.mockResolvedValue(mockGameWithParticipants);
            const result = await gameInstanceService.getGameInstanceByAccessCode(mockAccessCode, true);
            expect(prisma_1.prisma.gameInstance.findUnique).toHaveBeenCalledWith({
                where: { accessCode: mockAccessCode },
                include: expect.objectContaining({
                    participants: expect.any(Object)
                })
            });
            expect(result).toEqual(mockGameWithParticipants);
        });
        it('should handle errors when fetching game by access code', async () => {
            const mockError = new Error('Database error');
            prisma_1.prisma.gameInstance.findUnique.mockRejectedValue(mockError);
            await expect(gameInstanceService.getGameInstanceByAccessCode('ABC123')).rejects.toThrow(mockError);
        });
    });
    describe('getGameInstanceById', () => {
        it('should return a game instance by ID', async () => {
            const mockId = 'game-123';
            const mockGameInstance = {
                id: mockId,
                name: 'Test Game',
                gameTemplate: { name: 'Test Quiz' }
            };
            prisma_1.prisma.gameInstance.findUnique.mockResolvedValue(mockGameInstance);
            const result = await gameInstanceService.getGameInstanceById(mockId);
            expect(prisma_1.prisma.gameInstance.findUnique).toHaveBeenCalledWith({
                where: { id: mockId },
                include: expect.any(Object)
            });
            expect(result).toEqual(mockGameInstance);
        });
        it('should handle errors when fetching game by ID', async () => {
            const mockError = new Error('Database error');
            prisma_1.prisma.gameInstance.findUnique.mockRejectedValue(mockError);
            await expect(gameInstanceService.getGameInstanceById('game-123')).rejects.toThrow(mockError);
        });
    });
    describe('updateGameStatus', () => {
        it('should update game status', async () => {
            const gameId = 'game-123';
            const updateData = {
                status: 'active',
                currentQuestionIndex: 1
            };
            const mockUpdatedGame = {
                id: gameId,
                status: 'active',
                currentQuestionIndex: 1
            };
            prisma_1.prisma.gameInstance.update.mockResolvedValue(mockUpdatedGame);
            const result = await gameInstanceService.updateGameStatus(gameId, updateData);
            expect(prisma_1.prisma.gameInstance.update).toHaveBeenCalledWith({
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
            const updateData = {
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
            prisma_1.prisma.gameInstance.findUnique.mockResolvedValue({
                id: gameId,
                startedAt: null
            });
            prisma_1.prisma.gameInstance.update.mockResolvedValue(mockUpdatedGame);
            const result = await gameInstanceService.updateGameStatus(gameId, updateData);
            expect(prisma_1.prisma.gameInstance.update).toHaveBeenCalledWith({
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
            const updateData = {
                status: 'completed'
            };
            const mockUpdatedGame = {
                id: gameId,
                status: 'completed',
                endedAt: new Date()
            };
            prisma_1.prisma.gameInstance.update.mockResolvedValue(mockUpdatedGame);
            const result = await gameInstanceService.updateGameStatus(gameId, updateData);
            expect(prisma_1.prisma.gameInstance.update).toHaveBeenCalledWith({
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
            prisma_1.prisma.gameInstance.update.mockRejectedValue(mockError);
            await expect(gameInstanceService.updateGameStatus('game-123', { status: 'active' })).rejects.toThrow(mockError);
        });
    });
    describe('generateUniqueAccessCode', () => {
        it('should generate sequential access codes', async () => {
            // Mock that no existing codes found (start with 100000)
            prisma_1.prisma.gameInstance.findFirst.mockResolvedValue(null);
            const code = await gameInstanceService.generateUniqueAccessCode();
            expect(code).toBe('100000');
            expect(prisma_1.prisma.gameInstance.findFirst).toHaveBeenCalledWith({
                where: {
                    accessCode: {
                        regex: '^[0-9]{6}$'
                    }
                },
                orderBy: {
                    accessCode: 'desc'
                },
                select: {
                    accessCode: true
                }
            });
        });
        it('should increment from existing highest code', async () => {
            // Mock existing highest code
            prisma_1.prisma.gameInstance.findFirst.mockResolvedValue({ accessCode: '123456' });
            const code = await gameInstanceService.generateUniqueAccessCode();
            expect(code).toBe('123457');
        });
        it('should throw error if access code range exhausted', async () => {
            // Mock that maximum code already exists
            prisma_1.prisma.gameInstance.findFirst.mockResolvedValue({ accessCode: '999999' });
            await expect(gameInstanceService.generateUniqueAccessCode())
                .rejects.toThrow('Access code range exhausted');
        });
    });
    describe('getTeacherActiveGames', () => {
        it('should return active games for a teacher', async () => {
            const mockuserId = 'teacher-123';
            const mockGames = [
                { id: 'game-1', status: 'pending', name: 'Game 1', participants: [] },
                { id: 'game-2', status: 'active', name: 'Game 2', participants: [{ id: 'p1' }] }
            ];
            prisma_1.prisma.gameInstance.findMany.mockResolvedValue(mockGames);
            const result = await gameInstanceService.getTeacherActiveGames(mockuserId);
            expect(prisma_1.prisma.gameInstance.findMany).toHaveBeenCalledWith({
                where: {
                    initiatorUserId: mockuserId, // was 
                    status: { in: ['pending', 'active', 'paused'] }
                },
                include: expect.any(Object),
                orderBy: { createdAt: 'desc' }
            });
            expect(result).toEqual(mockGames);
        });
        it('should handle errors when fetching teacher games', async () => {
            const mockError = new Error('Database error');
            prisma_1.prisma.gameInstance.findMany.mockRejectedValue(mockError);
            await expect(gameInstanceService.getTeacherActiveGames('teacher-123')).rejects.toThrow(mockError);
        });
    });
});
