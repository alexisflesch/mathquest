/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { usePracticeGameSocket } from '../usePracticeGameSocket';
import { io } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');
const mockIo = io as jest.MockedFunction<typeof io>;

// Mock client logger
jest.mock('@/clientLogger', () => ({
    createLogger: () => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    })
}));

// Mock config
jest.mock('@/config', () => ({
    SOCKET_CONFIG: {
        url: 'http://localhost:3001',
        path: '/api/socket.io'
    }
}));

// Mock utils
jest.mock('@/utils', () => ({
    createSocketConfig: jest.fn(() => ({}))
}));

// Create a mock socket
const createMockSocket = () => {
    const eventHandlers: { [event: string]: Function[] } = {};

    return {
        id: 'mock-socket-id',
        connected: false,
        connect: jest.fn(),
        disconnect: jest.fn(),
        emit: jest.fn(),
        on: jest.fn((event: string, handler: Function) => {
            if (!eventHandlers[event]) {
                eventHandlers[event] = [];
            }
            eventHandlers[event].push(handler);
        }),
        off: jest.fn(),
        _triggerEvent: (event: string, data?: any) => {
            const handlers = eventHandlers[event] || [];
            handlers.forEach(handler => handler(data));
        },
        _eventHandlers: eventHandlers
    };
};

describe('usePracticeGameSocket', () => {
    let mockSocket: any;

    beforeEach(() => {
        mockSocket = createMockSocket();
        mockIo.mockReturnValue(mockSocket);
        jest.clearAllMocks();
    });

    const defaultProps = {
        discipline: 'math',
        level: 'beginner',
        themes: ['arithmetic'],
        questionLimit: 5,
        userId: 'test-user-123',
        username: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg'
    };

    it('should initialize with default state', () => {
        const { result } = renderHook(() => usePracticeGameSocket(defaultProps));

        expect(result.current.connected).toBe(false);
        expect(result.current.connecting).toBe(true);
        expect(result.current.error).toBe(null);
        expect(result.current.gameState.gameStatus).toBe('waiting');
        expect(result.current.gameState.currentQuestion).toBe(null);
        expect(result.current.gameState.questionIndex).toBe(0);
        expect(result.current.gameState.totalQuestions).toBe(5);
    });

    it('should handle socket connection', () => {
        const { result } = renderHook(() => usePracticeGameSocket(defaultProps));

        act(() => {
            mockSocket._triggerEvent('connect');
        });

        expect(result.current.connected).toBe(true);
        expect(result.current.connecting).toBe(false);
        expect(result.current.error).toBe(null);
    });

    it('should handle game_joined event', () => {
        const { result } = renderHook(() => usePracticeGameSocket(defaultProps));

        const gameJoinedData = {
            accessCode: 'PRACTICE',
            participant: {
                id: 'participant-1',
                userId: 'test-user-123',
                username: 'Test User',
                score: 0
            },
            gameStatus: 'waiting',
            isDiffered: true
        };

        act(() => {
            mockSocket._triggerEvent('game_joined', gameJoinedData);
        });

        expect(result.current.gameState.connectedToRoom).toBe(true);
        expect(result.current.gameState.gameStatus).toBe('waiting');
    });

    it('should handle game_question event', () => {
        const { result } = renderHook(() => usePracticeGameSocket(defaultProps));

        const questionData = {
            uid: 'question-123',
            text: 'What is 1+1?',
            type: 'multiple_choice',
            answers: ['1', '2', '3'],
            correctAnswers: [false, true, false],
            currentQuestionIndex: 0,
            totalQuestions: 5
        };

        act(() => {
            mockSocket._triggerEvent('game_question', questionData);
        });

        expect(result.current.gameState.currentQuestion).toEqual(questionData);
        expect(result.current.gameState.questionIndex).toBe(0);
        expect(result.current.gameState.totalQuestions).toBe(5);
        expect(result.current.gameState.gameStatus).toBe('active');
        expect(result.current.gameState.answered).toBe(false);
    });

    it('should handle answer_received event', () => {
        const { result } = renderHook(() => usePracticeGameSocket(defaultProps));

        const answerData = {
            questionId: 'question-123',
            timeSpent: 1000,
            correct: true,
            correctAnswers: [false, true, false],
            explanation: 'The correct answer is 2.'
        };

        act(() => {
            mockSocket._triggerEvent('answer_received', answerData);
        });

        expect(result.current.gameState.answered).toBe(true);
        expect(result.current.gameState.feedback).toEqual({
            correct: true,
            explanation: 'The correct answer is 2.',
            questionId: 'question-123',
            timeSpent: 1000,
            correctAnswers: [false, true, false],
            scoreAwarded: undefined
        });
    });

    it('should handle game_ended event', () => {
        const { result } = renderHook(() => usePracticeGameSocket(defaultProps));

        const gameEndedData = {
            accessCode: 'PRACTICE',
            score: 4,
            totalQuestions: 5,
            correct: 4,
            total: 5
        };

        act(() => {
            mockSocket._triggerEvent('game_ended', gameEndedData);
        });

        expect(result.current.gameState.gameStatus).toBe('finished');
        expect(result.current.gameState.score).toBe(4);
    });

    it('should provide startPracticeSession function', () => {
        const { result } = renderHook(() => usePracticeGameSocket(defaultProps));

        act(() => {
            result.current.startPracticeSession();
        });

        expect(mockSocket.emit).toHaveBeenCalledWith('join_game', {
            accessCode: 'PRACTICE',
            userId: 'test-user-123',
            username: 'Test User',
            avatarUrl: 'https://example.com/avatar.jpg',
            isDiffered: true,
            practiceMode: true,
            practiceConfig: {
                discipline: 'math',
                level: 'beginner',
                themes: ['arithmetic'],
                questionLimit: 5
            }
        });
    });

    it('should provide submitAnswer function', () => {
        const { result } = renderHook(() => usePracticeGameSocket(defaultProps));

        act(() => {
            result.current.submitAnswer('question-123', 1, 1500);
        });

        expect(mockSocket.emit).toHaveBeenCalledWith('game_answer', {
            accessCode: 'PRACTICE',
            userId: 'test-user-123',
            questionId: 'question-123',
            answer: 1,
            timeSpent: 1500
        });
    });

    it('should provide requestNextQuestion function', () => {
        const { result } = renderHook(() => usePracticeGameSocket(defaultProps));

        act(() => {
            result.current.requestNextQuestion('question-123');
        });

        expect(mockSocket.emit).toHaveBeenCalledWith('request_next_question', {
            accessCode: 'PRACTICE',
            userId: 'test-user-123',
            currentQuestionId: 'question-123'
        });
    });

    it('should handle connection errors', () => {
        const { result } = renderHook(() => usePracticeGameSocket(defaultProps));

        const error = { message: 'Connection failed' };

        act(() => {
            mockSocket._triggerEvent('connect_error', error);
        });

        expect(result.current.connecting).toBe(false);
        expect(result.current.error).toBe('Connection error: Connection failed');
    });

    it('should cleanup on unmount', () => {
        const { unmount } = renderHook(() => usePracticeGameSocket(defaultProps));

        unmount();

        expect(mockSocket.disconnect).toHaveBeenCalled();
    });
});
