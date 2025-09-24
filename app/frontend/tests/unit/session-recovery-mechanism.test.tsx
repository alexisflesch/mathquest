/**
 * Session Recovery Mechanism Test
 *
 * Tests the session recovery functionality implemented to fix Bug #9
 * Ensures that practice sessions persist across browser refreshes
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { io, Socket } from 'socket.io-client';
import { usePracticeSession } from '@/hooks/usePracticeSession';
import { PracticeSettings } from '@shared/types/practice/session';

// Mock socket.io-client
jest.mock('socket.io-client');
const mockIo = io as jest.MockedFunction<typeof io>;

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Mock logger
jest.mock('@/clientLogger', () => ({
    createLogger: () => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    })
}));

describe('Session Recovery Mechanism', () => {
    let mockSocket: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mock socket
        mockSocket = {
            connected: true,
            on: jest.fn(),
            off: jest.fn(),
            emit: jest.fn(),
            once: jest.fn(),
            disconnect: jest.fn(),
        };
        mockIo.mockReturnValue(mockSocket as any);

        // Setup localStorage mocks
        localStorageMock.getItem.mockReturnValue(null);
        localStorageMock.setItem.mockImplementation(() => { });
        localStorageMock.removeItem.mockImplementation(() => { });
    });

    describe('Session Storage in localStorage', () => {
        test('stores session ID when new session is created', async () => {
            const userId = 'test-user-123';
            const settings: PracticeSettings = {
                gradeLevel: '6ème',
                discipline: 'mathématiques',
                themes: ['algèbre'],
                questionCount: 10,
                showImmediateFeedback: true,
                allowRetry: true,
                randomizeQuestions: false
            };

            const { result } = renderHook(() =>
                usePracticeSession({ userId, settings })
            );

            // Simulate socket connection
            act(() => {
                const connectHandler = mockSocket.on.mock.calls.find(
                    (call: any) => call[0] === 'connect'
                )[1];
                connectHandler();
            });

            // Simulate session creation
            act(() => {
                const sessionCreatedHandler = mockSocket.on.mock.calls.find(
                    (call: any) => call[0] === 'PRACTICE_SESSION_CREATED'
                )[1];

                sessionCreatedHandler({
                    session: {
                        sessionId: 'test-session-456',
                        userId,
                        currentQuestionIndex: 0,
                        questionPool: ['q1', 'q2'],
                        currentQuestion: { uid: 'q1', question: 'Test?' }
                    }
                });
            });

            // Verify session ID was stored
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                `practice_session_${userId}`,
                'test-session-456'
            );
        });

        test('clears session ID when session is completed', async () => {
            const userId = 'test-user-123';
            const settings: PracticeSettings = {
                gradeLevel: '6ème',
                discipline: 'mathématiques',
                themes: ['algèbre'],
                questionCount: 10,
                showImmediateFeedback: true,
                allowRetry: true,
                randomizeQuestions: false
            };

            // Pre-populate localStorage with session ID
            localStorageMock.getItem.mockReturnValue('test-session-456');

            const { result } = renderHook(() =>
                usePracticeSession({ userId, settings })
            );

            // Simulate session completion
            act(() => {
                const sessionCompletedHandler = mockSocket.on.mock.calls.find(
                    (call: any) => call[0] === 'PRACTICE_SESSION_COMPLETED'
                )[1];

                sessionCompletedHandler({
                    session: { sessionId: 'test-session-456' },
                    summary: { totalQuestions: 10, correctAnswers: 8 }
                });
            });

            // Verify session ID was cleared
            expect(localStorageMock.removeItem).toHaveBeenCalledWith(
                `practice_session_${userId}`
            );
        });

        test('clears session ID on disconnect', async () => {
            const userId = 'test-user-123';
            const settings: PracticeSettings = {
                gradeLevel: '6ème',
                discipline: 'mathématiques',
                themes: ['algèbre'],
                questionCount: 10,
                showImmediateFeedback: true,
                allowRetry: true,
                randomizeQuestions: false
            };

            const { result } = renderHook(() =>
                usePracticeSession({ userId, settings })
            );

            // Call disconnect
            act(() => {
                result.current.disconnect();
            });

            // Verify session ID was cleared
            expect(localStorageMock.removeItem).toHaveBeenCalledWith(
                `practice_session_${userId}`
            );
        });
    });

    describe('Session Recovery on Connection', () => {
        test('attempts to recover stored session on socket connection', async () => {
            const userId = 'test-user-123';
            const storedSessionId = 'stored-session-789';
            const settings: PracticeSettings = {
                gradeLevel: '6ème',
                discipline: 'mathématiques',
                themes: ['algèbre'],
                questionCount: 10,
                showImmediateFeedback: true,
                allowRetry: true,
                randomizeQuestions: false
            };

            // Setup stored session ID
            localStorageMock.getItem.mockReturnValue(storedSessionId);

            const { result } = renderHook(() =>
                usePracticeSession({ userId, settings })
            );

            // Simulate socket connection
            act(() => {
                const connectHandler = mockSocket.on.mock.calls.find(
                    (call: any) => call[0] === 'connect'
                )[1];
                connectHandler();
            });

            // Verify recovery was attempted
            expect(mockSocket.emit).toHaveBeenCalledWith(
                'GET_PRACTICE_SESSION_STATE',
                { sessionId: storedSessionId }
            );
        });

        test('does not attempt recovery if no stored session exists', async () => {
            const userId = 'test-user-123';
            const settings: PracticeSettings = {
                gradeLevel: '6ème',
                discipline: 'mathématiques',
                themes: ['algèbre'],
                questionCount: 10,
                showImmediateFeedback: true,
                allowRetry: true,
                randomizeQuestions: false
            };

            // No stored session ID
            localStorageMock.getItem.mockReturnValue(null);

            const { result } = renderHook(() =>
                usePracticeSession({ userId, settings })
            );

            // Simulate socket connection
            act(() => {
                const connectHandler = mockSocket.on.mock.calls.find(
                    (call: any) => call[0] === 'connect'
                )[1];
                connectHandler();
            });

            // Verify no recovery was attempted
            expect(mockSocket.emit).not.toHaveBeenCalledWith(
                'GET_PRACTICE_SESSION_STATE',
                expect.any(Object)
            );
        });

        test('does not attempt recovery if session already exists', async () => {
            const userId = 'test-user-123';
            const storedSessionId = 'stored-session-789';
            const settings: PracticeSettings = {
                gradeLevel: '6ème',
                discipline: 'mathématiques',
                themes: ['algèbre'],
                questionCount: 10,
                showImmediateFeedback: true,
                allowRetry: true,
                randomizeQuestions: false
            };

            // Setup stored session ID
            localStorageMock.getItem.mockReturnValue(storedSessionId);

            const { result } = renderHook(() =>
                usePracticeSession({ userId, settings })
            );

            // First set up an existing session
            act(() => {
                const sessionCreatedHandler = mockSocket.on.mock.calls.find(
                    (call: any) => call[0] === 'PRACTICE_SESSION_CREATED'
                )[1];

                sessionCreatedHandler({
                    session: {
                        sessionId: 'current-session-999',
                        userId,
                        currentQuestionIndex: 0,
                        questionPool: ['q1', 'q2']
                    }
                });
            });

            // Reset emit mock to check only new calls
            mockSocket.emit.mockClear();

            // Simulate socket connection
            act(() => {
                const connectHandler = mockSocket.on.mock.calls.find(
                    (call: any) => call[0] === 'connect'
                )[1];
                connectHandler();
            });

            // Verify no recovery was attempted (session already exists)
            expect(mockSocket.emit).not.toHaveBeenCalledWith(
                'GET_PRACTICE_SESSION_STATE',
                expect.any(Object)
            );
        });
    });

    describe('Browser Refresh Simulation', () => {
        test('recovers session state after browser refresh', async () => {
            const userId = 'test-user-123';
            const storedSessionId = 'refresh-session-101';
            const settings: PracticeSettings = {
                gradeLevel: '6ème',
                discipline: 'mathématiques',
                themes: ['algèbre'],
                questionCount: 10,
                showImmediateFeedback: true,
                allowRetry: true,
                randomizeQuestions: false
            };

            // Setup stored session ID (simulating pre-refresh state)
            localStorageMock.getItem.mockReturnValue(storedSessionId);

            const { result } = renderHook(() =>
                usePracticeSession({ userId, settings })
            );

            // Simulate browser refresh (new hook instance)
            // Socket connects and recovery should be triggered
            act(() => {
                const connectHandler = mockSocket.on.mock.calls.find(
                    (call: any) => call[0] === 'connect'
                )[1];
                connectHandler();
            });

            // Verify recovery request was sent
            expect(mockSocket.emit).toHaveBeenCalledWith(
                'GET_PRACTICE_SESSION_STATE',
                { sessionId: storedSessionId }
            );

            // Simulate successful recovery response
            act(() => {
                const sessionStateHandler = mockSocket.on.mock.calls.find(
                    (call: any) => call[0] === 'PRACTICE_SESSION_STATE'
                )[1];

                sessionStateHandler({
                    session: {
                        sessionId: storedSessionId,
                        userId,
                        currentQuestionIndex: 5,
                        questionPool: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'],
                        currentQuestion: { uid: 'q6', question: 'Recovered question?' },
                        statistics: { questionsAttempted: 5, correctAnswers: 4 }
                    },
                    sessionId: storedSessionId
                });
            });

            // Verify session was recovered
            await waitFor(() => {
                expect(result.current.state.sessionId).toBe(storedSessionId);
                expect(result.current.state.session?.currentQuestionIndex).toBe(5);
            });
        });

        test('clears invalid session ID after failed recovery', async () => {
            const userId = 'test-user-123';
            const invalidSessionId = 'invalid-session-404';
            const settings: PracticeSettings = {
                gradeLevel: '6ème',
                discipline: 'mathématiques',
                themes: ['algèbre'],
                questionCount: 10,
                showImmediateFeedback: true,
                allowRetry: true,
                randomizeQuestions: false
            };

            // Setup invalid stored session ID
            localStorageMock.getItem.mockReturnValue(invalidSessionId);

            const { result } = renderHook(() =>
                usePracticeSession({ userId, settings })
            );

            // Simulate socket connection
            act(() => {
                const connectHandler = mockSocket.on.mock.calls.find(
                    (call: any) => call[0] === 'connect'
                )[1];
                connectHandler();
            });

            // Wait for the recovery timeout (5 seconds)
            await new Promise(resolve => setTimeout(resolve, 5100));

            // Verify invalid session ID was cleared
            expect(localStorageMock.removeItem).toHaveBeenCalledWith(
                `practice_session_${userId}`
            );
        }, 6000); // Increase timeout for this test
    });

    describe('Error Handling', () => {
        test('handles localStorage errors gracefully', async () => {
            const userId = 'test-user-123';
            const settings: PracticeSettings = {
                gradeLevel: '6ème',
                discipline: 'mathématiques',
                themes: ['algèbre'],
                questionCount: 10,
                showImmediateFeedback: true,
                allowRetry: true,
                randomizeQuestions: false
            };

            // Mock localStorage to throw errors
            localStorageMock.getItem.mockImplementation(() => {
                throw new Error('localStorage unavailable');
            });
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('localStorage unavailable');
            });
            localStorageMock.removeItem.mockImplementation(() => {
                throw new Error('localStorage unavailable');
            });

            // Create hook instance - should not crash despite localStorage errors
            const { result } = renderHook(() =>
                usePracticeSession({ userId, settings })
            );

            // Should have default state despite localStorage errors
            expect(result.current.state.connected).toBe(false);
            expect(result.current.state.session).toBeNull();
            expect(result.current.state.sessionId).toBeNull();

            // The hook should still be functional - it should have the expected methods
            expect(typeof result.current.startSession).toBe('function');
            expect(typeof result.current.disconnect).toBe('function');
            expect(typeof result.current.clearError).toBe('function');

            // Should be able to call methods without crashing
            expect(() => {
                result.current.clearError();
            }).not.toThrow();
        });
    });
});