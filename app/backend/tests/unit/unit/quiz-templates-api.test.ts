require('../../../tests/setupTestEnv');

import { jest } from '@jest/globals';
import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { app } from '@/server';
import { GameTemplateService } from '@/core/services/gameTemplateService';

// Import the testing injection function
import { __setGameTemplateServiceForTesting } from '../../../src/api/v1/quizTemplates';

// Mock services
jest.mock('@/core/services/gameTemplateService');
jest.mock('jsonwebtoken');
jest.mock('@/db/prisma');

// Mock jsonwebtoken
const mockJwt = jest.mocked(require('jsonwebtoken'));
mockJwt.verify.mockImplementation((token: string) => {
    if (token === 'jwt-teacher-token') {
        return { userId: 'teacher-123', role: 'TEACHER' };
    }
    if (token === 'jwt-student-token') {
        return { userId: 'student-123', role: 'STUDENT' };
    }
    if (token === 'jwt-other-teacher-token') {
        return { userId: 'other-teacher-123', role: 'TEACHER' };
    }
    throw new Error('Invalid token');
});
mockJwt.sign.mockReturnValue('mock-jwt-token');

// Mock Prisma
const mockPrisma = jest.mocked(require('@/db/prisma'));
mockPrisma.prisma = {
    user: {
        findUnique: jest.fn().mockImplementation((query: any) => {
            if (query.where.id === 'teacher-123') {
                return Promise.resolve({
                    id: 'teacher-123',
                    username: 'testteacher',
                    role: 'TEACHER'
                });
            }
            if (query.where.id === 'student-123') {
                return Promise.resolve({
                    id: 'student-123',
                    username: 'teststudent',
                    role: 'STUDENT'
                });
            }
            if (query.where.id === 'other-teacher-123') {
                return Promise.resolve({
                    id: 'other-teacher-123',
                    username: 'othertteacher',
                    role: 'TEACHER'
                });
            }
            return Promise.resolve(null);
        })
    }
} as any;

const mockGameTemplateService = GameTemplateService as jest.MockedClass<typeof GameTemplateService>;

describe('Quiz Templates API - Quiz Template Management', () => {
    let gameTemplateServiceInstance: jest.Mocked<GameTemplateService>;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Create mock instance
        gameTemplateServiceInstance = {
            creategameTemplate: jest.fn(),
            getgameTemplateById: jest.fn(),
            getgameTemplates: jest.fn(),
            updategameTemplate: jest.fn(),
            deletegameTemplate: jest.fn(),
            addQuestionTogameTemplate: jest.fn(),
            removeQuestionFromgameTemplate: jest.fn(),
            updateQuestionSequence: jest.fn(),
            createStudentGameTemplate: jest.fn()
        } as any;

        // Set up the mock implementation
        mockGameTemplateService.mockImplementation(() => gameTemplateServiceInstance);

        // Inject the mock service into the API module
        __setGameTemplateServiceForTesting(gameTemplateServiceInstance);
    });

    describe('POST /api/v1/quiz-templates - Create Quiz Template', () => {
        const mockTemplateData = {
            name: 'Test Quiz Template',
            gradeLevel: 'CM1',
            themes: ['addition', 'soustraction'],
            discipline: 'Mathématiques',
            description: 'A test quiz template',
            defaultMode: 'quiz',
            questionUids: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001']
        };

        const mockResponse = {
            id: 'template-123',
            name: 'Test Quiz Template',
            gradeLevel: 'CM1',
            themes: ['addition', 'soustraction'],
            discipline: 'Mathématiques',
            description: 'A test quiz template',
            defaultMode: 'quiz' as const,
            creatorId: 'teacher-123',
            createdAt: new Date('2025-09-12T07:35:14.311Z'),
            updatedAt: new Date('2025-09-12T07:35:14.311Z'),
            questions: []
        };

        it('should create quiz template successfully', async () => {
            gameTemplateServiceInstance.creategameTemplate.mockResolvedValue(mockResponse);

            const response = await request(app)
                .post('/api/v1/quiz-templates')
                .set('Cookie', ['teacherToken=jwt-teacher-token'])
                .send(mockTemplateData)
                .expect(201);

            expect(gameTemplateServiceInstance.creategameTemplate).toHaveBeenCalledWith('teacher-123', mockTemplateData);
            expect(response.body).toEqual({
                gameTemplate: {
                    ...mockResponse,
                    createdAt: '2025-09-12T07:35:14.311Z',
                    updatedAt: '2025-09-12T07:35:14.311Z'
                }
            });
        });

        it('should return 401 when student token provided', async () => {
            const response = await request(app)
                .post('/api/v1/quiz-templates')
                .set('Cookie', ['authToken=jwt-student-token'])
                .send(mockTemplateData)
                .expect(401);

            expect(response.body).toEqual({
                error: 'Authentication required'
            });
        });

        it('should return 400 when validation fails', async () => {
            const invalidData = {
                name: '',
                themes: [],
                discipline: 'Mathématiques',
                questionUids: []
            };

            const response = await request(app)
                .post('/api/v1/quiz-templates')
                .set('Cookie', ['teacherToken=jwt-teacher-token'])
                .send(invalidData)
                .expect(400);

            expect(response.body.error).toBe('Invalid request data');
            expect(response.body.success).toBe(false);
        });

        it('should return 500 when service throws error', async () => {
            gameTemplateServiceInstance.creategameTemplate.mockRejectedValue(new Error('Service error'));

            const response = await request(app)
                .post('/api/v1/quiz-templates')
                .set('Cookie', ['teacherToken=jwt-teacher-token'])
                .send(mockTemplateData)
                .expect(500);

            expect(response.body).toEqual({
                error: 'An error occurred while creating the quiz template'
            });
        });
    });
});
