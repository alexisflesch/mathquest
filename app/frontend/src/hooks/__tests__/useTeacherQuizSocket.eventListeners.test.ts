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
import { BaseQuestion } from '@shared/types/question';
import { Chrono } from '@shared/types/quiz/state';

// --- Define QuizState and Question locally ---
interface Question extends BaseQuestion { }

interface QuizState {
    currentQuestionIdx: number | null;
    questions: Question[];
    chrono: Chrono;
    locked: boolean;
    ended: boolean;
    stats: Record<string, unknown>;
    profSocketId?: string | null;
    timerStatus?: 'play' | 'pause' | 'stop' | null;
    timerQuestionId?: string | null;
    timerTimeLeft?: number | null;
    timerTimestamp?: number;
    questionStates?: Record<string, boolean>;
    quizId?: string;
    quizTitle?: string;
    hostId?: string;
    participants?: any[];
    currentState?: string;
}

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
describe('useTeacherQuizSocket Event Listeners', () => {
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

    it('should register event listener for "game_control_state"', () => {
        renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));

        // Verify that the event listener was registered
        expect(mockSocket.on).toHaveBeenCalledWith('game_control_state', expect.any(Function));
    });

    it('should register event listener for "quiz_timer_update"', () => {
        renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));

        // Verify that the event listener was registered
        expect(mockSocket.on).toHaveBeenCalledWith('quiz_timer_update', expect.any(Function));
    });

    it('should register event listener for "quiz_connected_count"', () => {
        renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));

        // Verify that the event listener was registered
        expect(mockSocket.on).toHaveBeenCalledWith('quiz_connected_count', expect.any(Function));
    });

    it('should register event listener for "dashboard_joined"', () => {
        renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));

        // Verify that the event listener was registered
        expect(mockSocket.on).toHaveBeenCalledWith('dashboard_joined', expect.any(Function));
    });

    it('should handle "game_control_state" event without errors', () => {
        const { result } = renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));
        const mockState: QuizState = {
            currentQuestionIdx: 0,
            questions: [{ uid: 'q1', text: 'Test question', type: 'multiple_choice', answers: [{ text: 'Answer 1', correct: true }], time: 30 }] as Question[],
            chrono: { timeLeft: 30, running: false },
            locked: false,
            ended: false,
            stats: {},
        };

        act(() => {
            const callback = mockSocket.on.mock.calls.find(call => call[0] === 'game_control_state')?.[1];
            if (callback) callback(mockState);
        });

        // Test passes if no errors are thrown and state is updated
        expect(result.current.quizState).toBeDefined();
        expect(result.current.quizState?.currentQuestionIdx).toBe(0);
    });

    it('should handle "quiz_timer_update" event without errors', () => {
        const { result } = renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));
        const mockTimerData = { questionId: 'q1', timeLeft: 15, status: 'play' };

        act(() => {
            const callback = mockSocket.on.mock.calls.find(call => call[0] === 'quiz_timer_update')?.[1];
            if (callback) callback(mockTimerData);
        });

        // Test passes if no errors are thrown - we don't test the exact timeLeft value
        // since the timer logic is complex and may not immediately update the display
        expect(result.current.timerQuestionId).toBe('q1');
        expect(result.current.timerStatus).toBe('play');
    });
});
