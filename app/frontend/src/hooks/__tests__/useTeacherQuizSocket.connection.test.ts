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

// --- Actual imports ---
import { renderHook, act } from '@testing-library/react';
import { io } from 'socket.io-client';
import { useTeacherQuizSocket } from '../useTeacherQuizSocket';

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
        jest.clearAllMocks();
        mockSocket.emit.mockClear();
        mockSocket.on.mockClear();
        mockSocket.off.mockClear();
        mockSocket.disconnect.mockClear();
        mockSocket.connect.mockClear();
        mockSocket.connected = false;
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

    it('should connect socket and register connection event listener', () => {
        renderHook(() => useTeacherQuizSocket(null, mockToken, mockQuizId));

        // Verify that connect event listener was registered
        expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    });

    it('should register disconnect event listener', () => {
        renderHook(() => useTeacherQuizSocket(null, mockToken, mockQuizId));

        // Verify that disconnect event listener was registered
        expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    it('should handle connect event properly', () => {
        renderHook(() => useTeacherQuizSocket(null, mockToken, mockQuizId));

        act(() => {
            const connectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
            if (connectCallback) {
                mockSocket.connected = true;
                connectCallback();
            }
        });

        // Verify that join_dashboard was emitted on connect with Phase 8 payload structure
        expect(mockSocket.emit).toHaveBeenCalledWith('join_dashboard', {
            gameId: mockQuizId
        });
    });

    it('should handle disconnect event properly', () => {
        renderHook(() => useTeacherQuizSocket(null, mockToken, mockQuizId));

        act(() => {
            const disconnectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')?.[1];
            if (disconnectCallback) {
                mockSocket.connected = false;
                disconnectCallback('transport error');
            }
        });

        // Test passes if no errors are thrown during disconnect handling
        expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    it('should cleanup listeners on component unmount', () => {
        const { unmount } = renderHook(() => useTeacherQuizSocket(null, mockToken, mockQuizId));

        // Unmount the component
        unmount();

        // Verify that disconnect was called
        expect(mockSocket.disconnect).toHaveBeenCalled();
    });
});
