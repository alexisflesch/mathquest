import request from 'supertest';
import { app } from '@/server';
import { UserService } from '@/core/services/userService';
import { __setUserServiceForTesting } from '@/api/v1/players';
import { createMockUserService } from '../helpers/serviceMocks';

describe('User API', () => {
    jest.setTimeout(3000);
    let mockUserService: jest.Mocked<UserService>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUserService = createMockUserService();
        __setUserServiceForTesting(mockUserService);
    });

    describe('POST /api/v1/players/register', () => {
        it('should register a new anonymous user (no email/password)', async () => {
            mockUserService.registerUser.mockResolvedValueOnce({
                success: true,
                token: 'mock-token',
                userState: 'student',
                user: {
                    id: 'user-uuid',
                    username: 'testuser',
                    role: 'STUDENT',
                    avatarEmoji: '🐼',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });
            const res = await request(app)
                .post('/api/v1/players/register')
                .send({ username: 'testuser' });
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('user');
            expect(res.body.user).toHaveProperty('id', 'user-uuid');
            expect(res.body.user).toHaveProperty('username', 'testuser');
        });

        it('should register a user with email and password', async () => {
            mockUserService.registerUser.mockResolvedValueOnce({
                success: true,
                token: 'mock-token',
                userState: 'student',
                user: {
                    id: 'user-uuid',
                    username: 'testuser',
                    email: 'user@example.com',
                    role: 'STUDENT',
                    avatarEmoji: '🐼',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });
            const res = await request(app)
                .post('/api/v1/players/register')
                .send({ username: 'testuser', email: 'user@example.com', password: 'password123' });
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('user');
            expect(res.body.user).toHaveProperty('id', 'user-uuid');
            expect(res.body.user).toHaveProperty('username', 'testuser');
            expect(res.body.user).toHaveProperty('email', 'user@example.com');
        });

        it('should return 400 if username is missing', async () => {
            const res = await request(app)
                .post('/api/v1/players/register')
                .send({ email: 'user@example.com', password: 'password123' });
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Username is required');
        });

        it('should return 400 if password is too short', async () => {
            const res = await request(app)
                .post('/api/v1/players/register')
                .send({ username: 'testuser', password: '12345' });
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Password must be at least 6 characters long');
        });

        it('should allow registration with an already taken username', async () => {
            mockUserService.registerUser.mockResolvedValueOnce({
                success: true,
                token: 'mock-token',
                userState: 'student',
                user: {
                    id: 'user-uuid',
                    username: 'existinguser',
                    email: undefined,
                    role: 'STUDENT',
                    avatarEmoji: '🐼',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });
            const res = await request(app)
                .post('/api/v1/players/register')
                .send({ username: 'existinguser' });
            expect(res.status).toBe(201);
            expect(res.body.user).toHaveProperty('username', 'existinguser');
        });
    });

    describe('GET /api/v1/players/cookie/:cookieId', () => {
        it('should return a user when found by cookieId', async () => {
            mockUserService.getUserByCookieId.mockResolvedValueOnce({
                id: 'user-uuid',
                username: 'testuser',
                email: null, // Prisma returns null for missing optional fields
                role: 'STUDENT',
                createdAt: new Date(),
                avatarEmoji: null,
            });
            const res = await request(app)
                .get('/api/v1/players/cookie/test-cookie-id');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('user');
            expect(res.body.user).toHaveProperty('id', 'user-uuid');
            expect(res.body.user).toHaveProperty('username', 'testuser');
            expect(res.body.user).toHaveProperty('email', null); // Accept null as valid for missing email
        });

        it('should return 404 when user not found by cookieId', async () => {
            mockUserService.getUserByCookieId.mockResolvedValueOnce(null);
            const res = await request(app)
                .get('/api/v1/players/cookie/nonexistent-cookie-id');
            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error', 'User not found');
        });
    });
});
