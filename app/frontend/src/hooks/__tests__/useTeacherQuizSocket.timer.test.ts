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
import { renderHook, act, waitFor } from '@testing-library/react';
import { io } from 'socket.io-client';
import { useTeacherQuizSocket, QuizState as HookQuizState } from '../useTeacherQuizSocket'; // Import QuizState from hook
import { QuestionData } from '@shared/types/socketEvents';


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
describe('useTeacherQuizSocket Timer Functionality', () => {
    const mockToken = 'mock-teacher-token';
    const mockQuizId = 'quiz123';

    beforeEach(() => {
        jest.useFakeTimers(); // Use fake timers for timer tests
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
        jest.runOnlyPendingTimers();
        jest.useRealTimers(); // Restore real timers
        window.localStorage.clear();
    });

    // Note: The hook's timer logic is heavily reliant on `quiz_timer_update` from the server.
    // Local timer decrement logic might be minimal or non-existent if the server is the source of truth.
    // These tests will focus on how the hook's timer state reacts to these events.

    it('should update timer states (timeLeft, timerStatus, timerQuestionId) based on "quiz_timer_update" events', async () => {
        jest.useRealTimers(); // Use real timers for this test only
        const { result, rerender } = renderHook(() => useTeacherQuizSocket(null, mockToken, mockQuizId));

        // 1. Simulate connection
        act(() => {
            mockSocket.connected = true;
            const connectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
            if (connectCallback) connectCallback(); // This should trigger get_game_state
        });

        // 2. Simulate receiving initial game_control_state to populate questions and questionTimers
        const initialQuestions: QuestionData[] = [
            { uid: 'q1', text: 'Q1', questionType: 'multiple_choice', answerOptions: [], correctAnswers: [], timeLimit: 60000 }, // ms
            { uid: 'q2', text: 'Q2', questionType: 'multiple_choice', answerOptions: [], correctAnswers: [], timeLimit: 45000 }, // ms
        ];
        const initialGameState: HookQuizState = {
            currentQuestionIdx: 0,
            questions: initialQuestions,
            chrono: { timeLeft: 60000, running: false }, // ms
            locked: false,
            ended: false,
            stats: {},
            timerStatus: 'stop',
            timerQuestionId: 'q1',
            timerTimeLeft: 60000, // ms
            timerTimestamp: Date.now() - 10000,
        };

        act(() => {
            const gameControlCallback = mockSocket.on.mock.calls.find(call => call[0] === 'game_control_state')?.[1];
            if (gameControlCallback) gameControlCallback(initialGameState);
        });

        expect(result.current.timerQuestionId).toBe('q1');
        expect(result.current.timeLeft).toBe(60000); // Initial timeLeft from game_control_state (ms)
        expect(result.current.timerStatus).toBe('stop');

        // 3. Now, simulate quiz_timer_update for q1
        const timerUpdate1 = { questionId: 'q1', timeLeft: 20000, status: 'play' as 'play' | 'pause' | 'stop', running: true, timestamp: Date.now() };
        act(() => {
            const timerUpdateCallback = mockSocket.on.mock.calls.find(call => call[0] === 'quiz_timer_update')?.[1];
            if (timerUpdateCallback) timerUpdateCallback(timerUpdate1);
        });

        // Wait for timer state to update, with longer timeout and debug log
        await waitFor(() => {
            if (result.current.timerStatus !== 'play' || result.current.timeLeft !== 20000) {
                // eslint-disable-next-line no-console
                console.log('DEBUG TIMER STATE:', result.current);
            }
            expect(result.current.timerQuestionId).toBe('q1');
            expect(result.current.timerStatus).toBe('play');
            expect(result.current.timeLeft).toBe(20000);
        }, { timeout: 2000 });

        // 4. Simulate another quiz_timer_update for q1 (e.g., pause)
        const timerUpdate2 = { questionId: 'q1', timeLeft: 10000, status: 'pause' as 'play' | 'pause' | 'stop', running: false, timestamp: Date.now() };
        act(() => {
            const timerUpdateCallback = mockSocket.on.mock.calls.find(call => call[0] === 'quiz_timer_update')?.[1];
            if (timerUpdateCallback) timerUpdateCallback(timerUpdate2);
        });
        expect(result.current.timerQuestionId).toBe('q1');
        expect(result.current.timerStatus).toBe('pause');
        expect(result.current.timeLeft).toBe(10000);

        // 5. Simulate quiz_timer_update for a different question, q2
        const timerUpdate3 = { questionId: 'q2', timeLeft: 30000, status: 'play' as 'play' | 'pause' | 'stop', running: true, timestamp: Date.now() };
        act(() => {
            const timerUpdateCallback = mockSocket.on.mock.calls.find(call => call[0] === 'quiz_timer_update')?.[1];
            if (timerUpdateCallback) timerUpdateCallback(timerUpdate3);
        });
        expect(result.current.timerQuestionId).toBe('q2');
        expect(result.current.timerStatus).toBe('play');
        expect(result.current.timeLeft).toBe(30000);
    });

    it('should initialize timer-related states from an initial game_control_state', () => {
        const { result } = renderHook(() => useTeacherQuizSocket(null, mockToken, mockQuizId));

        // Simulate connection for event listeners to be active
        act(() => {
            mockSocket.connected = true;
            const connectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
            if (connectCallback) connectCallback();
        });

        // Corrected QuizState structure based on the hook's definition
        const initialQuizStateWithTimer: HookQuizState = {
            currentQuestionIdx: 0,
            questions: [{ uid: 'q1', text: 'Test', questionType: 'multiple_choice', answerOptions: [], correctAnswers: [], timeLimit: 25000 }], // ms
            chrono: { timeLeft: 25000, running: true }, // ms
            locked: false,
            ended: false,
            stats: {},
            timerTimeLeft: 25000, // ms
            timerStatus: 'play',
            timerQuestionId: 'q1',
            timerTimestamp: Date.now() - 5000,
            questionStates: { 'q1': true }
        };

        act(() => {
            const callback = mockSocket.on.mock.calls.find(call => call[0] === 'game_control_state')?.[1];
            if (callback) callback(initialQuizStateWithTimer);
        });

        expect(result.current.timeLeft).toBe(25000); // ms
        expect(result.current.timerStatus).toBe(initialQuizStateWithTimer.timerStatus);
        expect(result.current.timerQuestionId).toBe(initialQuizStateWithTimer.timerQuestionId);
    });

});
