
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

        const questionPayload: GameQuestionPayload = {
            code: 'TEST123',
            question: {
                uid: 'q1',
                text: 'What is the capital of France?',
                type: 'choix_simple',
                answers: ['London', 'Paris', 'Berlin', 'Madrid'],
                subject: 'Geography',
                themes: ['Capitals'],
                difficulty: 2,
                gradeLevel: 'CE2'
            },
            timer: 45,
            questionIndex: 2,
            totalQuestions: 10,
            questionState: 'active'
        };

        act(() => {
            eventHandlers['game_question']?.(questionPayload);
        });

        await waitFor(() => {
            expect(result.current.gameState.currentQuestion).toEqual(questionPayload.question);
            expect(result.current.gameState.questionIndex).toBe(2);
            expect(result.current.gameState.totalQuestions).toBe(10);
            expect(result.current.gameState.timer).toBe(45);
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
        const questionPayload: GameQuestionPayload = {
            code: 'TEST123',
            question: {
                uid: 'q2',
                text: 'What is 5 + 3?',
                type: 'choix_simple',
                answers: ['6', '7', '8', '9']
            },
            timer: 30,
            questionIndex: 1,
            totalQuestions: 5,
            questionState: 'active'
        };

        act(() => {
            eventHandlers['game_question']?.(questionPayload);
        });

        await waitFor(() => {
            expect(result.current.gameState.answered).toBe(false);
            expect(result.current.gameState.currentQuestion?.uid).toBe('q2');
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
                gameStatus: 'active'
            });
        });

        await waitFor(() => {
            expect(result.current.gameState.connectedToRoom).toBe(true);
        });

        // Connection should persist through question updates
        const questionPayload: GameQuestionPayload = {
            code: 'TEST123',
            question: {
                uid: 'q1',
                text: 'Test question',
                type: 'choix_simple',
                answers: ['A', 'B', 'C', 'D']
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
            expect(result.current.gameState.connectedToRoom).toBe(true);
        });
    });

    it('should handle multiple choice question type', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        const multipleChoicePayload: GameQuestionPayload = {
            code: 'TEST123',
            question: {
                uid: 'q3',
                text: 'Which of the following are prime numbers?',
                type: 'choix_multiple',
                answers: ['2', '3', '4', '5', '6', '7'],
                correctAnswers: [true, true, false, true, false, true]
            },
            timer: 60,
            questionIndex: 3,
            totalQuestions: 8,
            questionState: 'active'
        };

        act(() => {
            eventHandlers['game_question']?.(multipleChoicePayload);
        });

        await waitFor(() => {
            expect(result.current.gameState.currentQuestion?.type).toBe('choix_multiple');
            expect(result.current.gameState.currentQuestion?.correctAnswers).toEqual([true, true, false, true, false, true]);
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
                gameStatus: 'active'
            });
        });

        await waitFor(() => {
            expect(result.current.gameState.gameStatus).toBe('active');
        });

        // Transition to paused
        act(() => {
            eventHandlers['timer_update']?.({
                timeLeft: 15,
                status: 'pause'
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

        // Initial timer status
        expect(result.current.gameState.timerStatus).toBe('stop');

        // Update timer to play
        act(() => {
            eventHandlers['timer_update']?.({
                timeLeft: 30,
                status: 'play'
            });
        });

        await waitFor(() => {
            expect(result.current.gameState.timerStatus).toBe('play');
        });

        // Update timer to pause
        act(() => {
            eventHandlers['game_update']?.({
                timeLeft: 25,
                status: 'pause'
            });
        });

        await waitFor(() => {
            expect(result.current.gameState.timerStatus).toBe('pause');
        });

        // Update timer to stop
        act(() => {
            eventHandlers['game_update']?.({
                status: 'stop'
            });
        });

        await waitFor(() => {
            expect(result.current.gameState.timerStatus).toBe('stop');
        });
    });

    it('should preserve question metadata through updates', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        const questionWithMetadata: GameQuestionPayload = {
            code: 'TEST123',
            question: {
                uid: 'q5',
                text: 'What is photosynthesis?',
                type: 'choix_simple',
                answers: ['A', 'B', 'C', 'D'],
                subject: 'Biology',
                themes: ['Plants', 'Processes'],
                difficulty: 3,
                gradeLevel: 'CM1',
                explanation: 'Photosynthesis is the process by which plants make food from sunlight.'
            },
            timer: 40,
            questionIndex: 4,
            totalQuestions: 6,
            questionState: 'active'
        };

        act(() => {
            eventHandlers['game_question']?.(questionWithMetadata);
        });

        await waitFor(() => {
            const currentQuestion = result.current.gameState.currentQuestion;
            expect(currentQuestion?.subject).toBe('Biology');
            expect(currentQuestion?.themes).toEqual(['Plants', 'Processes']);
            expect(currentQuestion?.difficulty).toBe(3);
            expect(currentQuestion?.gradeLevel).toBe('CM1');
            expect(currentQuestion?.explanation).toBe('Photosynthesis is the process by which plants make food from sunlight.');
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
                timeLeft: 30,
                status: 'play'
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

        const questionPayload: GameQuestionPayload = {
            code: 'TEST123',
            question: {
                uid: 'q1',
                text: 'Quick question',
                type: 'choix_simple',
                answers: ['A', 'B']
            },
            timer: 0,
            questionIndex: 0,
            totalQuestions: 1,
            questionState: 'active'
        };

        act(() => {
            eventHandlers['game_question']?.(questionPayload);
        });

        await waitFor(() => {
            expect(result.current.gameState.timer).toBe(0);
            expect(result.current.gameState.gameStatus).toBe('waiting');
        });
    });
});
