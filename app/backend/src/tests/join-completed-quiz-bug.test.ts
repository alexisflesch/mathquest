require('../../tests/setupTestEnv');

import { jest } from '@jest/globals';

// Mock all dependencies
jest.mock('../db/prisma', () => ({
    prisma: {
        gameInstance: {
            findUnique: jest.fn(),
            create: jest.fn()
        },
        gameParticipant: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn()
        },
        user: {
            findUnique: jest.fn(),
            upsert: jest.fn()
        },
        $transaction: jest.fn()
    }
}));

jest.mock('../config/redis', () => ({
    redisClient: {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        keys: jest.fn(),
        sadd: jest.fn(),
        srem: jest.fn(),
        smembers: jest.fn(),
        hget: jest.fn(),
        hset: jest.fn(),
        hgetall: jest.fn(),
        expire: jest.fn()
    }
}));

jest.mock('../utils/joinOrderBonus', () => ({
    assignJoinOrderBonus: jest.fn()
}));

jest.mock('../core/services/gameParticipant/leaderboardSnapshotService', () => ({
    addUserToSnapshot: jest.fn()
}));

jest.mock('../core/services/gameParticipant/deferredTimerUtils', () => ({
    hasOngoingDeferredSession: jest.fn()
}));

jest.mock('../sockets', () => ({
    getIO: jest.fn(() => ({
        to: jest.fn(() => ({
            emit: jest.fn()
        }))
    }))
}));

jest.mock('@shared/types/socket/events', () => ({
    SOCKET_EVENTS: {
        GAME_JOINED: 'game_joined',
        PARTICIPANT_JOINED: 'participant_joined'
    }
}));

jest.mock('../utils/logger', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    }))
}));

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { joinGame } from '../core/services/gameParticipant/joinService';

const mockPrisma = require('../db/prisma').prisma;
const mockHasOngoingDeferredSession = require('../core/services/gameParticipant/deferredTimerUtils').hasOngoingDeferredSession;

describe('Join Completed Quiz Bug', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return error when trying to join a completed quiz without deferred availability', async () => {
        // Mock a completed quiz without deferred availability (both dates null)
        mockPrisma.gameInstance.findUnique.mockResolvedValue({
            id: 'test-game-id',
            name: 'Test Quiz',
            status: 'completed',
            playMode: 'quiz',
            differedAvailableFrom: null,
            differedAvailableTo: null,
            gameTemplate: { name: 'Test Template' }
        });

        mockPrisma.user.upsert.mockResolvedValue({
            id: 'test-user-id',
            username: 'TestUser'
        });

        mockHasOngoingDeferredSession.mockResolvedValue(false);

        const result = await joinGame({
            userId: 'test-user-id',
            accessCode: 'TEST123',
            username: 'TestUser'
        });

        // Should return success: false for completed quiz without deferred availability
        expect(result.success).toBe(false);
        expect(result.error).toBe('This quiz has ended and is not available for replay');
    });

    it('should allow joining a completed quiz with valid deferred availability', async () => {
        // Mock a completed quiz with deferred availability
        const now = new Date();
        const pastDate = new Date(now.getTime() - 1000 * 60 * 60); // 1 hour ago
        const futureDate = new Date(now.getTime() + 1000 * 60 * 60); // 1 hour from now

        mockPrisma.gameInstance.findUnique.mockResolvedValue({
            id: 'test-game-id',
            name: 'Test Quiz',
            status: 'completed',
            playMode: 'quiz',
            differedAvailableFrom: pastDate,
            differedAvailableTo: futureDate,
            gameTemplate: { name: 'Test Template' }
        });

        mockPrisma.user.upsert.mockResolvedValue({
            id: 'test-user-id',
            username: 'TestUser'
        });

        mockHasOngoingDeferredSession.mockResolvedValue(false);

        // Mock the transaction to succeed
        mockPrisma.$transaction.mockResolvedValue({
            id: 'participant-id',
            userId: 'test-user-id',
            gameInstanceId: 'test-game-id',
            liveScore: 0,
            deferredScore: 0,
            nbAttempts: 0,
            status: 'active',
            joinedAt: new Date()
        });

        const result = await joinGame({
            userId: 'test-user-id',
            accessCode: 'TEST123',
            username: 'TestUser'
        });

        // Should succeed for completed quiz with valid deferred availability
        expect(result.success).toBe(true);
    });

    it('should allow joining an active quiz', async () => {
        // Mock an active quiz
        mockPrisma.gameInstance.findUnique.mockResolvedValue({
            id: 'test-game-id',
            name: 'Test Quiz',
            status: 'active',
            playMode: 'quiz',
            differedAvailableFrom: null,
            differedAvailableTo: null,
            gameTemplate: { name: 'Test Template' }
        });

        mockPrisma.user.upsert.mockResolvedValue({
            id: 'test-user-id',
            username: 'TestUser'
        });

        // Mock the transaction to succeed
        mockPrisma.$transaction.mockResolvedValue({
            id: 'participant-id',
            userId: 'test-user-id',
            gameInstanceId: 'test-game-id',
            liveScore: 0,
            deferredScore: 0,
            nbAttempts: 0,
            status: 'active',
            joinedAt: new Date()
        });

        const result = await joinGame({
            userId: 'test-user-id',
            accessCode: 'TEST123',
            username: 'TestUser'
        });

        // Should succeed for active quiz
        expect(result.success).toBe(true);
    });

    it('should return error when game not found', async () => {
        // Mock game not found
        mockPrisma.gameInstance.findUnique.mockResolvedValue(null);

        const result = await joinGame({
            userId: 'test-user-id',
            accessCode: 'NONEXISTENT',
            username: 'TestUser'
        });

        expect(result).toEqual({
            success: false,
            error: 'Game not found'
        });
    });
});
