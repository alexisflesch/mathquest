require('../../../tests/setupTestEnv');

import { jest } from '@jest/globals';
import { describe, it, expect, beforeAll, afterAll, beforeEach, test } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Import the joinGame function
import { joinGame } from '../../core/services/gameParticipant/joinService';

// Mock the joinGame module
jest.mock('../../core/services/gameParticipant/joinService', () => ({
    joinGame: jest.fn()
}));

// Mock the logger BEFORE any other imports
jest.mock('../../utils/logger', () => ({
    __esModule: true,
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    },
    default: jest.fn(() => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    }))
}));

// Mock authentication middleware
jest.mock('../../middleware/auth', () => ({
    teacherAuth: (req: any, res: any, next: any) => {
        req.user = {
            userId: 'teacher-123',
            username: 'testteacher',
            role: 'TEACHER'
        };
        next();
    },
    optionalAuth: (req: any, res: any, next: any) => {
        req.user = {
            userId: 'teacher-123',
            username: 'testteacher',
            role: 'TEACHER'
        };
        next();
    }
}));

// Mock validation middleware
jest.mock('../../middleware/validation', () => ({
    validateRequestBody: () => (req: any, res: any, next: any) => next()
}));

import { GameInstanceService } from '../../core/services/gameInstanceService';
import { GameParticipantService } from '../../core/services/gameParticipantService';
import { __setGameInstanceServiceForTesting, __setGameParticipantServiceForTesting } from '../../api/v1/games';

// Import setupServer after mocks
const { setupServer } = require('../../server');

describe('Games API - Core Endpoints', () => {
    let app: express.Application;
    let httpServer: any;
    let mockGameInstanceService: jest.Mocked<GameInstanceService>;
    let mockGameParticipantService: jest.Mocked<GameParticipantService>;

    beforeAll(async () => {
        // Setup test server
        const serverSetup = setupServer(0);
        app = serverSetup.httpServer;
        httpServer = serverSetup.httpServer;

        // Create mock services
        mockGameInstanceService = {
            createGameInstanceUnified: jest.fn(),
            createGameInstance: jest.fn(),
            getGameInstanceByAccessCode: jest.fn(),
            getGameInstanceById: jest.fn(),
            updateGameStatus: jest.fn(),
            getTeacherActiveGames: jest.fn(),
            generateUniqueAccessCode: jest.fn(),
            deleteGameInstance: jest.fn(),
            updateGameInstance: jest.fn(),
            renameGameInstance: jest.fn(),
            getGameInstancesByTemplate: jest.fn(),
            canPlayDeferred: jest.fn()
        } as any;

        // Mock the joinGame function
        jest.mock('../../core/services/gameParticipant/joinService', () => ({
            joinGame: jest.fn()
        }));

        mockGameParticipantService = {
            createParticipant: jest.fn()
        } as any;

        // Inject mock services for testing
        __setGameInstanceServiceForTesting(mockGameInstanceService);
        __setGameParticipantServiceForTesting(mockGameParticipantService);

        // Wait for server to be ready
        await new Promise((resolve) => {
            httpServer.listen(0, () => resolve(null));
        });
    });

    afterAll(async () => {
        if (httpServer) {
            httpServer.close();
        }
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/v1/games - Create Game', () => {
        test('should create a game successfully', async () => {
            const mockGameInstance = {
                id: 'game-123',
                name: 'Test Game',
                accessCode: 'ABC123',
                status: 'waiting',
                playMode: 'quiz' as const,
                gameTemplateId: 'template-123',
                initiatorUserId: 'user-123',
                createdAt: new Date(),
                updatedAt: new Date(),
                differedAvailableFrom: null,
                differedAvailableTo: null,
                leaderboard: null,
                currentQuestionIndex: null,
                settings: null,
                startedAt: null,
                endedAt: null,
                gameTemplate: {
                    id: 'template-123',
                    name: 'Test Template',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    gradeLevel: null,
                    themes: [],
                    discipline: null,
                    description: null,
                    defaultMode: null,
                    creatorId: 'user-123'
                },
                participants: []
            }; mockGameInstanceService.createGameInstanceUnified.mockResolvedValue(mockGameInstance);

            const gameData = {
                name: 'Test Game',
                playMode: 'quiz',
                gameTemplateId: 'template-123'
            };

            const response = await request(app)
                .post('/api/v1/games')
                .send(gameData)
                .expect(201);

            expect(mockGameInstanceService.createGameInstanceUnified).toHaveBeenCalledWith({
                gameTemplateId: 'template-123',
                name: 'Test Game',
                playMode: 'quiz',
                initiatorUserId: 'teacher-123',
                settings: undefined
            });
            expect(response.body).toEqual({
                gameInstance: {
                    ...mockGameInstance,
                    createdAt: expect.any(String),
                    updatedAt: expect.any(String),
                    gameTemplate: {
                        ...mockGameInstance.gameTemplate,
                        createdAt: expect.any(String),
                        updatedAt: expect.any(String)
                    }
                }
            });
        });

        test('should handle service errors during game creation', async () => {
            mockGameInstanceService.createGameInstanceUnified.mockRejectedValue(new Error('Database error'));

            const gameData = {
                name: 'Test Game',
                playMode: 'quiz',
                gameTemplateId: 'template-123'
            };

            const response = await request(app)
                .post('/api/v1/games')
                .send(gameData)
                .expect(500);

            expect(response.body).toEqual({ error: 'An error occurred while creating the game instance' });
        });
    });

    describe('GET /api/v1/games/:accessCode - Get Game by Access Code', () => {
        test('should return game instance by access code', async () => {
            const mockGameInstance = {
                id: 'game-123',
                name: 'Test Game',
                accessCode: 'ABC123',
                status: 'waiting',
                playMode: 'quiz' as const,
                gameTemplateId: 'template-123',
                initiatorUserId: 'user-123',
                createdAt: new Date(),
                updatedAt: new Date(),
                differedAvailableFrom: null,
                differedAvailableTo: null,
                leaderboard: null,
                currentQuestionIndex: null,
                settings: null,
                startedAt: null,
                endedAt: null,
                gameTemplate: {
                    id: 'template-123',
                    name: 'Test Template',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    gradeLevel: null,
                    themes: [],
                    discipline: null,
                    description: null,
                    defaultMode: null,
                    creatorId: 'user-123',
                    questions: []
                },
                participants: []
            }; mockGameInstanceService.getGameInstanceByAccessCode.mockResolvedValue(mockGameInstance);

            const response = await request(app)
                .get('/api/v1/games/ABC123')
                .expect(200);

            expect(mockGameInstanceService.getGameInstanceByAccessCode).toHaveBeenCalledWith('ABC123', false);
            expect(response.body).toEqual({
                gameInstance: {
                    accessCode: 'ABC123',
                    playMode: 'quiz',
                    linkedQuizId: null,
                    status: 'waiting',
                    name: 'Test Game'
                }
            });
        });

        test('should return 404 for non-existent game', async () => {
            mockGameInstanceService.getGameInstanceByAccessCode.mockResolvedValue(null);

            const response = await request(app)
                .get('/api/v1/games/NONEXISTENT')
                .expect(404);

            expect(response.body).toEqual({ error: 'Game not found' });
        });
    });

    describe('POST /api/v1/games/:accessCode/join - Join Game', () => {
        test('should join game successfully', async () => {
            const mockJoinResult = {
                success: true,
                participantId: 'participant-123',
                gameId: 'game-123'
            };

            // Mock the joinGame function
            const mockJoinGame = joinGame as jest.MockedFunction<typeof joinGame>;
            mockJoinGame.mockResolvedValue({
                success: true,
                gameInstance: {
                    id: 'game-123',
                    name: 'Test Game',
                    status: 'waiting',
                    playMode: 'quiz' as const,
                    differedAvailableFrom: null,
                    differedAvailableTo: null,
                    gameTemplate: { name: 'Test Template' }
                },
                participant: {
                    id: 'participant-123',
                    userId: 'user-123',
                    gameInstanceId: 'game-123',
                    status: 'ACTIVE',
                    liveScore: 0,
                    deferredScore: 0,
                    nbAttempts: 1,
                    joinedAt: new Date(),
                    lastActiveAt: null,
                    completedAt: null,
                    user: {
                        id: 'user-123',
                        username: 'TestPlayer',
                        email: null,
                        passwordHash: null,
                        createdAt: new Date(),
                        role: 'STUDENT',
                        resetToken: null,
                        resetTokenExpiresAt: null,
                        avatarEmoji: null,
                        emailVerificationToken: null,
                        emailVerificationTokenExpiresAt: null,
                        emailVerified: false
                    }
                }
            });

            const joinData = {
                userId: 'user-123',
                username: 'TestPlayer',
                avatar: 'avatar1'
            };

            const response = await request(app)
                .post('/api/v1/games/ABC123/join')
                .send(joinData)
                .expect(200);

            expect(mockJoinGame).toHaveBeenCalledWith({
                userId: 'user-123',
                accessCode: 'ABC123',
                username: undefined,
                avatarEmoji: undefined
            });
            expect(response.body).toEqual({
                success: true,
                gameInstance: {
                    id: 'game-123',
                    name: 'Test Game',
                    accessCode: 'ABC123',
                    status: 'waiting',
                    playMode: 'quiz',
                    differedAvailableFrom: null,
                    differedAvailableTo: null,
                    gameTemplate: {
                        id: 'unknown',
                        name: 'Test Template',
                        createdAt: expect.any(String),
                        updatedAt: expect.any(String),
                        creatorId: 'unknown',
                        themes: []
                    },
                    gameTemplateId: 'unknown',
                    createdAt: expect.any(String)
                },
                participant: {
                    id: 'participant-123',
                    userId: 'user-123',
                    username: 'TestPlayer',
                    avatarEmoji: '🐼',
                    score: 0,
                    joinedAt: expect.any(String),
                    participationType: 'LIVE',
                    attemptCount: 1,
                    online: true
                }
            });
        });

        test('should handle join errors', async () => {
            // Mock the joinGame function
            const mockJoinGame = joinGame as jest.MockedFunction<typeof joinGame>;
            mockJoinGame.mockResolvedValue({
                success: false,
                error: 'Game is full'
            });

            const joinData = {
                userId: 'user-123',
                username: 'TestPlayer',
                avatar: 'avatar1'
            };

            const response = await request(app)
                .post('/api/v1/games/ABC123/join')
                .send(joinData)
                .expect(400);

            expect(response.body).toEqual({ error: 'Game is full' });
        });
    });

    describe('PUT /api/v1/games/:id/status - Update Game Status', () => {
        test('should update game status successfully', async () => {
            const mockUpdatedGame = {
                id: 'game-123',
                name: 'Test Game',
                accessCode: 'ABC123',
                status: 'active',
                playMode: 'quiz' as const,
                gameTemplateId: 'template-123',
                initiatorUserId: 'user-123',
                createdAt: new Date(),
                updatedAt: new Date(),
                differedAvailableFrom: null,
                differedAvailableTo: null,
                leaderboard: null,
                currentQuestionIndex: null,
                settings: null,
                startedAt: null,
                endedAt: null,
                gameTemplate: {
                    id: 'template-123',
                    name: 'Test Template',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    gradeLevel: null,
                    themes: [],
                    discipline: null,
                    description: null,
                    defaultMode: null,
                    creatorId: 'user-123'
                },
                participants: []
            }; mockGameInstanceService.getGameInstanceById.mockResolvedValue({
                id: 'game-123',
                name: 'Test Game',
                accessCode: 'ABC123',
                status: 'waiting',
                playMode: 'quiz' as const,
                gameTemplateId: 'template-123',
                initiatorUserId: 'teacher-123',
                createdAt: new Date(),
                differedAvailableFrom: null,
                differedAvailableTo: null,
                leaderboard: null,
                currentQuestionIndex: null,
                settings: null,
                startedAt: null,
                endedAt: null,
                gameTemplate: {
                    id: 'template-123',
                    name: 'Test Template',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    gradeLevel: null,
                    themes: [],
                    discipline: null,
                    description: null,
                    defaultMode: null,
                    creatorId: 'user-123'
                },
                participants: []
            });
            mockGameInstanceService.updateGameStatus.mockResolvedValue(mockUpdatedGame);

            const statusData = {
                status: 'active'
            };

            const response = await request(app)
                .put('/api/v1/games/game-123/status')
                .send(statusData)
                .expect(200);

            expect(mockGameInstanceService.updateGameStatus).toHaveBeenCalledWith('game-123', {
                status: 'active'
            });
            expect(response.body).toEqual({
                gameInstance: {
                    ...mockUpdatedGame,
                    createdAt: mockUpdatedGame.createdAt.toISOString(),
                    updatedAt: mockUpdatedGame.updatedAt.toISOString(),
                    gameTemplate: {
                        ...mockUpdatedGame.gameTemplate,
                        createdAt: mockUpdatedGame.gameTemplate.createdAt.toISOString(),
                        updatedAt: mockUpdatedGame.gameTemplate.updatedAt.toISOString()
                    }
                }
            });
        });
    });

    describe('GET /api/v1/games/teacher/active - Get Teacher Active Games', () => {
        test('should return teacher active games', async () => {
            const mockActiveGames = [
                {
                    id: 'game-123',
                    name: 'Test Game 1',
                    accessCode: 'ABC123',
                    status: 'waiting',
                    playMode: 'quiz' as const,
                    gameTemplateId: 'template-123',
                    initiatorUserId: 'user-123',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    differedAvailableFrom: null,
                    differedAvailableTo: null,
                    leaderboard: null,
                    currentQuestionIndex: null,
                    settings: null,
                    startedAt: null,
                    endedAt: null,
                    gameTemplate: { name: 'Test Template' },
                    participants: [{ id: 'participant-123' }]
                },
                {
                    id: 'game-456',
                    name: 'Test Game 2',
                    accessCode: 'DEF456',
                    status: 'active',
                    playMode: 'tournament' as const,
                    gameTemplateId: 'template-456',
                    initiatorUserId: 'user-123',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    differedAvailableFrom: null,
                    differedAvailableTo: null,
                    leaderboard: null,
                    currentQuestionIndex: null,
                    settings: null,
                    startedAt: null,
                    endedAt: null,
                    gameTemplate: { name: 'Test Template 2' },
                    participants: [{ id: 'participant-456' }]
                }
            ]; mockGameInstanceService.getTeacherActiveGames.mockResolvedValue(mockActiveGames);

            const response = await request(app)
                .get('/api/v1/games/teacher/active')
                .expect(200);

            expect(mockGameInstanceService.getTeacherActiveGames).toHaveBeenCalledWith('teacher-123');
            expect(response.body).toEqual({
                games: [
                    {
                        id: 'game-123',
                        name: 'Test Game 1',
                        accessCode: 'ABC123',
                        status: 'waiting',
                        playMode: 'quiz',
                        gameTemplateId: 'template-123',
                        initiatorUserId: 'user-123',
                        createdAt: expect.any(String),
                        updatedAt: expect.any(String),
                        differedAvailableFrom: null,
                        differedAvailableTo: null,
                        leaderboard: null,
                        currentQuestionIndex: null,
                        settings: null,
                        startedAt: null,
                        endedAt: null,
                        gameTemplate: { name: 'Test Template' },
                        participants: [{ id: 'participant-123' }]
                    },
                    {
                        id: 'game-456',
                        name: 'Test Game 2',
                        accessCode: 'DEF456',
                        status: 'active',
                        playMode: 'tournament',
                        gameTemplateId: 'template-456',
                        initiatorUserId: 'user-123',
                        createdAt: expect.any(String),
                        updatedAt: expect.any(String),
                        differedAvailableFrom: null,
                        differedAvailableTo: null,
                        leaderboard: null,
                        currentQuestionIndex: null,
                        settings: null,
                        startedAt: null,
                        endedAt: null,
                        gameTemplate: { name: 'Test Template 2' },
                        participants: [{ id: 'participant-456' }]
                    }
                ]
            });
        });
    });

    describe('DELETE /api/v1/games/:id - Delete Game', () => {
        test('should delete game successfully', async () => {
            mockGameInstanceService.getGameInstanceById.mockResolvedValue({
                id: 'game-123',
                name: 'Test Game',
                accessCode: 'ABC123',
                status: 'waiting',
                playMode: 'quiz' as const,
                gameTemplateId: 'template-123',
                initiatorUserId: 'teacher-123',
                createdAt: new Date(),
                differedAvailableFrom: null,
                differedAvailableTo: null,
                leaderboard: null,
                currentQuestionIndex: null,
                settings: null,
                startedAt: null,
                endedAt: null,
                gameTemplate: {
                    id: 'template-123',
                    name: 'Test Template',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    gradeLevel: null,
                    themes: [],
                    discipline: null,
                    description: null,
                    defaultMode: null,
                    creatorId: 'user-123'
                },
                participants: []
            });
            mockGameInstanceService.deleteGameInstance.mockResolvedValue();

            const response = await request(app)
                .delete('/api/v1/games/game-123')
                .expect(204);

            expect(mockGameInstanceService.deleteGameInstance).toHaveBeenCalledWith('teacher-123', 'game-123');
        });

        test('should return 404 for non-existent game deletion', async () => {
            mockGameInstanceService.getGameInstanceById.mockResolvedValue(null);
            mockGameInstanceService.deleteGameInstance.mockResolvedValue();

            const response = await request(app)
                .delete('/api/v1/games/game-123')
                .expect(404);

            expect(response.body).toEqual({ error: 'Game instance not found' });
        });
    });
});
