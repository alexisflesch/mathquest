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
import { renderHook, act, waitFor } from '@testing-library/react';
import { io } from 'socket.io-client';
import { useTeacherQuizSocket } from '../useTeacherQuizSocket';
import type { QuestionData } from '@shared/types/socketEvents';
import { Chrono } from '@shared/types/quiz/state';

// --- Define QuizState locally ---
interface QuizState {
    currentQuestionIdx: number | null;
    questions: QuestionData[];
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
        renderHook(() => useTeacherQuizSocket(null, mockToken, mockQuizId));

        // Verify that the event listener was registered
        expect(mockSocket.on).toHaveBeenCalledWith('game_control_state', expect.any(Function));
    });

    it('should register event listener for "dashboard_timer_updated"', () => {
        renderHook(() => useTeacherQuizSocket(null, mockToken, mockQuizId));

        // Verify that the event listener was registered
        expect(mockSocket.on).toHaveBeenCalledWith('dashboard_timer_updated', expect.any(Function));
    });

    it('should register event listener for "quiz_connected_count"', () => {
        renderHook(() => useTeacherQuizSocket(null, mockToken, mockQuizId));

        // Verify that the event listener was registered
        expect(mockSocket.on).toHaveBeenCalledWith('quiz_connected_count', expect.any(Function));
    });

    it('should register event listener for "dashboard_joined"', () => {
        renderHook(() => useTeacherQuizSocket(null, mockToken, mockQuizId));

        // Verify that the event listener was registered
        expect(mockSocket.on).toHaveBeenCalledWith('dashboard_joined', expect.any(Function));
    });

    it('should handle "game_control_state" event without errors', () => {
        const { result } = renderHook(() => useTeacherQuizSocket(null, mockToken, mockQuizId));
        const mockState: QuizState = {
            currentQuestionIdx: 0,
            questions: [{ uid: 'q1', text: 'Test question', questionType: 'multiple_choice', answerOptions: ['Answer 1'], correctAnswers: [true], timeLimit: 30 }] as QuestionData[],
            chrono: { timeLeft: 30, running: false, status: 'stop' },
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

    it('should handle "dashboard_timer_updated" event without errors', () => {
        const { result } = renderHook(() => useTeacherQuizSocket(null, mockToken, mockQuizId));
        const mockTimerData = { questionId: 'q1', timeLeft: 15000, status: 'play', running: true, duration: 15000 }; // ms, not s, and running/duration required

        act(() => {
            // Trigger both dashboard_timer_updated and quiz_timer_update for robustness
            const dashboardCallback = mockSocket.on.mock.calls.find(call => call[0] === 'dashboard_timer_updated')?.[1];
            if (dashboardCallback) dashboardCallback(mockTimerData);
            const quizCallback = mockSocket.on.mock.calls.find(call => call[0] === 'quiz_timer_update')?.[1];
            if (quizCallback) quizCallback(mockTimerData);
        });

        // Wait for timer state to update
        return waitFor(() => {
            expect(result.current.timerQuestionId).toBe('q1');
            expect(result.current.timerStatus).toBe('play');
        });
    });
});
