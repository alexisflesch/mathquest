// --- Mock logger ---
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
import { renderHook } from '@testing-library/react';
import { io } from 'socket.io-client';
import { useTeacherQuizSocket } from '../useTeacherQuizSocket';
import { createLogger } from '@/clientLogger';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

// --- Mocks ---
const mockedIo = io as jest.MockedFunction<typeof io>;
const mockCreateLogger = createLogger as jest.MockedFunction<typeof createLogger>;

const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

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
describe('useTeacherQuizSocket Basic Tests', () => {
    const mockToken = 'mock-teacher-token';
    const mockQuizId = 'quiz123';

    beforeEach(() => {
        jest.clearAllMocks();
        mockLogger.debug.mockClear();
        mockLogger.info.mockClear();
        mockLogger.warn.mockClear();
        mockLogger.error.mockClear();
        mockSocket.emit.mockClear();
        mockSocket.on.mockClear();
        mockSocket.off.mockClear();
        mockSocket.disconnect.mockClear();
        mockSocket.connect.mockClear();
        mockSocket.connected = false;
        mockCreateLogger.mockReturnValue(mockLogger);
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

    it('should render without crashing', () => {
        const { result } = renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));
        expect(result.current).toBeDefined();
    });
});