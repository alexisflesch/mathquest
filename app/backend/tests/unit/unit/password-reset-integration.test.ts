require('../../../tests/setupTestEnv');

import { jest } from '@jest/globals';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';

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

// Mock Redis config
jest.mock('../../../src/config/redis', () => ({
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

jest.mock('../../../src/core/services/userService', () => {
    return {
        UserService: jest.fn().mockImplementation(() => mockUserService)
    };
});

// Mock EmailService
const mockEmailService = {
    sendPasswordResetEmail: jest.fn() as jest.MockedFunction<any>,
    sendVerificationEmail: jest.fn() as jest.MockedFunction<any>
};

jest.mock('../../../src/core/services/emailService', () => {
    return {
        EmailService: jest.fn().mockImplementation(() => mockEmailService)
    };
});

// Mock auth middleware
jest.mock('../../../src/middleware/auth', () => ({
    optionalAuth: jest.fn((req: any, res: any, next: any) => next()),
    teacherAuth: jest.fn((req: any, res: any, next: any) => next())
}));

// Mock validation middleware
jest.mock('../../../src/middleware/validation', () => ({
    validateRequestBody: jest.fn(() => (req: any, res: any, next: any) => next())
}));

// Mock avatar utils
jest.mock('../../../src/utils/avatarUtils', () => ({
    validateAvatar: jest.fn(),
    getRandomAvatar: jest.fn(),
    AllowedAvatar: {},
    isValidAvatar: jest.fn()
}));

// Mock username validator
jest.mock('../../../src/utils/usernameValidator', () => ({
    validateUsername: jest.fn(() => ({ isValid: true, errors: [] }))
}));

// Import after mocks
import { setupServer } from '../../../src/server';

describe('Password Reset Integration Tests', () => {
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
        Object.values(mockEmailService).forEach(mock => {
            if (typeof mock === 'function' && 'mockClear' in mock) {
                mock.mockClear();
            }
        });
    });

    describe('Email Content Validation', () => {
        it('should send email with correct username and token in proper order', async () => {
            mockUserService.requestPasswordReset.mockResolvedValue(undefined);

            const response = await request(httpServer)
                .post('/api/v1/auth/reset-password')
                .send({
                    email: 'test@example.com'
                })
                .expect(200);

            expect(response.body).toEqual({
                message: 'Password reset email sent if account exists',
                success: true
            });

            expect(mockUserService.requestPasswordReset).toHaveBeenCalledWith('test@example.com');
        });
    });

    describe('Password Reset Confirmation', () => {
        it('should successfully reset password with valid token', async () => {
            mockUserService.resetPasswordWithToken.mockResolvedValue(undefined);

            const response = await request(httpServer)
                .post('/api/v1/auth/reset-password/confirm')
                .send({
                    token: 'valid-reset-token',
                    newPassword: 'newpassword123'
                })
                .expect(200);

            expect(response.body).toEqual({
                message: 'Password reset successful'
            });

            expect(mockUserService.resetPasswordWithToken).toHaveBeenCalledWith('valid-reset-token', 'newpassword123');
        });

        it('should reject invalid or expired token', async () => {
            mockUserService.resetPasswordWithToken.mockRejectedValue(new Error('Invalid or expired reset token'));

            const response = await request(httpServer)
                .post('/api/v1/auth/reset-password/confirm')
                .send({
                    token: 'invalid-token',
                    newPassword: 'newpassword123'
                })
                .expect(400);

            expect(response.body).toEqual({
                error: 'Invalid or expired reset token'
            });
        });

        it('should reject password that is too short', async () => {
            const response = await request(httpServer)
                .post('/api/v1/auth/reset-password/confirm')
                .send({
                    token: 'some-token',
                    newPassword: '12345' // Too short
                })
                .expect(400);

            expect(response.body).toEqual({
                error: 'Password must be at least 6 characters long'
            });
        });

        it('should reject missing token or password', async () => {
            const response = await request(httpServer)
                .post('/api/v1/auth/reset-password/confirm')
                .send({
                    token: 'some-token'
                    // Missing newPassword
                })
                .expect(400);

            expect(response.body).toEqual({
                error: 'Token and new password are required'
            });
        });
    });
});