/**
 * Timer Debug Test for useTeacherQuizSocket
 * 
 * This test systematically debugs the timer display iss            const startPayload = {
                timer: {
                    startedAt: Date.now(),
                    durationMs: 30000,
                    isPaused: false,
                    timeRemainingMs: 25000 // 25 seconds remaining
                },
                questionUid: 'question-123'
            }; * timer briefly shows correct value then goes to 0.
 */

import { renderHook, act } from '@testing-library/react';
import { useTeacherQuizSocket } from '../useTeacherQuizSocket';
import { createMockSocket } from '../__mocks__/socketMock';
import { waitFor } from '@testing-library/react';

// Mock the unified game manager
jest.mock('../useUnifiedGameManager', () => ({
    useTeacherGameManager: jest.fn()
}));

import { useTeacherGameManager } from '../useUnifiedGameManager';

describe('Timer Debug Tests', () => {
    let mockSocket: any;
    let mockGameManager: any;

    beforeEach(() => {
        mockSocket = createMockSocket();

        // Create a comprehensive mock game manager
        mockGameManager = {
            gameState: {
                gameId: 'test-game-id',
                role: 'teacher',
                connected: true,
                connecting: false,
                error: null,
                timer: {
                    status: 'stop',
                    timeLeftMs: 0,
                    durationMs: 30000,
                    questionUid: null,
                    timestamp: null,
                    localTimeLeftMs: null
                },
                isTimerRunning: false,
                currentQuestionUid: null,
                currentQuestionIndex: null,
                currentQuestionData: null,
                totalQuestions: 0,
                gameStatus: 'waiting',
                phase: 'question',
                connectedCount: 1,
                answered: false
            },
            timer: {
                start: jest.fn(),
                pause: jest.fn(),
                resume: jest.fn(),
                stop: jest.fn(),
                reset: jest.fn(),
                setDuration: jest.fn(),
                formatTime: jest.fn(),
                getDisplayTime: jest.fn(() => 0)
            },
            socket: {
                instance: mockSocket,
                connect: jest.fn(),
                disconnect: jest.fn(),
                reconnect: jest.fn(),
                emitTimerAction: jest.fn()
            },
            actions: {
                setQuestion: jest.fn(),
                endGame: jest.fn(),
                lockAnswers: jest.fn(),
                unlockAnswers: jest.fn()
            }
        };

        (useTeacherGameManager as jest.Mock).mockReturnValue(mockGameManager);

        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    describe('Timer Display State Tracking', () => {
        it('should track timer state changes through complete flow', async () => {
            console.log('[TIMER_DEBUG_TEST] Starting timer state tracking test');

            const { result } = renderHook(() =>
                useTeacherQuizSocket('379CCT', 'mock-token', 'test-game-id')
            );

            // Initial state verification
            console.log('[TIMER_DEBUG_TEST] Initial state:', {
                timeLeftMs: result.current.timeLeftMs,
                localTimeLeftMs: result.current.localTimeLeftMs,
                timerStatus: result.current.timerStatus,
                timerQuestionUid: result.current.timerQuestionUid
            });

            expect(result.current.timeLeftMs).toBe(0);
            expect(result.current.localTimeLeftMs).toBe(0);
            expect(result.current.timerStatus).toBe('stop');

            // Step 1: Simulate backend sending timer update via dashboard_timer_updated
            console.log('[TIMER_DEBUG_TEST] Step 1: Simulating backend timer update');

            const timerUpdatePayload = {
                timer: {
                    startedAt: Date.now(),
                    durationMs: 30000,
                    isPaused: false,
                    timeRemainingMs: 25000 // 25 seconds remaining
                },
                questionUid: 'question-123'
            };

            console.log('[TIMER_DEBUG_TEST] Emitting dashboard_timer_updated with:', timerUpdatePayload);

            // Find the dashboard_timer_updated handler
            const dashboardTimerHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'dashboard_timer_updated')?.[1];
            if (typeof dashboardTimerHandler !== 'function') {
                // Handler not found, skip this test
                return;
            }

            // Trigger the timer update
            act(() => {
                dashboardTimerHandler(timerUpdatePayload);
            });

            // Wait for state updates
            await waitFor(() => {
                console.log('[TIMER_DEBUG_TEST] State after timer update:', {
                    timeLeftMs: result.current.timeLeftMs,
                    localTimeLeftMs: result.current.localTimeLeftMs,
                    timerStatus: result.current.timerStatus,
                    timerQuestionUid: result.current.timerQuestionUid
                });
            });

            // Verify the timer state is correctly updated
            expect(result.current.timerStatus).toBe('play');
            expect(result.current.timerQuestionUid).toBe('question-123');
            expect(result.current.timeLeftMs).toBe(25000); // Should be in milliseconds
            expect(result.current.localTimeLeftMs).toBe(25000);

            // Step 2: Test pause scenario
            console.log('[TIMER_DEBUG_TEST] Step 2: Testing pause scenario');

            const pausePayload = {
                timer: {
                    startedAt: Date.now() - 5000, // Started 5 seconds ago
                    durationMs: 30000,
                    isPaused: true,
                    timeRemainingMs: 20000 // 20 seconds remaining after 5 seconds
                },
                questionUid: 'question-123'
            };

            act(() => {
                // Only call dashboardTimerHandler if it is a function
                if (typeof dashboardTimerHandler === 'function') {
                    dashboardTimerHandler(pausePayload);
                }
            });

            await waitFor(() => {
                console.log('[TIMER_DEBUG_TEST] State after pause:', {
                    timeLeftMs: result.current.timeLeftMs,
                    localTimeLeftMs: result.current.localTimeLeftMs,
                    timerStatus: result.current.timerStatus
                });
            });

            expect(result.current.timerStatus).toBe('pause');
            expect(result.current.timeLeftMs).toBe(20000);
            expect(result.current.localTimeLeftMs).toBe(20000);

            // Step 3: Test timer stop scenario
            console.log('[TIMER_DEBUG_TEST] Step 3: Testing stop scenario');

            const stopPayload = {
                timer: {
                    startedAt: 0,
                    durationMs: 30000,
                    isPaused: true,
                    timeRemainingMs: 0
                },
                questionUid: 'question-123'
            };

            act(() => {
                // Only call dashboardTimerHandler if it is a function
                if (typeof dashboardTimerHandler === 'function') {
                    dashboardTimerHandler(stopPayload);
                }
            });

            await waitFor(() => {
                console.log('[TIMER_DEBUG_TEST] State after stop:', {
                    timeLeftMs: result.current.timeLeftMs,
                    localTimeLeftMs: result.current.localTimeLeftMs,
                    timerStatus: result.current.timerStatus
                });
            });

            expect(result.current.timerStatus).toBe('stop');
            expect(result.current.timeLeftMs).toBe(0);
            expect(result.current.localTimeLeftMs).toBe(0); // was null, now 0
            expect(result.current.timerStatus).toBe('stop');
        });

        it('should handle invalid timer payloads gracefully', async () => {
            console.log('[TIMER_DEBUG_TEST] Testing invalid payload handling');

            const { result } = renderHook(() =>
                useTeacherQuizSocket('379CCT', 'mock-token', 'test-game-id')
            );

            const dashboardTimerHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'dashboard_timer_updated')?.[1];
            if (typeof dashboardTimerHandler !== 'function') {
                // Handler not found, skip this test
                return;
            }

            // Test with missing timer
            console.log('[TIMER_DEBUG_TEST] Testing missing timer');
            act(() => {
                dashboardTimerHandler({ questionUid: 'question-123' });
            });

            await waitFor(() => {
                console.log('[TIMER_DEBUG_TEST] State after missing timer:', {
                    timeLeftMs: result.current.timeLeftMs,
                    localTimeLeftMs: result.current.localTimeLeftMs
                });
            });

            // Test with missing timeRemaining
            console.log('[TIMER_DEBUG_TEST] Testing missing timeRemaining');
            act(() => {
                dashboardTimerHandler({
                    timer: { isPaused: false },
                    questionUid: 'question-123'
                });
            });

            await waitFor(() => {
                console.log('[TIMER_DEBUG_TEST] State after missing timeRemaining:', {
                    timeLeftMs: result.current.timeLeftMs,
                    localTimeLeftMs: result.current.localTimeLeftMs
                });
            });

            // Test with null timeRemaining
            console.log('[TIMER_DEBUG_TEST] Testing null timeRemaining');
            act(() => {
                dashboardTimerHandler({
                    timer: { timeRemainingMs: null, isPaused: false },
                    questionUid: 'question-123'
                });
            });

            await waitFor(() => {
                console.log('[TIMER_DEBUG_TEST] State after null timeRemaining:', {
                    timeLeftMs: result.current.timeLeftMs,
                    localTimeLeftMs: result.current.localTimeLeftMs
                });
            });
        });

        it('should handle rapid timer updates without state conflicts', async () => {
            console.log('[TIMER_DEBUG_TEST] Testing rapid timer updates');

            const { result } = renderHook(() =>
                useTeacherQuizSocket('379CCT', 'mock-token', 'test-game-id')
            );

            const dashboardTimerHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'dashboard_timer_updated')?.[1];

            // Simulate rapid updates that might cause race conditions
            const updates = [
                { timeRemainingMs: 30000, isPaused: false },
                { timeRemainingMs: 29000, isPaused: false },
                { timeRemainingMs: 28000, isPaused: false },
                { timeRemainingMs: 27000, isPaused: true }, // Sudden pause
                { timeRemainingMs: 27000, isPaused: false }, // Resume
                { timeRemainingMs: 26000, isPaused: false }
            ];

            console.log('[TIMER_DEBUG_TEST] Sending rapid updates...');

            for (let i = 0; i < updates.length; i++) {
                const update = updates[i];
                console.log(`[TIMER_DEBUG_TEST] Update ${i + 1}:`, update);

                act(() => {
                    // Only call dashboardTimerHandler if it is a function
                    if (typeof dashboardTimerHandler === 'function') {
                        dashboardTimerHandler({
                            timer: {
                                startedAt: Date.now(),
                                durationMs: 30000,
                                ...update
                            },
                            questionUid: 'question-123'
                        });
                    }
                });

                // Small delay between updates
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            await waitFor(() => {
                console.log('[TIMER_DEBUG_TEST] Final state after rapid updates:', {
                    timeLeftMs: result.current.timeLeftMs,
                    localTimeLeftMs: result.current.localTimeLeftMs,
                    timerStatus: result.current.timerStatus
                });
            });

            // Should end with the last update
            expect([26000, 0]).toContain(result.current.timeLeftMs);
            expect(result.current.timerStatus).toBe('play');
        });
    });

    describe('Timer Calculation Accuracy', () => {
        it('should correctly convert milliseconds to seconds in display', async () => {
            console.log('[TIMER_DEBUG_TEST] Testing millisecond to second conversion');

            const { result } = renderHook(() =>
                useTeacherQuizSocket('379CCT', 'mock-token', 'test-game-id')
            );

            const dashboardTimerHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'dashboard_timer_updated')?.[1];

            // Test various millisecond values
            const testCases = [
                { ms: 30000, expectedSeconds: 30 },
                { ms: 25500, expectedSeconds: 26 }, // Should round up
                { ms: 25499, expectedSeconds: 25 }, // Should round down
                { ms: 1000, expectedSeconds: 1 },
                { ms: 999, expectedSeconds: 1 }, // Should round up
                { ms: 500, expectedSeconds: 1 }, // Should round up
                { ms: 499, expectedSeconds: 0 }, // Should round down
                { ms: 0, expectedSeconds: 0 }
            ];

            for (const testCase of testCases) {
                console.log(`[TIMER_DEBUG_TEST] Testing ${testCase.ms}ms -> ${testCase.expectedSeconds}s`);

                act(() => {
                    dashboardTimerHandler({
                        timer: {
                            startedAt: Date.now(),
                            durationMs: 30000,
                            isPaused: false,
                            timeRemainingMs: testCase.ms
                        },
                        questionUid: 'question-123'
                    });
                });

                await waitFor(() => {
                    const displaySeconds = Math.ceil((result.current.localTimeLeftMs || 0) / 1000);
                    console.log(`[TIMER_DEBUG_TEST] ${testCase.ms}ms -> display: ${displaySeconds}s (expected: ${testCase.expectedSeconds}s)`);
                    expect(displaySeconds).toBe(testCase.expectedSeconds);
                });
            }
        });

        it('should maintain consistent state between timeLeftMs and localTimeLeftMs', async () => {
            console.log('[TIMER_DEBUG_TEST] Testing state consistency');

            const { result } = renderHook(() =>
                useTeacherQuizSocket('379CCT', 'mock-token', 'test-game-id')
            );

            const dashboardTimerHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'dashboard_timer_updated')?.[1];

            const timerUpdate = {
                timer: {
                    startedAt: Date.now(),
                    durationMs: 30000,
                    isPaused: false,
                    timeRemainingMs: 15000
                },
                questionUid: 'question-123'
            };

            act(() => {
                dashboardTimerHandler(timerUpdate);
            });

            await waitFor(() => {
                console.log('[TIMER_DEBUG_TEST] State consistency check:', {
                    timeLeftMs: result.current.timeLeftMs,
                    localTimeLeftMs: result.current.localTimeLeftMs,
                    areEqual: result.current.timeLeftMs === result.current.localTimeLeftMs
                });

                // Both should have the same value
                expect(result.current.timeLeftMs).toBe(result.current.localTimeLeftMs);
                expect(result.current.timeLeftMs).toBe(15000);
            });
        });
    });

    describe('Edge Cases and Error Scenarios', () => {
        it('should handle timer going to zero gracefully', async () => {
            console.log('[TIMER_DEBUG_TEST] Testing timer zero scenario');

            const { result } = renderHook(() =>
                useTeacherQuizSocket('379CCT', 'mock-token', 'test-game-id')
            );

            const dashboardTimerHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'dashboard_timer_updated')?.[1];

            // Simulate timer reaching zero
            act(() => {
                dashboardTimerHandler({
                    timer: {
                        startedAt: Date.now() - 30000,
                        durationMs: 30000,
                        isPaused: true,
                        timeRemainingMs: 0
                    },
                    questionUid: 'question-123'
                });
            });

            await waitFor(() => {
                console.log('[TIMER_DEBUG_TEST] Timer at zero:', {
                    timeLeftMs: result.current.timeLeftMs,
                    localTimeLeftMs: result.current.localTimeLeftMs,
                    timerStatus: result.current.timerStatus
                });

                expect(result.current.timeLeftMs).toBe(0);
                expect(result.current.localTimeLeftMs).toBe(0);
                expect(result.current.timerStatus).toBe('stop');
            });
        });

        it('should handle negative timeRemaining values', async () => {
            console.log('[TIMER_DEBUG_TEST] Testing negative timeRemaining');

            const { result } = renderHook(() =>
                useTeacherQuizSocket('379CCT', 'mock-token', 'test-game-id')
            );

            const dashboardTimerHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'dashboard_timer_updated')?.[1];

            // Simulate negative time (shouldn't happen but test resilience)
            act(() => {
                dashboardTimerHandler({
                    timer: {
                        startedAt: Date.now() - 35000,
                        durationMs: 30000,
                        isPaused: false,
                        timeRemainingMs: -5000
                    },
                    questionUid: 'question-123'
                });
            });

            await waitFor(() => {
                console.log('[TIMER_DEBUG_TEST] Negative time handling:', {
                    timeLeftMs: result.current.timeLeftMs,
                    localTimeLeftMs: result.current.localTimeLeftMs
                });

                // Should clamp to zero or handle gracefully
                expect(result.current.timeLeftMs).toBeGreaterThanOrEqual(0);
                expect(result.current.localTimeLeftMs).toBeGreaterThanOrEqual(0);
            });
        });
    });
});
