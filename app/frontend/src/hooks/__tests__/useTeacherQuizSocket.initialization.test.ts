// --- Mock logger with inline implementation ---
jest.mock('@/clientLogger', () => ({
    createLogger: jest.fn(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    })),
}));

// --- Mock socket.io-client ---
jest.mock('socket.io-client', () => ({
    io: jest.fn(),
}));

// --- Mock useGameSocket ---
jest.mock('@/hooks/useGameSocket');

// --- Actual imports ---
import { renderHook, act } from '@testing-library/react';
import { io } from 'socket.io-client';
import { useGameSocket } from '@/hooks/useGameSocket';
import { useTeacherQuizSocket } from '../useTeacherQuizSocket';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

// --- Mocks ---
const mockedIo = io as jest.MockedFunction<typeof io>;
const mockedUseGameSocket = useGameSocket as jest.MockedFunction<typeof useGameSocket>;

const mockSocket = {
    connected: false,
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
    connect: jest.fn(),
    id: 'mockSocketId',
};

const mockGameSocketReturn = {
    socket: mockSocket,
    socketState: {
        connected: false,
        connecting: false,
        error: null,
        reconnectAttempts: 0
    },
    connect: jest.fn(),
    disconnect: jest.fn(() => mockSocket.disconnect()),
    reconnect: jest.fn(),
    emitTimerAction: jest.fn(),
    onTimerUpdate: jest.fn()
};

// --- Test Suite ---
describe('useTeacherQuizSocket Initialization', () => {
    const mockToken = 'mock-teacher-token';
    const mockQuizId = 'quiz123';

    beforeEach(() => {
        jest.clearAllMocks();
        mockSocket.emit.mockClear();
        mockSocket.on.mockClear();
        mockSocket.off.mockClear();
        mockSocket.disconnect.mockClear();
        mockSocket.connect.mockClear();
        mockSocket.connected = false;

        // Mock useGameSocket to return our mock socket
        mockedUseGameSocket.mockReturnValue(mockGameSocketReturn as any);

        mockedIo.mockReturnValue(mockSocket as any);

        const mockLocalStorage = (() => {
            let store: Record<string, string> = {};
            return {
                getItem: (key: string) => store[key] || null,
                setItem: (key: string, value: string) => { store[key] = value.toString(); },
                removeItem: (key: string) => { delete store[key]; },
                clear: () => { store = {}; }
            };
        })();
        Object.defineProperty(window, 'localStorage', { value: mockLocalStorage, writable: true });
        window.localStorage.setItem('mathquest_jwt_token', mockToken);
    });

    afterEach(() => {
        window.localStorage.clear();
    });

    it('should initialize socket with correct configuration', () => {
        renderHook(() => useTeacherQuizSocket(null, mockToken, mockQuizId));

        // Verify that useGameSocket was called with correct parameters
        expect(mockedUseGameSocket).toHaveBeenCalledWith('teacher', mockQuizId);
    });

    it('should setup all required event listeners', () => {
        renderHook(() => useTeacherQuizSocket(null, mockToken, mockQuizId));

        // Verify that all required event listeners are registered
        expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('game_control_state', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('quiz_timer_update', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('quiz_connected_count', expect.any(Function));
    });

    it('should emit "join_dashboard" on connect', () => {
        renderHook(() => useTeacherQuizSocket(null, mockToken, mockQuizId));

        act(() => {
            const connectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
            if (connectCallback) {
                mockSocket.connected = true;
                connectCallback();
            }
        });

        // Verify that join_dashboard was emitted with Phase 8 payload structure
        expect(mockSocket.emit).toHaveBeenCalledWith('join_dashboard', {
            gameId: mockQuizId
        });
    });

    it('should initialize with default states', () => {
        const { result } = renderHook(() => useTeacherQuizSocket(null, mockToken, mockQuizId));

        // Check initial state values
        expect(result.current.connectedCount).toBe(1); // Professor connected by default
        expect(result.current.timeLeftMs).toBe(0);
        expect(result.current.timerStatus).toBe('stop');
        expect(result.current.quizState).toBeDefined();
        expect(typeof result.current.emitSetQuestion).toBe('function');
        expect(typeof result.current.emitEndQuiz).toBe('function');
        expect(typeof result.current.emitPauseQuiz).toBe('function');
        expect(typeof result.current.emitResumeQuiz).toBe('function');
        expect(typeof result.current.emitTimerAction).toBe('function');
    });
});
