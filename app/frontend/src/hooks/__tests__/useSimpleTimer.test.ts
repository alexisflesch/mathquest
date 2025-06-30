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

// Mock socket
const mockSocket = {
    connected: true,
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn()
};

describe('useSimpleTimer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
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
        });
        expect(result.current.getTimerState('q-1')).toBeDefined();
        expect(result.current.getTimerState('q-1')?.status).toBe('run');

        // Pause timer for q-1
        act(() => {
            result.current.pauseTimer();
        });
        expect(result.current.getTimerState('q-1')?.status).toBe('pause');

        // Resume timer for q-1
        act(() => {
            result.current.startTimer('q-1', 30000);
        });
        expect(result.current.getTimerState('q-1')?.status).toBe('run');

        // Stop timer for q-1
        act(() => {
            result.current.stopTimer();
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
        });
        expect(result.current.getTimerState('q-1')).toBeDefined();
        expect(result.current.getTimerState('q-2')).toBeDefined();
        expect(result.current.getTimerState('q-1')?.timeLeftMs).not.toBe(result.current.getTimerState('q-2')?.timeLeftMs);
    });
});
