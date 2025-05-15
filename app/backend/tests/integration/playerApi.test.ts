
import request from 'supertest';
import { app } from '@/server';
import { prisma } from '@/db/prisma';
import bcrypt from 'bcrypt';
import { PlayerService } from '@/core/services/playerService';
import { __setPlayerServiceForTesting } from '@/api/v1/players';

// Mock the prisma client
jest.mock('@/db/prisma', () => ({
    prisma: {
        player: {
            findUnique: jest.fn(),
            create: jest.fn(),
        }
    }
}));

// Import our mock helper
import { createMockPlayerService } from '../helpers/serviceMocks';

describe('Player API', () => {
    // Create a mock implementation of PlayerService
    let mockPlayerService: jest.Mocked<PlayerService>;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Setup PlayerService mock implementation using our helper
        mockPlayerService = createMockPlayerService();

        // Use the testing injection mechanism to set our mock
        __setPlayerServiceForTesting(mockPlayerService);
    });

    describe('POST /api/v1/players/register', () => {
        it('should register a new anonymous player (no email/password)', async () => {
            // Setup the mock to return a new player with all required properties
            mockPlayerService.registerPlayer.mockResolvedValueOnce({
                id: 'player-uuid',
                username: 'testplayer',
                cookieId: 'mock-cookie-id',
                email: null,
                avatarUrl: null,
                createdAt: new Date(),
            });

            const res = await request(app)
                .post('/api/v1/players/register')
                .send({
                    username: 'testplayer',
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('player');
            expect(res.body.player).toHaveProperty('id', 'player-uuid');
            expect(res.body.player).toHaveProperty('username', 'testplayer');
            expect(res.body.player).toHaveProperty('cookieId', 'mock-cookie-id');
        });

        it('should register a player with email and password', async () => {
            // Setup mock to return a new player with email
            mockPlayerService.registerPlayer.mockResolvedValueOnce({
                id: 'player-uuid',
                username: 'testplayer',
                email: 'player@example.com',
                cookieId: 'mock-cookie-id',
                avatarUrl: null,
                createdAt: new Date(),
            });

            const res = await request(app)
                .post('/api/v1/players/register')
                .send({
                    username: 'testplayer',
                    email: 'player@example.com',
                    password: 'password123',
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('player');
            expect(res.body.player).toHaveProperty('id', 'player-uuid');
            expect(res.body.player).toHaveProperty('username', 'testplayer');
            expect(res.body.player).toHaveProperty('email', 'player@example.com');
            expect(res.body.player).toHaveProperty('cookieId', 'mock-cookie-id');
        });

        it('should return 400 if username is missing', async () => {
            const res = await request(app)
                .post('/api/v1/players/register')
                .send({
                    email: 'player@example.com',
                    password: 'password123',
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Username is required');
        });

        it('should return 400 if password is too short', async () => {
            const res = await request(app)
                .post('/api/v1/players/register')
                .send({
                    username: 'testplayer',
                    password: '12345', // Too short
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Password must be at least 6 characters long');
        });

        it('should return 409 if username already exists', async () => {
            // Setup mock to throw an error for duplicate username
            const error = new Error('Player with this username already exists');
            mockPlayerService.registerPlayer.mockRejectedValueOnce(error);

            const res = await request(app)
                .post('/api/v1/players/register')
                .send({
                    username: 'existingplayer',
                });

            expect(res.status).toBe(409);
            expect(res.body).toHaveProperty('error', 'Player with this username already exists');
        });
    });

    describe('GET /api/v1/players/cookie/:cookieId', () => {
        it('should return a player when found by cookieId', async () => {
            const mockPlayer = {
                id: 'player-uuid',
                username: 'testplayer',
                cookieId: 'test-cookie-id',
                email: null,
                avatarUrl: null,
                createdAt: new Date(),
            };

            // Mock the service to return a player
            mockPlayerService.getPlayerByCookieId.mockResolvedValueOnce(mockPlayer);

            const res = await request(app)
                .get('/api/v1/players/cookie/test-cookie-id');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('player');
            expect(res.body.player).toHaveProperty('id', 'player-uuid');
            expect(res.body.player).toHaveProperty('username', 'testplayer');
            expect(res.body.player).toHaveProperty('cookieId', 'test-cookie-id');
        });

        it('should return 404 when player not found by cookieId', async () => {
            // Mock the service to return null
            mockPlayerService.getPlayerByCookieId.mockResolvedValueOnce(null);

            const res = await request(app)
                .get('/api/v1/players/cookie/nonexistent-cookie-id');

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error', 'Player not found');
        });
    });
});
