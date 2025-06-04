import { renderHook, act } from '@testing-library/react';
import { io } from 'socket.io-client';
import { useTournamentSocket } from '../useTournamentSocket';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

// Mock socket.io-client
jest.mock('socket.io-client');
const mockIo = io as jest.MockedFunction<typeof io>;

// Mock socket instance
const mockSocket = {
    id: 'test-socket-id',
    connected: true,
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connect: jest.fn()
};

// Mock config and utils
jest.mock('@/config', () => ({
    SOCKET_CONFIG: {
        url: 'http://localhost:3001',
        path: '/socket.io',
        transports: ['websocket']
    }
}));

jest.mock('@/utils', () => ({
    createSocketConfig: jest.fn((config) => config)
}));

jest.mock('@/clientLogger', () => ({
    createLogger: jest.fn(() => ({
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }))
}));

describe('useTournamentSocket', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Don't set up the mock return value by default - let individual tests control it
    });

    const defaultProps = {
        accessCode: 'TEST123',
        userId: 'user-123',
        username: 'TestUser',
        avatarEmoji: 'https://example.com/avatar.jpg',
        isDiffered: false
    };

    it('should initialize with default state', () => {
        // Set up the mock to return our mock socket when io() is called
        mockIo.mockReturnValue(mockSocket as any);

        const { result } = renderHook(() => useTournamentSocket(defaultProps));

        expect(result.current.socket).not.toBeNull(); // Should have a socket
        expect(result.current.connected).toBe(false); // Not connected yet
        expect(result.current.connecting).toBe(true); // Should be connecting
        expect(result.current.error).toBeNull();
        expect(result.current.gameState).toEqual({
            currentQuestion: null,
            questionIndex: 0,
            totalQuestions: 0,
            timer: null,
            gameStatus: 'waiting',
            answered: false,
            connectedToRoom: false,
            feedback: null,
            showingCorrectAnswers: false,
            paused: false,
            waiting: false
        });
    });

    it('should handle socket connection', () => {
        // Set up the mock to return our mock socket when io() is called
        mockIo.mockReturnValue(mockSocket as any);

        const { result } = renderHook(() => useTournamentSocket(defaultProps));

        expect(mockIo).toHaveBeenCalledWith('http://localhost:3001', {
            url: 'http://localhost:3001',
            path: '/socket.io',
            transports: ['websocket']
        });

        // Simulate connection
        const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === SOCKET_EVENTS.CONNECT)?.[1];
        act(() => {
            connectHandler?.();
        });

        expect(result.current.connected).toBe(true);
        expect(result.current.connecting).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('should handle game_joined event', () => {
        mockIo.mockReturnValue(mockSocket as any);
        const { result } = renderHook(() => useTournamentSocket(defaultProps));

        const gameJoinedHandler = mockSocket.on.mock.calls.find(call => call[0] === SOCKET_EVENTS.GAME.GAME_JOINED)?.[1];

        act(() => {
            gameJoinedHandler?.({ gameStatus: 'active', accessCode: 'TEST123' });
        });

        expect(result.current.gameState.connectedToRoom).toBe(true);
        expect(result.current.gameState.gameStatus).toBe('active');
    });

    it('should handle game_question event', () => {
        mockIo.mockReturnValue(mockSocket as any);
        const { result } = renderHook(() => useTournamentSocket(defaultProps));

        const gameQuestionHandler = mockSocket.on.mock.calls.find(call => call[0] === SOCKET_EVENTS.GAME.GAME_QUESTION)?.[1];

        const mockQuestion = {
            uid: 'q-123',
            text: 'What is 2+2?',
            type: 'choix_simple',
            answers: ['3', '4', '5'],
            questionIndex: 1,
            totalQuestions: 5,
            timer: 30,
            questionState: 'active'
        };

        act(() => {
            gameQuestionHandler?.(mockQuestion);
        });

        expect(result.current.gameState.currentQuestion).toEqual(mockQuestion);
        expect(result.current.gameState.questionIndex).toBe(1);
        expect(result.current.gameState.totalQuestions).toBe(5);
        expect(result.current.gameState.timer).toBe(30);
        expect(result.current.gameState.answered).toBe(false);
        expect(result.current.gameState.paused).toBe(false);
        expect(result.current.gameState.waiting).toBe(false);
        expect(result.current.gameState.gameStatus).toBe('active');
    });

    it('should handle paused question state', () => {
        mockIo.mockReturnValue(mockSocket as any);
        const { result } = renderHook(() => useTournamentSocket(defaultProps));

        const gameQuestionHandler = mockSocket.on.mock.calls.find(call => call[0] === SOCKET_EVENTS.GAME.GAME_QUESTION)?.[1];

        const pausedQuestion = {
            uid: 'q-123',
            text: 'What is 2+2?',
            type: 'choix_simple',
            answers: ['3', '4', '5'],
            questionIndex: 1,
            totalQuestions: 5,
            timer: 20,
            questionState: 'paused'
        };

        act(() => {
            gameQuestionHandler?.(pausedQuestion);
        });

        expect(result.current.gameState.paused).toBe(true);
        expect(result.current.gameState.timer).toBe(20);
    });

    it('should handle answer_received event', () => {
        mockIo.mockReturnValue(mockSocket as any);
        const { result } = renderHook(() => useTournamentSocket(defaultProps));

        const answerReceivedHandler = mockSocket.on.mock.calls.find(call => call[0] === SOCKET_EVENTS.GAME.ANSWER_RECEIVED)?.[1];

        const feedback = {
            received: true,
            correct: true,
            questionId: 'q-123',
            timeSpent: 15,
            explanation: 'Correct! 2+2=4'
        };

        act(() => {
            answerReceivedHandler?.(feedback);
        });

        expect(result.current.gameState.answered).toBe(true);
        expect(result.current.gameState.feedback).toEqual(feedback);
        expect(result.current.gameState.waiting).toBe(true);
    });

    it('should handle rejected answers', () => {
        mockIo.mockReturnValue(mockSocket as any);
        const { result } = renderHook(() => useTournamentSocket(defaultProps));

        const answerReceivedHandler = mockSocket.on.mock.calls.find(call => call[0] === SOCKET_EVENTS.GAME.ANSWER_RECEIVED)?.[1];

        const rejectedFeedback = {
            rejected: true,
            message: 'Answer submitted too late',
            questionId: 'q-123'
        };

        act(() => {
            answerReceivedHandler?.(rejectedFeedback);
        });

        expect(result.current.gameState.answered).toBe(true);
        expect(result.current.gameState.feedback).toEqual(rejectedFeedback);
        expect(result.current.gameState.waiting).toBe(true);
    });

    it('should handle timer_update events for pause', () => {
        mockIo.mockReturnValue(mockSocket as any);
        const { result } = renderHook(() => useTournamentSocket(defaultProps));

        const timerUpdateHandler = mockSocket.on.mock.calls.find(call => call[0] === SOCKET_EVENTS.GAME.TIMER_UPDATE)?.[1];

        act(() => {
            timerUpdateHandler?.({ status: 'pause', timeLeft: 15 });
        });

        expect(result.current.gameState.paused).toBe(true);
        expect(result.current.gameState.timer).toBe(15);
    });

    it('should handle timer_update events for play', () => {
        mockIo.mockReturnValue(mockSocket as any);
        const { result } = renderHook(() => useTournamentSocket(defaultProps));

        const timerUpdateHandler = mockSocket.on.mock.calls.find(call => call[0] === SOCKET_EVENTS.GAME.TIMER_UPDATE)?.[1];

        act(() => {
            timerUpdateHandler?.({ status: 'play', timeLeft: 25 });
        });

        expect(result.current.gameState.paused).toBe(false);
    });

    it('should handle timer_update events for stop', () => {
        mockIo.mockReturnValue(mockSocket as any);
        const { result } = renderHook(() => useTournamentSocket(defaultProps));

        const timerUpdateHandler = mockSocket.on.mock.calls.find(call => call[0] === SOCKET_EVENTS.GAME.TIMER_UPDATE)?.[1];

        act(() => {
            timerUpdateHandler?.({ status: 'stop' });
        });

        expect(result.current.gameState.timer).toBe(0);
        expect(result.current.gameState.waiting).toBe(true);
    });

    it('should handle timer_set events', () => {
        mockIo.mockReturnValue(mockSocket as any);
        const { result } = renderHook(() => useTournamentSocket(defaultProps));

        const timerSetHandler = mockSocket.on.mock.calls.find(call => call[0] === SOCKET_EVENTS.GAME.TIMER_SET)?.[1];

        act(() => {
            timerSetHandler?.({ timeLeft: 20, questionState: 'active' });
        });

        expect(result.current.gameState.timer).toBe(20);
        expect(result.current.gameState.paused).toBe(false);
        expect(result.current.gameState.waiting).toBe(false);
    });

    it('should handle timer_set with stopped state', () => {
        mockIo.mockReturnValue(mockSocket as any);
        const { result } = renderHook(() => useTournamentSocket(defaultProps));

        const timerSetHandler = mockSocket.on.mock.calls.find(call => call[0] === SOCKET_EVENTS.GAME.TIMER_SET)?.[1];

        act(() => {
            timerSetHandler?.({ timeLeft: 0, questionState: 'stopped' });
        });

        expect(result.current.gameState.timer).toBe(0);
        expect(result.current.gameState.waiting).toBe(true);
    });

    it('should handle correct_answers event', () => {
        mockIo.mockReturnValue(mockSocket as any);
        const { result } = renderHook(() => useTournamentSocket(defaultProps));

        const correctAnswersHandler = mockSocket.on.mock.calls.find(call => call[0] === SOCKET_EVENTS.GAME.CORRECT_ANSWERS)?.[1];

        act(() => {
            correctAnswersHandler?.({ questionId: 'q-123', correctAnswers: [1] });
        });

        expect(result.current.gameState.showingCorrectAnswers).toBe(true);
    });

    it('should handle game_ended event', () => {
        mockIo.mockReturnValue(mockSocket as any);
        const { result } = renderHook(() => useTournamentSocket(defaultProps));

        const gameEndedHandler = mockSocket.on.mock.calls.find(call => call[0] === SOCKET_EVENTS.GAME.GAME_ENDED)?.[1];

        act(() => {
            gameEndedHandler?.({ score: 85, totalQuestions: 5 });
        });

        expect(result.current.gameState.gameStatus).toBe('finished');
        expect(result.current.gameState.timer).toBeNull();
        expect(result.current.gameState.waiting).toBe(true);
    });

    it('should handle game_error event', () => {
        mockIo.mockReturnValue(mockSocket as any);
        const { result } = renderHook(() => useTournamentSocket(defaultProps));

        const gameErrorHandler = mockSocket.on.mock.calls.find(call => call[0] === SOCKET_EVENTS.GAME.GAME_ERROR)?.[1];

        act(() => {
            gameErrorHandler?.({ message: 'Tournament not found' });
        });

        expect(result.current.error).toBe('Tournament not found');
    });

    it('should provide joinTournament function', () => {
        mockIo.mockReturnValue(mockSocket as any);
        const { result } = renderHook(() => useTournamentSocket(defaultProps));

        act(() => {
            result.current.joinTournament();
        });

        expect(mockSocket.emit).toHaveBeenCalledWith(SOCKET_EVENTS.GAME.JOIN_TOURNAMENT, {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser',
            avatarEmoji: 'https://example.com/avatar.jpg',
            isDiffered: false
        });
    });

    it('should provide submitAnswer function', () => {
        mockIo.mockReturnValue(mockSocket as any);
        const { result } = renderHook(() => useTournamentSocket(defaultProps));

        act(() => {
            result.current.submitAnswer('q-123', [1], 25);
        });

        expect(mockSocket.emit).toHaveBeenCalledWith(SOCKET_EVENTS.GAME.GAME_ANSWER, {
            accessCode: 'TEST123',
            userId: 'user-123',
            questionId: 'q-123',
            answer: [1],
            timeSpent: 25
        });
    });

    it('should handle connection errors', () => {
        mockIo.mockReturnValue(mockSocket as any);
        const { result } = renderHook(() => useTournamentSocket(defaultProps));

        const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === SOCKET_EVENTS.CONNECT_ERROR)?.[1];

        act(() => {
            errorHandler?.({ message: 'Connection failed' });
        });

        expect(result.current.connecting).toBe(false);
        expect(result.current.error).toBe('Connection error: Connection failed');
    });

    it('should handle disconnection', () => {
        mockIo.mockReturnValue(mockSocket as any);
        const { result } = renderHook(() => useTournamentSocket(defaultProps));

        const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === SOCKET_EVENTS.DISCONNECT)?.[1];

        act(() => {
            disconnectHandler?.('transport close');
        });

        expect(result.current.connected).toBe(false);
        expect(result.current.gameState.connectedToRoom).toBe(false);
    });

    it('should cleanup on unmount', () => {
        mockIo.mockReturnValue(mockSocket as any);
        const { unmount } = renderHook(() => useTournamentSocket(defaultProps));

        unmount();

        expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should provide clearFeedback function', () => {
        mockIo.mockReturnValue(mockSocket as any);
        const { result } = renderHook(() => useTournamentSocket(defaultProps));

        // Set some feedback first
        const answerReceivedHandler = mockSocket.on.mock.calls.find(call => call[0] === SOCKET_EVENTS.GAME.ANSWER_RECEIVED)?.[1];
        act(() => {
            answerReceivedHandler?.({ received: true, correct: true });
        });

        expect(result.current.gameState.feedback).toBeTruthy();

        // Clear feedback
        act(() => {
            result.current.clearFeedback();
        });

        expect(result.current.gameState.feedback).toBeNull();
        expect(result.current.gameState.showingCorrectAnswers).toBe(false);
    });

    it('should provide resetGameState function', () => {
        mockIo.mockReturnValue(mockSocket as any);
        const { result } = renderHook(() => useTournamentSocket(defaultProps));

        // Set some state first
        const gameQuestionHandler = mockSocket.on.mock.calls.find(call => call[0] === SOCKET_EVENTS.GAME.GAME_QUESTION)?.[1];
        act(() => {
            gameQuestionHandler?.({
                uid: 'q-123',
                text: 'Test question',
                questionIndex: 2,
                totalQuestions: 5,
                timer: 30
            });
        });

        expect(result.current.gameState.currentQuestion).toBeTruthy();

        // Reset state
        act(() => {
            result.current.resetGameState();
        });

        expect(result.current.gameState.currentQuestion).toBeNull();
        expect(result.current.gameState.questionIndex).toBe(0);
        expect(result.current.gameState.totalQuestions).toBe(0);
        expect(result.current.gameState.timer).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it('should not initialize socket if required props are missing', () => {
        const { result } = renderHook(() => useTournamentSocket({
            accessCode: '',
            userId: null,
            username: null
        }));

        expect(mockIo).not.toHaveBeenCalled();
        expect(result.current.socket).toBeNull();
    });

    it('should handle differed mode', () => {
        mockIo.mockReturnValue(mockSocket as any);
        const { result } = renderHook(() => useTournamentSocket({
            ...defaultProps,
            isDiffered: true
        }));

        act(() => {
            result.current.joinTournament();
        });

        expect(mockSocket.emit).toHaveBeenCalledWith(SOCKET_EVENTS.GAME.JOIN_TOURNAMENT, {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser',
            avatarEmoji: 'https://example.com/avatar.jpg',
            isDiffered: true
        });
    });
});
