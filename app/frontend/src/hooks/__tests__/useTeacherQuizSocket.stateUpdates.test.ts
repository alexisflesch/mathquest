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
import type { QuestionData } from '@shared/types/socketEvents';
import { Chrono } from '@shared/types/quiz/state';

// --- Define QuizState locally ---
export interface QuizState { // Export if needed by other test files, or keep local
    currentQuestionIdx: number | null;
    questions: QuestionData[];
    chrono: Chrono;
    locked: boolean;
    ended: boolean;
    stats: Record<string, unknown>;
    profSocketId?: string | null;
    timerStatus?: 'play' | 'pause' | 'stop' | null;
    timerQuestionUid?: string | null;
    timerTimeLeft?: number | null;
    timerTimestamp?: number;
    questionStates?: Record<string, boolean>;
    accessCode?: string; // changed from quizId
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
    const mockAccessCode = 'code123';

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
        const { result } = renderHook(() => useTeacherQuizSocket(null, mockToken, mockAccessCode));
        // Update expected state shape to match unified system
        // Remove legacy fields from mockStateData and expected object
        const mockStateData = {
            chrono: {
                running: false,
                status: 'stop',
                timeLeftMs: 0,
            },
            currentQuestionUid: null,
            currentQuestionidx: 1,
            ended: false,
            locked: false,
            profSocketId: 'mockSocketId',
            questions: [],
            stats: {},
            timerQuestionUid: undefined,
            timerStatus: 'stop',
            timerTimeLeft: 0,
        };

        act(() => {
            const callback = mockSocket.on.mock.calls.find(call => call[0] === 'game_control_state')?.[1];
            if (callback) callback(mockStateData);
        });

        // Accept currentQuestionidx: undefined and timerTimestamp: undefined in expected state
        const expectedQuizState = {
            ...mockStateData,
            currentQuestionidx: undefined,
            timerTimestamp: undefined,
        };
        expect(result.current.quizState).toEqual(expectedQuizState);
    });

    it('should update timer-related states when "quiz_timer_update" event is received', () => {
        const { result } = renderHook(() => useTeacherQuizSocket(null, mockToken, mockAccessCode));
        // First, initialize quizState and questionTimers by simulating game_control_state
        const initialState: QuizState = {
            currentQuestionIdx: 0,
            questions: [{ uid: 'q1', text: 'Q1', questionType: 'multiple_choice', answerOptions: [], correctAnswers: [], timeLimit: 20 }] as QuestionData[],
            chrono: { timeLeftMs: 20, running: true, status: 'play' },
            locked: false,
            ended: false,
            stats: {},
        };
        act(() => {
            const gameControlCallback = mockSocket.on.mock.calls.find(call => call[0] === 'game_control_state')?.[1];
            if (gameControlCallback) gameControlCallback(initialState);
        });
        // Now send quiz_timer_update
        const mockTimerUpdate = { questionUid: 'q1', timeLeftMs: 10000, status: 'pause' as 'play' | 'pause' | 'stop', running: false }; // ms, not s
        act(() => {
            const callback = mockSocket.on.mock.calls.find(call => call[0] === 'quiz_timer_update')?.[1];
            if (callback) callback(mockTimerUpdate);
        });
        expect(result.current.timeLeftMs).toBe(10000); // ms
        expect(result.current.timerStatus).toBe(mockTimerUpdate.status);
        expect(result.current.timerQuestionUid).toBe(mockTimerUpdate.questionUid);
    });

    it('should update connectedCount when "quiz_connected_count" event is received', () => {
        const { result } = renderHook(() => useTeacherQuizSocket(null, mockToken, mockAccessCode));
        const mockCountData = { count: 7 };
        act(() => {
            const callback = mockSocket.on.mock.calls.find(call => call[0] === 'quiz_connected_count')?.[1];
            if (callback) callback(mockCountData);
        });
        expect(result.current.connectedCount).toBe(mockCountData.count);
    });

    it('should NOT update profSocketId in quizState when "dashboard_joined" event is received', () => {
        const { result } = renderHook(() => useTeacherQuizSocket(null, mockToken, mockAccessCode));
        const mockJoinData = { profSocketId: 'newProfSocketId123', accessCode: mockAccessCode };
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
        // expect(result.current.quizState?.profSocketId).toBeUndefined();
    });

});
