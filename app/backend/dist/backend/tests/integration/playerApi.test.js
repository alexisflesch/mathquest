"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("@/server");
const players_1 = require("@/api/v1/players");
const serviceMocks_1 = require("../helpers/serviceMocks");
describe('User API', () => {
    jest.setTimeout(3000);
    let mockUserService;
    beforeEach(() => {
        jest.clearAllMocks();
        mockUserService = (0, serviceMocks_1.createMockUserService)();
        (0, players_1.__setUserServiceForTesting)(mockUserService);
    });
    describe('POST /api/v1/players/register', () => {
        it('should register a new anonymous user (no email/password)', async () => {
            mockUserService.registerUser.mockResolvedValueOnce({
                token: 'mock-token',
                user: {
                    id: 'user-uuid',
                    username: 'testuser',
                    role: 'STUDENT',
                },
            });
            const res = await (0, supertest_1.default)(server_1.app)
                .post('/api/v1/players/register')
                .send({ username: 'testuser' });
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('user');
            expect(res.body.user).toHaveProperty('id', 'user-uuid');
            expect(res.body.user).toHaveProperty('username', 'testuser');
        });
        it('should register a user with email and password', async () => {
            mockUserService.registerUser.mockResolvedValueOnce({
                token: 'mock-token',
                user: {
                    id: 'user-uuid',
                    username: 'testuser',
                    email: 'user@example.com',
                    role: 'STUDENT',
                },
            });
            const res = await (0, supertest_1.default)(server_1.app)
                .post('/api/v1/players/register')
                .send({ username: 'testuser', email: 'user@example.com', password: 'password123' });
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('user');
            expect(res.body.user).toHaveProperty('id', 'user-uuid');
            expect(res.body.user).toHaveProperty('username', 'testuser');
            expect(res.body.user).toHaveProperty('email', 'user@example.com');
        });
        it('should return 400 if username is missing', async () => {
            const res = await (0, supertest_1.default)(server_1.app)
                .post('/api/v1/players/register')
                .send({ email: 'user@example.com', password: 'password123' });
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Username is required');
        });
        it('should return 400 if password is too short', async () => {
            const res = await (0, supertest_1.default)(server_1.app)
                .post('/api/v1/players/register')
                .send({ username: 'testuser', password: '12345' });
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Password must be at least 6 characters long');
        });
        it('should allow registration with an already taken username', async () => {
            mockUserService.registerUser.mockResolvedValueOnce({
                token: 'mock-token',
                user: {
                    id: 'user-uuid',
                    username: 'existinguser',
                    email: undefined,
                    role: 'STUDENT',
                },
            });
            const res = await (0, supertest_1.default)(server_1.app)
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
                avatarUrl: null,
            });
            const res = await (0, supertest_1.default)(server_1.app)
                .get('/api/v1/players/cookie/test-cookie-id');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('user');
            expect(res.body.user).toHaveProperty('id', 'user-uuid');
            expect(res.body.user).toHaveProperty('username', 'testuser');
            expect(res.body.user).toHaveProperty('email', null); // Accept null as valid for missing email
        });
        it('should return 404 when user not found by cookieId', async () => {
            mockUserService.getUserByCookieId.mockResolvedValueOnce(null);
            const res = await (0, supertest_1.default)(server_1.app)
                .get('/api/v1/players/cookie/nonexistent-cookie-id');
            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error', 'User not found');
        });
    });
});
