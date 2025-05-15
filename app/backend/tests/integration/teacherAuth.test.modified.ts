// filepath: /home/aflesch/mathquest/app/backend/tests/integration/teacherAuth.test.ts
import request from 'supertest';
import { app } from '../../src/server';
import { prisma } from '../../src/db/prisma';
import bcrypt from 'bcrypt';

// Mock the prisma client
jest.mock('../../src/db/prisma', () => ({
    prisma: {
        teacher: {
            findUnique: jest.fn(),
            create: jest.fn(),
        }
    }
}));

describe('Teacher Authentication API', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    // No need to close server as we're using the app directly

    describe('POST /api/v1/teachers/register', () => {
        it('should register a new teacher', async () => {
            // Mock prisma.teacher.findUnique to return null (no teacher found)
            (prisma.teacher.findUnique as jest.Mock).mockResolvedValueOnce(null);

            // Mock prisma.teacher.create to return a new teacher
            (prisma.teacher.create as jest.Mock).mockResolvedValueOnce({
                id: 'teacher-uuid',
                username: 'testteacher',
                email: 'teacher@example.com',
                passwordHash: 'hashed_password',
                createdAt: new Date(),
            });

            const res = await request(app)
                .post('/api/v1/teachers/register')
                .send({
                    username: 'testteacher',
                    email: 'teacher@example.com',
                    password: 'password123',
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('teacher');
            expect(res.body.teacher).toHaveProperty('id', 'teacher-uuid');
            expect(res.body.teacher).toHaveProperty('username', 'testteacher');
            expect(res.body.teacher).toHaveProperty('email', 'teacher@example.com');
        });

        it('should return 400 if username is missing', async () => {
            const res = await request(app)
                .post('/api/v1/teachers/register')
                .send({
                    email: 'teacher@example.com',
                    password: 'password123',
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Username and password are required');
        });

        it('should return 400 if password is missing', async () => {
            const res = await request(app)
                .post('/api/v1/teachers/register')
                .send({
                    username: 'testteacher',
                    email: 'teacher@example.com',
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Username and password are required');
        });

        it('should return 400 if password is too short', async () => {
            const res = await request(app)
                .post('/api/v1/teachers/register')
                .send({
                    username: 'testteacher',
                    email: 'teacher@example.com',
                    password: '12345',
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Password must be at least 6 characters long');
        });

        it('should return 409 if username already exists', async () => {
            // Mock prisma.teacher.findUnique to return an existing teacher
            (prisma.teacher.findUnique as jest.Mock).mockResolvedValueOnce({
                id: 'existing-teacher-uuid',
                username: 'existingteacher',
            });

            const res = await request(app)
                .post('/api/v1/teachers/register')
                .send({
                    username: 'existingteacher',
                    password: 'password123',
                });

            expect(res.status).toBe(409);
            expect(res.body).toHaveProperty('error', 'Teacher with this username already exists');
        });
    });

    describe('POST /api/v1/teachers/login', () => {
        it('should login a teacher with valid credentials', async () => {
            // Mock prisma.teacher.findUnique to return a teacher
            (prisma.teacher.findUnique as jest.Mock).mockResolvedValueOnce({
                id: 'teacher-uuid',
                username: 'testteacher',
                email: 'teacher@example.com',
                passwordHash: 'hashed_password',
            });

            // Mock bcrypt.compare to return true (password matches)
            jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true as never);

            const res = await request(app)
                .post('/api/v1/teachers/login')
                .send({
                    username: 'testteacher',
                    password: 'password123',
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('teacher');
            expect(res.body.teacher).toHaveProperty('id', 'teacher-uuid');
            expect(res.body.teacher).toHaveProperty('username', 'testteacher');
        });

        it('should return 400 if username is missing', async () => {
            const res = await request(app)
                .post('/api/v1/teachers/login')
                .send({
                    password: 'password123',
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Username and password are required');
        });

        it('should return 400 if password is missing', async () => {
            const res = await request(app)
                .post('/api/v1/teachers/login')
                .send({
                    username: 'testteacher',
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Username and password are required');
        });

        it('should return 401 if teacher does not exist', async () => {
            // Mock prisma.teacher.findUnique to return null (no teacher found)
            (prisma.teacher.findUnique as jest.Mock).mockResolvedValueOnce(null);

            const res = await request(app)
                .post('/api/v1/teachers/login')
                .send({
                    username: 'nonexistentteacher',
                    password: 'password123',
                });

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('error', 'Invalid username or password');
        });

        it('should return 401 if password is incorrect', async () => {
            // Mock prisma.teacher.findUnique to return a teacher
            (prisma.teacher.findUnique as jest.Mock).mockResolvedValueOnce({
                id: 'teacher-uuid',
                username: 'testteacher',
                passwordHash: 'hashed_password',
            });

            // Mock bcrypt.compare to return false (password doesn't match)
            jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false as never);

            const res = await request(app)
                .post('/api/v1/teachers/login')
                .send({
                    username: 'testteacher',
                    password: 'wrongpassword',
                });

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('error', 'Invalid username or password');
        });
    });
});
