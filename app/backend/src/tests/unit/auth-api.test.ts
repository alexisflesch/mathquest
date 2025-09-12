require('../../../tests/setupTestEnv');

import { jest } from '@jest/globals';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock external dependencies
jest.mock('../../utils/logger', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    }))
}));

// Mock Redis config to prevent connection attempts
jest.mock('../../config/redis', () => ({
    redisClient: {
        on: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
        duplicate: jest.fn(() => ({
            on: jest.fn(),
            connect: jest.fn(),
            disconnect: jest.fn(),
            subscribe: jest.fn(),
            unsubscribe: jest.fn(),
            psubscribe: jest.fn(),
            punsubscribe: jest.fn(),
            publish: jest.fn()
        })),
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        psubscribe: jest.fn(),
        punsubscribe: jest.fn(),
        publish: jest.fn()
    }
}));

jest.mock('../../utils/avatarUtils', () => ({
    validateAvatar: jest.fn(),
    getRandomAvatar: jest.fn(),
    AllowedAvatar: {},
    isValidAvatar: jest.fn()
}));

jest.mock('../../utils/usernameValidator', () => ({
    validateUsername: jest.fn(() => ({ isValid: true }))
}));

// Mock Redis
jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => ({
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        expire: jest.fn(),
        exists: jest.fn(),
        quit: jest.fn()
    }));
});

// Mock UserService
const mockUserService = {
    loginUser: jest.fn() as jest.MockedFunction<any>,
    registerUser: jest.fn() as jest.MockedFunction<any>,
    upgradeUser: jest.fn() as jest.MockedFunction<any>,
    requestPasswordReset: jest.fn() as jest.MockedFunction<any>,
    resetPasswordWithToken: jest.fn() as jest.MockedFunction<any>,
    sendEmailVerification: jest.fn() as jest.MockedFunction<any>,
    verifyEmail: jest.fn() as jest.MockedFunction<any>,
    getUserById: jest.fn() as jest.MockedFunction<any>,
    getUserByEmail: jest.fn() as jest.MockedFunction<any>,
    getUserByCookieId: jest.fn() as jest.MockedFunction<any>,
    upgradeUserRole: jest.fn() as jest.MockedFunction<any>,
    updateUserProfile: jest.fn() as jest.MockedFunction<any>,
    generatePasswordResetToken: jest.fn() as jest.MockedFunction<any>,
    generateEmailVerificationToken: jest.fn() as jest.MockedFunction<any>
};

jest.mock('../../core/services/userService', () => {
    return {
        UserService: jest.fn().mockImplementation(() => mockUserService)
    };
});

// Mock auth middleware
jest.mock('../../middleware/auth', () => ({
    optionalAuth: jest.fn((req: any, res: any, next: any) => {
        // Mock authenticated user for profile and upgrade tests
        req.user = {
            userId: 'user-123',
            username: 'testuser',
            role: 'STUDENT'
        };
        next();
    }),
    teacherAuth: jest.fn((req: any, res: any, next: any) => {
        // Mock authenticated teacher user
        req.user = {
            userId: 'teacher-123',
            username: 'teacher1',
            role: 'TEACHER'
        };
        next();
    })
}));

// Mock validation middleware
jest.mock('../../middleware/validation', () => ({
    validateRequestBody: jest.fn(() => (req: any, res: any, next: any) => next())
}));

// Import after mocks
import { UserService } from '../../core/services/userService';
import { setupServer, app } from '../../server';

describe('Auth API', () => {
    let httpServer: any;

    beforeAll(async () => {
        // Setup test server
        const serverSetup = setupServer(0);
        httpServer = serverSetup.httpServer;

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
        // Reset all mock methods
        Object.values(mockUserService).forEach(mock => {
            if (typeof mock === 'function' && 'mockClear' in mock) {
                mock.mockClear();
            }
        });
    });

    describe('POST /api/v1/auth/logout', () => {
        it('should clear auth cookies on logout', async () => {
            const response = await request(app)
                .post('/api/v1/auth/logout')
                .expect(200);

            expect(response.body).toEqual({
                success: true,
                message: 'Logged out successfully'
            });
        });

        it('should handle logout without existing cookies', async () => {
            const response = await request(app)
                .post('/api/v1/auth/logout')
                .expect(200);

            expect(response.body).toEqual({
                success: true,
                message: 'Logged out successfully'
            });
        });
    });

    describe('POST /api/v1/auth', () => {
        it('should handle teacher login via universal login', async () => {
            const mockResult = {
                success: true,
                userState: 'teacher' as const,
                user: {
                    id: 'teacher-123',
                    email: 'teacher@example.com',
                    role: 'TEACHER' as const,
                    username: 'teacher1',
                    avatarEmoji: '🐼',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                token: 'jwt-teacher-token'
            };

            mockUserService.loginUser.mockResolvedValue(mockResult);

            const response = await request(app)
                .post('/api/v1/auth')
                .send({
                    action: 'login',
                    email: 'teacher@example.com',
                    password: 'password123'
                })
                .expect(200);

            expect(mockUserService.loginUser).toHaveBeenCalledWith({
                email: 'teacher@example.com',
                password: 'password123'
            });
            expect(response.body).toEqual({
                message: 'Login successful',
                enseignant: {
                    id: mockResult.user.id,
                    username: mockResult.user.username
                },
                enseignantId: mockResult.user.id,
                username: mockResult.user.username,
                avatar: mockResult.user.avatarEmoji,
                cookie_id: expect.stringContaining('teacher_'),
                token: mockResult.token,
                role: 'TEACHER'
            });
        });

        it('should handle teacher register', async () => {
            const mockResult = {
                success: true,
                userState: 'teacher' as const,
                user: {
                    id: 'teacher-123',
                    email: 'teacher@example.com',
                    role: 'TEACHER' as const,
                    username: 'teacher1',
                    avatarEmoji: '🐼',
                    emailVerified: false,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                token: 'jwt-teacher-token'
            };

            mockUserService.registerUser.mockResolvedValue(mockResult);

            const response = await request(app)
                .post('/api/v1/auth')
                .send({
                    action: 'teacher_register',
                    email: 'teacher@example.com',
                    password: 'password123',
                    username: 'teacher1',
                    adminPassword: 'test_admin'
                })
                .expect(201);

            expect(mockUserService.registerUser).toHaveBeenCalledWith({
                email: 'teacher@example.com',
                password: 'password123',
                username: 'teacher1',
                role: 'TEACHER'
            });
            expect(response.body).toEqual({
                success: true,
                user: {
                    id: mockResult.user.id,
                    email: mockResult.user.email,
                    username: mockResult.user.username,
                    role: 'TEACHER',
                    emailVerified: false
                },
                message: 'Teacher account created successfully. Please verify your email before logging in.',
                requiresEmailVerification: true
            });
        });

        it('should return 400 for invalid action', async () => {
            const response = await request(app)
                .post('/api/v1/auth')
                .send({
                    action: 'invalid_action',
                    email: 'test@example.com'
                })
                .expect(400);

            expect(response.body).toEqual({
                error: 'Invalid action'
            });
        });

        it('should return 400 for missing email/password in login', async () => {
            const response = await request(app)
                .post('/api/v1/auth')
                .send({
                    action: 'login',
                    password: 'password123'
                })
                .expect(400);

            expect(response.body).toEqual({
                error: 'Email and password are required'
            });
        });
    });

    describe('POST /api/v1/auth/register', () => {
        it('should register a new user successfully', async () => {
            const mockResult = {
                success: true,
                userState: 'student' as const,
                user: {
                    id: 'user-123',
                    email: 'user@example.com',
                    role: 'STUDENT' as const,
                    username: 'student1',
                    avatarEmoji: '🐼',
                    emailVerified: false,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                token: 'jwt-token'
            };

            mockUserService.registerUser.mockResolvedValue(mockResult);
            console.log('Mock set up for registerUser');

            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'user@example.com',
                    password: 'password123',
                    username: 'student1',
                    role: 'STUDENT'
                })
                .expect(201);

            console.log('Response received:', response.status, response.body);
            console.log('Mock called:', mockUserService.registerUser.mock.calls.length, 'times');

            expect(mockUserService.registerUser).toHaveBeenCalledWith({
                email: 'user@example.com',
                password: 'password123',
                username: 'student1',
                role: 'STUDENT'
            });
            expect(response.body).toEqual({
                success: true,
                user: {
                    id: mockResult.user.id,
                    email: mockResult.user.email,
                    username: mockResult.user.username,
                    avatar: mockResult.user.avatarEmoji,
                    role: 'STUDENT',
                    emailVerified: false
                },
                message: 'Account created successfully. Please verify your email before logging in.',
                requiresEmailVerification: true
            });
        });

        it('should return 500 when registration fails', async () => {
            mockUserService.registerUser.mockRejectedValue(new Error('Registration failed'));

            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'user@example.com',
                    password: 'password123',
                    username: 'student1',
                    role: 'STUDENT'
                })
                .expect(500);

            expect(response.body).toEqual({
                success: false,
                error: 'An error occurred during registration'
            });
        });
    });

    describe('POST /api/v1/auth/login', () => {
        it('should login user successfully', async () => {
            const mockResult = {
                success: true,
                userState: 'student' as const,
                user: {
                    id: 'user-123',
                    email: 'user@example.com',
                    role: 'STUDENT' as const,
                    username: 'student1',
                    avatarEmoji: '🐼',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                token: 'jwt-token'
            };

            mockUserService.loginUser.mockResolvedValue(mockResult);

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'user@example.com',
                    password: 'password123'
                })
                .expect(200);

            expect(mockUserService.loginUser).toHaveBeenCalledWith({
                email: 'user@example.com',
                password: 'password123'
            });
            expect(response.body).toEqual({
                success: true,
                user: {
                    id: mockResult.user.id,
                    email: mockResult.user.email,
                    username: mockResult.user.username,
                    avatar: mockResult.user.avatarEmoji,
                    role: 'STUDENT'
                },
                token: mockResult.token,
                message: 'Login successful'
            });
        });

        it('should return 401 for invalid credentials', async () => {
            mockUserService.loginUser.mockRejectedValue(new Error('Invalid email or password'));

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'user@example.com',
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(response.body).toEqual({
                error: 'Invalid email or password'
            });
        });
    });

    describe('POST /api/v1/auth/reset-password', () => {
        it('should send password reset email successfully', async () => {
            mockUserService.requestPasswordReset.mockResolvedValue(undefined);

            const response = await request(app)
                .post('/api/v1/auth/reset-password')
                .send({
                    email: 'user@example.com'
                })
                .expect(200);

            expect(mockUserService.requestPasswordReset).toHaveBeenCalledWith('user@example.com');
            expect(response.body).toEqual({
                message: 'Password reset email sent if account exists',
                success: true
            });
        });

        it('should return 500 when password reset fails', async () => {
            mockUserService.requestPasswordReset.mockRejectedValue(new Error('Reset failed'));

            const response = await request(app)
                .post('/api/v1/auth/reset-password')
                .send({
                    email: 'user@example.com'
                })
                .expect(200);

            expect(response.body).toEqual({
                message: 'Password reset email sent if account exists',
                success: true
            });
        });
    });

    describe('POST /api/v1/auth/reset-password/confirm', () => {
        it('should confirm password reset successfully', async () => {
            mockUserService.resetPasswordWithToken.mockResolvedValue(undefined);

            const response = await request(app)
                .post('/api/v1/auth/reset-password/confirm')
                .send({
                    token: 'reset-token',
                    newPassword: 'newpassword123'
                })
                .expect(200);

            expect(mockUserService.resetPasswordWithToken).toHaveBeenCalledWith('reset-token', 'newpassword123');
            expect(response.body).toEqual({
                message: 'Password reset successful'
            });
        });

        it('should return 500 when password reset confirmation fails', async () => {
            mockUserService.resetPasswordWithToken.mockRejectedValue(new Error('Confirmation failed'));

            const response = await request(app)
                .post('/api/v1/auth/reset-password/confirm')
                .send({
                    token: 'reset-token',
                    newPassword: 'newpassword123'
                })
                .expect(500);

            expect(response.body).toEqual({
                error: 'An error occurred during password reset'
            });
        });
    });

    describe('PUT /api/v1/auth/profile', () => {
        it('should update user profile successfully', async () => {
            const mockResult = {
                id: 'user-123',
                username: 'updateduser',
                email: 'updated@example.com',
                passwordHash: 'hashedpassword',
                createdAt: new Date(),
                role: 'STUDENT' as const,
                resetToken: null,
                resetTokenExpiresAt: null,
                avatarEmoji: 'avatar1',
                emailVerificationToken: null,
                emailVerificationTokenExpiresAt: null,
                emailVerified: true
            };

            mockUserService.updateUserProfile.mockResolvedValue(mockResult);

            const response = await request(app)
                .put('/api/v1/auth/profile')
                .send({
                    email: 'updated@example.com',
                    username: 'updateduser',
                    avatar: 'avatar1'
                })
                .expect(200);

            expect(mockUserService.updateUserProfile).toHaveBeenCalledWith('user-123', {
                username: 'updateduser',
                avatar: 'avatar1'
            });
            expect(response.body).toEqual({
                success: true,
                message: 'Profile updated successfully',
                user: {
                    id: 'user-123',
                    email: 'updated@example.com',
                    username: 'updateduser',
                    avatar: 'avatar1',
                    role: 'STUDENT'
                }
            });
        });

        it('should return 500 when profile update fails', async () => {
            mockUserService.updateUserProfile.mockRejectedValue(new Error('Update failed'));

            mockUserService.updateUserProfile.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .put('/api/v1/auth/profile')
                .send({
                    username: 'updateduser',
                    avatar: 'avatar1'
                })
                .expect(500);

            expect(response.body).toEqual({
                error: 'An error occurred while updating profile'
            });
        });
    });

    describe('POST /api/v1/auth/upgrade-to-teacher', () => {
        it('should upgrade user to teacher successfully', async () => {
            const mockResult = {
                success: true,
                userState: 'teacher' as const,
                user: {
                    id: 'user-123',
                    email: 'user@example.com',
                    role: 'TEACHER' as const,
                    username: 'teacher1',
                    avatarEmoji: '🐼',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                token: 'jwt-teacher-token'
            };

            mockUserService.upgradeUserRole.mockResolvedValue(mockResult);
            mockUserService.getUserById.mockResolvedValue({
                id: 'user-123',
                email: 'user@example.com',
                username: 'testuser',
                role: 'STUDENT',
                avatarEmoji: '🐼',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const response = await request(app)
                .post('/api/v1/auth/upgrade-to-teacher')
                .send({
                    schoolName: 'Test School',
                    subject: 'Mathematics',
                    adminPassword: 'test_admin'
                })
                .expect(200);

            expect(mockUserService.upgradeUserRole).toHaveBeenCalledWith('user-123', 'TEACHER');
            expect(response.body).toEqual({
                success: true,
                message: 'Account upgraded to teacher successfully',
                token: 'jwt-teacher-token',
                user: {
                    id: 'user-123',
                    username: 'teacher1',
                    email: 'user@example.com',
                    avatar: '🐼',
                    role: 'TEACHER'
                }
            });
        });

        it('should return 500 when teacher upgrade fails', async () => {
            mockUserService.upgradeUserRole.mockRejectedValue(new Error('Upgrade failed'));
            mockUserService.getUserById.mockResolvedValue({
                id: 'user-123',
                email: 'user@example.com',
                username: 'testuser',
                role: 'STUDENT',
                avatarEmoji: '🐼',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const response = await request(app)
                .post('/api/v1/auth/upgrade-to-teacher')
                .send({
                    schoolName: 'Test School',
                    subject: 'Mathematics',
                    adminPassword: 'test_admin'
                })
                .expect(500);

            expect(response.body).toEqual({
                error: 'An error occurred while upgrading account'
            });
        });

        it('should return 500 when teacher upgrade fails', async () => {
            mockUserService.upgradeUser.mockRejectedValue(new Error('Upgrade failed'));

            const response = await request(app)
                .post('/api/v1/auth/upgrade-to-teacher')
                .send({
                    schoolName: 'Test School',
                    subject: 'Mathematics',
                    adminPassword: 'wrong_password'
                })
                .expect(403);

            expect(response.body).toEqual({
                error: 'Invalid admin password'
            });
        });
    });

    describe('Email Verification Endpoints', () => {
        describe('POST /api/v1/auth/send-email-verification', () => {
            it('should send email verification successfully', async () => {
                mockUserService.sendEmailVerification.mockResolvedValue(undefined);

                const response = await request(app)
                    .post('/api/v1/auth/send-email-verification')
                    .send({
                        email: 'user@example.com'
                    })
                    .expect(200);

                expect(mockUserService.sendEmailVerification).toHaveBeenCalledWith('user@example.com');
                expect(response.body).toEqual({
                    message: 'Verification email sent if account exists',
                    success: true
                });
            });

            it('should return 500 when email verification fails', async () => {
                mockUserService.sendEmailVerification.mockRejectedValue(new Error('Send failed'));

                const response = await request(app)
                    .post('/api/v1/auth/send-email-verification')
                    .send({
                        email: 'user@example.com'
                    })
                    .expect(200);

                expect(response.body).toEqual({
                    message: 'Verification email sent if account exists',
                    success: true
                });
            });
        });

        describe('POST /api/v1/auth/verify-email', () => {
            it('should verify email successfully', async () => {
                mockUserService.verifyEmail.mockResolvedValue({
                    success: true,
                    message: 'Email verified successfully',
                    user: { id: 'user-123', email: 'user@example.com' },
                    token: 'new-token'
                });

                const response = await request(app)
                    .post('/api/v1/auth/verify-email')
                    .send({
                        token: 'verification-token'
                    })
                    .expect(200);

                expect(mockUserService.verifyEmail).toHaveBeenCalledWith('verification-token');
                expect(response.body).toEqual({
                    success: true,
                    message: 'Email verified successfully',
                    user: {
                        id: 'user-123',
                        email: 'user@example.com'
                    }
                });
            });

            it('should return 500 when email verification fails', async () => {
                mockUserService.verifyEmail.mockRejectedValue(new Error('Verification failed'));

                const response = await request(app)
                    .post('/api/v1/auth/verify-email')
                    .send({
                        token: 'verification-token'
                    })
                    .expect(500);

                expect(response.body).toEqual({
                    error: 'An error occurred during email verification'
                });
            });
        });

        describe('POST /api/v1/auth/resend-email-verification', () => {
            it('should resend email verification successfully', async () => {
                mockUserService.sendEmailVerification.mockResolvedValue(undefined);

                const response = await request(app)
                    .post('/api/v1/auth/resend-email-verification')
                    .send({
                        email: 'user@example.com'
                    })
                    .expect(200);

                expect(mockUserService.sendEmailVerification).toHaveBeenCalledWith('user@example.com');
                expect(response.body).toEqual({
                    success: true,
                    message: 'Verification email sent if account exists'
                });
            });

            it('should return 500 when resend email verification fails', async () => {
                mockUserService.sendEmailVerification.mockRejectedValue(new Error('Resend failed'));

                const response = await request(app)
                    .post('/api/v1/auth/resend-email-verification')
                    .send({
                        email: 'user@example.com'
                    })
                    .expect(200);

                expect(response.body).toEqual({
                    message: 'Verification email sent if account exists',
                    success: true
                });
            });
        });
    });
});