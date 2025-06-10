/**
 * Modern Tests for useTournamentSocketMigrated
 *
 * Tests the migration wrapper for the tournament socket using the unified game manager only.
 * No legacy compatibility or event handler checks.
 */

jest.mock('@/clientLogger', () => ({
    createLogger: jest.fn(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    })),
}));
jest.mock('../../useUnifiedGameManager', () => ({
    useTournamentGameManager: jest.fn(),
}));

import { renderHook, act } from '@testing-library/react';
import { useTournamentSocket } from '../../migrations/useTournamentSocketMigrated';
import { useTournamentGameManager } from '../../useUnifiedGameManager';
import { createLogger } from '@/clientLogger';
import type { TimerRole, TimerStatus } from '../../useGameTimer';
import type { Socket } from 'socket.io-client';
const mockedUseTournamentGameManager = jest.mocked(useTournamentGameManager);

const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

const createMockSocket = () => ({
    id: 'mockTournamentSocketId',
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    connected: true,
    toJSON: () => ({ id: 'mockTournamentSocketId', connected: true })
}) as unknown as Socket;

const createMockGameManager = (overrides: Partial<import('../../useUnifiedGameManager').GameState> = {}) => {
    const socketInstance = createMockSocket();
    const socketOn = jest.fn(() => () => { }); // always returns a cleanup function
    return {
        gameState: {
            gameId: 'tournament-123',
            role: 'tournament' as TimerRole,
            connected: true,
            connecting: false,
            error: null,
            timer: { timeLeft: 60, status: 'stopped' as TimerStatus, questionId: 'q1', duration: 60, timestamp: Date.now(), localTimeLeft: 60 },
            isTimerRunning: false,
            currentQuestionId: 'q1',
            currentQuestionIndex: 0,
            totalQuestions: 10,
            gameStatus: 'waiting' as 'waiting',
            phase: 'question' as 'question',
            connectedCount: 1,
            answered: false,
            currentQuestionData: null, // Add missing property
            ...overrides
        },
        timer: {
            start: jest.fn(),
            pause: jest.fn(),
            resume: jest.fn(),
            stop: jest.fn(),
            reset: jest.fn(),
            setDuration: jest.fn(),
            formatTime: jest.fn(() => '1:00'),
            getDisplayTime: jest.fn(() => 60)
        },
        socket: {
            instance: socketInstance,
            connect: jest.fn(),
            disconnect: jest.fn(),
            reconnect: jest.fn(),
            emit: jest.fn(),
            on: socketOn,
            emitTimerAction: jest.fn()
        },
        actions: {
            joinTournament: jest.fn(),
            submitAnswer: jest.fn()
        }
    };
};

describe('useTournamentSocket (modern migration)', () => {
    const mockTournamentCode = 'tournament-123';
    const mockUserId = 'user-1';
    const mockUsername = 'TestUser';
    const mockAvatar = '😀';

    beforeEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
        (createLogger as jest.MockedFunction<typeof createLogger>).mockReturnValue(mockLogger);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should initialize with unified game manager', () => {
        mockedUseTournamentGameManager.mockReturnValue(createMockGameManager());
        renderHook(() => useTournamentSocket({
            accessCode: mockTournamentCode,
            userId: mockUserId,
            username: mockUsername,
            avatarEmoji: mockAvatar
        }));
        expect(mockedUseTournamentGameManager).toHaveBeenCalledWith(
            mockTournamentCode,
            mockUserId,
            mockUsername,
            mockAvatar,
            expect.any(Object)
        );
    });

    it('should return the expected interface structure', () => {
        mockedUseTournamentGameManager.mockReturnValue(createMockGameManager());
        const { result } = renderHook(() => useTournamentSocket({
            accessCode: mockTournamentCode,
            userId: mockUserId,
            username: mockUsername,
            avatarEmoji: mockAvatar
        }));
        expect(result.current).toEqual({
            gameState: {
                gameStatus: 'waiting',
                currentQuestion: null,
                timer: null,
                feedback: null,
                waiting: true,
                answered: false,
                score: 0,
                rank: null
            },
            loading: true, // updated to match the effect of auto-join
            error: null,
            joinTournament: expect.any(Function),
            submitAnswer: expect.any(Function),
            connected: true,
            connecting: false
        });
    });

    it('should propagate error and loading state', () => {
        mockedUseTournamentGameManager.mockReturnValue(
            createMockGameManager({ error: 'Test error' })
        );
        const { result } = renderHook(() => useTournamentSocket({
            accessCode: mockTournamentCode,
            userId: mockUserId,
            username: mockUsername,
            avatarEmoji: mockAvatar
        }));
        expect(result.current.error).toBe('Test error');
    });

    it('should delegate joinTournament and submitAnswer', () => {
        const mockJoinTournament = jest.fn();
        const mockSubmitAnswer = jest.fn();
        mockedUseTournamentGameManager.mockReturnValue({
            ...createMockGameManager(),
            actions: {
                joinTournament: mockJoinTournament,
                submitAnswer: mockSubmitAnswer
            }
        });
        const { result } = renderHook(() => useTournamentSocket({
            accessCode: mockTournamentCode,
            userId: mockUserId,
            username: mockUsername,
            avatarEmoji: mockAvatar
        }));
        act(() => {
            result.current.joinTournament();
        });
        expect(mockJoinTournament).toHaveBeenCalled();
        act(() => {
            result.current.submitAnswer('q1', 2, 10);
        });
        expect(mockSubmitAnswer).toHaveBeenCalledWith('q1', 2, 10);
    });
});
