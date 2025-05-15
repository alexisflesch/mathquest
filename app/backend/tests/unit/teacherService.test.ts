
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { TeacherService } from '@/core/services/teacherService';
import { prisma } from '@/db/prisma';

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
    let teacherService: TeacherService;

    beforeEach(() => {
        teacherService = new TeacherService();
        jest.clearAllMocks();
    });

    describe('registerTeacher', () => {
        it('should register a new teacher and return token', async () => {
            // Mock prisma.teacher.findUnique to return null (no teacher found)
            (prisma.teacher.findUnique as jest.Mock).mockResolvedValueOnce(null);

            // Mock bcrypt.hash to return a hashed password
            (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_password');

            // Mock prisma.teacher.create to return a new teacher
            (prisma.teacher.create as jest.Mock).mockResolvedValueOnce({
                id: 'teacher-uuid',
                username: 'testteacher',
                email: 'teacher@example.com',
                passwordHash: 'hashed_password',
                createdAt: new Date(),
            });

            // Mock jwt.sign to return a token
            (jwt.sign as jest.Mock).mockReturnValueOnce('mock-jwt-token');

            const result = await teacherService.registerTeacher({
                username: 'testteacher',
                email: 'teacher@example.com',
                password: 'password123',
            });

            // Check that prisma was called with the right parameters
            expect(prisma.teacher.findUnique).toHaveBeenCalledWith({
                where: { username: 'testteacher' },
            });

            expect(prisma.teacher.create).toHaveBeenCalledWith({
                data: {
                    username: 'testteacher',
                    email: 'teacher@example.com',
                    passwordHash: 'hashed_password',
                },
            });

            // Check that jwt.sign was called with the right parameters
            expect(jwt.sign).toHaveBeenCalledWith(
                { teacherId: 'teacher-uuid', username: 'testteacher' },
                expect.any(String),
                { expiresIn: '24h' }
            );

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
            (prisma.teacher.findUnique as jest.Mock).mockResolvedValueOnce({
                id: 'existing-teacher-uuid',
                username: 'testteacher',
            });

            await expect(
                teacherService.registerTeacher({
                    username: 'testteacher',
                    password: 'password123',
                })
            ).rejects.toThrow('Teacher with this username already exists');
        });
    });

    describe('loginTeacher', () => {
        it('should login a teacher and return token', async () => {
            // Mock prisma.teacher.findUnique to return a teacher
            (prisma.teacher.findUnique as jest.Mock).mockResolvedValueOnce({
                id: 'teacher-uuid',
                username: 'testteacher',
                email: 'teacher@example.com',
                passwordHash: 'hashed_password',
            });

            // Mock bcrypt.compare to return true (password matches)
            (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

            // Mock jwt.sign to return a token
            (jwt.sign as jest.Mock).mockReturnValueOnce('mock-jwt-token');

            const result = await teacherService.loginTeacher({
                email: 'teacher@example.com',
                password: 'password123',
            });

            // Check that prisma was called with the right parameters
            expect(prisma.teacher.findUnique).toHaveBeenCalledWith({
                where: { email: 'teacher@example.com' },
            });

            // Check that bcrypt.compare was called with the right parameters
            expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');

            // Check that jwt.sign was called with the right parameters
            expect(jwt.sign).toHaveBeenCalledWith(
                { teacherId: 'teacher-uuid', username: 'testteacher' },
                expect.any(String),
                { expiresIn: '24h' }
            );

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
            (prisma.teacher.findUnique as jest.Mock).mockResolvedValueOnce(null);

            await expect(
                teacherService.loginTeacher({
                    email: 'nonexistent@example.com',
                    password: 'password123',
                })
            ).rejects.toThrow('Invalid email or password');
        });

        it('should throw an error if password does not match', async () => {
            // Mock prisma.teacher.findUnique to return a teacher
            (prisma.teacher.findUnique as jest.Mock).mockResolvedValueOnce({
                id: 'teacher-uuid',
                username: 'testteacher',
                passwordHash: 'hashed_password',
            });

            // Mock bcrypt.compare to return false (password doesn't match)
            (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

            await expect(
                teacherService.loginTeacher({
                    email: 'teacher@example.com',
                    password: 'wrongpassword',
                })
            ).rejects.toThrow('Invalid email or password');
        });
    });
});
