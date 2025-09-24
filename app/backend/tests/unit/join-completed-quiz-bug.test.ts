// require('../../tests/setupTestEnv');

import { jest } from '@jest/globals';

// Mock all dependencies
jest.mock('../../src/db/prisma', () => ({
    prisma: {
        gameInstance: {
            findUnique: jest.fn(),
            update: jest.fn()
        },
        gameParticipant: {
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn()
        },
        user: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            upsert: jest.fn()
        },
        $transaction: jest.fn()
    }
}));

jest.mock('../../src/config/redis', () => ({
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

jest.mock('../../src/utils/joinOrderBonus', () => ({
    assignJoinOrderBonus: jest.fn()
}));

jest.mock('../../src/core/services/gameParticipant/leaderboardSnapshotService', () => ({
    addUserToSnapshot: jest.fn()
}));

jest.mock('../../src/core/services/gameParticipant/deferredTimerUtils', () => ({
    hasOngoingDeferredSession: jest.fn()
}));

jest.mock('../../src/sockets', () => ({
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

jest.mock('../../src/utils/logger', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    }))
}));

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { joinGame } from '../../src/core/services/gameParticipant/joinService';

const mockPrisma = require('../../src/db/prisma').prisma;
const mockHasOngoingDeferredSession = require('../../src/core/services/gameParticipant/deferredTimerUtils').hasOngoingDeferredSession;
const mockAssignJoinOrderBonus = require('../../src/utils/joinOrderBonus').assignJoinOrderBonus;
const mockAddUserToSnapshot = require('../../src/core/services/gameParticipant/leaderboardSnapshotService').addUserToSnapshot;

describe('Join Completed Quiz Bug', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Set up default mock returns
        mockAssignJoinOrderBonus.mockResolvedValue(0);
        mockAddUserToSnapshot.mockResolvedValue(null);
    });

    it('should return error when trying to join a completed quiz without deferred availability', async () => {
        // Mock a completed quiz without deferred availability (both dates null)
        mockPrisma.gameInstance.findUnique.mockImplementation((args: any) => {
            if (args.where.accessCode === 'TEST123') {
                return Promise.resolve({
                    id: 'test-game-id',
                    name: 'Test Quiz',
                    status: 'completed',
                    playMode: 'quiz',
                    differedAvailableFrom: null,
                    differedAvailableTo: null,
                    gameTemplate: { name: 'Test Template' }
                });
            }
            return Promise.resolve(null);
        });

        mockPrisma.user.findFirst.mockResolvedValue(null);
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue({
            id: 'test-user-id',
            username: 'TestUser',
            role: 'STUDENT'
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

        // Mock user as already existing
        mockPrisma.user.findFirst.mockResolvedValue(null);
        mockPrisma.user.findUnique.mockResolvedValue({
            id: 'test-user-id',
            username: 'TestUser',
            role: 'STUDENT'
        });

        mockHasOngoingDeferredSession.mockResolvedValue(false);

        // Mock the transaction to succeed
        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
            return Promise.resolve({
                id: 'participant-id',
                userId: 'test-user-id',
                gameInstanceId: 'test-game-id',
                liveScore: 0,
                deferredScore: 0,
                nbAttempts: 0,
                status: 'active',
                joinedAt: new Date(),
                user: {
                    username: 'TestUser',
                    avatarEmoji: null
                }
            });
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

        // Mock user as already existing
        mockPrisma.user.findFirst.mockResolvedValue(null);
        mockPrisma.user.findUnique.mockResolvedValue({
            id: 'test-user-id',
            username: 'TestUser',
            role: 'STUDENT'
        });

        // Mock the transaction to succeed
        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
            return Promise.resolve({
                id: 'participant-id',
                userId: 'test-user-id',
                gameInstanceId: 'test-game-id',
                liveScore: 0,
                deferredScore: 0,
                nbAttempts: 0,
                status: 'active',
                joinedAt: new Date(),
                user: {
                    username: 'TestUser',
                    avatarEmoji: null
                }
            });
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
        mockPrisma.gameInstance.findUnique.mockImplementation((args: any) => {
            if (args.where.accessCode === 'NONEXISTENT') {
                return Promise.resolve(null);
            }
            return Promise.resolve(null);
        });

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
