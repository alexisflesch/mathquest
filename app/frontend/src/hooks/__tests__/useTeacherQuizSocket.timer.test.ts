// --- Mock logger ---
jest.mock('@/clientLogger', () => ({
    createLogger: jest.fn(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    })),
}));

// --- Mock unified game manager ---
jest.mock('../useUnifiedGameManager', () => ({
    useTeacherGameManager: jest.fn()
}));

// --- Actual imports ---
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTeacherQuizSocket, QuizState as HookQuizState } from '../useTeacherQuizSocket'; // Import QuizState from hook
import { QuestionData } from '@shared/types/socketEvents';
import { QUESTION_TYPES } from '@shared/types';
import { useTeacherGameManager } from '../useUnifiedGameManager';


// --- Mocks ---
let mockGameManager = {
    gameState: {
        gameId: '',
        role: 'teacher',
        connected: true,
        connecting: false,
        error: null,
        timer: {
            status: 'stop' as 'play' | 'pause' | 'stop',
            timeLeftMs: 0,
            durationMs: 30000,
            questionUid: null as string | null,
            timestamp: null as number | null,
            localTimeLeftMs: null as number | null
        },
        isTimerRunning: false,
        currentQuestionUid: null,
        currentQuestionIndex: null,
        currentQuestionData: null,
        totalQuestions: 0,
        gameStatus: 'waiting',
        phase: 'question',
        connectedCount: 1,
        answered: false
    },
    timer: {
        start: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn(),
        stop: jest.fn(),
        reset: jest.fn(),
        setDuration: jest.fn(),
        formatTime: jest.fn(),
        getDisplayTime: jest.fn(() => 0)
    },
    socket: {
        instance: {
            id: 'mock-socket-id',
            connected: true,
            on: jest.fn(),
            off: jest.fn(),
            emit: jest.fn(),
            disconnect: jest.fn(),
            connect: jest.fn(),
            removeAllListeners: jest.fn(),
        },
        connect: jest.fn(),
        disconnect: jest.fn(),
        reconnect: jest.fn(),
        emitTimerAction: jest.fn()
    },
    actions: {
        setQuestion: jest.fn(),
        endGame: jest.fn(),
        lockAnswers: jest.fn(),
        unlockAnswers: jest.fn()
    }
};

// --- Test Suite ---
describe('useTeacherQuizSocket Timer Functionality', () => {
    const mockToken = 'mock-teacher-token';
    const mockQuizId = 'quiz123';

    beforeEach(() => {
        jest.clearAllMocks();

        // Reset the mock game manager for each test
        mockGameManager = {
            gameState: {
                gameId: '',
                role: 'teacher',
                connected: true,
                connecting: false,
                error: null,
                timer: {
                    status: 'stop' as 'play' | 'pause' | 'stop',
                    timeLeftMs: 0,
                    durationMs: 30000,
                    questionUid: null as string | null,
                    timestamp: null as number | null,
                    localTimeLeftMs: null as number | null
                },
                isTimerRunning: false,
                currentQuestionUid: null,
                currentQuestionIndex: null,
                currentQuestionData: null,
                totalQuestions: 0,
                gameStatus: 'waiting',
                phase: 'question',
                connectedCount: 1,
                answered: false
            },
            timer: {
                start: jest.fn(),
                pause: jest.fn(),
                resume: jest.fn(),
                stop: jest.fn(),
                reset: jest.fn(),
                setDuration: jest.fn(),
                formatTime: jest.fn(),
                getDisplayTime: jest.fn(() => 0)
            },
            socket: {
                instance: {
                    id: 'mock-socket-id',
                    connected: true,
                    on: jest.fn(),
                    off: jest.fn(),
                    emit: jest.fn(),
                    disconnect: jest.fn(),
                    connect: jest.fn(),
                    removeAllListeners: jest.fn(),
                },
                connect: jest.fn(),
                disconnect: jest.fn(),
                reconnect: jest.fn(),
                emitTimerAction: jest.fn()
            },
            actions: {
                setQuestion: jest.fn(),
                endGame: jest.fn(),
                lockAnswers: jest.fn(),
                unlockAnswers: jest.fn()
            }
        };

        // Mock the game manager to return our mock
        (useTeacherGameManager as jest.Mock).mockReturnValue(mockGameManager);

        // Set up local storage
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

    it('should update timer states (timeLeftMs, timerStatus, timerQuestionUid) based on timer updates', async () => {
        const { result, rerender } = renderHook(() => useTeacherQuizSocket(null, mockToken, mockQuizId));

        // Initial state should be default
        expect(result.current.timeLeftMs).toBe(0);
        expect(result.current.timerStatus).toBe('stop');

        // Simulate timer state update by updating the mock and causing a re-render
        mockGameManager.gameState.timer.timeLeftMs = 20000;
        mockGameManager.gameState.timer.status = 'play';
        mockGameManager.gameState.timer.questionUid = 'q1';
        mockGameManager.gameState.gameId = 'test-game-id'; // Ensure gameId is set to trigger useEffect
        mockGameManager.timer.getDisplayTime.mockReturnValue(20000);

        // Re-render to trigger the useEffect that syncs the state
        rerender();

        // Wait for the hook to reflect the updated state
        await waitFor(() => {
            expect(result.current.timeLeftMs).toBe(20000);
            expect(result.current.timerStatus).toBe('play');
            expect(result.current.timerQuestionUid).toBe('q1');
        });

        // Test pause scenario
        mockGameManager.gameState.timer.timeLeftMs = 10000;
        mockGameManager.gameState.timer.status = 'pause';
        mockGameManager.timer.getDisplayTime.mockReturnValue(10000);
        rerender();

        await waitFor(() => {
            expect(result.current.timeLeftMs).toBe(10000);
            expect(result.current.timerStatus).toBe('pause');
            expect(result.current.timerQuestionUid).toBe('q1');
        });

        // Test different question
        mockGameManager.gameState.timer.timeLeftMs = 30000;
        mockGameManager.gameState.timer.status = 'play';
        mockGameManager.gameState.timer.questionUid = 'q2';
        mockGameManager.timer.getDisplayTime.mockReturnValue(30000);
        rerender();

        await waitFor(() => {
            expect(result.current.timeLeftMs).toBe(30000);
            expect(result.current.timerStatus).toBe('play');
            expect(result.current.timerQuestionUid).toBe('q2');
        });
    });

    it('should initialize timer-related states from the game manager', () => {
        // Set initial timer state in mock
        mockGameManager.gameState.gameId = 'test-game-id'; // Ensure gameId is set
        mockGameManager.gameState.timer.timeLeftMs = 25000;
        mockGameManager.gameState.timer.status = 'play';
        mockGameManager.gameState.timer.questionUid = 'q1';
        mockGameManager.timer.getDisplayTime.mockReturnValue(25000);

        const { result } = renderHook(() => useTeacherQuizSocket(null, mockToken, mockQuizId));

        expect(result.current.timeLeftMs).toBe(25000);
        expect(result.current.timerStatus).toBe('play');
        expect(result.current.timerQuestionUid).toBe('q1');
    });
});
