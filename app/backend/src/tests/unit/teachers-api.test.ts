require('../../../tests/setupTestEnv');

import { jest } from '@jest/globals';
import { describe, it, expect, beforeAll, afterAll, beforeEach, test } from '@jest/globals';
import request from 'supertest';
import { app } from '@/server';
import { UserService } from '@/core/services/userService';

// Import the testing injection functions
import { __setUserServiceForTesting as setTeachersUserService } from '../../../src/api/v1/teachers';

// Mock services
jest.mock('@/core/services/userService');

// Mock jsonwebtoken for authentication
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

// Mock Prisma
jest.mock('@/db/prisma');
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
            return Promise.resolve(null);
        })
    }
} as any;

const mockUserService = UserService as jest.MockedClass<typeof UserService>;

describe('Teachers API - Teacher Profile Management', () => {
    let userServiceInstance: jest.Mocked<UserService>;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Create mock instances
        userServiceInstance = {
            getUserById: jest.fn(),
        } as any;

        // Inject mock services
        setTeachersUserService(userServiceInstance);
    });

    describe('GET /api/v1/teachers/profile - Get Teacher Profile', () => {
        test('should return teacher profile successfully', async () => {
            const mockTeacherProfile = {
                id: 'teacher-123',
                username: 'teacheruser',
                email: 'teacher@example.com',
                role: 'TEACHER' as const,
                avatarEmoji: '👨‍🏫',
                createdAt: new Date('2025-09-12T07:35:14.311Z')
            };

            userServiceInstance.getUserById.mockResolvedValue(mockTeacherProfile);

            const response = await request(app)
                .get('/api/v1/teachers/profile')
                .set('Cookie', ['teacherToken=jwt-teacher-token'])
                .expect(200);

            expect(userServiceInstance.getUserById).toHaveBeenCalledWith('teacher-123');
            expect(response.body).toEqual({
                user: {
                    ...mockTeacherProfile,
                    createdAt: mockTeacherProfile.createdAt.toISOString()
                }
            });
        });

        test('should return 401 when no authentication provided', async () => {
            const response = await request(app)
                .get('/api/v1/teachers/profile')
                .expect(401);

            expect(response.body).toEqual({
                error: 'Authentication required'
            });
        });

        test('should return 401 when invalid token provided', async () => {
            const response = await request(app)
                .get('/api/v1/teachers/profile')
                .set('Cookie', ['teacherToken=invalid-token'])
                .expect(401);

            expect(response.body).toEqual({
                error: 'Invalid token'
            });
        });

        test('should return 404 when student token provided', async () => {
            const mockStudentProfile = {
                id: 'student-123',
                username: 'studentuser',
                email: 'student@example.com',
                role: 'STUDENT' as const,
                avatarEmoji: '👨‍🎓',
                createdAt: new Date('2025-09-12T07:35:14.311Z')
            };

            userServiceInstance.getUserById.mockResolvedValue(mockStudentProfile);

            const response = await request(app)
                .get('/api/v1/teachers/profile')
                .set('Cookie', ['teacherToken=jwt-student-token'])
                .expect(404);

            expect(userServiceInstance.getUserById).toHaveBeenCalledWith('student-123');
            expect(response.body).toEqual({
                error: 'Teacher not found'
            });
        });

        test('should return 404 when teacher not found', async () => {
            userServiceInstance.getUserById.mockResolvedValue(null);

            const response = await request(app)
                .get('/api/v1/teachers/profile')
                .set('Cookie', ['teacherToken=jwt-teacher-token'])
                .expect(404);

            expect(userServiceInstance.getUserById).toHaveBeenCalledWith('teacher-123');
            expect(response.body).toEqual({
                error: 'Teacher not found'
            });
        });

        test('should return 404 when user is not a teacher', async () => {
            const mockStudentProfile = {
                id: 'student-123',
                username: 'studentuser',
                email: 'student@example.com',
                role: 'STUDENT' as const,
                avatarEmoji: '🐻',
                createdAt: new Date('2025-09-12T07:35:14.311Z')
            };

            userServiceInstance.getUserById.mockResolvedValue(mockStudentProfile);

            const response = await request(app)
                .get('/api/v1/teachers/profile')
                .set('Cookie', ['teacherToken=jwt-teacher-token'])
                .expect(404);

            expect(userServiceInstance.getUserById).toHaveBeenCalledWith('teacher-123');
            expect(response.body).toEqual({
                error: 'Teacher not found'
            });
        });

        test('should handle service errors gracefully', async () => {
            userServiceInstance.getUserById.mockRejectedValue(new Error('Database connection failed'));

            const response = await request(app)
                .get('/api/v1/teachers/profile')
                .set('Cookie', ['teacherToken=jwt-teacher-token'])
                .expect(500);

            expect(userServiceInstance.getUserById).toHaveBeenCalledWith('teacher-123');
            expect(response.body).toEqual({
                error: 'An error occurred fetching the profile'
            });
        });
    });
});
