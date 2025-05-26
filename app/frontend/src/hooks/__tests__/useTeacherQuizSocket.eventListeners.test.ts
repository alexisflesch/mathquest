// filepath: /home/aflesch/mathquest/app/frontend/src/hooks/__tests__/useTeacherQuizSocket.eventListeners.test.ts
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
    createLogger: jest.fn(() => mockLoggerInstance),
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

// --- Define QuizState and Question locally (mirroring hook's definition if needed for mock data) ---
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
        mockLoggerInstance.debug.mockClear();
        mockLoggerInstance.info.mockClear();
        mockLoggerInstance.warn.mockClear();
        mockLoggerInstance.error.mockClear();
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

    it('should call handler and log when "game_control_state" event is received', () => {
        renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));
        const mockState: QuizState = {
            quizId: mockQuizId,
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

        expect(mockLoggerInstance.debug).toHaveBeenCalledWith(
            'Processing game_control_state',
            mockState
        );
    });

    it('should call handler and log when "quiz_timer_update" event is received', () => {
        renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));
        const mockTimerData = { questionId: 'q1', timeLeft: 15, status: 'play' };

        act(() => {
            const callback = mockSocket.on.mock.calls.find(call => call[0] === 'quiz_timer_update')?.[1];
            if (callback) callback(mockTimerData);
        });

        // Based on the hook's logging for quiz_timer_update
        expect(mockLoggerInstance.debug).toHaveBeenCalledWith( // Or .info, check hook
            'Received quiz_timer_update',
            mockTimerData
        );
    });

    it('should call handler and log when "quiz_connected_count" event is received', () => {
        renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));
        const mockCountData = { count: 5 };

        act(() => {
            // The event name in the hook is "quiz_connected_count"
            const callback = mockSocket.on.mock.calls.find(call => call[0] === 'quiz_connected_count')?.[1];
            if (callback) callback(mockCountData);
        });

        // Log in the hook: logger.debug('Received quiz_connected_count', data);
        expect(mockLoggerInstance.debug).toHaveBeenCalledWith(
            'Received quiz_connected_count',
            mockCountData
        );
    });

    it('should call handler and log when "dashboard_joined" event is received', () => {
        renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));
        // The hook expects { room, socketId } but the test used { profSocketId, quizId }
        const mockJoinData = { room: `dashboard_${mockQuizId}`, socketId: 'prof123_socket_id' };

        act(() => {
            const connectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
            if (connectCallback) {
                mockSocket.connected = true;
                connectCallback();
            }

            const dashboardJoinedCallback = mockSocket.on.mock.calls.find(call => call[0] === 'dashboard_joined')?.[1];
            if (dashboardJoinedCallback) dashboardJoinedCallback(mockJoinData);
        });

        // Log in the hook: logger.debug("Server confirms dashboard join", { room, socketId });
        expect(mockLoggerInstance.debug).toHaveBeenCalledWith(
            "Server confirms dashboard join",
            mockJoinData
        );
    });

});
