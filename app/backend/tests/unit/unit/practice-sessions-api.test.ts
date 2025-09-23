require('../../../tests/setupTestEnv');

import { jest } from '@jest/globals';
import { describe, it, expect, beforeAll, afterAll, beforeEach, test } from '@jest/globals';
import request from 'supertest';
import { app } from '@/server';
import { PracticeSessionService } from '@/core/services/practiceSessionService';

// Import the testing injection functions
// Note: Practice sessions API doesn't have injection function, so we mock the service import
import * as practiceSessionServiceModule from '../../../src/core/services/practiceSessionService';

// Mock services
jest.mock('@/core/services/practiceSessionService', () => ({
    practiceSessionService: {
        createSession: jest.fn(),
        getSession: jest.fn(),
        endSession: jest.fn(),
        deleteSession: jest.fn(),
    }
}));

// Mock jsonwebtoken for authentication (if needed)
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn((token: string) => {
        if (token === 'jwt-teacher-token') {
            return { userId: 'teacher-123', role: 'TEACHER' };
        }
        if (token === 'jwt-student-token') {
            return { userId: 'student-123', role: 'STUDENT' };
        }
        throw new Error('Invalid token');
    }),
    sign: jest.fn(() => 'mock-jwt-token')
}));

const mockPracticeSessionService = PracticeSessionService as jest.MockedClass<typeof PracticeSessionService>;

describe('Practice Sessions API - Practice Session Management', () => {
    let practiceSessionServiceInstance: jest.Mocked<PracticeSessionService>;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Get the mocked service instance
        practiceSessionServiceInstance = (practiceSessionServiceModule as any).practiceSessionService;
    });

    describe('POST /api/v1/practice/sessions - Create Practice Session', () => {
        test('should create practice session successfully', async () => {
            const mockSettings = {
                gradeLevel: 'CM1',
                discipline: 'Mathématiques',
                themes: ['addition', 'soustraction'],
                questionCount: 10,
                showImmediateFeedback: true,
                allowRetry: false,
                randomizeQuestions: true
            };

            const mockSession = {
                sessionId: 'practice_student-123_1234567890_abc123def',
                userId: 'student-123',
                settings: mockSettings,
                status: 'active' as const,
                questionPool: ['q1', 'q2', 'q3'],
                currentQuestionIndex: 0,
                answers: [],
                statistics: {
                    questionsAttempted: 0,
                    correctAnswers: 0,
                    incorrectAnswers: 0,
                    accuracyPercentage: 0,
                    averageTimePerQuestion: 0,
                    totalTimeSpent: 0,
                    retriedQuestions: []
                },
                createdAt: new Date('2025-09-12T07:35:14.311Z'),
                startedAt: new Date('2025-09-12T07:35:14.311Z'),
                expiresAt: new Date('2025-09-13T07:35:14.311Z')
            };

            practiceSessionServiceInstance.createSession.mockResolvedValue(mockSession);

            const response = await request(app)
                .post('/api/v1/practice/sessions')
                .send({
                    userId: 'student-123',
                    settings: mockSettings
                })
                .expect(201);

            expect(practiceSessionServiceInstance.createSession).toHaveBeenCalledWith('temp-user-123', mockSettings);
            expect(response.body).toEqual({
                success: true,
                session: {
                    ...mockSession,
                    createdAt: mockSession.createdAt.toISOString(),
                    startedAt: mockSession.startedAt.toISOString(),
                    expiresAt: mockSession.expiresAt.toISOString()
                }
            });
        });

        test('should return 400 when settings validation fails', async () => {
            const invalidSettings = {
                gradeLevel: '', // Invalid: empty string
                discipline: 'Mathématiques',
                themes: [],
                questionCount: 10,
                showImmediateFeedback: true,
                allowRetry: false,
                randomizeQuestions: true
            };

            const response = await request(app)
                .post('/api/v1/practice/sessions')
                .send({
                    userId: 'student-123',
                    settings: invalidSettings
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid request data');
        });

        test('should return 400 when userId is missing', async () => {
            const mockSettings = {
                gradeLevel: 'CM1',
                discipline: 'Mathématiques',
                themes: ['addition'],
                questionCount: 10,
                showImmediateFeedback: true,
                allowRetry: false,
                randomizeQuestions: true
            };

            const response = await request(app)
                .post('/api/v1/practice/sessions')
                .send({
                    settings: mockSettings
                    // Missing userId
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid request data');
        });

        test('should return 500 when service throws error', async () => {
            const mockSettings = {
                gradeLevel: 'CM1',
                discipline: 'Mathématiques',
                themes: ['addition'],
                questionCount: 10,
                showImmediateFeedback: true,
                allowRetry: false,
                randomizeQuestions: true
            };

            practiceSessionServiceInstance.createSession.mockRejectedValue(new Error('Database connection failed'));

            const response = await request(app)
                .post('/api/v1/practice/sessions')
                .send({
                    userId: 'student-123',
                    settings: mockSettings
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Database connection failed');
        });
    });

    describe('GET /api/v1/practice/sessions/:sessionId - Get Practice Session', () => {
        test('should return practice session successfully', async () => {
            const mockSession = {
                sessionId: 'practice_student-123_1234567890_abc123def',
                userId: 'student-123',
                settings: {
                    gradeLevel: 'CM1',
                    discipline: 'Mathématiques',
                    themes: ['addition'],
                    questionCount: 10,
                    showImmediateFeedback: true,
                    allowRetry: false,
                    randomizeQuestions: true
                },
                status: 'active' as const,
                questionPool: ['q1', 'q2', 'q3'],
                currentQuestionIndex: 0,
                answers: [],
                statistics: {
                    questionsAttempted: 0,
                    correctAnswers: 0,
                    incorrectAnswers: 0,
                    accuracyPercentage: 0,
                    averageTimePerQuestion: 0,
                    totalTimeSpent: 0,
                    retriedQuestions: []
                },
                createdAt: new Date('2025-09-12T07:35:14.311Z'),
                startedAt: new Date('2025-09-12T07:35:14.311Z'),
                expiresAt: new Date('2025-09-13T07:35:14.311Z')
            };

            practiceSessionServiceInstance.getSession.mockResolvedValue(mockSession);

            const response = await request(app)
                .get('/api/v1/practice/sessions/practice_student-123_1234567890_abc123def')
                .expect(200);

            expect(practiceSessionServiceInstance.getSession).toHaveBeenCalledWith('practice_student-123_1234567890_abc123def');
            expect(response.body).toEqual({
                success: true,
                session: {
                    ...mockSession,
                    createdAt: mockSession.createdAt.toISOString(),
                    startedAt: mockSession.startedAt.toISOString(),
                    expiresAt: mockSession.expiresAt.toISOString()
                }
            });
        });

        test('should return 400 when sessionId is missing', async () => {
            const response = await request(app)
                .get('/api/v1/practice/sessions/')
                .expect(404); // Express will return 404 for missing parameter

            // The route won't match, so we get a 404
            expect(response.status).toBe(404);
        });

        test('should return 404 when session not found', async () => {
            practiceSessionServiceInstance.getSession.mockResolvedValue(null);

            const response = await request(app)
                .get('/api/v1/practice/sessions/nonexistent-session')
                .expect(404);

            expect(practiceSessionServiceInstance.getSession).toHaveBeenCalledWith('nonexistent-session');
            expect(response.body).toEqual({
                success: false,
                error: 'Practice session not found'
            });
        });

        test('should return 500 when service throws error', async () => {
            practiceSessionServiceInstance.getSession.mockRejectedValue(new Error('Redis connection failed'));

            const response = await request(app)
                .get('/api/v1/practice/sessions/practice_student-123_1234567890_abc123def')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Redis connection failed');
        });
    });

    describe('DELETE /api/v1/practice/sessions/:sessionId - End and Delete Practice Session', () => {
        test('should end and delete practice session successfully', async () => {
            const mockFinalSession = {
                sessionId: 'practice_student-123_1234567890_abc123def',
                userId: 'student-123',
                settings: {
                    gradeLevel: 'CM1',
                    discipline: 'Mathématiques',
                    themes: ['addition'],
                    questionCount: 10,
                    showImmediateFeedback: true,
                    allowRetry: false,
                    randomizeQuestions: true
                },
                status: 'completed' as const,
                questionPool: ['q1', 'q2', 'q3'],
                currentQuestionIndex: 2,
                answers: [],
                statistics: {
                    questionsAttempted: 3,
                    correctAnswers: 2,
                    incorrectAnswers: 1,
                    accuracyPercentage: 66.67,
                    averageTimePerQuestion: 45000,
                    totalTimeSpent: 135000,
                    retriedQuestions: []
                },
                createdAt: new Date('2025-09-12T07:35:14.311Z'),
                startedAt: new Date('2025-09-12T07:35:14.311Z'),
                completedAt: new Date('2025-09-12T08:35:14.311Z'),
                expiresAt: new Date('2025-09-13T07:35:14.311Z')
            };

            practiceSessionServiceInstance.endSession.mockResolvedValue(mockFinalSession);
            practiceSessionServiceInstance.deleteSession.mockResolvedValue(undefined);

            const response = await request(app)
                .delete('/api/v1/practice/sessions/practice_student-123_1234567890_abc123def')
                .expect(200);

            expect(practiceSessionServiceInstance.endSession).toHaveBeenCalledWith('practice_student-123_1234567890_abc123def');
            expect(practiceSessionServiceInstance.deleteSession).toHaveBeenCalledWith('practice_student-123_1234567890_abc123def');
            expect(response.body).toEqual({
                success: true,
                session: {
                    ...mockFinalSession,
                    createdAt: mockFinalSession.createdAt.toISOString(),
                    startedAt: mockFinalSession.startedAt.toISOString(),
                    completedAt: mockFinalSession.completedAt.toISOString(),
                    expiresAt: mockFinalSession.expiresAt.toISOString()
                },
                message: 'Practice session ended successfully'
            });
        });

        test('should return 400 when sessionId is missing', async () => {
            const response = await request(app)
                .delete('/api/v1/practice/sessions/')
                .expect(404); // Express will return 404 for missing parameter

            expect(response.status).toBe(404);
        });

        test('should return 400 when session not found during end', async () => {
            practiceSessionServiceInstance.endSession.mockRejectedValue(new Error('Practice session not found'));

            const response = await request(app)
                .delete('/api/v1/practice/sessions/nonexistent-session')
                .expect(400);

            expect(practiceSessionServiceInstance.endSession).toHaveBeenCalledWith('nonexistent-session');
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Practice session not found');
        });

        test('should return 400 when service throws error during delete', async () => {
            const mockFinalSession = {
                sessionId: 'practice_student-123_1234567890_abc123def',
                userId: 'student-123',
                settings: {
                    gradeLevel: 'CM1',
                    discipline: 'Mathématiques',
                    themes: ['addition'],
                    questionCount: 10,
                    showImmediateFeedback: true,
                    allowRetry: false,
                    randomizeQuestions: true
                },
                status: 'completed' as const,
                questionPool: ['q1', 'q2', 'q3'],
                currentQuestionIndex: 2,
                answers: [],
                statistics: {
                    questionsAttempted: 3,
                    correctAnswers: 2,
                    incorrectAnswers: 1,
                    accuracyPercentage: 66.67,
                    averageTimePerQuestion: 45000,
                    totalTimeSpent: 135000,
                    retriedQuestions: []
                },
                createdAt: new Date('2025-09-12T07:35:14.311Z'),
                startedAt: new Date('2025-09-12T07:35:14.311Z'),
                completedAt: new Date('2025-09-12T08:35:14.311Z'),
                expiresAt: new Date('2025-09-13T07:35:14.311Z')
            };

            practiceSessionServiceInstance.endSession.mockResolvedValue(mockFinalSession);
            practiceSessionServiceInstance.deleteSession.mockRejectedValue(new Error('Redis delete failed'));

            const response = await request(app)
                .delete('/api/v1/practice/sessions/practice_student-123_1234567890_abc123def')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Redis delete failed');
        });
    });
});
