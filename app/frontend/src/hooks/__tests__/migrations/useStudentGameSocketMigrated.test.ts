/**
 * Integration Tests for useStudentGameSocket
 * 
 * Tests the migration wrapper that provides backward compatibility
 * while using the unified game management system internally.
 */

// --- Mock dependencies ---
jest.mock('@/clientLogger', () => ({
    createLogger: jest.fn(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    })),
}));
jest.mock('../../useUnifiedGameManager', () => ({
    useStudentGameManager: jest.fn(),
}));
import { useStudentGameManager } from '../../useUnifiedGameManager';
const mockedUseStudentGameManager = jest.mocked(useStudentGameManager);

import { renderHook, act } from '@testing-library/react';
import { useStudentGameSocket } from '../../migrations/useStudentGameSocketMigrated';
import { createLogger } from '@/clientLogger';
import type { TimerRole, TimerStatus } from '../../useGameTimer';
import type { Socket } from 'socket.io-client';

// --- Mock types ---
const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

// Create a mock socket that avoids circular references for Jest serialization
const createMockSocket = () => ({
    id: 'mockSocketId',
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    connected: true,
    toJSON: () => ({ id: 'mockSocketId', connected: true })
}) as unknown as Socket;

// Mock unified game manager response
const createMockUnifiedGameManager = (overrides = {}) => ({
    gameState: {
        gameId: 'test-game-123',
        role: 'student' as TimerRole,
        connected: true,
        connecting: false,
        error: null,
        timer: {
            timeLeftMs: 30,
            status: 'stopped' as TimerStatus,
            questionId: null,
            durationMs: 30,
            timestamp: Date.now(),
            localTimeLeftMs: 30
        },
        isTimerRunning: false,
        currentQuestionId: null,
        currentQuestionIndex: 0,
        totalQuestions: 5,
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
        formatTime: jest.fn(() => '0:30'),
        getDisplayTime: jest.fn(() => 30)
    },
    socket: {
        instance: createMockSocket(),
        connect: jest.fn(),
        disconnect: jest.fn(),
        reconnect: jest.fn(),
        emit: jest.fn(),
        on: jest.fn(),
        emitTimerAction: jest.fn()
    },
    actions: {
        joinGame: jest.fn(),
        submitAnswer: jest.fn()
    }
});

describe('useStudentGameSocket', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
        (createLogger as jest.MockedFunction<typeof createLogger>).mockReturnValue(mockLogger);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should provide the correct initial state from the unified game manager', () => {
        mockedUseStudentGameManager.mockReturnValue(createMockUnifiedGameManager());

        const { result } = renderHook(() =>
            useStudentGameSocket({
                accessCode: 'test-game-123',
                userId: 'user-1',
                username: 'TestUser',
                avatarEmoji: '😀'
            })
        );

        // The migration hook adapts the unified state to the student game interface
        expect(result.current.gameState.phase).toBeDefined();
        expect(result.current.connected).toBe(true);
        expect(result.current.connecting).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('should delegate joinGame and submitAnswer to unified actions', () => {
        const mockManager = createMockUnifiedGameManager();
        mockedUseStudentGameManager.mockReturnValue(mockManager);

        const { result } = renderHook(() =>
            useStudentGameSocket({
                accessCode: 'test-game-123',
                userId: 'user-1',
                username: 'TestUser',
                avatarEmoji: '😀'
            })
        );

        act(() => {
            result.current.joinGame();
        });
        expect(mockManager.socket.instance.emit).toHaveBeenCalledWith(
            'join_game',
            expect.objectContaining({
                accessCode: 'test-game-123',
                userId: 'user-1',
                username: 'TestUser',
                avatarEmoji: '😀',
                isDiffered: false
            })
        );

        act(() => {
            result.current.submitAnswer('q1', 2, 10);
        });
        expect(mockManager.socket.instance.emit).toHaveBeenCalledWith(
            'submit_answer',
            expect.objectContaining({
                questionId: 'q1',
                answer: 2,
                accessCode: 'test-game-123',
                userId: 'user-1',
                timeSpent: 10
            })
        );
    });

    it('should expose the socket instance', () => {
        const mockManager = createMockUnifiedGameManager();
        mockedUseStudentGameManager.mockReturnValue(mockManager);

        const { result } = renderHook(() =>
            useStudentGameSocket({
                accessCode: 'test-game-123',
                userId: 'user-1',
                username: 'TestUser',
                avatarEmoji: '😀'
            })
        );

        expect(result.current.socket).toBe(mockManager.socket.instance);
    });

    it('should propagate error and connection state', () => {
        mockedUseStudentGameManager.mockReturnValue(
            createMockUnifiedGameManager({ connected: false, connecting: true, error: 'Test error' })
        );

        const { result } = renderHook(() =>
            useStudentGameSocket({
                accessCode: 'test-game-123',
                userId: 'user-1',
                username: 'TestUser',
                avatarEmoji: '😀'
            })
        );

        expect(result.current.connected).toBe(false);
        expect(result.current.connecting).toBe(true);
        expect(result.current.error).toBe('Test error');
    });
});
