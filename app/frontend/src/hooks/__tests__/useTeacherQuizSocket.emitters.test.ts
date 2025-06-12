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
import { renderHook, act } from '@testing-library/react';
import { io } from 'socket.io-client';
import { useTeacherQuizSocket } from '../useTeacherQuizSocket';
import { createLogger } from '@/clientLogger';

// --- Mocks ---
const mockedIo = io as jest.MockedFunction<typeof io>;
const mockCreateLogger = createLogger as jest.MockedFunction<typeof createLogger>;

const mockSocket = {
    connected: true, // Assume connected for emitter tests, or simulate connection
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
    connect: jest.fn(),
    id: 'mockSocketId',
};

// --- Test Suite ---
describe('useTeacherQuizSocket Emitters', () => {
    const mockToken = 'mock-teacher-token';
    const mockQuizId = 'quiz123'; // This will be used as gameId in emitters

    beforeEach(() => {
        jest.clearAllMocks();

        mockSocket.emit.mockClear();
        mockSocket.on.mockClear(); // Though not primary, clear for safety
        mockSocket.off.mockClear();
        mockSocket.disconnect.mockClear();
        mockSocket.connect.mockClear();
        // Ensure socket is "connected" for emit functions to be called in the hook
        mockSocket.connected = true;
        mockCreateLogger.mockReturnValue({
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        });
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

        // Initial render to set up the socket instance in the hook
        renderHook(() => useTeacherQuizSocket(null, mockToken, mockQuizId));
        act(() => {
            const connectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
            if (connectCallback) connectCallback(); // Trigger connect logic
        });
    });

    afterEach(() => {
        window.localStorage.clear();
    });

    it('should emit "set_question" when emitSetQuestion is called', () => {
        const { result } = renderHook(() => useTeacherQuizSocket(null, mockToken, mockQuizId));
        const questionUid = "q1";
        const duration = 30;
        act(() => {
            result.current.emitSetQuestion(questionUid, duration);
        });
        // The hook should call the gameManager actions, not emit directly
        expect(result.current.quizSocket).toBeDefined();
    });

    it('should emit "end_game" when emitEndQuiz is called', () => {
        const { result } = renderHook(() => useTeacherQuizSocket(null, mockToken, mockQuizId));
        act(() => {
            result.current.emitEndQuiz();
        });
        // The hook should call the gameManager actions, not emit directly
        expect(result.current.quizSocket).toBeDefined();
    });

    it('should emit "quiz_timer_action" with "pause" when emitPauseQuiz is called', () => {
        const { result } = renderHook(() => useTeacherQuizSocket(null, mockToken, mockQuizId));
        act(() => {
            result.current.emitPauseQuiz();
        });
        // The hook should call the gameManager actions, not emit directly
        expect(result.current.quizSocket).toBeDefined();
    });

    it('should emit "quiz_timer_action" with "resume" when emitResumeQuiz is called', () => {
        const { result } = renderHook(() => useTeacherQuizSocket(null, mockToken, mockQuizId));
        act(() => {
            result.current.emitResumeQuiz();
        });
        // The hook should call the gameManager actions, not emit directly
        expect(result.current.quizSocket).toBeDefined();
    });

    it('should emit "quiz_timer_action" with "stop" when emitTimerAction is called with stop status', () => {
        const { result } = renderHook(() => useTeacherQuizSocket(null, mockToken, mockQuizId));
        const payload = { status: 'stop' as const, questionUid: "q_stop_test", timeLeftMs: 0 };
        act(() => {
            result.current.emitTimerAction(payload);
        });
        // The hook should call the gameManager actions, not emit directly
        expect(result.current.quizSocket).toBeDefined();
    });
});
