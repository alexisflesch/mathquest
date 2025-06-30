import { renderHook, act, waitFor } from '@testing-library/react';
import { io } from 'socket.io-client';
import { useStudentGameSocket } from '../useStudentGameSocket';
import type { LiveQuestionPayload, FilteredQuestion } from '@shared/types/quiz/liveQuestion';
import { QUESTION_TYPES } from '@shared/types';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

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

describe('useStudentGameSocket - State Updates', () => {
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

    it('should properly update game state when receiving new question', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        const questionPayload: LiveQuestionPayload = {
            question: {
                uid: 'q1',
                text: 'What is the capital of France?',
                questionType: QUESTION_TYPES.SINGLE_CHOICE,
                answerOptions: ['London', 'Paris', 'Berlin', 'Madrid']
                // explanation and correctAnswers removed for security
            },
            timer: {
                status: 'run' as const,
                questionUid: 'q1',
                timerEndDateMs: Date.now() + 45000,
            },
            questionIndex: 2,
            totalQuestions: 10,
            questionState: 'active'
        };

        act(() => {
            eventHandlers['game_question']?.(questionPayload);
        });

        // Simulate timer update from backend
        act(() => {
            eventHandlers['timer_update']?.({
                timeLeftMs: 45,
                status: 'run',
                running: true
            });
        });

        await waitFor(() => {
            expect(result.current.gameState.currentQuestion).toEqual(questionPayload.question);
            expect(result.current.gameState.questionIndex).toBe(2);
            expect(result.current.gameState.totalQuestions).toBe(10);
            // Timer state is now managed by useSimpleTimer hook
            expect(result.current.gameState.answered).toBe(false);
            expect(result.current.gameState.gameStatus).toBe('active');
        });
    });

    it('should reset answered state when receiving new question', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        // First, set answered to true
        act(() => {
            eventHandlers['answer_received']?.({ received: true });
        });

        await waitFor(() => {
            expect(result.current.gameState.answered).toBe(true);
        });

        // Now receive a new question
        const questionPayload: LiveQuestionPayload = {
            question: {
                uid: 'q2',
                text: 'What is 5 + 3?',
                questionType: QUESTION_TYPES.SINGLE_CHOICE,
                answerOptions: ['6', '7', '8', '9']
                // explanation and correctAnswers removed for security
            },
            timer: {
                status: 'run' as const,
                questionUid: 'q2',
                timerEndDateMs: Date.now() + 30000,
            },
            questionIndex: 1,
            totalQuestions: 5,
            questionState: 'active'
        };

        act(() => {
            eventHandlers['game_question']?.(questionPayload);
            eventHandlers['timer_update']?.({ timeLeftMs: 30, status: 'run', running: true });
        });

        await waitFor(() => {
            expect(result.current.gameState.answered).toBe(false);
            expect(result.current.gameState.currentQuestion?.uid).toBe('q2');
            expect(result.current.gameState.currentQuestion?.questionType).toBe(QUESTION_TYPES.SINGLE_CHOICE);
            expect(result.current.gameState.currentQuestion?.answerOptions).toEqual(['6', '7', '8', '9']);
        });
    });

    it('should maintain connection state through game events', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        // Initially not connected to room
        expect(result.current.gameState.connectedToRoom).toBe(false);

        // Join game successfully
        act(() => {
            eventHandlers['game_joined']?.({
                accessCode: 'TEST123',
                participant: { id: 'p1', userId: 'user-123', username: 'TestUser' },
                gameStatus: 'active',
                isDiffered: false
            });
        });

        await waitFor(() => {
            expect(result.current.gameState.connectedToRoom).toBe(true);
        });

        // Connection should persist through question updates
        const questionPayload: LiveQuestionPayload = {
            question: {
                uid: 'q1',
                text: 'Test question',
                questionType: QUESTION_TYPES.SINGLE_CHOICE,
                answerOptions: ['A', 'B', 'C', 'D']
                // explanation and correctAnswers removed for security
            },
            timer: {
                status: 'run' as const,
                questionUid: 'q1',
                timerEndDateMs: Date.now() + 30000,
            },
            questionIndex: 0,
            totalQuestions: 1,
            questionState: 'active'
        };

        act(() => {
            eventHandlers['game_question']?.(questionPayload);
            eventHandlers['timer_update']?.({ timeLeftMs: 30, status: 'run', running: true });
        });

        await waitFor(() => {
            expect(result.current.gameState.connectedToRoom).toBe(true);
            expect(result.current.gameState.currentQuestion?.uid).toBe('q1');
            expect(result.current.gameState.currentQuestion?.questionType).toBe(QUESTION_TYPES.SINGLE_CHOICE);
            expect(result.current.gameState.currentQuestion?.answerOptions).toEqual(['A', 'B', 'C', 'D']);
        });
    });

    it('should handle multiple choice question type', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        const multipleChoicePayload: LiveQuestionPayload = {
            question: {
                uid: 'q3',
                text: 'Which of the following are prime numbers?',
                questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
                answerOptions: ['2', '3', '4', '5', '6', '7']
            },
            timer: {
                status: 'run' as const,
                questionUid: 'q3',
                timerEndDateMs: Date.now() + 60000,
            },
            questionIndex: 3,
            totalQuestions: 8,
            questionState: 'active'
        };

        act(() => {
            eventHandlers['game_question']?.(multipleChoicePayload);
            eventHandlers['timer_update']?.({ timeLeftMs: 60, status: 'run', running: true });
        });

        await waitFor(() => {
            expect(result.current.gameState.currentQuestion?.questionType).toBe(QUESTION_TYPES.MULTIPLE_CHOICE);
            expect(result.current.gameState.currentQuestion?.answerOptions).toEqual(['2', '3', '4', '5', '6', '7']);
        });
    });

    it('should handle game status transitions', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        // Start with waiting
        expect(result.current.gameState.gameStatus).toBe('waiting');

        // Transition to active
        act(() => {
            eventHandlers['game_joined']?.({
                accessCode: 'TEST123',
                participant: { id: 'p1', userId: 'user-123', username: 'TestUser' },
                gameStatus: 'active',
                isDiffered: false
            });
        });

        await waitFor(() => {
            expect(result.current.gameState.gameStatus).toBe('active');
        });

        // Transition to paused
        act(() => {
            eventHandlers['timer_update']?.({
                timeLeftMs: 15,
                status: 'pause',
                running: false
            });
        });

        await waitFor(() => {
            expect(result.current.gameState.gameStatus).toBe('paused');
        });

        // Transition to finished
        act(() => {
            eventHandlers['game_ended']?.({
                score: 80,
                totalQuestions: 5
            });
        });

        await waitFor(() => {
            expect(result.current.gameState.gameStatus).toBe('finished');
        });
    });

    it('should handle timer status updates independently', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        // Timer state is now managed by useSimpleTimer hook
        // Initial timer status test removed

        // Update timer to play
        act(() => {
            eventHandlers['timer_update']?.({
                timeLeftMs: 30,
                status: 'run',
                running: true
            });
        });

        await waitFor(() => {
            // Timer state is now managed by useSimpleTimer hook
            expect(result.current.gameState.gameStatus).toBe('active');
        });

        // Update timer to pause
        act(() => {
            eventHandlers['timer_update']?.({
                timeLeftMs: 25,
                status: 'pause',
                running: false
            });
        });

        await waitFor(() => {
            // Timer state is now managed by useSimpleTimer hook
            expect(result.current.gameState.gameStatus).toBe('paused');
        });

        // Update timer to stop
        act(() => {
            eventHandlers['timer_update']?.({
                timeLeftMs: 0,
                status: 'stop',
                running: false
            });
        });

        await waitFor(() => {
            // Timer state is now managed by useSimpleTimer hook
            expect(result.current.gameState.gameStatus).toBe('completed');
        });
    });

    it('should preserve question metadata through updates', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        const questionWithMetadata: LiveQuestionPayload = {
            question: {
                uid: 'q5',
                text: 'What is photosynthesis?',
                questionType: QUESTION_TYPES.SINGLE_CHOICE,
                answerOptions: ['A', 'B', 'C', 'D']
            },
            timer: {
                status: 'run' as const,
                questionUid: 'q5',
                timerEndDateMs: Date.now() + 40000,
            },
            questionIndex: 4,
            totalQuestions: 6,
            questionState: 'active'
        };

        act(() => {
            eventHandlers['game_question']?.(questionWithMetadata);
        });

        await waitFor(() => {
            const currentQuestion = result.current.gameState.currentQuestion;
            expect(currentQuestion?.uid).toBe('q5');
            expect(currentQuestion?.text).toBe('What is photosynthesis?');
            expect(currentQuestion?.questionType).toBe(QUESTION_TYPES.SINGLE_CHOICE);
            expect(currentQuestion?.answerOptions).toEqual(['A', 'B', 'C', 'D']);
        });
    });

    it('should handle error state correctly', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        // Initially no error
        expect(result.current.error).toBeNull();

        // Receive error
        act(() => {
            eventHandlers['game_error']?.({
                message: 'Session expired',
                code: 'EXPIRED'
            });
        });

        await waitFor(() => {
            expect(result.current.error).toBe('Session expired');
        });

        // Error should persist until cleared or new connection
        act(() => {
            eventHandlers['timer_update']?.({
                timeLeftMs: 30,
                status: 'run'
            });
        });

        await waitFor(() => {
            expect(result.current.error).toBe('Session expired'); // Should still be there
        });
    });

    it('should handle edge case with zero timer from server', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        const questionPayload: LiveQuestionPayload = {
            question: {
                uid: 'q1',
                text: 'Quick question',
                questionType: QUESTION_TYPES.SINGLE_CHOICE,
                answerOptions: ['A', 'B']
            },
            timer: {
                status: 'stop' as const,
                questionUid: 'q1',
                timerEndDateMs: 0,
            },
            questionIndex: 0,
            totalQuestions: 1,
            questionState: 'active'
        };

        act(() => {
            eventHandlers['game_question']?.(questionPayload);
            eventHandlers['timer_update']?.({ timeLeftMs: 0, status: 'stop', running: false });
        });

        await waitFor(() => {
            // Timer state is now managed by useSimpleTimer hook
            expect(result.current.gameState.currentQuestion?.uid).toBe('q1');
            expect(result.current.gameState.currentQuestion?.questionType).toBe(QUESTION_TYPES.SINGLE_CHOICE);
            expect(result.current.gameState.currentQuestion?.answerOptions).toEqual(['A', 'B']);
            expect(result.current.gameState.gameStatus).toBe('waiting');
        });
    });
});
