import { renderHook } from '@testing-library/react';
import { io } from 'socket.io-client';
import { useStudentGameSocket } from '../useStudentGameSocket';
import { SOCKET_CONFIG } from '@/config';
import { createSocketConfig } from '@/utils';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

// Mock socket.io-client
jest.mock('socket.io-client');
const mockIo = io as jest.MockedFunction<typeof io>;

// Mock createSocketConfig
jest.mock('@/utils', () => ({
    createSocketConfig: jest.fn()
}));
const mockCreateSocketConfig = createSocketConfig as jest.MockedFunction<typeof createSocketConfig>;

// Mock logger
jest.mock('@/clientLogger', () => ({
    createLogger: jest.fn(() => ({
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }))
}));

describe('useStudentGameSocket - Initialization', () => {
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
        mockCreateSocketConfig.mockReturnValue({
            ...SOCKET_CONFIG,
            auth: { token: 'mock-token' },
            query: { token: 'mock-token' }
        });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should initialize with default state when no parameters provided', () => {
        const { result } = renderHook(() => useStudentGameSocket({
            accessCode: null,
            userId: null,
            username: null
        }));

        expect(result.current.socket).toBeNull();
        expect(result.current.connected).toBe(false);
        expect(result.current.connecting).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.gameState).toEqual({
            currentQuestion: null,
            questionIndex: 0,
            totalQuestions: 0,
            timer: 0, // changed from null to 0 to match unified timer default
            timerStatus: 'stop',
            gameStatus: 'waiting',
            answered: false,
            connectedToRoom: false,
            phase: 'question',
            feedbackRemaining: null,
            correctAnswers: null,
            gameMode: 'tournament',
            linkedQuizId: null,
            lastAnswerFeedback: null,
            leaderboard: [],
            numericAnswer: null
        });
    });

    it('should create socket connection with valid parameters', () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser',
            avatarEmoji: 'https://example.com/avatar.jpg',
            isDiffered: false
        };

        renderHook(() => useStudentGameSocket(hookProps));

        expect(mockCreateSocketConfig).toHaveBeenCalledWith(SOCKET_CONFIG);
        expect(mockIo).toHaveBeenCalledWith(SOCKET_CONFIG.url, {
            ...SOCKET_CONFIG,
            auth: { token: 'mock-token' },
            query: { token: 'mock-token' }
        });
        expect(mockSocket.connect).toHaveBeenCalled();
    });

    it('should not create socket when missing required parameters', () => {
        const { result } = renderHook(() => useStudentGameSocket({
            accessCode: 'TEST123',
            userId: null, // Missing userId
            username: 'TestUser'
        }));

        expect(mockIo).not.toHaveBeenCalled();
        expect(result.current.socket).toBeNull();
        expect(result.current.connecting).toBe(false);
    });

    it('should register connection event handlers on socket creation', () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        renderHook(() => useStudentGameSocket(hookProps));

        // Verify connection events are registered
        expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('reconnect', expect.any(Function));
    });

    it('should clean up socket on unmount', () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { unmount } = renderHook(() => useStudentGameSocket(hookProps));

        unmount();

        expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should handle differed mode parameter', () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser',
            isDiffered: true
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        // Should still create socket with differed flag
        expect(mockIo).toHaveBeenCalled();
        expect(result.current.gameState.gameStatus).toBe('waiting');
    });

    it('should provide all expected hook interface methods', () => {
        const hookProps = {
            accessCode: 'TEST123',
            userId: 'user-123',
            username: 'TestUser'
        };

        const { result } = renderHook(() => useStudentGameSocket(hookProps));

        // Check all interface methods exist
        expect(typeof result.current.joinGame).toBe('function');
        expect(typeof result.current.submitAnswer).toBe('function');
        expect(typeof result.current.requestNextQuestion).toBe('function');

        // Check all interface properties exist
        expect(result.current).toHaveProperty('socket');
        expect(result.current).toHaveProperty('gameState');
        expect(result.current).toHaveProperty('connected');
        expect(result.current).toHaveProperty('connecting');
        expect(result.current).toHaveProperty('error');
    });
});
