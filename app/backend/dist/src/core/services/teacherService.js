"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
// Create a service-specific logger
const logger = (0, logger_1.default)('TeacherService');
// Number of salt rounds for bcrypt
const SALT_ROUNDS = 10;
// JWT secret key should be stored in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'mathquest_default_secret';
// JWT expiration time (e.g., 24 hours)
const JWT_EXPIRES_IN = '24h';
/**
 * Teacher service class for handling teacher-related operations
 */
class TeacherService {
    /**
     * Register a new teacher
     */
    async registerTeacher(data) {
        try {
            const { username, email, password } = data;
            // Check if teacher with the same username already exists
            const existingTeacher = await prisma_1.prisma.teacher.findUnique({
                where: { username },
            });
            if (existingTeacher) {
                throw new Error('Teacher with this username already exists');
            }
            // Check if email is provided and if it's already in use
            if (email) {
                const teacherWithEmail = await prisma_1.prisma.teacher.findUnique({
                    where: { email },
                });
                if (teacherWithEmail) {
                    throw new Error('Teacher with this email already exists');
                }
            }
            // Hash the password
            const passwordHash = await bcrypt_1.default.hash(password, SALT_ROUNDS);
            // Create the teacher in the database
            const teacher = await prisma_1.prisma.teacher.create({
                data: {
                    username,
                    email,
                    passwordHash,
                },
            });
            // Generate JWT token
            const token = jsonwebtoken_1.default.sign({ teacherId: teacher.id, username: teacher.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
            return {
                token,
                teacher: {
                    id: teacher.id,
                    username: teacher.username,
                    email: teacher.email || undefined,
                },
            };
        }
        catch (error) {
            logger.error({ error }, 'Error registering teacher');
            throw error;
        }
    }
    /**
     * Login a teacher
     */
    async loginTeacher(data) {
        try {
            const { email, password } = data;
            // Find the teacher by email
            const teacher = await prisma_1.prisma.teacher.findUnique({
                where: { email },
            });
            if (!teacher) {
                throw new Error('Invalid email or password');
            }
            // Compare passwords
            const passwordMatch = await bcrypt_1.default.compare(password, teacher.passwordHash);
            if (!passwordMatch) {
                throw new Error('Invalid email or password');
            }
            // Generate JWT token
            const token = jsonwebtoken_1.default.sign({ teacherId: teacher.id, username: teacher.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
            return {
                token,
                teacher: {
                    id: teacher.id,
                    username: teacher.username,
                    email: teacher.email || undefined,
                },
            };
        }
        catch (error) {
            logger.error({ error }, 'Error logging in teacher');
            throw error;
        }
    }
    /**
     * Get a teacher by ID
     */
    async getTeacherById(id) {
        try {
            return await prisma_1.prisma.teacher.findUnique({
                where: { id },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    createdAt: true,
                    avatarUrl: true,
                },
            });
        }
        catch (error) {
            logger.error({ error }, `Error fetching teacher with ID ${id}`);
            throw error;
        }
    }
}
exports.TeacherService = TeacherService;
