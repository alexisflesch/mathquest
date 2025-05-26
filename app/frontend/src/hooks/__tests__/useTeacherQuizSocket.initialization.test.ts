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
import { renderHook } from '@testing-library/react';
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
describe('useTeacherQuizSocket Initialization', () => {
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
        mockSocket.connect.mockClear(); // ensure connect is also cleared
        mockSocket.connected = false; // Reset connected state

        // Setup default mock return value for io
        mockedIo.mockReturnValue(mockSocket as any);
    });

    it('should initialize logger and socket with correct parameters', () => {
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
            value: mockLocalStorage
        });
        // Set the token that the hook will try to retrieve
        window.localStorage.setItem('mathquest_jwt_token', mockToken);

        renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));

        expect(mockLoggerInstance.info).toHaveBeenCalledWith(
            `Initializing socket connection for quiz: ${mockQuizId} to ${SOCKET_URL}`
        );

        // Expected configuration based on SOCKET_CONFIG and createSocketConfig
        const expectedSocketConfig = {
            url: SOCKET_URL, // From SOCKET_CONFIG
            path: SOCKET_PATH, // From SOCKET_CONFIG
            transports: ['websocket', 'polling'], // From SOCKET_CONFIG
            reconnectionAttempts: 10, // From SOCKET_CONFIG
            reconnectionDelay: 1000, // From SOCKET_CONFIG
            reconnectionDelayMax: 10000, // From SOCKET_CONFIG
            timeout: 30000, // From SOCKET_CONFIG
            forceNew: true, // From SOCKET_CONFIG
            autoConnect: false, // From SOCKET_CONFIG
            withCredentials: true, // From SOCKET_CONFIG
            extraHeaders: { // From SOCKET_CONFIG
                "X-Client-Version": "1.0.0",
                "X-Client-Source": "frontend"
            },
            auth: { token: mockToken }, // From createSocketConfig via getSocketAuth
            query: { token: mockToken } // From createSocketConfig via getSocketAuth
        };

        expect(mockedIo).toHaveBeenCalledWith(SOCKET_URL, expectedSocketConfig);

        expect(mockSocket.connect).toHaveBeenCalledTimes(1);

        // Clean up localStorage mock
        window.localStorage.clear();
    });
});
