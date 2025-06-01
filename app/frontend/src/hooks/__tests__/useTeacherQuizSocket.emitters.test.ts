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
        renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));
        act(() => {
            const connectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
            if (connectCallback) connectCallback(); // Trigger connect logic
        });
    });

    afterEach(() => {
        window.localStorage.clear();
    });

    it('should emit "set_question" when emitSetQuestion is called', () => {
        const { result } = renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));
        const questionUid = "q1";
        act(() => {
            result.current.emitSetQuestion(questionUid);
        });

        // Check for the Phase 8 event with gameId payload structure
        expect(mockSocket.emit).toHaveBeenCalledWith('set_question', { gameId: mockQuizId, questionUid });
    });

    it('should emit "end_game" when emitEndQuiz is called', () => {
        const { result } = renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));
        act(() => {
            result.current.emitEndQuiz();
        });

        expect(mockSocket.emit).toHaveBeenCalledWith('end_game', { gameId: mockQuizId });
    });

    it('should emit "quiz_timer_action" with "pause" when emitPauseQuiz is called', () => {
        const { result } = renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));
        act(() => {
            result.current.emitPauseQuiz();
        });

        expect(mockSocket.emit).toHaveBeenCalledWith('quiz_timer_action', { gameId: mockQuizId, action: 'pause' });
    });

    it('should emit "quiz_timer_action" with "resume" when emitResumeQuiz is called', () => {
        const { result } = renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));
        act(() => {
            result.current.emitResumeQuiz();
        });

        expect(mockSocket.emit).toHaveBeenCalledWith('quiz_timer_action', { gameId: mockQuizId, action: 'resume' });
    });

    it('should emit "quiz_timer_action" with "stop" when emitTimerAction is called with stop status', () => {
        const { result } = renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));
        const questionIdForStop = "q_stop_test";
        act(() => {
            // Call emitTimerAction with status 'stop'
            result.current.emitTimerAction({ status: 'stop', questionId: questionIdForStop });
        });

        // emitTimerAction for 'stop' will emit { gameId, action: 'stop', duration: undefined }
        expect(mockSocket.emit).toHaveBeenCalledWith('quiz_timer_action', { gameId: mockQuizId, action: 'stop', duration: undefined });
    });
});
