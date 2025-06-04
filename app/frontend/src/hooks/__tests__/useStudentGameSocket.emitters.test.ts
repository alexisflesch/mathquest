
import { renderHook, act, waitFor } from '@testing-library/react';
import { io } from 'socket.io-client';
import { useStudentGameSocket } from '../useStudentGameSocket';

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

describe('useStudentGameSocket - Emitters', () => {
    let mockSocket: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create mock socket
        mockSocket = {
            id: 'test-socket-id',
            connected: false,
            connect: jest.fn(),
            disconnect: jest.fn(),
            on: jest.fn(),
            off: jest.fn(),
            emit: jest.fn(),
            onAny: jest.fn()
        };

        mockIo.mockReturnValue(mockSocket);
    });

    it('should emit join_game with correct payload', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser',
            avatarEmoji: 'https://example.com/avatar.jpg',
            isDiffered: false
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        act(() => {
            result.current.joinGame();
        });

        expect(mockSocket.emit).toHaveBeenCalledWith('join_game', {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser',
            avatarEmoji: 'https://example.com/avatar.jpg',
            isDiffered: false
        });
    });

    it('should emit join_game with differed mode', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser',
            isDiffered: true
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        act(() => {
            result.current.joinGame();
        });

        expect(mockSocket.emit).toHaveBeenCalledWith('join_game', {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser',
            avatarEmoji: undefined,
            isDiffered: true
        });
    });

    it('should not emit join_game when missing required parameters', async () => {
        const hookProps = {
            accessCode: null,
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        act(() => {
            result.current.joinGame();
        });

        expect(mockSocket.emit).not.toHaveBeenCalledWith('join_game', expect.anything());
    });

    it('should emit game_answer with correct payload', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        const questionId = 'q1';
        const answer = 'Option B';
        const timeSpent = 15000;

        act(() => {
            result.current.submitAnswer(questionId, answer, timeSpent);
        });

        expect(mockSocket.emit).toHaveBeenCalledWith('game_answer', {
            accessCode: 'TEST123',
            userId: 'user-123',
            questionId: 'q1',
            answer: 'Option B',
            timeSpent: 15000
        });
    });

    it('should emit game_answer with array answer for multiple choice', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        const questionId = 'q2';
        const answer = ['Option A', 'Option C'];
        const timeSpent = 20000;

        act(() => {
            result.current.submitAnswer(questionId, answer, timeSpent);
        });

        expect(mockSocket.emit).toHaveBeenCalledWith('game_answer', {
            accessCode: 'TEST123',
            userId: 'user-123',
            questionId: 'q2',
            answer: ['Option A', 'Option C'],
            timeSpent: 20000
        });
    });

    it('should not emit game_answer when missing socket', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: null, // Missing userId
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        act(() => {
            result.current.submitAnswer('q1', 'answer', 1000);
        });

        expect(mockSocket.emit).not.toHaveBeenCalledWith('game_answer', expect.anything());
    });

    it('should emit request_next_question with correct payload', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        const currentQuestionId = 'q1';

        act(() => {
            result.current.requestNextQuestion(currentQuestionId);
        });

        expect(mockSocket.emit).toHaveBeenCalledWith('request_next_question', {
            accessCode: 'TEST123',
            userId: 'user-123',
            currentQuestionId: 'q1'
        });
    });

    it('should not emit request_next_question when missing parameters', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: null, // Missing userId
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        act(() => {
            result.current.requestNextQuestion('q1');
        });

        expect(mockSocket.emit).not.toHaveBeenCalledWith('request_next_question', expect.anything());
    });

    it('should handle multiple rapid emit calls', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        act(() => {
            result.current.joinGame();
            result.current.submitAnswer('q1', 'answer1', 1000);
            result.current.submitAnswer('q2', 'answer2', 2000);
            result.current.requestNextQuestion('q2');
        });

        expect(mockSocket.emit).toHaveBeenCalledTimes(4);
        expect(mockSocket.emit).toHaveBeenNthCalledWith(1, 'join_game', expect.any(Object));
        expect(mockSocket.emit).toHaveBeenNthCalledWith(2, 'game_answer', expect.objectContaining({
            questionId: 'q1',
            answer: 'answer1'
        }));
        expect(mockSocket.emit).toHaveBeenNthCalledWith(3, 'game_answer', expect.objectContaining({
            questionId: 'q2',
            answer: 'answer2'
        }));
        expect(mockSocket.emit).toHaveBeenNthCalledWith(4, 'request_next_question', expect.objectContaining({
            currentQuestionId: 'q2'
        }));
    });

    it('should preserve emit functionality after socket recreation', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result, rerender } = renderHook((props) => useStudentGameSocket(props), {
            initialProps: hookProps
        });

        // First emit
        act(() => {
            result.current.joinGame();
        });

        expect(mockSocket.emit).toHaveBeenCalledWith('join_game', expect.any(Object));

        // Simulate parameter change that recreates socket
        const newProps = { ...hookProps, accessCode: 'NEW123' };

        // Create new mock socket for rerender
        const newMockSocket = {
            ...mockSocket,
            emit: jest.fn()
        };
        mockIo.mockReturnValue(newMockSocket);

        rerender(newProps);

        // Second emit with new socket
        act(() => {
            result.current.joinGame();
        });

        expect(newMockSocket.emit).toHaveBeenCalledWith('join_game', expect.objectContaining({
            accessCode: 'NEW123'
        }));
    });

    it('should handle emit with numeric answer', async () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        act(() => {
            result.current.submitAnswer('q1', 42, 5000);
        });

        expect(mockSocket.emit).toHaveBeenCalledWith('game_answer', {
            accessCode: 'TEST123',
            userId: 'user-123',
            questionId: 'q1',
            answer: 42,
            timeSpent: 5000
        });
    });
});
