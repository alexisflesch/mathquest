import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';
import { UserRole, UserRegistrationData, UserLoginData, UserUpgradeData, AuthResponse } from '@shared/types/core';

const logger = createLogger('UserService');
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'mathquest_default_secret';
const JWT_EXPIRES_IN = '24h';

export class UserService {
    /**
     * Register a new user (student or teacher)
     */
    async registerUser(data: UserRegistrationData): Promise<AuthResponse> {
        try {
            const { username, email, password, role, cookieId: providedCookieId, avatarEmoji } = data;
            let existingUser = null;
            if (email) {
                existingUser = await prisma.user.findFirst({ where: { email } });
            }
            if (existingUser) {
                throw new Error('User with this email already exists');
            }
            // Use provided cookieId for students, or generate one if not provided
            let cookieId: string | undefined = undefined;
            if (role === 'STUDENT') {
                cookieId = providedCookieId || crypto.randomBytes(32).toString('hex');
            }
            // Prepare user data
            const userData: any = {
                username,
                email,
                role,
            };
            if (avatarEmoji) userData.avatarEmoji = avatarEmoji;
            if (cookieId) userData.studentProfile = { create: { cookieId } };
            if (password) userData.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
            // Create the user in the database
            const user = await prisma.user.create({
                data: userData,
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    avatarEmoji: true,
                },
            });
            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, username: user.username, role: user.role },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );
            return {
                token,
                user: user.email === null
                    ? { id: user.id, username: user.username, role: user.role, avatarEmoji: user.avatarEmoji }
                    : { id: user.id, username: user.username, role: user.role, email: user.email, avatarEmoji: user.avatarEmoji },
            };
        } catch (error) {
            logger.error({ error }, 'Error registering user');
            throw error;
        }
    }

    /**
     * Login a user (teacher or student with email/password)
     */
    async loginUser(data: UserLoginData): Promise<AuthResponse> {
        try {
            const { email, password } = data;
            const user = await prisma.user.findUnique({
                where: { email },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    passwordHash: true,
                    role: true,
                    avatarEmoji: true
                }
            });
            if (!user || !user.passwordHash) {
                throw new Error('Invalid email or password');
            }
            const passwordMatch = await bcrypt.compare(password, user.passwordHash);
            if (!passwordMatch) {
                throw new Error('Invalid email or password');
            }
            const token = jwt.sign(
                { userId: user.id, username: user.username, role: user.role },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );
            return {
                token,
                user: user.email === null
                    ? { id: user.id, username: user.username, role: user.role, avatarEmoji: user.avatarEmoji }
                    : { id: user.id, username: user.username, role: user.role, email: user.email, avatarEmoji: user.avatarEmoji },
            };
        } catch (error) {
            logger.error({ error }, 'Error logging in user');
            throw error;
        }
    }

    /**
     * Get a user by ID
     */
    async getUserById(id: string) {
        try {
            return await prisma.user.findUnique({
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
        } catch (error) {
            logger.error({ error }, `Error fetching user with ID ${id}`);
            throw error;
        }
    }

    /**
     * Get a user by cookieId (for students)
     */
    async getUserByCookieId(cookieId: string) {
        try {
            return await prisma.user.findFirst({
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
        } catch (error) {
            logger.error({ error }, `Error fetching user with cookieId ${cookieId}`);
            throw error;
        }
    }

    /**
     * Get a user by email
     */
    async getUserByEmail(email: string) {
        try {
            return await prisma.user.findUnique({
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
        } catch (error) {
            logger.error({ error }, `Error fetching user with email ${email}`);
            throw error;
        }
    }

    /**
     * Generate and store a password reset token for a user
     */
    async generatePasswordResetToken(email: string): Promise<string> {
        try {
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user || user.role !== 'TEACHER') {
                // Don't reveal if email exists for security
                throw new Error('If this email exists, a reset link has been sent');
            }

            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

            await prisma.user.update({
                where: { email },
                data: {
                    resetToken,
                    resetTokenExpiresAt,
                },
            });

            logger.info({ email, resetToken }, 'Password reset token generated');
            return resetToken;
        } catch (error) {
            logger.error({ error, email }, 'Error generating password reset token');
            throw error;
        }
    }

    /**
     * Validate a password reset token and reset the password
     */
    async resetPasswordWithToken(token: string, newPassword: string): Promise<void> {
        try {
            if (!token || !newPassword) {
                throw new Error('Token and new password are required');
            }

            if (newPassword.length < 6) {
                throw new Error('Password must be at least 6 characters long');
            }

            const user = await prisma.user.findFirst({
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

            const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordHash,
                    resetToken: null,
                    resetTokenExpiresAt: null,
                },
            });

            logger.info({ userId: user.id }, 'Password reset successful');
        } catch (error) {
            logger.error({ error, token }, 'Error resetting password with token');
            throw error;
        }
    }

    /**
     * Upgrade an existing user (guest→student, student→teacher, guest→teacher)
     */
    async upgradeUser(userId: string, data: UserUpgradeData): Promise<AuthResponse> {
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
            const existingUser = await prisma.user.findUnique({
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
            const userWithEmail = await prisma.user.findUnique({
                where: { email }
            });

            if (userWithEmail && userWithEmail.id !== userId) {
                throw new Error('Email already exists');
            }

            // Hash the password
            const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

            // Update user with email, password, and role
            const updatedUser = await prisma.user.update({
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
                    avatarEmoji: true
                }
            });

            // Generate JWT token with new role
            const token = jwt.sign(
                { userId: updatedUser.id, username: updatedUser.username, role: updatedUser.role },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            logger.info({ userId, targetRole, email }, 'User upgraded successfully');

            return {
                token,
                user: {
                    id: updatedUser.id,
                    username: updatedUser.username,
                    email: updatedUser.email!,
                    role: updatedUser.role
                }
            };
        } catch (error) {
            logger.error({ error, userId }, 'Error upgrading user');
            throw error;
        }
    }

    /**
     * Update user profile (username and avatar)
     */
    async updateUserProfile(userId: string, data: { username: string; avatar: string }) {
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
            const existingUser = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!existingUser) {
                throw new Error('User not found');
            }

            // Update user profile
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    username: username.trim(),
                    avatarEmoji: avatar.trim()
                }
            });

            logger.info({ userId, username, avatar }, 'User profile updated successfully');

            return updatedUser;
        } catch (error) {
            logger.error({ error, userId }, 'Error updating user profile');
            throw error;
        }
    }
}
