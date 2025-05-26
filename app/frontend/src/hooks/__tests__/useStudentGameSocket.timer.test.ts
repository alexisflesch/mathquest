
import { renderHook, act, waitFor } from '@testing-library/react';
import { io } from 'socket.io-client';
import { useStudentGameSocket, GameQuestionPayload } from '../useStudentGameSocket';

// Mock socket.io-client
jest.mock('socket.io-client');
const mockIo = io as jest.MockedFunction<typeof io>;

// Mock utils
jest.mock('@/utils', () => ({
    createSocketConfig: jest.fn((config) => config)
}));

// Mock logger
jest.mock('@/clientLogger', () => ({
    createLogger: jest.fn(() => ({
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }))
}));

describe('useStudentGameSocket - Timer Management', () => {
    let mockSocket: any;
    let eventHandlers: { [key: string]: (...args: any[]) => void } = {};

    beforeEach(() => {
        jest.clearAllMocks();
        eventHandlers = {};

        // Create mock socket that captures event handlers
        mockSocket = {
            id: 'test-socket-id',
            connected: false,
            connect: jest.fn(),
            disconnect: jest.fn(),
            on: jest.fn((event: string, handler: (...args: any[]) => void) => {
                eventHandlers[event] = handler;
            }),
            off: jest.fn(),
            emit: jest.fn(),
            onAny: jest.fn()
        };

        mockIo.mockReturnValue(mockSocket);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should start timer countdown when receiving active question', async () => {
        jest.useFakeTimers();

        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        const questionPayload: GameQuestionPayload = {
            code: 'TEST123',
            question: {
                uid: 'q1',
                text: 'What is 2+2?',
                type: 'choix_simple',
                answers: ['3', '4', '5', '6']
            },
            timer: 30,
            questionIndex: 0,
            totalQuestions: 5,
            questionState: 'active'
        };

        act(() => {
            eventHandlers['game_question']?.(questionPayload);
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(30);
            expect(result.current.gameState.timerStatus).toBe('play');
        });

        // Advance timer by 5 seconds
        act(() => {
            jest.advanceTimersByTime(5000);
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(25);
        });

        // Advance timer by 20 more seconds
        act(() => {
            jest.advanceTimersByTime(20000);
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(5);
        });

        jest.useRealTimers();
    });

    it('should stop timer when reaching zero', async () => {
        jest.useFakeTimers();

        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        const questionPayload: GameQuestionPayload = {
            code: 'TEST123',
            question: {
                uid: 'q1',
                text: 'What is 2+2?',
                type: 'choix_simple',
                answers: ['3', '4', '5', '6']
            },
            timer: 3,
            questionIndex: 0,
            totalQuestions: 5,
            questionState: 'active'
        };

        act(() => {
            eventHandlers['game_question']?.(questionPayload);
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(3);
        });

        // Advance timer past zero
        act(() => {
            jest.advanceTimersByTime(4000);
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(0);
            expect(result.current.gameState.gameStatus).toBe('waiting');
        });

        jest.useRealTimers();
    });

    it('should not start timer for paused question', async () => {
        jest.useFakeTimers();

        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        const questionPayload: GameQuestionPayload = {
            code: 'TEST123',
            question: {
                uid: 'q1',
                text: 'What is 2+2?',
                type: 'choix_simple',
                answers: ['3', '4', '5', '6']
            },
            timer: 30,
            questionIndex: 0,
            totalQuestions: 5,
            questionState: 'paused'
        };

        act(() => {
            eventHandlers['game_question']?.(questionPayload);
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(30);
            expect(result.current.gameState.gameStatus).toBe('paused');
        });

        // Advance timer - should not change because it's paused
        act(() => {
            jest.advanceTimersByTime(5000);
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(30); // Should remain unchanged
        });

        jest.useRealTimers();
    });

    it('should pause timer on timer_update pause event', async () => {
        jest.useFakeTimers();

        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        // Start with an active question
        const questionPayload: GameQuestionPayload = {
            code: 'TEST123',
            question: {
                uid: 'q1',
                text: 'What is 2+2?',
                type: 'choix_simple',
                answers: ['3', '4', '5', '6']
            },
            timer: 30,
            questionIndex: 0,
            totalQuestions: 5,
            questionState: 'active'
        };

        act(() => {
            eventHandlers['game_question']?.(questionPayload);
        });

        // Let timer run for 5 seconds
        act(() => {
            jest.advanceTimersByTime(5000);
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(25);
        });

        // Pause the timer
        act(() => {
            eventHandlers['timer_update']?.({
                timeLeft: 25,
                status: 'pause'
            });
        });

        await waitFor(() => {
            expect(result.current.gameState.gameStatus).toBe('paused');
            expect(result.current.gameState.timerStatus).toBe('pause');
        });

        // Advance time - timer should not change when paused
        act(() => {
            jest.advanceTimersByTime(10000);
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(25); // Should remain paused
        });

        jest.useRealTimers();
    });

    it('should resume timer on timer_update play event', async () => {
        jest.useFakeTimers();

        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        // Start with paused state
        act(() => {
            eventHandlers['timer_update']?.({
                timeLeft: 20,
                status: 'pause'
            });
        });

        await waitFor(() => {
            expect(result.current.gameState.gameStatus).toBe('paused');
        });

        // Resume the timer
        act(() => {
            eventHandlers['timer_update']?.({
                timeLeft: 20,
                status: 'play'
            });
        });

        await waitFor(() => {
            expect(result.current.gameState.gameStatus).toBe('active');
            expect(result.current.gameState.timerStatus).toBe('play');
        });

        // Timer should now countdown
        act(() => {
            jest.advanceTimersByTime(3000);
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(17);
        });

        jest.useRealTimers();
    });

    it('should handle timer_set events', async () => {
        jest.useFakeTimers();

        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        // Set timer to specific value
        act(() => {
            eventHandlers['timer_set']?.({
                timeLeft: 15,
                questionState: 'active'
            });
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(15);
        });

        // Timer should start counting down
        act(() => {
            jest.advanceTimersByTime(5000);
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(10);
        });

        jest.useRealTimers();
    });

    it('should handle timer_set stop event', async () => {
        jest.useFakeTimers();

        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        // Stop the timer
        act(() => {
            eventHandlers['timer_set']?.({
                timeLeft: 0,
                questionState: 'stopped'
            });
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(0);
            expect(result.current.gameState.gameStatus).toBe('waiting');
        });

        jest.useRealTimers();
    });

    it('should clean up timer on component unmount', async () => {
        jest.useFakeTimers();

        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result, unmount } = renderHook(() => useStudentGameSocket(hookProps));

        // Start a timer
        const questionPayload: GameQuestionPayload = {
            code: 'TEST123',
            question: {
                uid: 'q1',
                text: 'What is 2+2?',
                type: 'choix_simple',
                answers: ['3', '4', '5', '6']
            },
            timer: 30,
            questionIndex: 0,
            totalQuestions: 5,
            questionState: 'active'
        };

        act(() => {
            eventHandlers['game_question']?.(questionPayload);
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(30);
        });

        // Unmount the component
        unmount();

        // Timer should be cleaned up and not continue
        // This test primarily ensures no memory leaks or errors occur
        act(() => {
            jest.advanceTimersByTime(35000);
        });

        jest.useRealTimers();
    });

    it('should handle game_update with timer stop', async () => {
        jest.useFakeTimers();

        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        // Start with active timer
        act(() => {
            eventHandlers['game_update']?.({
                timeLeft: 20,
                status: 'play'
            });
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(20);
        });

        // Stop the timer
        act(() => {
            eventHandlers['game_update']?.({
                status: 'stop'
            });
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(0);
            expect(result.current.gameState.gameStatus).toBe('waiting');
        });

        jest.useRealTimers();
    });
});
