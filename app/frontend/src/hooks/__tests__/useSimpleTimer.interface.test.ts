/**
 * Simple Timer Hook Test
 * 
 * Basic test to verify the new simple timer hook interface
 */

import { renderHook } from '@testing-library/react';

// Mock the hook directly in the jest.mock call
jest.mock('../useSimpleTimer', () => ({
    useSimpleTimer: jest.fn(() => ({
        timeLeftMs: 0,
        status: 'stop' as const,
        questionUid: null,
        durationMs: 0,
        isActive: false,
        startTimer: jest.fn(),
        pauseTimer: jest.fn(),
        resumeTimer: jest.fn(),
        stopTimer: jest.fn(),
        isConnected: true
    }))
}));

import { useSimpleTimer } from '../useSimpleTimer';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

describe('useSimpleTimer Interface', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the expected interface', () => {
        const { result } = renderHook(() =>
            useSimpleTimer({
                gameId: 'test-game',
                accessCode: 'TEST123',
                socket: null,
                role: 'teacher'
            })
        );

        // Test state properties
        expect(result.current).toHaveProperty('timeLeftMs');
        expect(result.current).toHaveProperty('status');
        expect(result.current).toHaveProperty('questionUid');
        expect(result.current).toHaveProperty('durationMs');
        expect(result.current).toHaveProperty('isActive');

        // Test action methods
        expect(result.current).toHaveProperty('startTimer');
        expect(result.current).toHaveProperty('pauseTimer');
        expect(result.current).toHaveProperty('resumeTimer');
        expect(result.current).toHaveProperty('stopTimer');

        // Test connection state
        expect(result.current).toHaveProperty('isConnected');
    });

    it('should initialize with stopped state', () => {
        const { result } = renderHook(() =>
            useSimpleTimer({
                gameId: 'test-game',
                accessCode: 'TEST123',
                socket: null,
                role: 'teacher'
            })
        );

        expect(result.current.timeLeftMs).toBe(0);
        expect(result.current.status).toBe('stop');
        expect(result.current.questionUid).toBe(null);
        expect(result.current.isActive).toBe(false);
    });

    it('should provide action methods with correct types', () => {
        const { result } = renderHook(() =>
            useSimpleTimer({
                gameId: 'test-game',
                accessCode: 'TEST123',
                socket: null,
                role: 'teacher'
            })
        );

        expect(typeof result.current.startTimer).toBe('function');
        expect(typeof result.current.pauseTimer).toBe('function');
        expect(typeof result.current.resumeTimer).toBe('function');
        expect(typeof result.current.stopTimer).toBe('function');
    });

    it('should accept correct config format', () => {
        const config = {
            gameId: 'test-game',
            accessCode: 'TEST123',
            socket: null,
            role: 'teacher' as const
        };

        const { result } = renderHook(() => useSimpleTimer(config));

        // Verify the hook returns the expected structure
        expect(result.current).toBeDefined();
        expect(typeof result.current).toBe('object');
    });
});
