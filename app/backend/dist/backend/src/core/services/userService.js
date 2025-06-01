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
const logger = (0, logger_1.default)('UserService');
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'mathquest_default_secret';
const JWT_EXPIRES_IN = '24h';
class UserService {
    /**
     * Register a new user (student or teacher)
     */
    async registerUser(data) {
        try {
            const { username, email, password, role, cookieId: providedCookieId } = data;
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
            };
            if (cookieId)
                userData.studentProfile = { create: { cookieId } };
            if (password)
                userData.passwordHash = await bcrypt_1.default.hash(password, SALT_ROUNDS);
            // Create the user in the database
            const user = await prisma_1.prisma.user.create({
                data: userData,
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                },
            });
            // Generate JWT token
            const token = jsonwebtoken_1.default.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
            const userClean = {
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
            const user = await prisma_1.prisma.user.findUnique({ where: { email } });
            if (!user || !user.passwordHash) {
                throw new Error('Invalid email or password');
            }
            const passwordMatch = await bcrypt_1.default.compare(password, user.passwordHash);
            if (!passwordMatch) {
                throw new Error('Invalid email or password');
            }
            const token = jsonwebtoken_1.default.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
            return {
                token,
                user: user.email === null
                    ? { id: user.id, username: user.username, role: user.role }
                    : { id: user.id, username: user.username, role: user.role, email: user.email },
            };
        }
        catch (error) {
            logger.error({ error }, 'Error logging in user');
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
                    avatarUrl: true,
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
                    avatarUrl: true,
                },
            });
        }
        catch (error) {
            logger.error({ error }, `Error fetching user with cookieId ${cookieId}`);
            throw error;
        }
    }
}
exports.UserService = UserService;
