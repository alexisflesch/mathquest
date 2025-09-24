require('../../../tests/setupTestEnv');

import { jest } from '@jest/globals';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock external dependencies
jest.mock('../../../src/utils/logger', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    }))
}));

// Mock Redis config to prevent connection attempts
jest.mock('../../../src/config/redis', () => ({
    redisClient: {
        on: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn()
    }
}));

jest.mock('../../../src/core/services/gameStateService', () => ({
    __esModule: true,
    default: {
        getFullGameState: jest.fn(),
        setCurrentQuestion: jest.fn(),
        endCurrentQuestion: jest.fn(),
        getCanonicalTimer: jest.fn()
    },
    getCanonicalTimer: jest.fn()
}));

jest.mock('../../../src/sockets', () => ({
    getIO: jest.fn(() => ({
        to: jest.fn(() => ({
            emit: jest.fn()
        }))
    }))
}));

jest.mock('../../../src/db/prisma', () => ({
    prisma: {
        gameInstance: {
            findUnique: jest.fn(),
            update: jest.fn()
        },
        question: {
            findUnique: jest.fn()
        }
    }
}));

// Mock leaderboard snapshot service
jest.mock('../../../src/core/services/gameParticipant/leaderboardSnapshotService', () => ({
    getLeaderboardSnapshot: jest.fn()
}));

// Mock auth middleware with conditional logic
jest.mock('../../../src/middleware/auth', () => ({
    teacherAuth: jest.fn((req: any, res: any, next: any) => {
        // Extract user ID and role from headers
        const userId = req.headers['x-user-id'];
        const userRole = req.headers['x-user-role'];

        if (!userId) {
            console.log('Mock teacherAuth: No user ID, returning 401');
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (userRole !== 'TEACHER') {
            console.log(`Mock teacherAuth: User role '${userRole}' is not 'TEACHER', returning 403`);
            return res.status(403).json({ error: 'Teacher access required' });
        }

        console.log(`Mock teacherAuth: Success for user ${userId}`);
        req.user = {
            userId: userId,
            role: userRole
        };
        next();
    }),
    optionalAuth: jest.fn((req: any, res: any, next: any) => {
        // Extract user ID and role from headers
        const userId = req.headers['x-user-id'];
        const userRole = req.headers['x-user-role'];

        if (userId && userRole) {
            console.log(`Mock optionalAuth: Setting user ${userId}`);
            req.user = {
                userId: userId,
                role: userRole
            };
        } else {
            console.log('Mock optionalAuth: No auth headers, proceeding without user');
            req.user = null;
        }
        next();
    })
}));

// Mock validation middleware
jest.mock('../../../src/middleware/validation', () => ({
    validateRequestBody: jest.fn(() => (req: any, res: any, next: any) => next())
}));

// Import shared types
import type { GameInstance, GameTemplate, PlayMode } from '../../../../shared/types/core';

// Import app, prisma, and services
import { app } from '../../../src/server';
import { prisma } from '../../../src/db/prisma';
import gameStateService from '../../../src/core/services/gameStateService';

describe('Game Control API', () => {
    let mockPrisma: jest.Mocked<typeof prisma>;
    let mockGameStateService: jest.Mocked<typeof gameStateService>;

    beforeAll(async () => {
        // App is already configured from server.ts
    });

    afterAll(async () => {
        // No server to close since we're using the exported app
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma = prisma as jest.Mocked<typeof prisma>;
        mockGameStateService = gameStateService as jest.Mocked<typeof gameStateService>;
    });

    describe('GET /api/v1/game-control/:accessCode', () => {
        it('should return game state successfully', async () => {
            const mockGameInstance: GameInstance = {
                id: 'game-123',
                name: 'Test Game',
                createdAt: new Date(),
                accessCode: 'ABC123',
                status: 'ACTIVE' as const,
                playMode: 'quiz' as PlayMode,
                leaderboard: {},
                currentQuestionIndex: 0,
                settings: {},
                startedAt: null,
                endedAt: null,
                differedAvailableFrom: null,
                differedAvailableTo: null,
                gameTemplateId: 'template-123',
                initiatorUserId: 'teacher-123'
            };

            const mockGameState = {
                gameState: {
                    gameId: 'game-123',
                    accessCode: 'ABC123',
                    status: 'active' as const,
                    currentQuestionIndex: 0,
                    questionUids: ['q1', 'q2'],
                    startedAt: Date.now(),
                    answersLocked: false,
                    gameMode: 'quiz' as PlayMode,
                    linkedQuizId: 'template-123',
                    settings: {
                        timeMultiplier: 1.0,
                        showLeaderboard: true
                    }
                },
                participants: [],
                answers: {},
                leaderboard: []
            };

            mockPrisma.gameInstance.findUnique.mockResolvedValue(mockGameInstance as any);
            mockGameStateService.getFullGameState.mockResolvedValue(mockGameState);

            const response = await request(app)
                .get('/api/v1/game-control/ABC123')
                .set('x-user-id', 'teacher-123')
                .set('x-user-role', 'TEACHER')
                .expect(200);

            expect(mockPrisma.gameInstance.findUnique).toHaveBeenCalledWith({
                where: { accessCode: 'ABC123' }
            });
            expect(mockGameStateService.getFullGameState).toHaveBeenCalledWith('ABC123');
            expect(response.body).toEqual({ gameState: mockGameState });
        });

        it('should return 404 when game not found', async () => {
            mockPrisma.gameInstance.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .get('/api/v1/game-control/INVALID')
                .set('x-user-id', 'teacher-123')
                .set('x-user-role', 'TEACHER')
                .expect(404);

            expect(response.body).toEqual({
                error: 'Game not found'
            });
        });

        it('should return 403 when user is not the game owner', async () => {
            const mockGameInstance = {
                id: 'game-123',
                name: 'Test Game',
                createdAt: new Date(),
                accessCode: 'ABC123',
                status: 'ACTIVE' as const,
                playMode: 'quiz' as PlayMode,
                leaderboard: {},
                currentQuestionIndex: 0,
                settings: {},
                startedAt: null,
                endedAt: null,
                differedAvailableFrom: null,
                differedAvailableTo: null,
                gameTemplateId: 'template-123',
                initiatorUserId: 'other-teacher'
            };

            mockPrisma.gameInstance.findUnique.mockResolvedValue(mockGameInstance as any);

            const response = await request(app)
                .get('/api/v1/game-control/ABC123')
                .set('x-user-id', 'teacher-123')
                .set('x-user-role', 'TEACHER')
                .expect(403);

            expect(response.body).toEqual({
                error: 'You do not have permission to access this game'
            });
        });

        it('should return 500 when service throws error', async () => {
            const mockGameInstance: GameInstance = {
                id: 'game-123',
                name: 'Test Game',
                createdAt: new Date(),
                accessCode: 'ABC123',
                status: 'ACTIVE' as const,
                playMode: 'quiz' as PlayMode,
                leaderboard: {},
                currentQuestionIndex: 0,
                settings: {},
                startedAt: null,
                endedAt: null,
                differedAvailableFrom: null,
                differedAvailableTo: null,
                gameTemplateId: 'template-123',
                initiatorUserId: 'teacher-123'
            };

            mockPrisma.gameInstance.findUnique.mockResolvedValue(mockGameInstance as any);
            mockGameStateService.getFullGameState.mockRejectedValue(new Error('Service error'));

            const response = await request(app)
                .get('/api/v1/game-control/ABC123')
                .set('x-user-id', 'teacher-123')
                .set('x-user-role', 'TEACHER')
                .expect(500);

            expect(response.body).toEqual({
                error: 'An error occurred while fetching game state'
            });
        });
    });

    describe('POST /api/v1/game-control/:accessCode/question', () => {
        it('should set question successfully', async () => {
            const mockGameInstance: GameInstance = {
                id: 'game-123',
                name: 'Test Game',
                createdAt: new Date(),
                accessCode: 'ABC123',
                status: 'ACTIVE' as const,
                playMode: 'quiz' as PlayMode,
                leaderboard: {},
                currentQuestionIndex: 0,
                settings: {},
                startedAt: null,
                endedAt: null,
                differedAvailableFrom: null,
                differedAvailableTo: null,
                gameTemplateId: 'template-123',
                initiatorUserId: 'teacher-123'
            };

            const mockUpdatedGameState = {
                gameId: 'game-123',
                accessCode: 'ABC123',
                status: 'active' as const,
                currentQuestionIndex: 0,
                questionUids: ['q1', 'q2'],
                startedAt: Date.now(),
                answersLocked: false,
                gameMode: 'quiz' as PlayMode,
                linkedQuizId: 'template-123',
                settings: {
                    timeMultiplier: 1.0,
                    showLeaderboard: true
                },
                questionData: {
                    uid: 'q1',
                    text: 'What is 2+2?',
                    questionType: 'multiple_choice_single_answer' as const
                }
            };

            mockPrisma.gameInstance.findUnique.mockResolvedValue(mockGameInstance as any);
            mockGameStateService.setCurrentQuestion.mockResolvedValue(mockUpdatedGameState);

            const response = await request(app)
                .post('/api/v1/game-control/ABC123/question')
                .set('x-user-id', 'teacher-123')
                .set('x-user-role', 'TEACHER')
                .send({
                    questionIndex: 0
                })
                .expect(200);

            expect(mockGameStateService.setCurrentQuestion).toHaveBeenCalledWith('ABC123', 0);
            expect(response.body).toEqual({
                success: true,
                questionIndex: 0,
                questionUid: 'q1',
                timer: undefined
            });
        });

        it('should return 400 when questionIndex is missing', async () => {
            const mockGameInstance: GameInstance = {
                id: 'game-123',
                name: 'Test Game',
                createdAt: new Date(),
                accessCode: 'ABC123',
                status: 'ACTIVE' as const,
                playMode: 'quiz' as PlayMode,
                leaderboard: {},
                currentQuestionIndex: 0,
                settings: {},
                startedAt: null,
                endedAt: null,
                differedAvailableFrom: null,
                differedAvailableTo: null,
                gameTemplateId: 'template-123',
                initiatorUserId: 'teacher-123'
            };

            mockPrisma.gameInstance.findUnique.mockResolvedValue(mockGameInstance as any);

            const response = await request(app)
                .post('/api/v1/game-control/ABC123/question')
                .set('x-user-id', 'teacher-123')
                .set('x-user-role', 'TEACHER')
                .send({})
                .expect(400);

            expect(response.body).toEqual({
                error: 'Valid questionIndex is required'
            });
        });

        it('should return 404 when game not found', async () => {
            mockPrisma.gameInstance.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/v1/game-control/INVALID/question')
                .set('x-user-id', 'teacher-123')
                .set('x-user-role', 'TEACHER')
                .send({
                    questionIndex: 0
                })
                .expect(404);

            expect(response.body).toEqual({
                error: 'Game not found'
            });
        });

        it('should return 403 when user is not the game owner', async () => {
            const mockGameInstance: GameInstance = {
                id: 'game-123',
                name: 'Test Game',
                createdAt: new Date(),
                accessCode: 'ABC123',
                status: 'ACTIVE' as const,
                playMode: 'quiz' as PlayMode,
                leaderboard: {},
                currentQuestionIndex: 0,
                settings: {},
                startedAt: null,
                endedAt: null,
                differedAvailableFrom: null,
                differedAvailableTo: null,
                gameTemplateId: 'template-123',
                initiatorUserId: 'other-teacher'
            };

            mockPrisma.gameInstance.findUnique.mockResolvedValue(mockGameInstance as any);

            const response = await request(app)
                .post('/api/v1/game-control/ABC123/question')
                .set('x-user-id', 'teacher-123')
                .set('x-user-role', 'TEACHER')
                .send({
                    questionIndex: 0
                })
                .expect(403);

            expect(response.body).toEqual({
                error: 'You do not have permission to control this game'
            });
        });

        it('should return 500 when service throws error', async () => {
            const mockGameInstance: GameInstance = {
                id: 'game-123',
                name: 'Test Game',
                createdAt: new Date(),
                accessCode: 'ABC123',
                status: 'ACTIVE' as const,
                playMode: 'quiz' as PlayMode,
                leaderboard: {},
                currentQuestionIndex: 0,
                settings: {},
                startedAt: null,
                endedAt: null,
                differedAvailableFrom: null,
                differedAvailableTo: null,
                gameTemplateId: 'template-123',
                initiatorUserId: 'teacher-123'
            };

            mockPrisma.gameInstance.findUnique.mockResolvedValue(mockGameInstance as any);
            mockGameStateService.setCurrentQuestion.mockRejectedValue(new Error('Service error'));

            const response = await request(app)
                .post('/api/v1/game-control/ABC123/question')
                .set('x-user-id', 'teacher-123')
                .set('x-user-role', 'TEACHER')
                .send({
                    questionIndex: 0
                })
                .expect(500);

            expect(response.body).toEqual({
                error: 'An error occurred while setting current question'
            });
        });
    });

    describe('POST /api/v1/game-control/:accessCode/end-question', () => {
        it('should end question successfully', async () => {
            const mockGameInstance: GameInstance = {
                id: 'game-123',
                name: 'Test Game',
                createdAt: new Date(),
                accessCode: 'ABC123',
                status: 'ACTIVE' as const,
                playMode: 'quiz' as PlayMode,
                leaderboard: {},
                currentQuestionIndex: 0,
                settings: {},
                startedAt: null,
                endedAt: null,
                differedAvailableFrom: null,
                differedAvailableTo: null,
                gameTemplateId: 'template-123',
                initiatorUserId: 'teacher-123'
            };

            const mockUpdatedGameState = {
                gameId: 'game-123',
                accessCode: 'ABC123',
                status: 'active' as const,
                currentQuestionIndex: 0,
                questionUids: ['q1', 'q2'],
                startedAt: Date.now(),
                answersLocked: false,
                gameMode: 'quiz' as PlayMode,
                linkedQuizId: 'template-123',
                settings: {
                    timeMultiplier: 1.0,
                    showLeaderboard: true
                }
            };

            const mockFullGameState = {
                gameState: mockUpdatedGameState,
                participants: [],
                answers: {},
                leaderboard: []
            };

            mockPrisma.gameInstance.findUnique.mockResolvedValue(mockGameInstance as any);
            mockGameStateService.endCurrentQuestion.mockResolvedValue(mockUpdatedGameState);
            mockGameStateService.getFullGameState.mockResolvedValue(mockFullGameState);

            const response = await request(app)
                .post('/api/v1/game-control/ABC123/end-question')
                .set('x-user-id', 'teacher-123')
                .set('x-user-role', 'TEACHER')
                .expect(200);

            expect(mockGameStateService.endCurrentQuestion).toHaveBeenCalledWith('ABC123');
            expect(mockGameStateService.getFullGameState).toHaveBeenCalledWith('ABC123');
            expect(response.body).toEqual({
                success: true,
                questionIndex: 0,
                gameState: mockFullGameState
            });
        });

        it('should return 404 when game not found', async () => {
            mockPrisma.gameInstance.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/v1/game-control/INVALID/end-question')
                .set('x-user-id', 'teacher-123')
                .set('x-user-role', 'TEACHER')
                .expect(404);

            expect(response.body).toEqual({
                error: 'Game not found'
            });
        });

        it('should return 403 when user is not the game owner', async () => {
            const mockGameInstance: GameInstance = {
                id: 'game-123',
                name: 'Test Game',
                createdAt: new Date(),
                accessCode: 'ABC123',
                status: 'ACTIVE' as const,
                playMode: 'quiz' as PlayMode,
                leaderboard: {},
                currentQuestionIndex: 0,
                settings: {},
                startedAt: null,
                endedAt: null,
                differedAvailableFrom: null,
                differedAvailableTo: null,
                gameTemplateId: 'template-123',
                initiatorUserId: 'other-teacher'
            };

            mockPrisma.gameInstance.findUnique.mockResolvedValue(mockGameInstance as any);

            const response = await request(app)
                .post('/api/v1/game-control/ABC123/end-question')
                .set('x-user-id', 'teacher-123')
                .set('x-user-role', 'TEACHER')
                .expect(403);

            expect(response.body).toEqual({
                error: 'You do not have permission to control this game'
            });
        });

        it('should return 500 when service throws error', async () => {
            const mockGameInstance: GameInstance = {
                id: 'game-123',
                name: 'Test Game',
                createdAt: new Date(),
                accessCode: 'ABC123',
                status: 'ACTIVE' as const,
                playMode: 'quiz' as PlayMode,
                leaderboard: {},
                currentQuestionIndex: 0,
                settings: {},
                startedAt: null,
                endedAt: null,
                differedAvailableFrom: null,
                differedAvailableTo: null,
                gameTemplateId: 'template-123',
                initiatorUserId: 'teacher-123'
            };

            mockPrisma.gameInstance.findUnique.mockResolvedValue(mockGameInstance as any);
            mockGameStateService.endCurrentQuestion.mockRejectedValue(new Error('Service error'));

            const response = await request(app)
                .post('/api/v1/game-control/ABC123/end-question')
                .set('x-user-id', 'teacher-123')
                .set('x-user-role', 'TEACHER')
                .expect(500);

            expect(response.body).toEqual({
                error: 'An error occurred while ending the question'
            });
        });
    });

    describe('POST /api/v1/game-control/:accessCode/end-game', () => {
        it('should end game successfully', async () => {
            const mockGameInstance: GameInstance = {
                id: 'game-123',
                name: 'Test Game',
                createdAt: new Date(),
                accessCode: 'ABC123',
                status: 'ACTIVE' as const,
                playMode: 'quiz' as PlayMode,
                leaderboard: {},
                currentQuestionIndex: 0,
                settings: {},
                startedAt: null,
                endedAt: null,
                differedAvailableFrom: null,
                differedAvailableTo: null,
                gameTemplateId: 'template-123',
                initiatorUserId: 'teacher-123'
            };

            const mockFullGameState = {
                gameState: {
                    gameId: 'game-123',
                    accessCode: 'ABC123',
                    status: 'completed' as const,
                    currentQuestionIndex: 1,
                    questionUids: ['q1', 'q2'],
                    startedAt: Date.now(),
                    answersLocked: false,
                    gameMode: 'quiz' as PlayMode,
                    linkedQuizId: 'template-123',
                    settings: {
                        timeMultiplier: 1.0,
                        showLeaderboard: true
                    }
                },
                participants: [],
                answers: {},
                leaderboard: []
            };

            mockPrisma.gameInstance.findUnique.mockResolvedValue(mockGameInstance as any);
            mockPrisma.gameInstance.update.mockResolvedValue(({
                ...mockGameInstance,
                status: 'completed' as const
            }) as any);
            mockGameStateService.getFullGameState.mockResolvedValue(mockFullGameState);

            const response = await request(app)
                .post('/api/v1/game-control/ABC123/end-game')
                .set('x-user-id', 'teacher-123')
                .set('x-user-role', 'TEACHER')
                .expect(200);

            expect(mockPrisma.gameInstance.update).toHaveBeenCalledWith({
                where: { id: 'game-123' },
                data: { status: 'completed' as const }
            });
            expect(mockGameStateService.getFullGameState).toHaveBeenCalledWith('ABC123');
            expect(response.body).toEqual({
                success: true,
                gameState: mockFullGameState
            });
        });

        it('should return 404 when game not found', async () => {
            mockPrisma.gameInstance.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/v1/game-control/INVALID/end-game')
                .set('x-user-id', 'teacher-123')
                .set('x-user-role', 'TEACHER')
                .expect(404);

            expect(response.body).toEqual({
                error: 'Game not found'
            });
        });

        it('should return 403 when user is not the game owner', async () => {
            const mockGameInstance: GameInstance = {
                id: 'game-123',
                name: 'Test Game',
                createdAt: new Date(),
                accessCode: 'ABC123',
                status: 'ACTIVE' as const,
                playMode: 'quiz' as PlayMode,
                leaderboard: {},
                currentQuestionIndex: 0,
                settings: {},
                startedAt: null,
                endedAt: null,
                differedAvailableFrom: null,
                differedAvailableTo: null,
                gameTemplateId: 'template-123',
                initiatorUserId: 'other-teacher'
            };

            mockPrisma.gameInstance.findUnique.mockResolvedValue(mockGameInstance as any);

            const response = await request(app)
                .post('/api/v1/game-control/ABC123/end-game')
                .set('x-user-id', 'teacher-123')
                .set('x-user-role', 'TEACHER')
                .expect(403);

            expect(response.body).toEqual({
                error: 'You do not have permission to control this game'
            });
        });

        it('should return 500 when service throws error', async () => {
            const mockGameInstance: GameInstance = {
                id: 'game-123',
                name: 'Test Game',
                createdAt: new Date(),
                accessCode: 'ABC123',
                status: 'ACTIVE' as const,
                playMode: 'quiz' as PlayMode,
                leaderboard: {},
                currentQuestionIndex: 0,
                settings: {},
                startedAt: null,
                endedAt: null,
                differedAvailableFrom: null,
                differedAvailableTo: null,
                gameTemplateId: 'template-123',
                initiatorUserId: 'teacher-123'
            };

            mockPrisma.gameInstance.findUnique.mockResolvedValue(mockGameInstance as any);
            mockPrisma.gameInstance.update.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .post('/api/v1/game-control/ABC123/end-game')
                .set('x-user-id', 'teacher-123')
                .set('x-user-role', 'TEACHER')
                .expect(500);

            expect(response.body).toEqual({
                error: 'An error occurred while ending the game'
            });
        });
    });
});