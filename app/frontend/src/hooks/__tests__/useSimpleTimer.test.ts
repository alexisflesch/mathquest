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

    it('should initialize with stopped timer state', () => {
        const { result } = renderHook(() =>
            useSimpleTimer({
                gameId: 'test-game',
                accessCode: 'TEST123',
                socket: mockSocket as any,
                role: 'teacher'
            })
        );

        expect(result.current.timeLeftMs).toBe(0);
        expect(result.current.status).toBe('stop');
        expect(result.current.questionUid).toBe(null);
        expect(result.current.isConnected).toBe(true);
    });

    it('should emit timer start action for teachers', () => {
        const { result } = renderHook(() =>
            useSimpleTimer({
                gameId: 'test-game',
                accessCode: 'TEST123',
                socket: mockSocket as any,
                role: 'teacher'
            })
        );

        act(() => {
            result.current.startTimer('question-1', 30000);
        });

        expect(mockSocket.emit).toHaveBeenCalledWith(
            'quiz_timer_action',
            {
                accessCode: 'TEST123',
                action: 'start',
                duration: 30000,
                questionUid: 'question-1'
            }
        );
    });

    it('should not emit actions for non-teacher roles', () => {
        const { result } = renderHook(() =>
            useSimpleTimer({
                gameId: 'test-game',
                accessCode: 'TEST123',
                socket: mockSocket as any,
                role: 'student'
            })
        );

        act(() => {
            result.current.startTimer('question-1', 30000);
        });

        expect(mockSocket.emit).not.toHaveBeenCalled();
    });
});
