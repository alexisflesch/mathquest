// filepath: /home/aflesch/mathquest/app/frontend/src/hooks/__tests__/useTeacherQuizSocket.connection.test.ts
// --- Define MockLogger interface and instance first ---
interface MockLogger {
    debug: jest.Mock;
    info: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
}

const mockLoggerInstance: MockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

// --- Mock logger ---
jest.mock('@/clientLogger', () => ({
    createLogger: jest.fn(() => mockLoggerInstance), // Always return the pre-defined instance
}));

// --- Mock socket.io-client ---
jest.mock('socket.io-client', () => ({
    io: jest.fn(),
}));

// --- Actual imports ---
import { renderHook, act } from '@testing-library/react';
import { io } from 'socket.io-client'; // This will be the mocked version
import { useTeacherQuizSocket } from '../useTeacherQuizSocket'; // The hook under test

// --- Constants ---
const SOCKET_URL = 'http://localhost:3007'; // Matches API_URL from config.ts
const SOCKET_PATH = '/api/socket.io'; // Matches SOCKET_CONFIG.path from config.ts

// --- Mocks ---
const mockedIo = io as jest.MockedFunction<typeof io>;

const mockSocket = {
    connected: false,
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
    connect: jest.fn(),
    id: 'mockSocketId',
};

// --- Test Suite ---
describe('useTeacherQuizSocket Connection', () => {
    const mockToken = 'mock-teacher-token';
    const mockQuizId = 'quiz123';

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Reset specific mock functions for the logger instance
        mockLoggerInstance.debug.mockClear();
        mockLoggerInstance.info.mockClear();
        mockLoggerInstance.warn.mockClear();
        mockLoggerInstance.error.mockClear();

        // Reset mockSocket methods
        mockSocket.emit.mockClear();
        mockSocket.on.mockClear();
        mockSocket.off.mockClear();
        mockSocket.disconnect.mockClear();
        mockSocket.connect.mockClear();
        mockSocket.connected = false;

        // Setup default mock return value for io
        mockedIo.mockReturnValue(mockSocket as any);

        // Mock localStorage for getSocketAuth
        const mockLocalStorage = (() => {
            let store: Record<string, string> = {};
            return {
                getItem: (key: string) => store[key] || null,
                setItem: (key: string, value: string) => {
                    store[key] = value.toString();
                },
                removeItem: (key: string) => {
                    delete store[key];
                },
                clear: () => {
                    store = {};
                }
            };
        })();
        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true // Ensure it can be modified/cleared in tests
        });
        window.localStorage.setItem('mathquest_jwt_token', mockToken);
    });

    afterEach(() => {
        window.localStorage.clear();
    });

    it('should connect the socket and set up event listeners on mount', () => {
        renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));

        expect(mockSocket.connect).toHaveBeenCalledTimes(1);

        // Check that basic event listeners are attached in the first useEffect (connection)
        expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('dashboard_joined', expect.any(Function));

        // Check listeners from the second useEffect (state synchronization)
        // These are added *after* quizSocket is set.
        // To test these, we need to ensure quizSocket is truthy when the second useEffect runs.
        // The mock setup ensures io() returns mockSocket, so quizSocket becomes mockSocket.
        expect(mockSocket.on).toHaveBeenCalledWith('game_control_state', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('quiz_timer_update', expect.any(Function));
        // The event name in the hook is "quiz_connected_count"
        expect(mockSocket.on).toHaveBeenCalledWith('quiz_connected_count', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith("error_dashboard", expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith("game_error", expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith("lobby_error", expect.any(Function));
        // The 'connect' listener in the second useEffect is for re-connections.
        // It's a different handler than the one in the first useEffect.
        // We can check it was called at least once (for the initial setup) or twice if we simulate a reconnect.
        // For simplicity, checking it was called for the second useEffect is sufficient here.
        // To be precise, we can count the calls for 'connect'.
        const connectListeners = mockSocket.on.mock.calls.filter(call => call[0] === 'connect');
        expect(connectListeners.length).toBeGreaterThanOrEqual(1); // At least one from first useEffect
        // If quizSocket is set, the second useEffect also adds one.
        // So, if the hook structure is as expected, it should be 2 if quizSocket is set immediately.
        // Given the two useEffects, it should be called twice if quizSocket is set synchronously.
        expect(mockSocket.on.mock.calls.filter(call => call[0] === 'connect')).toHaveLength(2);
    });

    it('should handle socket connection and log info, then emit join and get state', () => {
        renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));

        act(() => {
            // Simulate the 'connect' event being triggered by the socket
            const connectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
            if (connectCallback) {
                mockSocket.connected = true; // Simulate socket being connected
                connectCallback();
            }
        });

        expect(mockLoggerInstance.info).toHaveBeenCalledWith(
            `Socket connected: ${mockSocket.id}`
        );
        // Verify that after connection, appropriate messages are emitted
        expect(mockSocket.emit).toHaveBeenCalledWith("join_dashboard", { quizId: mockQuizId, role: 'teacher' });
        expect(mockSocket.emit).toHaveBeenCalledWith("get_game_state", { quizId: mockQuizId });
    });

    it('should handle socket disconnection and log info', () => {
        renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));

        act(() => {
            // Simulate the 'disconnect' event
            const disconnectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')?.[1];
            if (disconnectCallback) {
                mockSocket.connected = false; // Simulate socket being disconnected
                disconnectCallback('io server disconnect');
            }
        });

        expect(mockLoggerInstance.warn).toHaveBeenCalledWith(
            `Socket disconnected: io server disconnect`
        );
    });

    it('should log error when "connect_error" event is received', () => {
        renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));
        const mockError = { message: 'Test connection error' };

        act(() => {
            const callback = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')?.[1];
            if (callback) callback(mockError);
        });

        expect(mockLoggerInstance.error).toHaveBeenCalledWith(
            "Socket connection error:",
            mockError
        );
    });

    it('should clean up listeners and disconnect socket on unmount', () => {
        const { unmount } = renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));

        // Simulate the initial 'connect' event being triggered to ensure all event handlers
        // (including those in the second useEffect) are properly set up before unmount.
        act(() => {
            const connectHandlers = mockSocket.on.mock.calls.filter(call => call[0] === 'connect');
            // The first registered 'connect' handler is from the first useEffect
            if (connectHandlers.length > 0 && typeof connectHandlers[0][1] === 'function') {
                mockSocket.connected = true;
                connectHandlers[0][1](); // Call the first 'connect' handler
            }
        });

        unmount();

        // Verify cleanup from the first useEffect:
        // - socket.disconnect() is called.
        // - Logger message for disconnection.
        expect(mockSocket.disconnect).toHaveBeenCalledTimes(1);
        expect(mockLoggerInstance.info).toHaveBeenCalledWith(
            `Disconnecting socket for quiz: ${mockQuizId}`
        );

        // Verify cleanup from the second useEffect (quizSocket.off calls):
        expect(mockSocket.off).toHaveBeenCalledWith('game_control_state', expect.any(Function));
        expect(mockSocket.off).toHaveBeenCalledWith('quiz_timer_update', expect.any(Function));
        expect(mockSocket.off).toHaveBeenCalledWith('quiz_connected_count'); // Called without a specific handler
        expect(mockSocket.off).toHaveBeenCalledWith('error_dashboard', expect.any(Function));
        expect(mockSocket.off).toHaveBeenCalledWith('game_error', expect.any(Function));
        expect(mockSocket.off).toHaveBeenCalledWith('lobby_error', expect.any(Function));

        // These listeners are set up in both useEffects but cleaned by the second one.
        expect(mockSocket.off).toHaveBeenCalledWith('connect_error', expect.any(Function));
        expect(mockSocket.off).toHaveBeenCalledWith('disconnect', expect.any(Function));

        // quizSocket.off("connect") is called, removing all listeners for "connect".
        expect(mockSocket.off).toHaveBeenCalledWith('connect');

        // 'dashboard_joined' is set up in the first useEffect but NOT explicitly cleaned up with .off()
        // So, we assert that it was NOT called for 'dashboard_joined'.
        expect(mockSocket.off).not.toHaveBeenCalledWith('dashboard_joined', expect.any(Function));
    });
});
