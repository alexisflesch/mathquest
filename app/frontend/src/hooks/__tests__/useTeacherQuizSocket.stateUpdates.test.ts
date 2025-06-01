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
import { BaseQuestion } from '@shared/types/question';
import { Chrono } from '@shared/types/quiz/state';

// --- Define QuizState and Question locally ---
interface Question extends BaseQuestion { }

export interface QuizState { // Export if needed by other test files, or keep local
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
describe('useTeacherQuizSocket State Updates', () => {
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

    it('should update quizState when "game_control_state" event is received', () => {
        const { result } = renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));
        const mockStateData: QuizState = {
            quizId: mockQuizId,
            currentQuestionIdx: 1,
            questions: [{ uid: 'q2', text: 'Another question', type: 'single_choice', answers: [], time: 60 }] as Question[],
            chrono: { timeLeft: 60, running: true },
            locked: true,
            ended: false,
            stats: { q1: { correct: 1 } },
        };

        act(() => {
            const callback = mockSocket.on.mock.calls.find(call => call[0] === 'game_control_state')?.[1];
            if (callback) callback(mockStateData);
        });

        expect(result.current.quizState).toEqual(mockStateData);
    });

    it('should update timer-related states when "quiz_timer_update" event is received', () => {
        const { result } = renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));
        // First, initialize quizState and questionTimers by simulating game_control_state
        const initialState: QuizState = {
            currentQuestionIdx: 0,
            questions: [{ uid: 'q1', text: 'Q1', type: 'multiple_choice', answers: [], time: 20 }] as Question[],
            chrono: { timeLeft: 20, running: true },
            locked: false,
            ended: false,
            stats: {},
        };
        act(() => {
            const gameControlCallback = mockSocket.on.mock.calls.find(call => call[0] === 'game_control_state')?.[1];
            if (gameControlCallback) gameControlCallback(initialState);
        });
        // Now send quiz_timer_update
        const mockTimerUpdate = { questionId: 'q1', timeLeft: 10, status: 'pause' as 'play' | 'pause' | 'stop' };
        act(() => {
            const callback = mockSocket.on.mock.calls.find(call => call[0] === 'quiz_timer_update')?.[1];
            if (callback) callback(mockTimerUpdate);
        });
        expect(result.current.timeLeft).toBe(mockTimerUpdate.timeLeft);
        expect(result.current.timerStatus).toBe(mockTimerUpdate.status);
        expect(result.current.timerQuestionId).toBe(mockTimerUpdate.questionId);
    });

    it('should update connectedCount when "quiz_connected_count" event is received', () => {
        const { result } = renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));
        const mockCountData = { count: 7 };
        act(() => {
            const callback = mockSocket.on.mock.calls.find(call => call[0] === 'quiz_connected_count')?.[1];
            if (callback) callback(mockCountData);
        });
        expect(result.current.connectedCount).toBe(mockCountData.count);
    });

    it('should NOT update profSocketId in quizState when "dashboard_joined" event is received', () => {
        const { result } = renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));
        const mockJoinData = { profSocketId: 'newProfSocketId123', quizId: mockQuizId };
        act(() => {
            const connectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
            if (connectCallback) {
                mockSocket.connected = true;
                connectCallback();
            }
            const dashboardJoinedCallback = mockSocket.on.mock.calls.find(call => call[0] === 'dashboard_joined')?.[1];
            if (dashboardJoinedCallback) dashboardJoinedCallback(mockJoinData);
        });
        // The hook does NOT update quizState.profSocketId on dashboard_joined
        expect(result.current.quizState?.profSocketId).toBeUndefined();
    });

});
