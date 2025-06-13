import { renderHook, act, waitFor } from '@testing-library/react';
import { io } from 'socket.io-client';
import { useStudentGameSocket } from '../useStudentGameSocket';
import { LiveQuestionPayload } from '@shared/types/quiz/liveQuestion';
import { QUESTION_TYPES } from '@shared/types';

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
    let mockDateNow: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        eventHandlers = {};

        // Mock Date.now for consistent timer testing
        mockDateNow = jest.spyOn(Date, 'now');
        let mockTime = 1000000000000; // Start at a fixed time
        mockDateNow.mockImplementation(() => mockTime);

        // Helper to advance mock time
        (global as any).mockAdvanceTime = (ms: number) => {
            mockTime += ms;
        };

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
        mockDateNow?.mockRestore();
        delete (global as any).mockAdvanceTime;
    });

    it('should start timer countdown when receiving active question', async () => {
        jest.useFakeTimers();

        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        const questionPayload: LiveQuestionPayload = {
            question: {
                uid: 'q1',
                text: 'What is 2+2?',
                questionType: QUESTION_TYPES.SINGLE_CHOICE,
                answerOptions: ['3', '4', '5', '6'],
                explanation: '2 + 2 = 4',
                correctAnswers: [false, true, false, false]
            },
            timer: 30000, // ms
            questionIndex: 0,
            totalQuestions: 5,
            questionState: 'active'
        };

        act(() => {
            eventHandlers['game_question']?.(questionPayload);
            eventHandlers['timer_update']?.({
                timeLeftMs: 30000,
                running: true,
                status: 'play'
            });
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(30000); // ms
            expect(result.current.gameState.timerStatus).toBe('play');
        });

        // Debug: Log the timer state before advancing
        console.log('Timer before advancing:', result.current.gameState.timer, result.current.gameState.timerStatus);

        // Advance timer by 5 seconds
        act(() => {
            (global as any).mockAdvanceTime(5000); // Advance Date.now()
            jest.advanceTimersByTime(5000); // Advance setInterval
        });

        // Debug: Log the timer state after advancing
        console.log('Timer after advancing 5s:', result.current.gameState.timer, result.current.gameState.timerStatus);

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(25000); // ms
        });

        // Advance timer by 20 more seconds
        act(() => {
            (global as any).mockAdvanceTime(20000); // Advance Date.now()
            jest.advanceTimersByTime(20000); // Advance setInterval
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(5000); // ms
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

        const questionPayload: LiveQuestionPayload = {
            question: {
                uid: 'q1',
                text: 'What is 2+2?',
                questionType: QUESTION_TYPES.SINGLE_CHOICE,
                answerOptions: ['3', '4', '5', '6'],
                explanation: '2 + 2 = 4',
                correctAnswers: [false, true, false, false]
            },
            timer: 3000, // ms
            questionIndex: 0,
            totalQuestions: 5,
            questionState: 'active'
        };

        act(() => {
            eventHandlers['game_question']?.(questionPayload);
            eventHandlers['timer_update']?.({
                timeLeftMs: 3000,
                running: true,
                status: 'play'
            });
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(3000); // ms
        });

        // Advance timer past zero
        act(() => {
            (global as any).mockAdvanceTime(4000); // Advance Date.now()
            jest.advanceTimersByTime(4000); // Advance setInterval
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(0); // ms
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

        const questionPayload: LiveQuestionPayload = {
            question: {
                uid: 'q1',
                text: 'What is 2+2?',
                questionType: QUESTION_TYPES.SINGLE_CHOICE,
                answerOptions: ['3', '4', '5', '6'],
                explanation: '2 + 2 = 4',
                correctAnswers: [false, true, false, false]
            },
            timer: 30000, // ms
            questionIndex: 0,
            totalQuestions: 5,
            questionState: 'paused'
        };

        act(() => {
            eventHandlers['game_question']?.(questionPayload);
            eventHandlers['timer_update']?.({
                timeLeftMs: 30000,
                running: false,
                status: 'pause'
            });
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(30000); // ms
            expect(result.current.gameState.gameStatus).toBe('paused');
        });

        // Advance timer - should not change because it's paused
        act(() => {
            (global as any).mockAdvanceTime(5000); // Advance Date.now()
            jest.advanceTimersByTime(5000); // Advance setInterval
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(30000); // Should remain unchanged
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
        const questionPayload: LiveQuestionPayload = {
            question: {
                uid: 'q1',
                text: 'What is 2+2?',
                questionType: QUESTION_TYPES.SINGLE_CHOICE,
                answerOptions: ['3', '4', '5', '6'],
                explanation: '2 + 2 = 4',
                correctAnswers: [false, true, false, false]
            },
            timer: 30000, // ms
            questionIndex: 0,
            totalQuestions: 5,
            questionState: 'active'
        };

        act(() => {
            eventHandlers['game_question']?.(questionPayload);
            eventHandlers['timer_update']?.({
                timeLeftMs: 30000,
                running: true,
                status: 'play'
            });
        });

        // Let timer run for 5 seconds
        act(() => {
            (global as any).mockAdvanceTime(5000); // Advance Date.now()
            jest.advanceTimersByTime(5000); // Advance setInterval
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(25000); // ms
        });

        // Pause the timer
        act(() => {
            eventHandlers['timer_update']?.({
                timeLeftMs: 25000, // ms
                running: false,
                status: 'pause'
            });
        });

        await waitFor(() => {
            expect(result.current.gameState.gameStatus).toBe('paused');
            expect(result.current.gameState.timerStatus).toBe('pause');
        });

        // Advance time - timer should not change when paused
        act(() => {
            (global as any).mockAdvanceTime(10000); // Advance Date.now()
            jest.advanceTimersByTime(10000); // Advance setInterval
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(25000); // ms
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
                timeLeftMs: 20000, // ms
                running: false,
                status: 'pause'
            });
        });

        await waitFor(() => {
            expect(result.current.gameState.gameStatus).toBe('paused');
        });

        // Resume the timer
        act(() => {
            eventHandlers['timer_update']?.({
                timeLeftMs: 20000, // ms
                running: true,
                status: 'play'
            });
        });

        await waitFor(() => {
            expect(result.current.gameState.gameStatus).toBe('active');
            expect(result.current.gameState.timerStatus).toBe('play');
        });

        // Timer should now countdown
        act(() => {
            (global as any).mockAdvanceTime(3000); // Advance Date.now()
            jest.advanceTimersByTime(3000); // Advance setInterval
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(17000); // ms
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
                timeLeftMs: 15000, // ms
                questionState: 'active'
            });
            eventHandlers['timer_update']?.({
                timeLeftMs: 15000,
                running: true,
                status: 'play'
            });
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(15000); // ms
        });

        // Timer should start counting down
        act(() => {
            (global as any).mockAdvanceTime(5000); // Advance Date.now()
            jest.advanceTimersByTime(5000); // Advance setInterval
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(10000); // ms
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
                timeLeftMs: 0,
                questionState: 'stopped'
            });
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(0); // ms
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
        const questionPayload: LiveQuestionPayload = {
            question: {
                uid: 'q1',
                text: 'What is 2+2?',
                questionType: QUESTION_TYPES.SINGLE_CHOICE,
                answerOptions: ['3', '4', '5', '6'],
                explanation: '2 + 2 = 4',
                correctAnswers: [false, true, false, false]
            },
            timer: 30000, // ms
            questionIndex: 0,
            totalQuestions: 5,
            questionState: 'active'
        };

        act(() => {
            eventHandlers['game_question']?.(questionPayload);
            eventHandlers['timer_update']?.({
                timeLeftMs: 30000,
                running: true,
                status: 'play'
            });
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(30000); // ms
        });

        // Unmount the component
        unmount();

        // Timer should be cleaned up and not continue
        // This test primarily ensures no memory leaks or errors occur
        act(() => {
            (global as any).mockAdvanceTime(35000); // Advance Date.now()
            jest.advanceTimersByTime(35000); // Advance setInterval
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
                timeLeftMs: 20000, // ms
                status: 'play'
            });
            eventHandlers['timer_update']?.({
                timeLeftMs: 20000,
                running: true,
                status: 'play'
            });
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(20000); // ms
        });

        // Stop the timer
        act(() => {
            eventHandlers['game_update']?.({
                status: 'stop'
            });
            eventHandlers['timer_update']?.({
                timeLeftMs: 0,
                running: false,
                status: 'stop'
            });
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(0); // ms
            expect(result.current.gameState.gameStatus).toBe('waiting');
        });

        jest.useRealTimers();
    });
});
