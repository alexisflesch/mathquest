/**
 * useGameTimer Hook Tests
 * Focus on socket integration and role-based behavior
 */

import { renderHook, act } from '@testing-library/react';
import { useGameTimer, useTeacherTimer, useStudentTimer, useProjectionTimer, useTournamentTimer } from '../useGameTimer';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

// Mock socket.io
const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
};

// Mock logger
jest.mock('@/clientLogger', () => ({
    createLogger: jest.fn(() => ({
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    })),
}));

// Mock config
jest.mock('@/config/gameConfig', () => ({
    TIMER_CONFIG: {
        DEFAULT_QUESTION_TIME: 30,
        UI_UPDATE_INTERVAL: 100,
    },
    UI_CONFIG: {
        LEADERBOARD_UPDATE_INTERVAL: 500,
    },
}));

describe('useGameTimer Hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Basic Timer Functionality', () => {
        it('should initialize with default state', () => {
            const { result } = renderHook(() => useGameTimer('student'));

            expect(result.current.timerState.status).toBe('stop');
            expect(result.current.timerState.timeLeft).toBe(0);
            expect(result.current.timerState.duration).toBe(30);
            expect(result.current.isRunning).toBe(false);
        });

        it('should start timer correctly', () => {
            const { result } = renderHook(() => useGameTimer('student'));

            act(() => {
                result.current.start('question-1', 60);
            });

            expect(result.current.timerState.status).toBe('play');
            expect(result.current.timerState.duration).toBe(60);
            expect(result.current.timerState.questionId).toBe('question-1');
            expect(result.current.isRunning).toBe(true);
        });

        it('should pause and resume timer', () => {
            const { result } = renderHook(() => useGameTimer('student'));

            act(() => {
                result.current.start('question-1', 60);
            });

            act(() => {
                result.current.pause();
            });

            expect(result.current.timerState.status).toBe('pause');
            expect(result.current.isRunning).toBe(false);

            act(() => {
                result.current.resume();
            });

            expect(result.current.timerState.status).toBe('play');
            expect(result.current.isRunning).toBe(true);
        });
    });

    describe('Socket Integration', () => {
        it('should register socket events for teacher role', () => {
            renderHook(() => useGameTimer('teacher', mockSocket as any));

            expect(mockSocket.on).toHaveBeenCalledWith(
                SOCKET_EVENTS.TEACHER.TIMER_UPDATE,
                expect.any(Function)
            );
            expect(mockSocket.on).toHaveBeenCalledWith(
                SOCKET_EVENTS.TEACHER.DASHBOARD_TIMER_UPDATED,
                expect.any(Function)
            );
        });

        it('should register socket events for student role', () => {
            renderHook(() => useGameTimer('student', mockSocket as any));

            expect(mockSocket.on).toHaveBeenCalledWith(
                SOCKET_EVENTS.GAME.TIMER_UPDATE,
                expect.any(Function)
            );
            expect(mockSocket.on).toHaveBeenCalledWith(
                SOCKET_EVENTS.GAME.GAME_TIMER_UPDATED,
                expect.any(Function)
            );
        });

        it('should handle socket timer updates', () => {
            const { result } = renderHook(() => useGameTimer('student', mockSocket as any));

            // Get the timer update handler that was registered
            const timerUpdateHandler = mockSocket.on.mock.calls.find(
                call => call[0] === SOCKET_EVENTS.GAME.TIMER_UPDATE
            )?.[1];

            expect(timerUpdateHandler).toBeDefined();

            // Simulate a timer update
            act(() => {
                timerUpdateHandler({
                    timeLeft: 25000, // ms, not s
                    running: true,
                    status: 'play',
                    questionId: 'q1'
                });
            });

            expect(result.current.timerState.status).toBe('play');
            expect(result.current.timerState.timeLeft).toBe(25000);
        });
    });

    describe('Role-Specific Utility Functions', () => {
        it('should create teacher timer with socket', () => {
            const { result } = renderHook(() => useTeacherTimer(mockSocket as any));
            expect(result.current.timerState).toBeDefined();
        });

        it('should create student timer with socket', () => {
            const { result } = renderHook(() => useStudentTimer(mockSocket as any));
            expect(result.current.timerState).toBeDefined();
        });

        it('should create projection timer with socket', () => {
            const { result } = renderHook(() => useProjectionTimer(mockSocket as any));
            expect(result.current.timerState).toBeDefined();
        });

        it('should create tournament timer with socket', () => {
            const { result } = renderHook(() => useTournamentTimer(mockSocket as any));
            expect(result.current.timerState).toBeDefined();
        });
    });

    describe('Time Formatting', () => {
        it('should format time correctly', () => {
            const { result } = renderHook(() => useGameTimer('student'));

            expect(result.current.formatTime(0)).toBe('0s');
            expect(result.current.formatTime(30000)).toBe('30s');
            expect(result.current.formatTime(90000)).toBe('1:30');
            expect(result.current.formatTime(5500, true)).toBe('5.5s');
        });
    });

    describe('Backend Synchronization', () => {
        it('should sync with backend state', () => {
            const { result } = renderHook(() => useGameTimer('student'));

            act(() => {
                result.current.syncWithBackend({
                    timeLeft: 45000, // ms, not s
                    running: true,
                    status: 'play',
                    questionId: 'question-2'
                });
            });

            expect(result.current.timerState.status).toBe('play');
            expect(result.current.timerState.timeLeft).toBe(45000);
            expect(result.current.timerState.questionId).toBe('question-2');
        });
    });
});
