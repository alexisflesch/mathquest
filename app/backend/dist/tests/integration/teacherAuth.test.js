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
    let mockTeacherService;
    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        // Setup TeacherService mock
        mockTeacherService = (0, serviceMocks_1.createMockTeacherService)();
        // Use the testing injection mechanism to set our mock
        (0, teachers_1.__setTeacherServiceForTesting)(mockTeacherService);
    });
    describe('POST /api/v1/teachers/register', () => {
        it('should register a new teacher and return a token', async () => {
            // Setup mock to return a new teacher with token
            mockTeacherService.registerTeacher.mockResolvedValueOnce({
                teacher: {
                    id: 'teacher-uuid',
                    username: 'testteacher',
                    email: 'test@example.com'
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
            expect(res.body).toHaveProperty('teacher');
            expect(res.body.teacher.username).toBe('testteacher');
            // Verify service was called with correct parameters
            expect(mockTeacherService.registerTeacher).toHaveBeenCalledWith({
                username: 'testteacher',
                email: 'test@example.com',
                password: 'Password123!'
            });
        });
    });
    describe('POST /api/v1/teachers/login', () => {
        it('should login a teacher and return a token', async () => {
            // Setup mock to return a teacher with token
            mockTeacherService.loginTeacher.mockResolvedValueOnce({
                teacher: {
                    id: 'teacher-uuid',
                    username: 'testteacher',
                    email: 'test@example.com'
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
            expect(res.body).toHaveProperty('teacher');
            // Verify service was called with correct parameters
            expect(mockTeacherService.loginTeacher).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'Password123!'
            });
        });
    });
});
