"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const teacherService_1 = require("@/core/services/teacherService");
const prisma_1 = require("@/db/prisma");
// Mock the prisma client
jest.mock('@/db/prisma', () => ({
    prisma: {
        teacher: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
    },
}));
// Mock bcrypt and jwt
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
describe('TeacherService', () => {
    let teacherService;
    beforeEach(() => {
        teacherService = new teacherService_1.TeacherService();
        jest.clearAllMocks();
    });
    describe('registerTeacher', () => {
        it('should register a new teacher and return token', async () => {
            // Mock prisma.teacher.findUnique to return null (no teacher found)
            prisma_1.prisma.teacher.findUnique.mockResolvedValueOnce(null);
            // Mock bcrypt.hash to return a hashed password
            bcrypt_1.default.hash.mockResolvedValueOnce('hashed_password');
            // Mock prisma.teacher.create to return a new teacher
            prisma_1.prisma.teacher.create.mockResolvedValueOnce({
                id: 'teacher-uuid',
                username: 'testteacher',
                email: 'teacher@example.com',
                passwordHash: 'hashed_password',
                createdAt: new Date(),
            });
            // Mock jwt.sign to return a token
            jsonwebtoken_1.default.sign.mockReturnValueOnce('mock-jwt-token');
            const result = await teacherService.registerTeacher({
                username: 'testteacher',
                email: 'teacher@example.com',
                password: 'password123',
            });
            // Check that prisma was called with the right parameters
            expect(prisma_1.prisma.teacher.findUnique).toHaveBeenCalledWith({
                where: { username: 'testteacher' },
            });
            expect(prisma_1.prisma.teacher.create).toHaveBeenCalledWith({
                data: {
                    username: 'testteacher',
                    email: 'teacher@example.com',
                    passwordHash: 'hashed_password',
                },
            });
            // Check that jwt.sign was called with the right parameters
            expect(jsonwebtoken_1.default.sign).toHaveBeenCalledWith({ teacherId: 'teacher-uuid', username: 'testteacher' }, expect.any(String), { expiresIn: '24h' });
            // Check the returned value
            expect(result).toEqual({
                token: 'mock-jwt-token',
                teacher: {
                    id: 'teacher-uuid',
                    username: 'testteacher',
                    email: 'teacher@example.com',
                },
            });
        });
        it('should throw an error if teacher with username already exists', async () => {
            // Mock prisma.teacher.findUnique to return an existing teacher
            prisma_1.prisma.teacher.findUnique.mockResolvedValueOnce({
                id: 'existing-teacher-uuid',
                username: 'testteacher',
            });
            await expect(teacherService.registerTeacher({
                username: 'testteacher',
                password: 'password123',
            })).rejects.toThrow('Teacher with this username already exists');
        });
    });
    describe('loginTeacher', () => {
        it('should login a teacher and return token', async () => {
            // Mock prisma.teacher.findUnique to return a teacher
            prisma_1.prisma.teacher.findUnique.mockResolvedValueOnce({
                id: 'teacher-uuid',
                username: 'testteacher',
                email: 'teacher@example.com',
                passwordHash: 'hashed_password',
            });
            // Mock bcrypt.compare to return true (password matches)
            bcrypt_1.default.compare.mockResolvedValueOnce(true);
            // Mock jwt.sign to return a token
            jsonwebtoken_1.default.sign.mockReturnValueOnce('mock-jwt-token');
            const result = await teacherService.loginTeacher({
                email: 'teacher@example.com',
                password: 'password123',
            });
            // Check that prisma was called with the right parameters
            expect(prisma_1.prisma.teacher.findUnique).toHaveBeenCalledWith({
                where: { email: 'teacher@example.com' },
            });
            // Check that bcrypt.compare was called with the right parameters
            expect(bcrypt_1.default.compare).toHaveBeenCalledWith('password123', 'hashed_password');
            // Check that jwt.sign was called with the right parameters
            expect(jsonwebtoken_1.default.sign).toHaveBeenCalledWith({ teacherId: 'teacher-uuid', username: 'testteacher' }, expect.any(String), { expiresIn: '24h' });
            // Check the returned value
            expect(result).toEqual({
                token: 'mock-jwt-token',
                teacher: {
                    id: 'teacher-uuid',
                    username: 'testteacher',
                    email: 'teacher@example.com',
                },
            });
        });
        it('should throw an error if teacher is not found', async () => {
            // Mock prisma.teacher.findUnique to return null (no teacher found)
            prisma_1.prisma.teacher.findUnique.mockResolvedValueOnce(null);
            await expect(teacherService.loginTeacher({
                email: 'nonexistent@example.com',
                password: 'password123',
            })).rejects.toThrow('Invalid email or password');
        });
        it('should throw an error if password does not match', async () => {
            // Mock prisma.teacher.findUnique to return a teacher
            prisma_1.prisma.teacher.findUnique.mockResolvedValueOnce({
                id: 'teacher-uuid',
                username: 'testteacher',
                passwordHash: 'hashed_password',
            });
            // Mock bcrypt.compare to return false (password doesn't match)
            bcrypt_1.default.compare.mockResolvedValueOnce(false);
            await expect(teacherService.loginTeacher({
                email: 'teacher@example.com',
                password: 'wrongpassword',
            })).rejects.toThrow('Invalid email or password');
        });
    });
});
