/**
 * Simple Timer Hook Test
 * 
 * Basic test to verify the new simple timer hook works correctly
 */

import { renderHook, act } from '@testing-library/react';
import { useSimpleTimer } from '../useSimpleTimer';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

// Mock logger with relative path
jest.mock('../../clientLogger', () => ({
    createLogger: () => ({
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    })
}));

// Create mock constants instead of mocking the module
const TEACHER_EVENTS = {
    TIMER_ACTION: 'quiz_timer_action',
    DASHBOARD_TIMER_UPDATED: 'dashboard_timer_updated'
};

// Mock socket with event handler storage
const mockSocket = {
    connected: true,
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    // Store event handlers for simulation
    _handlers: {} as Record<string, Function[]>
};

// Helper to simulate socket events
const simulateSocketEvent = (eventName: string, payload: any) => {
    const handlers = mockSocket._handlers[eventName] || [];
    handlers.forEach(handler => handler(payload));
};

describe('useSimpleTimer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSocket._handlers = {};

        // Mock the on method to store handlers
        mockSocket.on.mockImplementation((eventName: string, handler: Function) => {
            if (!mockSocket._handlers[eventName]) {
                mockSocket._handlers[eventName] = [];
            }
            mockSocket._handlers[eventName].push(handler);
        });
    });

    it('should start, pause, resume, and stop timer per questionUid (canonical)', () => {
        const { result } = renderHook(() =>
            useSimpleTimer({
                gameId: 'test-game',
                accessCode: 'TEST123',
                socket: mockSocket as any,
                role: 'teacher'
            })
        );

        // Start timer for q-1
        act(() => {
            result.current.startTimer('q-1', 30000);

            // Simulate backend response
            simulateSocketEvent('dashboard_timer_updated', {
                timer: {
                    questionUid: 'q-1',
                    status: 'run',
                    timerEndDateMs: Date.now() + 30000,
                    durationMs: 30000
                },
                serverTime: Date.now()
            });
        });
        expect(result.current.getTimerState('q-1')).toBeDefined();
        expect(result.current.getTimerState('q-1')?.status).toBe('run');

        // Pause timer for q-1
        act(() => {
            result.current.pauseTimer();

            // Simulate backend response
            simulateSocketEvent('dashboard_timer_updated', {
                timer: {
                    questionUid: 'q-1',
                    status: 'pause',
                    timerEndDateMs: Date.now() + 25000,
                    timeLeftMs: 25000,
                    durationMs: 30000
                },
                serverTime: Date.now()
            });
        });
        expect(result.current.getTimerState('q-1')?.status).toBe('pause');

        // Resume timer for q-1
        act(() => {
            result.current.resumeTimer();

            // Simulate backend response
            simulateSocketEvent('dashboard_timer_updated', {
                timer: {
                    questionUid: 'q-1',
                    status: 'run',
                    timerEndDateMs: Date.now() + 25000,
                    durationMs: 30000
                },
                serverTime: Date.now()
            });
        });
        expect(result.current.getTimerState('q-1')?.status).toBe('run');

        // Stop timer for q-1
        act(() => {
            result.current.stopTimer();

            // Simulate backend response
            simulateSocketEvent('dashboard_timer_updated', {
                timer: {
                    questionUid: 'q-1',
                    status: 'stop',
                    timerEndDateMs: 0,
                    timeLeftMs: 0,
                    durationMs: 30000
                },
                serverTime: Date.now()
            });
        });
        expect(result.current.getTimerState('q-1')?.status).toBe('stop');
    });

    it('should maintain independent timer state per questionUid', () => {
        const { result } = renderHook(() =>
            useSimpleTimer({
                gameId: 'test-game',
                accessCode: 'TEST123',
                socket: mockSocket as any,
                role: 'teacher'
            })
        );

        act(() => {
            result.current.startTimer('q-1', 10000);
            result.current.startTimer('q-2', 20000);

            // Simulate backend responses for both timers
            simulateSocketEvent('dashboard_timer_updated', {
                timer: {
                    questionUid: 'q-1',
                    status: 'run',
                    timerEndDateMs: Date.now() + 10000,
                    durationMs: 10000
                },
                serverTime: Date.now()
            });

            simulateSocketEvent('dashboard_timer_updated', {
                timer: {
                    questionUid: 'q-2',
                    status: 'run',
                    timerEndDateMs: Date.now() + 20000,
                    durationMs: 20000
                },
                serverTime: Date.now()
            });
        });

        expect(result.current.getTimerState('q-1')).toBeDefined();
        expect(result.current.getTimerState('q-2')).toBeDefined();
        expect(result.current.getTimerState('q-1')?.durationMs).toBe(10000);
        expect(result.current.getTimerState('q-2')?.durationMs).toBe(20000);
    });
});
