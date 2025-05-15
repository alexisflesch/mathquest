"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const playerService_1 = require("@/core/services/playerService");
const prisma_1 = require("@/db/prisma");
// Mock the prisma client
jest.mock('@/db/prisma', () => ({
    prisma: {
        player: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
    },
}));
// Mock bcrypt
jest.mock('bcrypt');
// Mock crypto
jest.mock('crypto', () => ({
    randomBytes: jest.fn().mockReturnValue({
        toString: jest.fn().mockReturnValue('mock-cookie-id'),
    }),
}));
describe('PlayerService', () => {
    let playerService;
    beforeEach(() => {
        playerService = new playerService_1.PlayerService();
        jest.clearAllMocks();
    });
    describe('registerPlayer', () => {
        it('should register an anonymous player (without password)', async () => {
            // Mock prisma.player.findUnique to return null (no player found)
            prisma_1.prisma.player.findUnique.mockResolvedValueOnce(null);
            // Mock prisma.player.create to return a new player
            prisma_1.prisma.player.create.mockResolvedValueOnce({
                id: 'player-uuid',
                username: 'testplayer',
                cookieId: 'mock-cookie-id',
                createdAt: new Date(),
            });
            const result = await playerService.registerPlayer({
                username: 'testplayer',
            });
            // Check that prisma was called with the right parameters
            expect(prisma_1.prisma.player.findUnique).toHaveBeenCalledWith({
                where: { username: 'testplayer' },
            });
            expect(prisma_1.prisma.player.create).toHaveBeenCalledWith({
                data: {
                    username: 'testplayer',
                    cookieId: 'mock-cookie-id',
                },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    cookieId: true,
                    createdAt: true,
                    avatarUrl: true,
                },
            });
            // Check the returned value
            expect(result).toEqual({
                id: 'player-uuid',
                username: 'testplayer',
                cookieId: 'mock-cookie-id',
                createdAt: expect.any(Date),
            });
        });
        it('should register a player with email and password', async () => {
            // Mock prisma.player.findUnique to return null (no player found)
            prisma_1.prisma.player.findUnique
                .mockResolvedValueOnce(null) // First call for username check
                .mockResolvedValueOnce(null); // Second call for email check
            // Mock bcrypt.hash to return a hashed password
            bcrypt_1.default.hash.mockResolvedValueOnce('hashed_password');
            // Mock prisma.player.create to return a new player
            prisma_1.prisma.player.create.mockResolvedValueOnce({
                id: 'player-uuid',
                username: 'testplayer',
                email: 'player@example.com',
                cookieId: 'mock-cookie-id',
                passwordHash: 'hashed_password',
                createdAt: new Date(),
            });
            const result = await playerService.registerPlayer({
                username: 'testplayer',
                email: 'player@example.com',
                password: 'password123',
            });
            // Check that prisma was called with the right parameters
            expect(prisma_1.prisma.player.findUnique).toHaveBeenCalledWith({
                where: { username: 'testplayer' },
            });
            expect(prisma_1.prisma.player.findUnique).toHaveBeenCalledWith({
                where: { email: 'player@example.com' },
            });
            expect(bcrypt_1.default.hash).toHaveBeenCalledWith('password123', 10);
            expect(prisma_1.prisma.player.create).toHaveBeenCalledWith({
                data: {
                    username: 'testplayer',
                    email: 'player@example.com',
                    cookieId: 'mock-cookie-id',
                    passwordHash: 'hashed_password',
                },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    cookieId: true,
                    createdAt: true,
                    avatarUrl: true,
                },
            });
            // Check the returned value
            expect(result).toEqual({
                id: 'player-uuid',
                username: 'testplayer',
                email: 'player@example.com',
                cookieId: 'mock-cookie-id',
                passwordHash: 'hashed_password',
                createdAt: expect.any(Date),
            });
        });
        it('should throw an error if player with username already exists', async () => {
            // Mock prisma.player.findUnique to return an existing player
            prisma_1.prisma.player.findUnique.mockResolvedValueOnce({
                id: 'existing-player-uuid',
                username: 'existingplayer',
            });
            await expect(playerService.registerPlayer({
                username: 'existingplayer',
            })).rejects.toThrow('Player with this username already exists');
        });
        it('should throw an error if email is already in use', async () => {
            // Mock prisma.player.findUnique to return null for username check
            prisma_1.prisma.player.findUnique
                .mockResolvedValueOnce(null) // First call for username check
                .mockResolvedValueOnce({
                id: 'existing-player-uuid',
                email: 'existing@example.com',
            });
            await expect(playerService.registerPlayer({
                username: 'newplayer',
                email: 'existing@example.com',
            })).rejects.toThrow('Player with this email already exists');
        });
    });
    describe('getPlayerByCookieId', () => {
        it('should return a player when found by cookieId', async () => {
            const mockPlayer = {
                id: 'player-uuid',
                username: 'testplayer',
                cookieId: 'test-cookie-id',
                createdAt: new Date(),
            };
            // Mock prisma.player.findUnique to return a player
            prisma_1.prisma.player.findUnique.mockResolvedValueOnce(mockPlayer);
            const result = await playerService.getPlayerByCookieId('test-cookie-id');
            expect(prisma_1.prisma.player.findUnique).toHaveBeenCalledWith({
                where: { cookieId: 'test-cookie-id' },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    cookieId: true,
                    createdAt: true,
                    avatarUrl: true,
                },
            });
            expect(result).toEqual(mockPlayer);
        });
        it('should return null when player not found by cookieId', async () => {
            // Mock prisma.player.findUnique to return null
            prisma_1.prisma.player.findUnique.mockResolvedValueOnce(null);
            const result = await playerService.getPlayerByCookieId('nonexistent-cookie-id');
            expect(prisma_1.prisma.player.findUnique).toHaveBeenCalledWith({
                where: { cookieId: 'nonexistent-cookie-id' },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    cookieId: true,
                    createdAt: true,
                    avatarUrl: true,
                },
            });
            expect(result).toBeNull();
        });
    });
});
