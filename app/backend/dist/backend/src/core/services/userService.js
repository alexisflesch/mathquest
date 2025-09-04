"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
const emailService_1 = require("./emailService");
const logger = (0, logger_1.default)('UserService');
const emailService = new emailService_1.EmailService();
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'mathquest_default_secret';
const JWT_EXPIRES_IN = '24h';
class UserService {
    /**
     * Register a new user (student or teacher)
     */
    async registerUser(data) {
        try {
            const { username, email, password, role, cookieId: providedCookieId, avatarEmoji } = data;
            let existingUser = null;
            if (email) {
                existingUser = await prisma_1.prisma.user.findFirst({ where: { email } });
            }
            if (existingUser) {
                throw new Error('User with this email already exists');
            }
            // Use provided cookieId for students, or generate one if not provided
            let cookieId = undefined;
            if (role === 'STUDENT') {
                cookieId = providedCookieId || crypto_1.default.randomBytes(32).toString('hex');
            }
            // Prepare user data
            const userData = {
                username,
                email,
                role,
                avatarEmoji: avatarEmoji || '🐼', // Default to panda emoji if not provided
            };
            if (cookieId)
                userData.studentProfile = { create: { cookieId } };
            if (password)
                userData.passwordHash = await bcrypt_1.default.hash(password, SALT_ROUNDS);
            // Always create a TeacherProfile for TEACHER role
            if (role === 'TEACHER') {
                userData.teacherProfile = { create: {} };
            }
            // Create the user in the database
            const user = await prisma_1.prisma.user.create({
                data: userData,
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    avatarEmoji: true,
                    emailVerified: true,
                    createdAt: true,
                },
            });
            // Send email verification if user has an email
            if (email) {
                try {
                    logger.info('Attempting to send email verification', {
                        userId: user.id,
                        email: email
                    });
                    await this.sendEmailVerification(email);
                    logger.info('Email verification sent successfully', {
                        userId: user.id,
                        email: email
                    });
                }
                catch (emailError) {
                    logger.error('Failed to send verification email during registration', {
                        userId: user.id,
                        email: email,
                        error: emailError
                    });
                    // Don't fail registration if email sending fails
                }
            }
            else {
                logger.info('No email provided, skipping email verification', {
                    userId: user.id
                });
            }
            // Generate JWT token
            const token = jsonwebtoken_1.default.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
            return {
                success: true,
                token,
                userState: user.role === 'TEACHER' ? 'teacher' : 'student',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email || undefined,
                    role: user.role,
                    avatarEmoji: user.avatarEmoji || '🐼', // Fallback to default if null
                    createdAt: user.createdAt,
                    updatedAt: user.createdAt, // Use createdAt as updatedAt since updatedAt doesn't exist in schema
                },
            };
        }
        catch (error) {
            logger.error({ error }, 'Error registering user');
            throw error;
        }
    }
    /**
     * Login a user (teacher or student with email/password)
     */
    async loginUser(data) {
        try {
            const { email, password } = data;
            const user = await prisma_1.prisma.user.findUnique({
                where: { email },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    passwordHash: true,
                    role: true,
                    avatarEmoji: true,
                    createdAt: true,
                    emailVerified: true
                }
            });
            if (!user || !user.passwordHash) {
                throw new Error('Invalid email or password');
            }
            // Check if email is verified (only for users who have emails)
            if (user.email && !user.emailVerified) {
                throw new Error('Please verify your email address before logging in. Check your inbox for a verification link.');
            }
            const passwordMatch = await bcrypt_1.default.compare(password, user.passwordHash);
            if (!passwordMatch) {
                throw new Error('Invalid email or password');
            }
            const token = jsonwebtoken_1.default.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
            return {
                success: true,
                token,
                userState: user.role === 'TEACHER' ? 'teacher' : 'student',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email || undefined,
                    role: user.role,
                    avatarEmoji: user.avatarEmoji || '🐼', // Fallback to default if null
                    createdAt: user.createdAt,
                    updatedAt: user.createdAt, // Use createdAt as updatedAt since updatedAt doesn't exist in schema
                },
            };
        }
        catch (error) {
            logger.error({
                error: error instanceof Error ? error.message : JSON.stringify(error),
                stack: error instanceof Error ? error.stack : undefined,
                email: data.email
            }, 'Error logging in user');
            throw error;
        }
    }
    /**
     * Get a user by ID
     */
    async getUserById(id) {
        try {
            return await prisma_1.prisma.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    avatarEmoji: true,
                },
            });
        }
        catch (error) {
            logger.error({ error }, `Error fetching user with ID ${id}`);
            throw error;
        }
    }
    /**
     * Get a user by cookieId (for students)
     */
    async getUserByCookieId(cookieId) {
        try {
            return await prisma_1.prisma.user.findFirst({
                where: { studentProfile: { cookieId } },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    avatarEmoji: true,
                },
            });
        }
        catch (error) {
            logger.error({ error }, `Error fetching user with cookieId ${cookieId}`);
            throw error;
        }
    }
    /**
     * Get a user by email
     */
    async getUserByEmail(email) {
        try {
            return await prisma_1.prisma.user.findUnique({
                where: { email },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    avatarEmoji: true,
                },
            });
        }
        catch (error) {
            logger.error({ error }, `Error fetching user with email ${email}`);
            throw error;
        }
    }
    /**
     * Generate and store a password reset token for a user
     */
    async generatePasswordResetToken(email) {
        try {
            const user = await prisma_1.prisma.user.findUnique({ where: { email } });
            if (!user || user.role !== 'TEACHER') {
                // Don't reveal if email exists for security
                throw new Error('If this email exists, a reset link has been sent');
            }
            const resetToken = crypto_1.default.randomBytes(32).toString('hex');
            const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
            await prisma_1.prisma.user.update({
                where: { email },
                data: {
                    resetToken,
                    resetTokenExpiresAt,
                },
            });
            logger.info({ email, resetToken }, 'Password reset token generated');
            return resetToken;
        }
        catch (error) {
            logger.error({ error, email }, 'Error generating password reset token');
            throw error;
        }
    }
    /**
     * Validate a password reset token and reset the password
     */
    async resetPasswordWithToken(token, newPassword) {
        try {
            if (!token || !newPassword) {
                throw new Error('Token and new password are required');
            }
            if (newPassword.length < 6) {
                throw new Error('Password must be at least 6 characters long');
            }
            const user = await prisma_1.prisma.user.findFirst({
                where: {
                    resetToken: token,
                    resetTokenExpiresAt: {
                        gt: new Date(), // Token must not be expired
                    },
                },
            });
            if (!user) {
                throw new Error('Invalid or expired reset token');
            }
            const passwordHash = await bcrypt_1.default.hash(newPassword, SALT_ROUNDS);
            await prisma_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordHash,
                    resetToken: null,
                    resetTokenExpiresAt: null,
                },
            });
            logger.info({ userId: user.id }, 'Password reset successful');
        }
        catch (error) {
            logger.error({ error, token }, 'Error resetting password with token');
            throw error;
        }
    }
    /**
     * Upgrade an existing user (guest→student, student→teacher, guest→teacher)
     */
    async upgradeUser(userId, data) {
        try {
            const { email, password, targetRole } = data;
            // Validate input
            if (!email || !password) {
                throw new Error('Email and password are required');
            }
            if (password.length < 6) {
                throw new Error('Password must be at least 6 characters long');
            }
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error('Invalid email format');
            }
            // Check if user exists
            const existingUser = await prisma_1.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    studentProfile: true,
                    teacherProfile: true
                }
            });
            if (!existingUser) {
                throw new Error('User not found');
            }
            // Check if email is already taken by another user
            const userWithEmail = await prisma_1.prisma.user.findUnique({
                where: { email }
            });
            if (userWithEmail && userWithEmail.id !== userId) {
                throw new Error('Email already exists');
            }
            // Hash the password
            const passwordHash = await bcrypt_1.default.hash(password, SALT_ROUNDS);
            // Update user with email, password, and role
            const updatedUser = await prisma_1.prisma.user.update({
                where: { id: userId },
                data: {
                    email,
                    passwordHash,
                    role: targetRole,
                    // Create teacher profile if upgrading to teacher
                    ...(targetRole === 'TEACHER' && !existingUser.teacherProfile && {
                        teacherProfile: {
                            create: {}
                        }
                    })
                },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    avatarEmoji: true,
                    createdAt: true
                }
            });
            // Generate JWT token with new role
            const token = jsonwebtoken_1.default.sign({ userId: updatedUser.id, username: updatedUser.username, role: updatedUser.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
            logger.info({ userId, targetRole, email }, 'User upgraded successfully');
            return {
                success: true,
                token,
                userState: updatedUser.role === 'TEACHER' ? 'teacher' : 'student',
                user: {
                    id: updatedUser.id,
                    username: updatedUser.username,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    avatarEmoji: updatedUser.avatarEmoji || '🐼', // Fallback to default if null
                    createdAt: updatedUser.createdAt,
                    updatedAt: updatedUser.createdAt, // Use createdAt as updatedAt since updatedAt doesn't exist in schema
                }
            };
        }
        catch (error) {
            logger.error({ error, userId }, 'Error upgrading user');
            throw error;
        }
    }
    /**
     * Update user profile (username and avatar)
     */
    async updateUserProfile(userId, data) {
        try {
            const { username, avatar } = data;
            // Validate input
            if (!username || username.trim().length === 0) {
                throw new Error('Username is required');
            }
            if (!avatar || avatar.trim().length === 0) {
                throw new Error('Avatar is required');
            }
            // Check if user exists
            const existingUser = await prisma_1.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!existingUser) {
                throw new Error('User not found');
            }
            // Update user profile
            const updatedUser = await prisma_1.prisma.user.update({
                where: { id: userId },
                data: {
                    username: username.trim(),
                    avatarEmoji: avatar.trim()
                }
            });
            logger.info({ userId, username, avatar }, 'User profile updated successfully');
            return updatedUser;
        }
        catch (error) {
            logger.error({ error, userId }, 'Error updating user profile');
            throw error;
        }
    }
    /**
     * Upgrade user role (student→teacher) without changing password
     */
    async upgradeUserRole(userId, targetRole) {
        try {
            // Check if user exists
            const existingUser = await prisma_1.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    studentProfile: true,
                    teacherProfile: true
                }
            });
            if (!existingUser) {
                throw new Error('User not found');
            }
            // Update user role
            const updatedUser = await prisma_1.prisma.user.update({
                where: { id: userId },
                data: {
                    role: targetRole,
                    // Create teacher profile if upgrading to teacher
                    ...(targetRole === 'TEACHER' && !existingUser.teacherProfile && {
                        teacherProfile: {
                            create: {}
                        }
                    })
                },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    avatarEmoji: true,
                    createdAt: true
                }
            });
            // Generate JWT token with new role
            const token = jsonwebtoken_1.default.sign({ userId: updatedUser.id, username: updatedUser.username, role: updatedUser.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
            logger.info({ userId, targetRole }, 'User role upgraded successfully');
            return {
                success: true,
                token,
                userState: updatedUser.role === 'TEACHER' ? 'teacher' : 'student',
                user: {
                    id: updatedUser.id,
                    username: updatedUser.username,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    avatarEmoji: updatedUser.avatarEmoji || '🐼', // Fallback to default if null
                    createdAt: updatedUser.createdAt,
                    updatedAt: updatedUser.createdAt, // Use createdAt as updatedAt since updatedAt doesn't exist in schema
                }
            };
        }
        catch (error) {
            logger.error({ error, userId }, 'Error upgrading user role');
            throw error;
        }
    }
    /**
     * Generate and send email verification token
     */
    async sendEmailVerification(email) {
        try {
            const user = await prisma_1.prisma.user.findUnique({ where: { email } });
            if (!user) {
                // Don't reveal if email exists for security
                logger.warn({ email }, 'Email verification requested for non-existent email');
                return;
            }
            if (user.emailVerified) {
                logger.info({ email, userId: user.id }, 'Email verification requested for already verified email');
                return;
            }
            const emailVerificationToken = crypto_1.default.randomBytes(32).toString('hex');
            const emailVerificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
            await prisma_1.prisma.user.update({
                where: { email },
                data: {
                    emailVerificationToken,
                    emailVerificationTokenExpiresAt,
                },
            });
            // Send verification email
            await emailService.sendVerificationEmail(email, emailVerificationToken, user.username);
            logger.info({ email, userId: user.id }, 'Email verification token generated and sent');
        }
        catch (error) {
            logger.error({ error, email }, 'Error sending email verification');
            throw error;
        }
    }
    /**
     * Verify email using verification token
     */
    async verifyEmail(token) {
        try {
            if (!token) {
                return { success: false, message: 'Verification token is required' };
            }
            const user = await prisma_1.prisma.user.findFirst({
                where: {
                    emailVerificationToken: token,
                    emailVerificationTokenExpiresAt: {
                        gt: new Date(), // Token must not be expired
                    },
                },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    avatarEmoji: true,
                    emailVerified: true,
                    createdAt: true
                }
            });
            if (!user) {
                return { success: false, message: 'Invalid or expired verification token' };
            }
            if (user.emailVerified) {
                // Generate JWT token for already verified user
                const jwtToken = jsonwebtoken_1.default.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
                return {
                    success: true,
                    message: 'Email already verified',
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        avatarEmoji: user.avatarEmoji,
                        createdAt: user.createdAt
                    },
                    token: jwtToken
                };
            }
            await prisma_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    emailVerified: true,
                    emailVerificationToken: null,
                    emailVerificationTokenExpiresAt: null,
                },
            });
            // Generate JWT token for newly verified user
            const jwtToken = jsonwebtoken_1.default.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
            // Send welcome email
            if (user.email) {
                await emailService.sendWelcomeEmail(user.email, user.username);
            }
            logger.info({ userId: user.id, email: user.email }, 'Email verification successful');
            return {
                success: true,
                message: 'Email verified successfully',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    avatarEmoji: user.avatarEmoji,
                    createdAt: user.createdAt
                },
                token: jwtToken
            };
        }
        catch (error) {
            logger.error({ error, token }, 'Error verifying email');
            throw error;
        }
    }
    /**
     * Generate email verification token without sending email (for testing)
     */
    async generateEmailVerificationToken(email) {
        try {
            const user = await prisma_1.prisma.user.findUnique({ where: { email } });
            if (!user) {
                throw new Error('User not found');
            }
            const emailVerificationToken = crypto_1.default.randomBytes(32).toString('hex');
            const emailVerificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
            await prisma_1.prisma.user.update({
                where: { email },
                data: {
                    emailVerificationToken,
                    emailVerificationTokenExpiresAt,
                },
            });
            logger.info({ email, userId: user.id }, 'Email verification token generated');
            return emailVerificationToken;
        }
        catch (error) {
            logger.error({ error, email }, 'Error generating email verification token');
            throw error;
        }
    }
    /**
     * Enhanced password reset that also sends email
     */
    async requestPasswordReset(email) {
        try {
            const user = await prisma_1.prisma.user.findUnique({ where: { email } });
            if (!user || user.role !== 'TEACHER') {
                // Don't reveal if email exists for security
                logger.warn({ email }, 'Password reset requested for non-existent or non-teacher email');
                return;
            }
            const resetToken = crypto_1.default.randomBytes(32).toString('hex');
            const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
            await prisma_1.prisma.user.update({
                where: { email },
                data: {
                    resetToken,
                    resetTokenExpiresAt,
                },
            });
            // Send password reset email
            await emailService.sendPasswordResetEmail(email, user.username, resetToken);
            logger.info({ email, userId: user.id }, 'Password reset token generated and sent');
        }
        catch (error) {
            logger.error({ error, email }, 'Error requesting password reset');
            throw error;
        }
    }
}
exports.UserService = UserService;
