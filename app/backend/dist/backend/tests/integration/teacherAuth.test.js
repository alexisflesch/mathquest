"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("@/server");
const serviceMocks_1 = require("../helpers/serviceMocks");
const teachers_1 = require("@/api/v1/teachers");
describe('Teacher Authentication API', () => {
    jest.setTimeout(3000);
    let mockUserService;
    beforeEach(() => {
        jest.clearAllMocks();
        mockUserService = (0, serviceMocks_1.createMockUserService)();
        (0, teachers_1.__setUserServiceForTesting)(mockUserService);
    });
    describe('POST /api/v1/teachers/register', () => {
        it('should register a new teacher and return a token', async () => {
            mockUserService.registerUser.mockResolvedValueOnce({
                user: {
                    id: 'teacher-uuid',
                    username: 'testteacher',
                    email: 'test@example.com',
                    role: 'TEACHER'
                },
                token: 'mock-jwt-token'
            });
            const res = await (0, supertest_1.default)(server_1.app)
                .post('/api/v1/teachers/register')
                .send({
                username: 'testteacher',
                email: 'test@example.com',
                password: 'Password123!'
            });
            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body.token).toBe('mock-jwt-token');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.username).toBe('testteacher');
            expect(mockUserService.registerUser).toHaveBeenCalledWith({
                username: 'testteacher',
                email: 'test@example.com',
                password: 'Password123!',
                role: 'TEACHER'
            });
        });
    });
    describe('POST /api/v1/teachers/login', () => {
        it('should login a teacher and return a token', async () => {
            mockUserService.loginUser.mockResolvedValueOnce({
                user: {
                    id: 'teacher-uuid',
                    username: 'testteacher',
                    email: 'test@example.com',
                    role: 'TEACHER'
                },
                token: 'mock-jwt-token'
            });
            const res = await (0, supertest_1.default)(server_1.app)
                .post('/api/v1/teachers/login')
                .send({
                email: 'test@example.com',
                password: 'Password123!'
            });
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.token).toBe('mock-jwt-token');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.username).toBe('testteacher');
            expect(mockUserService.loginUser).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'Password123!'
            });
        });
    });
});
