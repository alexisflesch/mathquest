
import { renderHook, act, waitFor } from '@testing-library/react';
import { io } from 'socket.io-client';
import { useStudentGameSocket, GameQuestionPayload, AnswerReceived } from '../useStudentGameSocket';

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

describe('useStudentGameSocket - Event Listeners', () => {
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

    it('should handle game_joined event', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        const joinedPayload = {
            accessCode: 'TEST123',
            participant: { userId: 'user-123', username: 'TestUser' },
            gameStatus: 'active' as const,
            isDiffered: false
        };

        act(() => {
            eventHandlers['game_joined']?.(joinedPayload);
        });

        await waitFor(() => {
            expect(result.current.gameState.connectedToRoom).toBe(true);
            expect(result.current.gameState.gameStatus).toBe('active');
        });
    });

    it('should handle game_question event with timer start', async () => {
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
            expect(result.current.gameState.currentQuestion).toEqual(questionPayload.question);
            expect(result.current.gameState.questionIndex).toBe(0);
            expect(result.current.gameState.totalQuestions).toBe(5);
            expect(result.current.gameState.timer).toBe(30);
            expect(result.current.gameState.answered).toBe(false);
            expect(result.current.gameState.gameStatus).toBe('active');
        });

        jest.useRealTimers();
    });

    it('should handle game_question event with paused state', async () => {
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
            expect(result.current.gameState.gameStatus).toBe('paused');
            expect(result.current.gameState.timer).toBe(30);
        });
    });

    it('should handle timer_update event', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        const timerUpdate = {
            timeLeft: 15,
            status: 'play' as const
        };

        act(() => {
            eventHandlers['timer_update']?.(timerUpdate);
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(15);
            expect(result.current.gameState.timerStatus).toBe('play');
        });
    });

    it('should handle timer_update pause event', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        const timerUpdate = {
            timeLeft: 10,
            status: 'pause' as const
        };

        act(() => {
            eventHandlers['timer_update']?.(timerUpdate);
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(10);
            expect(result.current.gameState.timerStatus).toBe('pause');
            expect(result.current.gameState.gameStatus).toBe('paused');
        });
    });

    it('should handle game_update event', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        const gameUpdate = {
            timeLeft: 20,
            status: 'play' as const
        };

        act(() => {
            eventHandlers['game_update']?.(gameUpdate);
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(20);
            expect(result.current.gameState.timerStatus).toBe('play');
        });
    });

    it('should handle answer_received success event', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        const answerResponse: AnswerReceived = {
            received: true,
            correct: true,
            questionId: 'q1'
        };

        act(() => {
            eventHandlers['answer_received']?.(answerResponse);
        });

        await waitFor(() => {
            expect(result.current.gameState.answered).toBe(true);
        });
    });

    it('should handle answer_received rejection event', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        const answerResponse: AnswerReceived = {
            rejected: true,
            message: 'Too late to answer'
        };

        act(() => {
            eventHandlers['answer_received']?.(answerResponse);
        });

        await waitFor(() => {
            expect(result.current.gameState.answered).toBe(true);
        });
    });

    it('should handle correct_answers event', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        const correctAnswersPayload = {
            questionId: 'q1'
        };

        act(() => {
            eventHandlers['correct_answers']?.(correctAnswersPayload);
        });

        // This event is primarily for signaling - the actual correct answers
        // are typically derived from the question object
        // The test verifies the event is handled without errors
        await waitFor(() => {
            expect(result.current.gameState).toBeDefined();
        });
    });

    it('should handle game_ended event', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        const gameResults = {
            score: 85,
            totalQuestions: 5,
            correct: 4
        };

        act(() => {
            eventHandlers['game_ended']?.(gameResults);
        });

        await waitFor(() => {
            expect(result.current.gameState.gameStatus).toBe('finished');
            expect(result.current.gameState.timer).toBeNull();
        });
    });

    it('should handle game_error event', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        const errorPayload = {
            message: 'Game session expired',
            code: 'EXPIRED'
        };

        act(() => {
            eventHandlers['game_error']?.(errorPayload);
        });

        await waitFor(() => {
            expect(result.current.error).toBe('Game session expired');
        });
    });

    it('should handle game_already_played event', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        const alreadyPlayedPayload = {
            accessCode: 'TEST123'
        };

        act(() => {
            eventHandlers['game_already_played']?.(alreadyPlayedPayload);
        });

        await waitFor(() => {
            expect(result.current.error).toBe('You have already played this game');
        });
    });

    it('should handle timer_set with stopped state', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        const timerSetPayload = {
            timeLeft: 0,
            questionState: 'stopped' as const
        };

        act(() => {
            eventHandlers['timer_set']?.(timerSetPayload);
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(0);
            expect(result.current.gameState.gameStatus).toBe('waiting');
        });
    });
});
