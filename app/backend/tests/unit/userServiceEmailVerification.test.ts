import { UserService } from '@/core/services/userService';
import createLogger from '@/utils/logger';

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

// Mock crypto
jest.mock('crypto', () => ({
    randomBytes: jest.fn(() => ({
        toString: jest.fn(() => 'mocked-token-123')
    }))
}));

describe('Email Verification UserService Methods', () => {
    let userService: UserService;
    let mockPrismaUser: any;

    beforeEach(() => {
        jest.clearAllMocks();
        userService = new UserService();
        // Get the mocked prisma user methods
        mockPrismaUser = require('@/db/prisma').prisma.user;
    });

    describe('sendEmailVerification', () => {
        test('should send email verification for existing user', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                username: 'testuser',
                emailVerified: false
            };

            mockPrismaUser.findUnique.mockResolvedValue(mockUser);
            mockPrismaUser.update.mockResolvedValue(mockUser);

            await userService.sendEmailVerification('test@example.com');

            expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
                where: { email: 'test@example.com' }
            });
            expect(mockPrismaUser.update).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
                data: {
                    emailVerificationToken: 'mocked-token-123',
                    emailVerificationTokenExpiresAt: expect.any(Date)
                }
            });
        });

        test('should handle non-existent user gracefully', async () => {
            mockPrismaUser.findUnique.mockResolvedValue(null);

            await expect(userService.sendEmailVerification('nonexistent@example.com'))
                .resolves
                .not.toThrow();

            expect(mockPrismaUser.update).not.toHaveBeenCalled();
        });

        test('should handle already verified user', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                username: 'testuser',
                emailVerified: true
            };

            mockPrismaUser.findUnique.mockResolvedValue(mockUser);

            await userService.sendEmailVerification('test@example.com');

            expect(mockPrismaUser.update).not.toHaveBeenCalled();
        });
    });

    describe('verifyEmail', () => {
        test('should verify email with valid token', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                username: 'testuser',
                emailVerified: false
            };

            mockPrismaUser.findFirst.mockResolvedValue(mockUser);
            mockPrismaUser.update.mockResolvedValue({ ...mockUser, emailVerified: true });

            const result = await userService.verifyEmail('valid-token-123');

            expect(result.success).toBe(true);
            expect(result.message).toBe('Email verified successfully');
            expect(mockPrismaUser.update).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                data: {
                    emailVerified: true,
                    emailVerificationToken: null,
                    emailVerificationTokenExpiresAt: null
                }
            });
        });

        test('should return failure for invalid token', async () => {
            mockPrismaUser.findFirst.mockResolvedValue(null);

            const result = await userService.verifyEmail('invalid-token');

            expect(result.success).toBe(false);
            expect(result.message).toBe('Invalid or expired verification token');
            expect(mockPrismaUser.update).not.toHaveBeenCalled();
        });

        test('should handle already verified user', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                username: 'testuser',
                emailVerified: true
            };

            mockPrismaUser.findFirst.mockResolvedValue(mockUser);

            const result = await userService.verifyEmail('valid-token-123');

            expect(result.success).toBe(true);
            expect(result.message).toBe('Email already verified');
            expect(mockPrismaUser.update).not.toHaveBeenCalled();
        });
    });

    describe('generateEmailVerificationToken', () => {
        test('should generate token for existing user', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                username: 'testuser'
            };

            mockPrismaUser.findUnique.mockResolvedValue(mockUser);
            mockPrismaUser.update.mockResolvedValue(mockUser);

            const token = await userService.generateEmailVerificationToken('test@example.com');

            expect(token).toBe('mocked-token-123');
            expect(mockPrismaUser.update).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
                data: {
                    emailVerificationToken: 'mocked-token-123',
                    emailVerificationTokenExpiresAt: expect.any(Date)
                }
            });
        });

        test('should throw error for non-existent user', async () => {
            mockPrismaUser.findUnique.mockResolvedValue(null);

            await expect(userService.generateEmailVerificationToken('nonexistent@example.com'))
                .rejects
                .toThrow('User not found');
        });
    });

    describe('requestPasswordReset', () => {
        test('should request password reset for teacher user', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'teacher@example.com',
                username: 'teacher',
                role: 'TEACHER'
            };

            mockPrismaUser.findUnique.mockResolvedValue(mockUser);
            mockPrismaUser.update.mockResolvedValue(mockUser);

            await userService.requestPasswordReset('teacher@example.com');

            expect(mockPrismaUser.update).toHaveBeenCalledWith({
                where: { email: 'teacher@example.com' },
                data: {
                    resetToken: 'mocked-token-123',
                    resetTokenExpiresAt: expect.any(Date)
                }
            });
        });

        test('should handle non-teacher user gracefully', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'student@example.com',
                username: 'student',
                role: 'STUDENT'
            };

            mockPrismaUser.findUnique.mockResolvedValue(mockUser);

            await expect(userService.requestPasswordReset('student@example.com'))
                .resolves
                .not.toThrow();

            expect(mockPrismaUser.update).not.toHaveBeenCalled();
        });

        test('should handle non-existent user gracefully', async () => {
            mockPrismaUser.findUnique.mockResolvedValue(null);

            await expect(userService.requestPasswordReset('nonexistent@example.com'))
                .resolves
                .not.toThrow();

            expect(mockPrismaUser.update).not.toHaveBeenCalled();
        });
    });
});
