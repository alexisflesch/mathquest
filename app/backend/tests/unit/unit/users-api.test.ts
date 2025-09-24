require('../../../tests/setupTestEnv');

import { jest } from '@jest/globals';
import { describe, it, expect, beforeAll, afterAll, beforeEach, test } from '@jest/globals';
import request from 'supertest';
import { app } from '../../../src/server';
import { UserService } from '../../../src/core/services/userService';
import { EmailService } from '../../../src/core/services/emailService';
import { UserRole, AuthResponse, UserState } from '../../../../shared/types/core';

// Import the testing injection functions
import { __setUserServiceForTesting as setAuthUserService } from '../../../src/api/v1/auth';
import { __setUserServiceForTesting as setUsersUserService } from '../../../src/api/v1/users';

// Mock services
jest.mock('../../../src/core/services/userService');
jest.mock('../../../src/core/services/emailService');
jest.mock('../../../src/utils/usernameValidator');
jest.mock('../../../src/utils/avatarUtils');
jest.mock('jsonwebtoken');
jest.mock('../../../src/db/prisma');

// Mock jsonwebtoken
const mockJwt = jest.mocked(require('jsonwebtoken'));
mockJwt.verify.mockImplementation((token: string) => {
    if (token === 'jwt-token-123') {
        return { userId: 'user-123', role: 'STUDENT' };
    }
    if (token === 'jwt-teacher-token') {
        return { userId: 'teacher-123', role: 'TEACHER' };
    }
    if (token === 'jwt-student-token') {
        return { userId: 'student-123', role: 'STUDENT' };
    }
    throw new Error('Invalid token');
});
mockJwt.sign.mockReturnValue('mock-jwt-token');

// Mock Prisma
const mockPrisma = jest.mocked(require('../../../src/db/prisma'));
mockPrisma.prisma = {
    user: {
        findUnique: jest.fn().mockImplementation((query: any) => {
            if (query.where.id === 'user-123') {
                return Promise.resolve({
                    id: 'user-123',
                    username: 'testuser',
                    role: 'STUDENT'
                });
            }
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

// Mock getRandomAvatar to return consistent values
const mockAvatarUtils = jest.mocked(require('../../../src/utils/avatarUtils'));
mockAvatarUtils.getRandomAvatar.mockReturnValue('👨‍🏫');

const mockUserService = UserService as jest.MockedClass<typeof UserService>;
const mockEmailService = EmailService as jest.MockedClass<typeof EmailService>;
const mockUsernameValidator = jest.mocked(require('../../../src/utils/usernameValidator'));

describe('Users API - Authentication & User Management', () => {
    let userServiceInstance: jest.Mocked<UserService>;
    let emailServiceInstance: jest.Mocked<EmailService>;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Create mock instances
        userServiceInstance = {
            registerUser: jest.fn(),
            loginUser: jest.fn(),
            getUserById: jest.fn(),
            getUserByCookieId: jest.fn(),
            getUserByEmail: jest.fn(),
            generatePasswordResetToken: jest.fn(),
            resetPasswordWithToken: jest.fn(),
            upgradeUser: jest.fn(),
            updateUserProfile: jest.fn(),
            upgradeUserRole: jest.fn(),
            sendEmailVerification: jest.fn(),
            verifyEmail: jest.fn(),
            generateEmailVerificationToken: jest.fn(),
            requestPasswordReset: jest.fn()
        } as any;

        emailServiceInstance = {
            sendPasswordResetEmail: jest.fn(),
            sendEmailVerificationEmail: jest.fn(),
            sendWelcomeEmail: jest.fn()
        } as any;

        // Set up the mock implementations
        mockUserService.mockImplementation(() => userServiceInstance);
        mockEmailService.mockImplementation(() => emailServiceInstance);

        // Mock username validator to always return valid
        mockUsernameValidator.validateUsername.mockReturnValue({ isValid: true });

        // Inject the mock services into the API modules
        setAuthUserService(userServiceInstance);
        setUsersUserService(userServiceInstance);
    });

    describe('POST /api/v1/auth/logout - Logout', () => {
        test('should logout successfully', async () => {
            const response = await request(app)
                .post('/api/v1/auth/logout')
                .expect(200);

            expect(response.body).toEqual({
                success: true,
                message: 'Logged out successfully'
            });
        });
    });

    describe('POST /api/v1/auth - Universal Auth (Login/Register)', () => {
        test('should handle login action successfully', async () => {
            const mockLoginResult: AuthResponse = {
                success: true,
                user: {
                    id: 'user-123',
                    username: 'testuser',
                    email: 'test@example.com',
                    role: 'STUDENT' as const,
                    avatarEmoji: '🐼',
                    createdAt: new Date('2025-09-12T07:35:14.311Z'),
                    updatedAt: new Date('2025-09-12T07:35:14.311Z')
                },
                userState: 'student' as UserState,
                token: 'jwt-token-123'
            };

            userServiceInstance.loginUser.mockResolvedValue(mockLoginResult);

            const loginData = {
                action: 'login',
                email: 'test@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/v1/auth')
                .send(loginData)
                .expect(200);

            expect(userServiceInstance.loginUser).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123'
            });
            expect(response.body).toEqual({
                success: true,
                user: {
                    id: 'user-123',
                    email: 'test@example.com',
                    username: 'testuser',
                    avatar: '🐼',
                    role: 'STUDENT'
                },
                token: 'jwt-token-123',
                message: 'Login successful'
            });
        });

        test('should handle teacher login successfully', async () => {
            const mockLoginResult: AuthResponse = {
                success: true,
                user: {
                    id: 'teacher-123',
                    username: 'teacheruser',
                    email: 'teacher@example.com',
                    role: 'TEACHER' as const,
                    avatarEmoji: '👨‍🏫',
                    createdAt: new Date('2025-09-12T07:35:14.311Z'),
                    updatedAt: new Date('2025-09-12T07:35:14.311Z')
                },
                userState: 'teacher' as UserState,
                token: 'jwt-teacher-token-123'
            };

            userServiceInstance.loginUser.mockResolvedValue(mockLoginResult);

            const loginData = {
                action: 'login',
                email: 'teacher@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/v1/auth')
                .send(loginData)
                .expect(200);

            expect(userServiceInstance.loginUser).toHaveBeenCalledWith({
                email: 'teacher@example.com',
                password: 'password123'
            });
            expect(response.body).toEqual({
                message: 'Login successful',
                enseignant: {
                    id: 'teacher-123',
                    username: 'teacheruser'
                },
                enseignantId: 'teacher-123',
                username: 'teacheruser',
                avatar: '👨‍🏫',
                cookie_id: expect.stringMatching(/^teacher_teacher-123_\d+$/),
                token: 'jwt-teacher-token-123',
                role: 'TEACHER'
            });
        });

        test('should handle teacher register action successfully', async () => {
            const mockRegisterResult: AuthResponse = {
                success: true,
                user: {
                    id: 'teacher-456',
                    username: 'newteacher',
                    email: 'newteacher@example.com',
                    role: 'TEACHER' as const,
                    avatarEmoji: '👩‍🏫',
                    createdAt: new Date('2025-09-12T07:35:14.311Z'),
                    updatedAt: new Date('2025-09-12T07:35:14.311Z')
                },
                userState: 'teacher' as UserState,
                token: 'jwt-teacher-register-token'
            };

            userServiceInstance.registerUser.mockResolvedValue(mockRegisterResult);

            const registerData = {
                action: 'teacher_register',
                username: 'newteacher',
                email: 'newteacher@example.com',
                password: 'password123',
                adminPassword: 'test_admin'
            };

            const response = await request(app)
                .post('/api/v1/auth')
                .send(registerData)
                .expect(201);

            expect(userServiceInstance.registerUser).toHaveBeenCalledWith({
                username: 'newteacher',
                email: 'newteacher@example.com',
                password: 'password123',
                role: 'TEACHER' as const,
                avatarEmoji: '👨‍🏫'
            });
            expect(response.body).toEqual({
                success: true,
                user: {
                    id: 'teacher-456',
                    email: 'newteacher@example.com',
                    username: 'newteacher',
                    avatar: '👨‍🏫',
                    role: 'TEACHER',
                    emailVerified: false
                },
                message: 'Teacher account created successfully. Please verify your email before logging in.',
                requiresEmailVerification: true
            });
        });

        test('should return 400 for invalid action', async () => {
            const invalidData = {
                action: 'invalid_action',
                email: 'test@example.com'
            };

            const response = await request(app)
                .post('/api/v1/auth')
                .send(invalidData)
                .expect(400);

            expect(response.body).toEqual({
                error: 'Invalid action'
            });
        });

        test('should return 400 for missing required fields', async () => {
            const incompleteData = {
                action: 'login'
                // missing email and password
            };

            const response = await request(app)
                .post('/api/v1/auth')
                .send(incompleteData)
                .expect(400);

            expect(response.body).toEqual({
                error: 'Email and password are required'
            });
        });
    });

    describe('POST /api/v1/auth/register - Register User', () => {
        test('should register student successfully', async () => {
            const mockRegisterResult: AuthResponse = {
                success: true,
                user: {
                    id: 'student-123',
                    username: 'studentuser',
                    email: 'student@example.com',
                    role: 'STUDENT' as const,
                    avatarEmoji: '🐻',
                    emailVerified: false,
                    createdAt: new Date('2025-09-12T07:35:14.311Z'),
                    updatedAt: new Date('2025-09-12T07:35:14.311Z')
                },
                userState: 'student' as UserState,
                token: 'jwt-student-token'
            };

            userServiceInstance.registerUser.mockResolvedValue(mockRegisterResult);

            const registerData = {
                username: 'studentuser',
                email: 'student@example.com',
                password: 'password123',
                role: 'STUDENT' as const
            };

            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(registerData)
                .expect(201);

            expect(userServiceInstance.registerUser).toHaveBeenCalledWith({
                username: 'studentuser',
                email: 'student@example.com',
                password: 'password123',
                role: 'STUDENT' as const,
                avatarEmoji: expect.any(String)
            });
            expect(response.body).toEqual({
                success: true,
                user: {
                    id: 'student-123',
                    username: 'studentuser',
                    email: 'student@example.com',
                    avatar: '🐻',
                    role: 'STUDENT',
                    emailVerified: false
                },
                message: 'Account created successfully. Please verify your email before logging in.',
                requiresEmailVerification: true
            });
        });

        test('should register teacher successfully', async () => {
            const mockRegisterResult: AuthResponse = {
                success: true,
                user: {
                    id: 'teacher-789',
                    username: 'teacheruser',
                    email: 'teacher@example.com',
                    role: 'TEACHER' as const,
                    avatarEmoji: '👨‍🏫',
                    emailVerified: false,
                    createdAt: new Date('2025-09-12T07:35:14.311Z'),
                    updatedAt: new Date('2025-09-12T07:35:14.311Z')
                },
                userState: 'teacher' as UserState,
                token: 'jwt-teacher-token'
            };

            userServiceInstance.registerUser.mockResolvedValue(mockRegisterResult);

            const registerData = {
                username: 'teacheruser',
                email: 'teacher@example.com',
                password: 'password123',
                role: 'TEACHER' as const,
                adminPassword: 'test_admin'
            };

            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(registerData)
                .expect(201);

            expect(userServiceInstance.registerUser).toHaveBeenCalledWith({
                username: 'teacheruser',
                email: 'teacher@example.com',
                password: 'password123',
                role: 'TEACHER' as const,
                avatarEmoji: '👨‍🏫'
            });
            expect(response.body).toEqual({
                success: true,
                user: {
                    id: 'teacher-789',
                    email: 'teacher@example.com',
                    username: 'teacheruser',
                    avatar: '👨‍🏫',
                    role: 'TEACHER',
                    emailVerified: false
                },
                message: 'Account created successfully. Please verify your email before logging in.',
                requiresEmailVerification: true
            });
        });

        test('should handle registration errors', async () => {
            userServiceInstance.registerUser.mockRejectedValue(new Error('User with this email already exists'));

            const registerData = {
                username: 'existinguser',
                email: 'existing@example.com',
                password: 'password123',
                role: 'STUDENT'
            };

            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(registerData)
                .expect(409);

            expect(response.body).toEqual({
                success: false,
                error: 'User with this email already exists'
            });
        });
    });

    describe('POST /api/v1/auth/login - Login User', () => {
        test('should login student successfully', async () => {
            const mockLoginResult: AuthResponse = {
                success: true,
                user: {
                    id: 'student-123',
                    username: 'studentuser',
                    email: 'student@example.com',
                    role: 'STUDENT' as const,
                    avatarEmoji: '🐼',
                    createdAt: new Date('2025-09-12T07:35:14.311Z'),
                    updatedAt: new Date('2025-09-12T07:35:14.311Z')
                },
                userState: 'student' as UserState,
                token: 'jwt-student-token'
            };

            userServiceInstance.loginUser.mockResolvedValue(mockLoginResult);

            const loginData = {
                email: 'student@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send(loginData)
                .expect(200);

            expect(userServiceInstance.loginUser).toHaveBeenCalledWith({
                email: 'student@example.com',
                password: 'password123'
            });
            expect(response.body).toEqual({
                success: true,
                user: {
                    id: 'student-123',
                    email: 'student@example.com',
                    username: 'studentuser',
                    avatar: '🐼',
                    role: 'STUDENT'
                },
                token: 'jwt-student-token',
                message: 'Login successful'
            });
        });

        test('should login teacher successfully', async () => {
            const mockLoginResult: AuthResponse = {
                success: true,
                user: {
                    id: 'teacher-123',
                    username: 'teacheruser',
                    email: 'teacher@example.com',
                    role: 'TEACHER' as const,
                    avatarEmoji: '👨‍🏫',
                    createdAt: new Date('2025-09-12T07:35:14.311Z'),
                    updatedAt: new Date('2025-09-12T07:35:14.311Z')
                },
                userState: 'teacher' as UserState,
                token: 'jwt-teacher-token'
            };

            userServiceInstance.loginUser.mockResolvedValue(mockLoginResult);

            const loginData = {
                email: 'teacher@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send(loginData)
                .expect(200);

            expect(userServiceInstance.loginUser).toHaveBeenCalledWith({
                email: 'teacher@example.com',
                password: 'password123'
            });
            expect(response.body).toEqual({
                message: 'Login successful',
                enseignant: {
                    id: 'teacher-123',
                    username: 'teacheruser'
                },
                enseignantId: 'teacher-123',
                username: 'teacheruser',
                avatar: '👨‍🏫',
                cookie_id: expect.stringMatching(/^teacher_teacher-123_\d+$/),
                token: 'jwt-teacher-token',
                role: 'TEACHER'
            });
        });

        test('should handle login errors', async () => {
            userServiceInstance.loginUser.mockRejectedValue(new Error('Invalid email or password'));

            const loginData = {
                email: 'wrong@example.com',
                password: 'wrongpassword'
            };

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body).toEqual({
                error: 'Invalid email or password'
            });
        });
    });

    describe('GET /api/v1/auth/status - Auth Status', () => {
        test('should return authenticated user status', async () => {
            const mockUser = {
                id: 'user-123',
                username: 'testuser',
                email: 'test@example.com',
                passwordHash: 'hashedpassword',
                createdAt: new Date('2025-09-12T07:35:14.311Z'),
                updatedAt: new Date('2025-09-12T07:35:14.311Z'),
                role: 'STUDENT' as const,
                resetToken: null,
                resetTokenExpiresAt: null,
                avatarEmoji: '🐼',
                emailVerificationToken: null,
                emailVerificationTokenExpiresAt: null,
                emailVerified: true
            };

            userServiceInstance.getUserById.mockResolvedValue(mockUser);

            const response = await request(app)
                .get('/api/v1/auth/status')
                .set('Cookie', ['authToken=jwt-token-123'])
                .expect(200);

            expect(userServiceInstance.getUserById).toHaveBeenCalledWith('user-123');
            expect(response.body).toEqual({
                authState: 'student',
                cookieNames: ['authToken'],
                cookiesFound: 2,
                hasAuthToken: true,
                hasTeacherToken: false,
                isTeacher: false,
                timestamp: expect.any(String),
                user: {
                    id: 'user-123',
                    username: 'testuser',
                    email: 'test@example.com',
                    role: 'STUDENT',
                    avatar: '🐼'
                }
            });
        });

        test('should return unauthenticated status when no token', async () => {
            const response = await request(app)
                .get('/api/v1/auth/status')
                .expect(200);

            expect(response.body).toEqual({
                authState: 'anonymous',
                cookieNames: [],
                cookiesFound: 0,
                hasAuthToken: false,
                hasTeacherToken: false,
                timestamp: expect.any(String)
            });
        });
    });

    describe('GET /api/v1/users/:userId - Get User by ID', () => {
        test('should return user by ID successfully', async () => {
            const mockUser = {
                id: 'user-123',
                username: 'testuser',
                email: 'test@example.com',
                passwordHash: 'hashedpassword',
                createdAt: new Date('2025-09-12T07:35:14.311Z'),
                updatedAt: new Date('2025-09-12T07:35:14.311Z'),
                role: 'STUDENT' as const,
                resetToken: null,
                resetTokenExpiresAt: null,
                avatarEmoji: '🐼',
                emailVerificationToken: null,
                emailVerificationTokenExpiresAt: null,
                emailVerified: true
            };

            userServiceInstance.getUserById.mockResolvedValue(mockUser);

            const response = await request(app)
                .get('/api/v1/users/user-123')
                .expect(200);

            expect(userServiceInstance.getUserById).toHaveBeenCalledWith('user-123');
            expect(response.body).toEqual({
                id: 'user-123',
                username: 'testuser',
                email: 'test@example.com',
                role: 'STUDENT',
                avatarEmoji: '🐼',
                createdAt: '2025-09-12T07:35:14.311Z',
                updatedAt: '2025-09-12T07:35:14.311Z'
            });
        });

        test('should return 404 for non-existent user', async () => {
            userServiceInstance.getUserById.mockResolvedValue(null);

            const response = await request(app)
                .get('/api/v1/users/non-existent-user')
                .expect(404);

            expect(response.body).toEqual({
                error: 'User not found'
            });
        });

        test('should return 400 for missing user ID', async () => {
            const response = await request(app)
                .get('/api/v1/users/')
                .expect(404); // Express will handle this as 404 since no route matches
        });
    });

    describe('PUT /api/v1/auth/profile - Update Profile', () => {
        test('should update user profile successfully', async () => {
            const mockUpdatedUser = {
                id: 'user-123',
                username: 'updateduser',
                email: 'test@example.com',
                passwordHash: 'hashedpassword',
                createdAt: new Date('2025-09-12T07:35:14.311Z'),
                updatedAt: new Date('2025-09-12T08:35:14.311Z'),
                role: 'STUDENT' as const,
                resetToken: null,
                resetTokenExpiresAt: null,
                avatarEmoji: '🦁',
                emailVerificationToken: null,
                emailVerificationTokenExpiresAt: null,
                emailVerified: true
            };

            userServiceInstance.updateUserProfile.mockResolvedValue(mockUpdatedUser);

            const profileData = {
                username: 'updateduser',
                avatar: '🦁'
            };

            const response = await request(app)
                .put('/api/v1/auth/profile')
                .set('Cookie', ['authToken=jwt-token-123'])
                .send(profileData)
                .expect(200);

            expect(userServiceInstance.updateUserProfile).toHaveBeenCalledWith('user-123', {
                username: 'updateduser',
                avatar: '🦁'
            });
            expect(response.body).toEqual({
                success: true,
                message: 'Profile updated successfully',
                user: {
                    id: 'user-123',
                    username: 'updateduser',
                    email: 'test@example.com',
                    avatar: '🦁',
                    role: 'STUDENT'
                }
            });
        });

        test('should handle profile update errors', async () => {
            userServiceInstance.updateUserProfile.mockRejectedValue(new Error('Username already taken'));

            const profileData = {
                username: 'takenusername',
                avatar: '🐯'
            };

            const response = await request(app)
                .put('/api/v1/auth/profile')
                .set('Cookie', ['authToken=jwt-token-123'])
                .send(profileData)
                .expect(500);

            expect(response.body).toEqual({
                error: 'An error occurred while updating profile'
            });
        });
    });

    describe('POST /api/v1/auth/reset-password - Reset Password', () => {
        test('should initiate password reset successfully', async () => {
            userServiceInstance.requestPasswordReset.mockResolvedValue(undefined);

            const resetData = {
                email: 'test@example.com'
            };

            const response = await request(app)
                .post('/api/v1/auth/reset-password')
                .send(resetData)
                .expect(200);

            expect(userServiceInstance.requestPasswordReset).toHaveBeenCalledWith('test@example.com');
            expect(response.body).toEqual({
                success: true,
                message: 'Password reset email sent if account exists'
            });
        });

        test('should handle password reset errors', async () => {
            userServiceInstance.requestPasswordReset.mockRejectedValue(new Error('User not found'));

            const resetData = {
                email: 'nonexistent@example.com'
            };

            const response = await request(app)
                .post('/api/v1/auth/reset-password')
                .send(resetData)
                .expect(200);

            expect(response.body).toEqual({
                success: true,
                message: 'Password reset email sent if account exists'
            });
        });
    });

    describe('POST /api/v1/auth/reset-password/confirm - Confirm Password Reset', () => {
        test('should confirm password reset successfully', async () => {
            userServiceInstance.resetPasswordWithToken.mockResolvedValue(undefined);

            const confirmData = {
                token: 'reset-token-123',
                newPassword: 'newpassword123'
            };

            const response = await request(app)
                .post('/api/v1/auth/reset-password/confirm')
                .send(confirmData)
                .expect(200);

            expect(userServiceInstance.resetPasswordWithToken).toHaveBeenCalledWith('reset-token-123', 'newpassword123');
            expect(response.body).toEqual({
                message: 'Password reset successful'
            });
        });

        test('should handle invalid reset token', async () => {
            userServiceInstance.resetPasswordWithToken.mockRejectedValue(new Error('Invalid or expired token'));

            const confirmData = {
                token: 'invalid-token',
                newPassword: 'newpassword123'
            };

            const response = await request(app)
                .post('/api/v1/auth/reset-password/confirm')
                .send(confirmData)
                .expect(400);

            expect(response.body).toEqual({
                error: 'Invalid or expired reset token'
            });
        });
    });

    describe('POST /api/v1/auth/send-email-verification - Send Email Verification', () => {
        test('should send email verification successfully', async () => {
            userServiceInstance.sendEmailVerification.mockResolvedValue(undefined);

            const verificationData = {
                email: 'test@example.com'
            };

            const response = await request(app)
                .post('/api/v1/auth/send-email-verification')
                .send(verificationData)
                .expect(200);

            expect(userServiceInstance.sendEmailVerification).toHaveBeenCalledWith('test@example.com');
            expect(response.body).toEqual({
                success: true,
                message: 'Verification email sent if account exists'
            });
        });

        test('should handle email verification errors', async () => {
            userServiceInstance.sendEmailVerification.mockRejectedValue(new Error('Email already verified'));

            const verificationData = {
                email: 'verified@example.com'
            };

            const response = await request(app)
                .post('/api/v1/auth/send-email-verification')
                .send(verificationData)
                .expect(200);

            expect(response.body).toEqual({
                success: true,
                message: 'Verification email sent if account exists'
            });
        });
    });

    describe('POST /api/v1/auth/verify-email - Verify Email', () => {
        test('should verify email successfully', async () => {
            const mockVerificationResult = {
                success: true,
                message: 'Email verified successfully',
                user: {
                    id: 'user-123',
                    username: 'testuser',
                    email: 'test@example.com',
                    role: 'STUDENT' as const,
                    avatarEmoji: '🐼'
                },
                token: 'jwt-verified-token'
            };

            userServiceInstance.verifyEmail.mockResolvedValue(mockVerificationResult);

            const verifyData = {
                token: 'verification-token-123'
            };

            const response = await request(app)
                .post('/api/v1/auth/verify-email')
                .send(verifyData)
                .expect(200);

            expect(userServiceInstance.verifyEmail).toHaveBeenCalledWith('verification-token-123');
            expect(response.body).toEqual({
                success: true,
                message: 'Email verified successfully',
                user: {
                    id: 'user-123',
                    username: 'testuser',
                    email: 'test@example.com',
                    avatarEmoji: '🐼',
                    role: 'STUDENT'
                }
            });
        });

        test('should handle invalid verification token', async () => {
            const mockVerificationResult = {
                success: false,
                message: 'Invalid or expired verification token'
            };

            userServiceInstance.verifyEmail.mockResolvedValue(mockVerificationResult);

            const verifyData = {
                token: 'invalid-token'
            };

            const response = await request(app)
                .post('/api/v1/auth/verify-email')
                .send(verifyData)
                .expect(400);

            expect(response.body).toEqual({
                error: 'Invalid or expired verification token'
            });
        });
    });

    describe('POST /api/v1/auth/resend-email-verification - Resend Email Verification', () => {
        test('should resend email verification successfully', async () => {
            userServiceInstance.sendEmailVerification.mockResolvedValue(undefined);

            const resendData = {
                email: 'test@example.com'
            };

            const response = await request(app)
                .post('/api/v1/auth/resend-email-verification')
                .send(resendData)
                .expect(200);

            expect(userServiceInstance.sendEmailVerification).toHaveBeenCalledWith('test@example.com');
            expect(response.body).toEqual({
                success: true,
                message: 'Verification email sent if account exists'
            });
        });
    });

    describe('POST /api/v1/auth/upgrade - Upgrade Account', () => {
        test('should upgrade account successfully', async () => {
            const mockUpgradeResult: AuthResponse = {
                success: true,
                user: {
                    id: 'guest-user-123',
                    username: 'guestuser',
                    email: 'test@example.com',
                    role: 'TEACHER' as const,
                    avatarEmoji: '👨‍🏫',
                    createdAt: new Date('2025-09-12T07:35:14.311Z'),
                    updatedAt: new Date('2025-09-12T07:35:14.311Z')
                },
                userState: 'teacher' as UserState,
                token: 'jwt-upgraded-token'
            };

            userServiceInstance.upgradeUser.mockResolvedValue(mockUpgradeResult);

            // Mock getUserByCookieId for guest user lookup
            userServiceInstance.getUserByCookieId.mockResolvedValue({
                id: 'guest-user-123',
                username: 'guestuser',
                email: null,
                role: 'GUEST',
                avatarEmoji: null,
                createdAt: new Date('2025-09-12T07:35:14.311Z')
            });

            const upgradeData = {
                cookieId: 'guest-cookie-123',
                email: 'test@example.com',
                password: 'password123',
                targetRole: 'TEACHER',
                adminPassword: 'test_admin'
            };

            const response = await request(app)
                .post('/api/v1/auth/upgrade')
                .send(upgradeData)
                .expect(200);

            expect(userServiceInstance.upgradeUser).toHaveBeenCalledWith('guest-user-123', {
                email: 'test@example.com',
                password: 'password123',
                targetRole: 'TEACHER'
            });
            expect(response.body).toEqual({
                success: true,
                user: {
                    id: 'guest-user-123',
                    username: 'guestuser',
                    email: 'test@example.com',
                    avatar: '👨‍🏫',
                    role: 'TEACHER'
                },
                token: 'jwt-upgraded-token',
                message: 'Account upgraded successfully'
            });
        });
    });

    describe('POST /api/v1/auth/upgrade-to-teacher - Upgrade to Teacher', () => {
        test('should upgrade student to teacher successfully', async () => {
            const mockUpgradeResult: AuthResponse = {
                success: true,
                user: {
                    id: 'student-123',
                    username: 'studentuser',
                    email: 'student@example.com',
                    role: 'TEACHER' as const,
                    avatarEmoji: '👨‍🏫',
                    createdAt: new Date('2025-09-12T07:35:14.311Z'),
                    updatedAt: new Date('2025-09-12T07:35:14.311Z')
                },
                userState: 'teacher' as UserState,
                token: 'jwt-teacher-upgrade-token'
            };

            userServiceInstance.upgradeUserRole.mockResolvedValue(mockUpgradeResult);

            // Mock getUserById to return the student user
            userServiceInstance.getUserById.mockResolvedValue({
                id: 'student-123',
                username: 'studentuser',
                email: 'student@example.com',
                role: 'STUDENT',
                avatarEmoji: '🐻',
                createdAt: new Date('2025-09-12T07:35:14.311Z')
            });

            const upgradeData = {
                adminPassword: 'test_admin'
            };

            const response = await request(app)
                .post('/api/v1/auth/upgrade-to-teacher')
                .set('Cookie', ['authToken=jwt-student-token'])
                .send(upgradeData)
                .expect(200);

            expect(userServiceInstance.upgradeUserRole).toHaveBeenCalledWith('student-123', 'TEACHER' as const);
            expect(response.body).toEqual({
                success: true,
                message: 'Account upgraded to teacher successfully',
                token: 'jwt-teacher-upgrade-token',
                user: {
                    id: 'student-123',
                    username: 'studentuser',
                    email: 'student@example.com',
                    avatar: '👨‍🏫',
                    role: 'TEACHER'
                }
            });
        });

        test('should handle upgrade errors', async () => {
            userServiceInstance.upgradeUserRole.mockRejectedValue(new Error('Upgrade failed'));

            const upgradeData = {
                password: 'wrongpassword'
            };

            const response = await request(app)
                .post('/api/v1/auth/upgrade-to-teacher')
                .set('Cookie', ['authToken=jwt-student-token'])
                .send(upgradeData)
                .expect(400);

            expect(response.body).toEqual({
                error: 'Invalid request data',
                success: false,
                details: expect.any(Array),
                required: expect.any(Array)
            });
        });
    });
});
