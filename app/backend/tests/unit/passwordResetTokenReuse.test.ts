require('../setupTestEnv');

import { UserService } from '@/core/services/userService';

// Mock EmailService
jest.mock('@/core/services/emailService', () => ({
    EmailService: jest.fn().mockImplementation(() => ({
        sendVerificationEmail: jest.fn().mockResolvedValue(true),
        sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
        sendWelcomeEmail: jest.fn().mockResolvedValue(true)
    }))
}));

// Mock logger
jest.mock('@/utils/logger', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }))
}));

// Mock Prisma
jest.mock('@/db/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
            create: jest.fn()
        }
    }
}));

// Get reference to the mocked prisma for use in tests
const { prisma } = require('@/db/prisma');

// Mock crypto
jest.mock('crypto', () => ({
    randomBytes: jest.fn(() => ({
        toString: jest.fn(() => 'test-reset-token-12345')
    }))
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
    hash: jest.fn(() => Promise.resolve('hashed-password'))
}));

describe('Password Reset Token Reuse Bug Test', () => {
    let userService: UserService;

    beforeEach(() => {
        jest.clearAllMocks();
        userService = new UserService();
    });

    it('should prevent password reset token reuse after successful use', async () => {
        // Mock user with valid reset token
        const mockUser = {
            id: 'user-123',
            email: 'test@example.com',
            resetToken: 'test-reset-token-12345',
            resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
            passwordHash: 'old-hash'
        };

        // First call: token exists and is valid
        prisma.user.findFirst
            .mockResolvedValueOnce(mockUser)
            .mockResolvedValueOnce(null); // Second call: token should be gone

        prisma.user.update.mockResolvedValue({
            ...mockUser,
            passwordHash: 'hashed-password',
            resetToken: null,
            resetTokenExpiresAt: null
        });

        // First reset attempt - should succeed
        await expect(userService.resetPasswordWithToken('test-reset-token-12345', 'newpassword123'))
            .resolves.not.toThrow();

        // Verify the token was cleared
        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 'user-123' },
            data: {
                passwordHash: 'hashed-password',
                resetToken: null,
                resetTokenExpiresAt: null,
            },
        });

        // Second reset attempt with same token - should fail
        await expect(userService.resetPasswordWithToken('test-reset-token-12345', 'anotherpassword123'))
            .rejects.toThrow('Invalid or expired reset token');

        // Verify we tried to find the user with the token again
        expect(prisma.user.findFirst).toHaveBeenCalledTimes(2);
        expect(prisma.user.findFirst).toHaveBeenNthCalledWith(2, {
            where: {
                resetToken: 'test-reset-token-12345',
                resetTokenExpiresAt: {
                    gt: expect.any(Date),
                },
            },
        });
    });

    it('should handle concurrent token usage (race condition test)', async () => {
        // Mock user with valid reset token
        const mockUser = {
            id: 'user-123',
            email: 'test@example.com',
            resetToken: 'test-reset-token-12345',
            resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
            passwordHash: 'old-hash'
        };

        // Both concurrent calls find the user initially
        prisma.user.findFirst
            .mockResolvedValue(mockUser);

        // First update succeeds
        prisma.user.update
            .mockResolvedValueOnce({
                ...mockUser,
                passwordHash: 'hashed-password-1',
                resetToken: null,
                resetTokenExpiresAt: null
            })
            // Second update fails (simulating concurrent modification)
            .mockRejectedValueOnce(new Error('Concurrent modification detected'));

        // First concurrent request - should succeed
        const firstPromise = userService.resetPasswordWithToken('test-reset-token-12345', 'password1');

        // Second concurrent request - should fail due to race condition
        const secondPromise = userService.resetPasswordWithToken('test-reset-token-12345', 'password2');

        await expect(firstPromise).resolves.not.toThrow();
        await expect(secondPromise).rejects.toThrow();

        // Verify both tried to find the user
        expect(prisma.user.findFirst).toHaveBeenCalledTimes(2);
    });

    it('should handle expired tokens correctly', async () => {
        // Mock user with expired reset token
        const mockUser = {
            id: 'user-123',
            email: 'test@example.com',
            resetToken: 'expired-token-12345',
            resetTokenExpiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
            passwordHash: 'old-hash'
        };

        // Mock findFirst to return null for expired tokens (simulating Prisma's gt filter)
        prisma.user.findFirst.mockImplementation((args: { where?: { resetTokenExpiresAt?: { gt?: Date } } }) => {
            if (args?.where?.resetTokenExpiresAt?.gt) {
                const now = new Date();
                if (mockUser.resetTokenExpiresAt <= now) {
                    return Promise.resolve(null); // Token is expired
                }
            }
            return Promise.resolve(mockUser);
        });

        // Attempt to use expired token - should fail
        await expect(userService.resetPasswordWithToken('expired-token-12345', 'newpassword123'))
            .rejects.toThrow('Invalid or expired reset token');

        // Verify we didn't try to update the password
        expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should handle non-existent tokens correctly', async () => {
        // No user found with token
        prisma.user.findFirst.mockResolvedValue(null);

        // Attempt to use non-existent token - should fail
        await expect(userService.resetPasswordWithToken('non-existent-token', 'newpassword123'))
            .rejects.toThrow('Invalid or expired reset token');

        // Verify we didn't try to update the password
        expect(prisma.user.update).not.toHaveBeenCalled();
    });
});