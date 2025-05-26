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
import { useTeacherQuizSocket, QuizState as HookQuizState } from '../useTeacherQuizSocket'; // Import QuizState from hook
import { BaseQuestion } from '@shared/types/question';
import { Chrono } from '@shared/types/quiz/state';


// --- Define Question locally if needed for mock QuizState ---
interface Question extends BaseQuestion { }

// Re-define QuizState if specific structure is needed for tests, or use imported HookQuizState
// For this file, we'll use the imported HookQuizState to ensure alignment.
// interface QuizState extends HookQuizState {} // Alias for clarity if preferred


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
        jest.runOnlyPendingTimers();
        jest.useRealTimers(); // Restore real timers
        window.localStorage.clear();
    });

    // Note: The hook's timer logic is heavily reliant on `quiz_timer_update` from the server.
    // Local timer decrement logic might be minimal or non-existent if the server is the source of truth.
    // These tests will focus on how the hook's timer state reacts to these events.

    it('should update timer states (timeLeft, timerStatus, timerQuestionId) based on "quiz_timer_update" events', () => {
        const { result, rerender } = renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));

        // 1. Simulate connection
        act(() => {
            mockSocket.connected = true;
            const connectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
            if (connectCallback) connectCallback(); // This should trigger get_game_state
        });

        // 2. Simulate receiving initial game_control_state to populate questions and questionTimers
        const initialQuestions: Question[] = [
            { uid: 'q1', text: 'Q1', type: 'multiple_choice', answers: [], time: 60 },
            { uid: 'q2', text: 'Q2', type: 'multiple_choice', answers: [], time: 45 },
        ];
        const initialGameState: HookQuizState = {
            currentQuestionIdx: 0,
            questions: initialQuestions,
            chrono: { timeLeft: 60, running: false },
            locked: false,
            ended: false,
            stats: {},
            timerStatus: 'stop',
            timerQuestionId: 'q1',
            timerTimeLeft: 60,
            timerTimestamp: Date.now() - 10000,
        };

        act(() => {
            const gameControlCallback = mockSocket.on.mock.calls.find(call => call[0] === 'game_control_state')?.[1];
            if (gameControlCallback) gameControlCallback(initialGameState);
        });

        // At this point, questionTimers should be initialized in the hook
        // For q1, it should have: { status: 'stop', timeLeft: 60, initialTime: 60, timestamp: null }
        // And timerQuestionId should be 'q1', timeLeft should be 60

        expect(result.current.timerQuestionId).toBe('q1');
        expect(result.current.timeLeft).toBe(60); // Initial timeLeft from game_control_state
        expect(result.current.timerStatus).toBe('stop');

        // 3. Now, simulate quiz_timer_update for q1
        const timerUpdate1 = { questionId: 'q1', timeLeft: 20, status: 'play' as 'play' | 'pause' | 'stop', timestamp: Date.now() };
        act(() => {
            const timerUpdateCallback = mockSocket.on.mock.calls.find(call => call[0] === 'quiz_timer_update')?.[1];
            if (timerUpdateCallback) timerUpdateCallback(timerUpdate1);
        });

        // After quiz_timer_update for q1:
        // - timerQuestionId should remain 'q1' (or be set to 'q1' if it wasn't already)
        // - timerStatus should become 'play'
        // - timeLeft (the global display one) should become 20
        // - questionTimers['q1'] should be updated to { status: 'play', timeLeft: 20, ... }
        expect(result.current.timerQuestionId).toBe('q1');
        expect(result.current.timerStatus).toBe('play');
        expect(result.current.timeLeft).toBe(20); // This was failing

        // 4. Simulate another quiz_timer_update for q1 (e.g., pause)
        const timerUpdate2 = { questionId: 'q1', timeLeft: 10, status: 'pause' as 'play' | 'pause' | 'stop', timestamp: Date.now() };
        act(() => {
            const timerUpdateCallback = mockSocket.on.mock.calls.find(call => call[0] === 'quiz_timer_update')?.[1];
            if (timerUpdateCallback) timerUpdateCallback(timerUpdate2);
        });
        expect(result.current.timerQuestionId).toBe('q1');
        expect(result.current.timerStatus).toBe('pause');
        expect(result.current.timeLeft).toBe(10);

        // 5. Simulate quiz_timer_update for a different question, q2
        const timerUpdate3 = { questionId: 'q2', timeLeft: 30, status: 'play' as 'play' | 'pause' | 'stop', timestamp: Date.now() };
        act(() => {
            const timerUpdateCallback = mockSocket.on.mock.calls.find(call => call[0] === 'quiz_timer_update')?.[1];
            if (timerUpdateCallback) timerUpdateCallback(timerUpdate3);
        });
        expect(result.current.timerQuestionId).toBe('q2');
        expect(result.current.timerStatus).toBe('play');
        expect(result.current.timeLeft).toBe(30);
    });

    it('should initialize timer-related states from an initial game_control_state', () => {
        const { result } = renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));

        // Simulate connection for event listeners to be active
        act(() => {
            mockSocket.connected = true;
            const connectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
            if (connectCallback) connectCallback();
        });

        // Corrected QuizState structure based on the hook's definition
        const initialQuizStateWithTimer: HookQuizState = {
            // quizId is not part of the HookQuizState interface directly
            currentQuestionIdx: 0,
            questions: [{ uid: 'q1', text: 'Test', type: 'multiple_choice', answers: [], time: 25 }] as Question[],
            chrono: { timeLeft: 25, running: true },
            locked: false,
            ended: false,
            stats: {},
            // These are the timer properties directly on QuizState from the hook
            timerTimeLeft: 25,
            timerStatus: 'play',
            timerQuestionId: 'q1',
            timerTimestamp: Date.now() - 5000, // 5 seconds ago
            questionStates: { 'q1': true } // Example, can be empty or undefined
        };

        act(() => {
            const callback = mockSocket.on.mock.calls.find(call => call[0] === 'game_control_state')?.[1];
            if (callback) callback(initialQuizStateWithTimer);
        });

        expect(result.current.timeLeft).toBe(initialQuizStateWithTimer.timerTimeLeft);
        expect(result.current.timerStatus).toBe(initialQuizStateWithTimer.timerStatus);
        expect(result.current.timerQuestionId).toBe(initialQuizStateWithTimer.timerQuestionId);
    });

});
