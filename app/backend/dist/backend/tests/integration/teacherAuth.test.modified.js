"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// filepath: /home/aflesch/mathquest/app/backend/tests/integration/teacherAuth.test.ts
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../../src/server");
const prisma_1 = require("../../src/db/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
// Mock the prisma client
jest.mock('../../src/db/prisma', () => ({
    prisma: {
        user: {
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
            // Mock prisma.user.findUnique to return null (no teacher found)
            prisma_1.prisma.user.findUnique.mockResolvedValueOnce(null);
            // Mock prisma.user.create to return a new teacher user
            prisma_1.prisma.user.create.mockResolvedValueOnce({
                id: 'teacher-uuid',
                username: 'testteacher',
                email: 'teacher@example.com',
                passwordHash: 'hashed_password',
                role: 'TEACHER',
                createdAt: new Date(),
            });
            const res = await (0, supertest_1.default)(server_1.app)
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
            const res = await (0, supertest_1.default)(server_1.app)
                .post('/api/v1/teachers/register')
                .send({
                email: 'teacher@example.com',
                password: 'password123',
            });
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Username and password are required');
        });
        it('should return 400 if password is missing', async () => {
            const res = await (0, supertest_1.default)(server_1.app)
                .post('/api/v1/teachers/register')
                .send({
                username: 'testteacher',
                email: 'teacher@example.com',
            });
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Username and password are required');
        });
        it('should return 400 if password is too short', async () => {
            const res = await (0, supertest_1.default)(server_1.app)
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
            // Mock prisma.user.findUnique to return an existing teacher
            prisma_1.prisma.user.findUnique.mockResolvedValueOnce({
                id: 'existing-teacher-uuid',
                username: 'existingteacher',
                role: 'TEACHER',
            });
            const res = await (0, supertest_1.default)(server_1.app)
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
            // Mock prisma.user.findUnique to return a teacher
            prisma_1.prisma.user.findUnique.mockResolvedValueOnce({
                id: 'teacher-uuid',
                username: 'testteacher',
                email: 'teacher@example.com',
                passwordHash: 'hashed_password',
                role: 'TEACHER',
            });
            // Mock bcrypt.compare to return true (password matches)
            jest.spyOn(bcrypt_1.default, 'compare').mockResolvedValueOnce(true);
            const res = await (0, supertest_1.default)(server_1.app)
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
            const res = await (0, supertest_1.default)(server_1.app)
                .post('/api/v1/teachers/login')
                .send({
                password: 'password123',
            });
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Username and password are required');
        });
        it('should return 400 if password is missing', async () => {
            const res = await (0, supertest_1.default)(server_1.app)
                .post('/api/v1/teachers/login')
                .send({
                username: 'testteacher',
            });
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Username and password are required');
        });
        it('should return 401 if teacher does not exist', async () => {
            // Mock prisma.user.findUnique to return null (no teacher found)
            prisma_1.prisma.user.findUnique.mockResolvedValueOnce(null);
            const res = await (0, supertest_1.default)(server_1.app)
                .post('/api/v1/teachers/login')
                .send({
                username: 'nonexistentteacher',
                password: 'password123',
            });
            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('error', 'Invalid username or password');
        });
        it('should return 401 if password is incorrect', async () => {
            // Mock prisma.user.findUnique to return a teacher
            prisma_1.prisma.user.findUnique.mockResolvedValueOnce({
                id: 'teacher-uuid',
                username: 'testteacher',
                passwordHash: 'hashed_password',
                role: 'TEACHER',
            });
            // Mock bcrypt.compare to return false (password doesn't match)
            jest.spyOn(bcrypt_1.default, 'compare').mockResolvedValueOnce(false);
            const res = await (0, supertest_1.default)(server_1.app)
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
