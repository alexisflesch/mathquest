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

// --- Mocks ---
const mockedIo = io as jest.MockedFunction<typeof io>;
const mockCreateLogger = createLogger as jest.MockedFunction<typeof createLogger>;

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
describe('useTeacherQuizSocket Simple Tests', () => {
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

    it('should initialize with default state values', () => {
        const { result } = renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));

        expect(result.current.quizState).toBeDefined();
        expect(result.current.connectedCount).toBe(1); // Professor is connected by default
        expect(result.current.timeLeftMs).toBe(0); // timeLeftMs is initialized to 0
        expect(result.current.timerStatus).toBe('stop'); // timerStatus is initialized to 'stop'
        expect(result.current.timerQuestionUid).toBeNull();
        expect(typeof result.current.emitSetQuestion).toBe('function');
        expect(typeof result.current.emitEndQuiz).toBe('function');
        expect(typeof result.current.emitPauseQuiz).toBe('function');
        expect(typeof result.current.emitResumeQuiz).toBe('function');
        expect(typeof result.current.emitTimerAction).toBe('function');
    });
});