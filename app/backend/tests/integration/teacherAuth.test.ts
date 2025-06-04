import request from 'supertest';
import { app } from '@/server';
import { UserService } from '@/core/services/userService';
import { createMockUserService } from '../helpers/serviceMocks';
import { __setUserServiceForTesting } from '@/api/v1/teachers';

describe('Teacher Authentication API', () => {
    jest.setTimeout(3000);

    let mockUserService: jest.Mocked<UserService>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUserService = createMockUserService();
        __setUserServiceForTesting(mockUserService);
    });

    describe('POST /api/v1/teachers/register', () => {
        it('should register a new teacher and return a token', async () => {
            // Mock getUserByEmail to throw error (user not found - which is expected for new registration)
            mockUserService.getUserByEmail.mockRejectedValueOnce(new Error('User not found'));

            mockUserService.registerUser.mockResolvedValueOnce({
                user: {
                    id: 'teacher-uuid',
                    username: 'testteacher',
                    email: 'test@example.com',
                    role: 'TEACHER'
                },
                token: 'mock-jwt-token'
            });
            const res = await request(app)
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

    describe('POST /api/v1/auth (teacher_login)', () => {
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
            const res = await request(app)
                .post('/api/v1/auth')
                .send({
                    action: 'teacher_login',
                    email: 'test@example.com',
                    password: 'Password123!'
                });
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.token).toBe('mock-jwt-token');
            expect(res.body).toHaveProperty('username');
            expect(res.body.username).toBe('testteacher');
            expect(mockUserService.loginUser).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'Password123!'
            });
        });
    });
});