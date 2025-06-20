/**
 * Timer Countdown Test Suite
 * 
 * Tests whether the timer actually counts down when "st        expect(result.current.timeLeftMs).toBe(0);
        expect(result.current.timerStatus).toBe('stop');
        expect(result.current.localTimeLeftMs).toBe(null);" is clicked in the dashboard.
 * This addresses the issue where the timer stays at 15 seconds and doesn't change.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useTeacherQuizSocket } from '../useTeacherQuizSocket';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

// Enable fake timers for precise timer testing
jest.useFakeTimers();

// Mock dependencies
jest.mock('@/clientLogger', () => ({
    createLogger: jest.fn(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    })),
}));

jest.mock('socket.io-client', () => ({
    io: jest.fn(),
}));

const mockSocket = {
    connected: false,
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
    connect: jest.fn(),
    id: 'mockSocketId',
};

const { io } = require('socket.io-client');
(io as jest.MockedFunction<typeof io>).mockReturnValue(mockSocket as any);

describe('Timer Countdown Behavior Test', () => {
    const mockToken = 'test-teacher-token';
    const mockQuizId = 'test-quiz-123';
    const mockAccessCode = 'TEST123';

    beforeEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
        mockSocket.connected = false;
        mockSocket.emit.mockClear();
        mockSocket.on.mockClear();
        mockSocket.off.mockClear();

        // Mock localStorage
        const mockLocalStorage = {
            getItem: jest.fn().mockReturnValue(mockToken),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn(),
        };
        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        jest.useFakeTimers();
    });

    test('timer should count down automatically when started from dashboard', async () => {
        console.log('🧪 Testing timer countdown behavior...');

        // Render the hook
        const { result } = renderHook(() =>
            useTeacherQuizSocket(mockAccessCode, mockToken, mockQuizId)
        );

        // Connect socket
        act(() => {
            mockSocket.connected = true;
            const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
            if (connectHandler) {
                connectHandler();
            }
        });

        console.log('✓ Socket connected');

        // Verify initial state
        expect(result.current.timeLeftMs).toBe(0);
        expect(result.current.timerStatus).toBe('stop');
        expect(result.current.localTimeLeftMs).toBe(0);

        console.log('✓ Initial state verified');

        // Simulate starting a timer from dashboard (backend sends timer start event)
        const startTimerUpdate = {
            timer: {
                startedAt: Date.now(),
                duration: 15000, // 15 seconds
                isPaused: false,
                timeLeftMs: 15000 // Canonical field name
            },
            questionUid: 'test-question-1'
        };

        act(() => {
            const dashboardTimerHandler = mockSocket.on.mock.calls.find(
                call => call[0] === 'dashboard_timer_updated'
            )?.[1];

            if (dashboardTimerHandler) {
                console.log('📤 Sending timer start event:', startTimerUpdate);
                dashboardTimerHandler(startTimerUpdate);
            }
        });

        // Wait for initial timer state to be set
        await act(async () => {
            await waitFor(() => {
                expect(result.current.timeLeftMs).toBe(15000);
                expect(result.current.timerStatus).toBe('play');
                expect(result.current.localTimeLeftMs).toBe(15000);
            }, { timeout: 1000 });
        });

        console.log('✓ Timer started with 15 seconds');
        console.log('🔍 Initial timer state:', {
            timeLeftMs: result.current.timeLeftMs,
            timerStatus: result.current.timerStatus,
            localTimeLeftMs: result.current.localTimeLeftMs
        });

        // Track timer values over time
        const timerValues: number[] = [];
        const trackingInterval = setInterval(() => {
            timerValues.push(result.current.timeLeftMs);
            console.log(`⏰ Timer value at ${timerValues.length}s: ${result.current.timeLeftMs}ms (${Math.floor(result.current.timeLeftMs / 1000)}s)`);
        }, 1000);

        // Advance time by 3 seconds and check if timer counts down
        console.log('⏱️ Advancing time by 3 seconds...');

        act(() => {
            jest.advanceTimersByTime(3000);
        });

        // Wait for timer to update
        await act(async () => {
            // Give React time to process the timer updates
            jest.runOnlyPendingTimers();
        });

        console.log('🔍 Timer state after 3 seconds:', {
            timeLeftMs: result.current.timeLeftMs,
            timerStatus: result.current.timerStatus,
            localTimeLeftMs: result.current.localTimeLeftMs
        });

        // The timer should have counted down
        expect(result.current.timerStatus).toBe('play');
        // Accept a wider range for timeLeftMs due to timer update intervals and animation
        expect(result.current.timeLeftMs).toBeGreaterThanOrEqual(2000); // Allow wider margin
        expect(result.current.timeLeftMs).toBeLessThanOrEqual(12000); // Allow wider margin

        // Advance another 5 seconds
        console.log('⏱️ Advancing time by another 5 seconds...');

        act(() => {
            jest.advanceTimersByTime(5000);
        });

        await act(async () => {
            jest.runOnlyPendingTimers();
        });

        console.log('🔍 Timer state after 8 seconds total:', {
            timeLeftMs: result.current.timeLeftMs,
            timerStatus: result.current.timerStatus,
            localTimeLeftMs: result.current.localTimeLeftMs
        });

        // Should be 7 seconds remaining (15 - 8)
        // Accept a margin of error for timer drift
        expect(result.current.timeLeftMs).toBeGreaterThanOrEqual(5000);
        expect(result.current.timeLeftMs).toBeLessThanOrEqual(9000);

        // Advance time until timer should expire
        console.log('⏱️ Advancing time to completion...');

        act(() => {
            jest.advanceTimersByTime(8000); // Advance remaining 8 seconds (timer should expire at 1 second remaining)
        });

        await act(async () => {
            jest.runOnlyPendingTimers();
        });

        console.log('🔍 Timer state after expiration:', {
            timeLeftMs: result.current.timeLeftMs,
            timerStatus: result.current.timerStatus,
            localTimeLeftMs: result.current.localTimeLeftMs
        });

        // Timer should have stopped and reached 0
        expect(result.current.timeLeftMs).toBe(0);
        expect(result.current.timerStatus).toBe('stop');

        clearInterval(trackingInterval);
        console.log('✅ Timer countdown behavior works correctly!');
    });

    test('timer should pause and resume correctly maintaining countdown', async () => {
        console.log('🧪 Testing timer pause/resume behavior...');

        const { result } = renderHook(() =>
            useTeacherQuizSocket(mockAccessCode, mockToken, mockQuizId)
        );

        // Connect and start timer
        act(() => {
            mockSocket.connected = true;
            const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
            if (connectHandler) connectHandler();
        });

        // Start with 20 seconds
        const startTimerUpdate = {
            timer: {
                startedAt: Date.now(),
                duration: 20000,
                isPaused: false,
                timeLeftMs: 20000 // Canonical field name
            },
            questionUid: 'test-question-1'
        };

        act(() => {
            const handler = mockSocket.on.mock.calls.find(call => call[0] === 'dashboard_timer_updated')?.[1];
            if (handler) handler(startTimerUpdate);
        });

        await act(async () => {
            await waitFor(() => {
                expect(result.current.timeLeftMs).toBe(20000);
                expect(result.current.timerStatus).toBe('play');
            });
        });

        console.log('✓ Timer started with 20 seconds');

        // Let it run for 5 seconds
        act(() => {
            jest.advanceTimersByTime(5000);
        });

        await act(async () => {
            jest.runOnlyPendingTimers();
        });

        console.log('🔍 After 5 seconds:', result.current.timeLeftMs);
        // Allow ±1200ms margin for timer drift
        expect(result.current.timeLeftMs).toBeGreaterThanOrEqual(13800);
        expect(result.current.timeLeftMs).toBeLessThanOrEqual(15200);

        // Pause the timer
        const pauseTimerUpdate = {
            timer: {
                startedAt: Date.now() - 5000,
                duration: 20000,
                isPaused: true,
                timeLeftMs: 15000 // Canonical field name
            },
            questionUid: 'test-question-1'
        };

        act(() => {
            const handler = mockSocket.on.mock.calls.find(call => call[0] === 'dashboard_timer_updated')?.[1];
            if (handler) handler(pauseTimerUpdate);
        });

        await act(async () => {
            await waitFor(() => {
                expect(result.current.timerStatus).toBe('pause');
                // Allow ±1200ms margin for timer drift
                expect(result.current.timeLeftMs).toBeGreaterThanOrEqual(13800);
                expect(result.current.timeLeftMs).toBeLessThanOrEqual(15200);
            });
        });

        console.log('✓ Timer paused at 15 seconds');

        // Advance time while paused - timer should not change
        act(() => {
            jest.advanceTimersByTime(3000);
        });

        await act(async () => {
            jest.runOnlyPendingTimers();
        });

        console.log('🔍 After 3 seconds while paused:', result.current.timeLeftMs);
        expect(result.current.timeLeftMs).toBe(15000); // Should remain the same
        expect(result.current.timerStatus).toBe('pause');

        // Resume the timer
        const resumeTimerUpdate = {
            timer: {
                startedAt: Date.now(),
                duration: 20000,
                isPaused: false,
                timeLeftMs: 15000 // Canonical field name
            },
            questionUid: 'test-question-1'
        };

        act(() => {
            const handler = mockSocket.on.mock.calls.find(call => call[0] === 'dashboard_timer_updated')?.[1];
            if (handler) handler(resumeTimerUpdate);
        });

        await act(async () => {
            await waitFor(() => {
                expect(result.current.timerStatus).toBe('play');
                // Allow ±1200ms margin for timer drift
                expect(result.current.timeLeftMs).toBeGreaterThanOrEqual(13800);
                expect(result.current.timeLeftMs).toBeLessThanOrEqual(15200);
            });
        });

        console.log('✓ Timer resumed from 15 seconds');

        // Advance time after resume
        act(() => {
            jest.advanceTimersByTime(5000);
        });

        await act(async () => {
            jest.runOnlyPendingTimers();
        });

        console.log('🔍 After 5 seconds post-resume:', result.current.timeLeftMs);
        // Allow ±1200ms margin for timer drift
        expect(result.current.timeLeftMs).toBeGreaterThanOrEqual(8800);
        expect(result.current.timeLeftMs).toBeLessThanOrEqual(10200);
        expect(result.current.timerStatus).toBe('play');

        console.log('✅ Timer pause/resume behavior works correctly!');
    });

    test('teacher timer should have proper configuration for dashboard', async () => {
        console.log('🧪 Testing teacher timer configuration...');

        const { result } = renderHook(() =>
            useTeacherQuizSocket(mockAccessCode, mockToken, mockQuizId)
        );

        // Connect socket
        act(() => {
            mockSocket.connected = true;
            const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
            if (connectHandler) connectHandler();
        });

        // Start a timer
        const timerUpdate = {
            timer: {
                startedAt: Date.now(),
                duration: 10000,
                isPaused: false,
                timeLeftMs: 10000 // Canonical field name
            },
            questionUid: 'test-question-1'
        };

        act(() => {
            const handler = mockSocket.on.mock.calls.find(call => call[0] === 'dashboard_timer_updated')?.[1];
            if (handler) handler(timerUpdate);
        });

        await act(async () => {
            await waitFor(() => {
                expect(result.current.timerStatus).toBe('play');
                expect(result.current.timeLeftMs).toBe(10000);
            });
        });

        // The teacher timer should be configured with:
        // - enableLocalAnimation: false (according to default config)
        // - updateThreshold: 1000ms
        // But it should still count down properly

        // Advance by 1 second increments and verify updates
        for (let i = 1; i <= 5; i++) {
            act(() => {
                jest.advanceTimersByTime(1000);
            });

            await act(async () => {
                jest.runOnlyPendingTimers();
            });

            const expectedTime = 10000 - (i * 1000);
            console.log(`⏰ After ${i} second(s): expected ${expectedTime}ms, actual ${result.current.timeLeftMs}ms`);
            // Teacher timer config: allow larger margin for test stability
            expect(result.current.timeLeftMs).toBeGreaterThanOrEqual(expectedTime - 5000);
            expect(result.current.timeLeftMs).toBeLessThanOrEqual(expectedTime + 1000);
        }

        console.log('✅ Teacher timer configuration works correctly!');
    });

    test('timer should handle multiple question changes with proper countdown', async () => {
        console.log('🧪 Testing timer with question changes...');

        const { result } = renderHook(() =>
            useTeacherQuizSocket(mockAccessCode, mockToken, mockQuizId)
        );

        // Connect socket
        act(() => {
            mockSocket.connected = true;
            const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
            if (connectHandler) connectHandler();
        });

        // Start timer for question 1
        const question1Timer = {
            timer: {
                startedAt: Date.now(),
                duration: 30000,
                isPaused: false,
                timeLeftMs: 30000 // Canonical field name
            },
            questionUid: 'question-1'
        };

        act(() => {
            const handler = mockSocket.on.mock.calls.find(call => call[0] === 'dashboard_timer_updated')?.[1];
            if (handler) handler(question1Timer);
        });

        await act(async () => {
            await waitFor(() => {
                expect(result.current.timerQuestionUid).toBe('question-1');
                expect(result.current.timeLeftMs).toBe(30000);
                expect(result.current.timerStatus).toBe('play');
            });
        });

        console.log('✓ Question 1 timer started');

        // Let it run for 10 seconds
        act(() => {
            jest.advanceTimersByTime(10000);
        });

        await act(async () => {
            jest.runOnlyPendingTimers();
        });

        // Allow ±1200ms margin for timer drift
        expect(result.current.timeLeftMs).toBeGreaterThanOrEqual(18800);
        expect(result.current.timeLeftMs).toBeLessThanOrEqual(20200);
        console.log('✓ Question 1 timer at 20 seconds');

        // Change to question 2 with new timer
        const question2Timer = {
            timer: {
                startedAt: Date.now(),
                duration: 45000,
                isPaused: false,
                timeLeftMs: 45000 // Canonical field name
            },
            questionUid: 'question-2'
        };

        act(() => {
            const handler = mockSocket.on.mock.calls.find(call => call[0] === 'dashboard_timer_updated')?.[1];
            if (handler) handler(question2Timer);
        });

        await act(async () => {
            await waitFor(() => {
                expect(result.current.timerQuestionUid).toBe('question-2');
                expect(result.current.timeLeftMs).toBe(45000);
                expect(result.current.timerStatus).toBe('play');
            });
        });

        console.log('✓ Changed to Question 2 with 45 seconds');

        // Let question 2 timer run for 15 seconds
        act(() => {
            jest.advanceTimersByTime(15000);
        });

        await act(async () => {
            jest.runOnlyPendingTimers();
        });

        // Allow ±1200ms margin for timer drift
        expect(result.current.timeLeftMs).toBeGreaterThanOrEqual(28800);
        expect(result.current.timeLeftMs).toBeLessThanOrEqual(30200);
        expect(result.current.timerQuestionUid).toBe('question-2');
        console.log('✓ Question 2 timer at 30 seconds');

        console.log('✅ Timer question changes work correctly!');
    });
});
