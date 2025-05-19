import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';

const logger = createLogger('UserService');
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'mathquest_default_secret';
const JWT_EXPIRES_IN = '24h';

export type UserRole = 'STUDENT' | 'TEACHER';

export interface UserRegistrationData {
    username: string;
    email?: string;
    password?: string;
    role: UserRole;
}

export interface UserLoginData {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        username: string;
        email?: string;
        role: UserRole;
    };
}

export class UserService {
    /**
     * Register a new user (student or teacher)
     */
    async registerUser(data: UserRegistrationData): Promise<AuthResponse> {
        try {
            const { username, email, password, role } = data;
            let existingUser = null;
            if (email) {
                existingUser = await prisma.user.findFirst({ where: { email } });
            }
            if (existingUser) {
                throw new Error('User with this email already exists');
            }
            // Generate a unique cookieId for students
            let cookieId: string | undefined = undefined;
            if (role === 'STUDENT') {
                cookieId = crypto.randomBytes(32).toString('hex');
            }
            // Prepare user data
            const userData: any = {
                username,
                email,
                role,
            };
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
                },
            });
            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, username: user.username, role: user.role },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );
            const userClean: { id: string; username: string; role: UserRole; email?: string } = {
                id: user.id,
                username: user.username,
                role: user.role,
            };
            if (user.email !== null) {
                userClean.email = user.email;
            }
            return {
                token,
                user: user.email === null
                    ? { id: user.id, username: user.username, role: user.role }
                    : { id: user.id, username: user.username, role: user.role, email: user.email },
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
            const user = await prisma.user.findUnique({ where: { email } });
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
                    ? { id: user.id, username: user.username, role: user.role }
                    : { id: user.id, username: user.username, role: user.role, email: user.email },
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
                    avatarUrl: true,
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
                    avatarUrl: true,
                },
            });
        } catch (error) {
            logger.error({ error }, `Error fetching user with cookieId ${cookieId}`);
            throw error;
        }
    }
}
