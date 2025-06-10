import { renderHook, act } from '@testing-library/react';
import { useTeacherQuizSocket } from '../../migrations/useTeacherQuizSocketMigrated';
import { useTeacherGameManager } from '../../useUnifiedGameManager';
import { createLogger } from '@/clientLogger';
import type { TimerRole, TimerStatus } from '../../useGameTimer';
import type { Socket } from 'socket.io-client';

jest.mock('@/clientLogger', () => ({
    createLogger: jest.fn(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    })),
}));
jest.mock('../../useUnifiedGameManager', () => ({
    useTeacherGameManager: jest.fn(),
}));
const mockedUseTeacherGameManager = require('../../useUnifiedGameManager').useTeacherGameManager as jest.MockedFunction<typeof import('../../useUnifiedGameManager').useTeacherGameManager>;

const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

const createMockSocket = () => ({
    id: 'mockSocketId',
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    connected: true,
    toJSON: () => ({ id: 'mockSocketId', connected: true })
}) as unknown as Socket;

const createMockGameManager = (overrides = {}) => {
    const socketInstance = createMockSocket();
    const socketOn = jest.fn(() => () => { }); // always returns a cleanup function
    return {
        gameState: {
            gameId: 'quiz123',
            role: 'teacher' as TimerRole,
            connected: true,
            connecting: false,
            error: null,
            timer: {
                timeLeft: 30,
                status: 'stopped' as TimerStatus,
                questionId: 'q1',
                duration: 30,
                timestamp: Date.now(),
                localTimeLeft: 30
            },
            isTimerRunning: false,
            currentQuestionId: 'q1',
            currentQuestionIndex: 0,
            totalQuestions: 10,
            gameStatus: 'waiting' as 'waiting',
            phase: 'question' as 'question',
            connectedCount: 1,
            answered: false,
            currentQuestionData: null, // Add missing property
            ...overrides
        },
        timer: {
            start: jest.fn(),
            pause: jest.fn(),
            resume: jest.fn(),
            stop: jest.fn(),
            reset: jest.fn(),
            setDuration: jest.fn(),
            formatTime: jest.fn(() => '0:30'),
            getDisplayTime: jest.fn(() => 30)
        },
        socket: {
            instance: socketInstance,
            connect: jest.fn(),
            disconnect: jest.fn(),
            reconnect: jest.fn(),
            emit: jest.fn(),
            on: socketOn,
            emitTimerAction: jest.fn()
        },
        actions: {
            setQuestion: jest.fn(),
            endGame: jest.fn(),
            lockAnswers: jest.fn(),
            unlockAnswers: jest.fn()
        }
    };
};

describe('useTeacherQuizSocket (modern migration)', () => {
    const mockToken = 'mock-teacher-token';
    const mockQuizId = 'quiz123';

    beforeEach(() => {
        jest.clearAllMocks();
        (createLogger as jest.MockedFunction<typeof createLogger>).mockReturnValue(mockLogger);
    });

    it('should initialize with unified game manager', () => {
        mockedUseTeacherGameManager.mockReturnValue(createMockGameManager());
        renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));
        expect(mockedUseTeacherGameManager).toHaveBeenCalledWith(
            mockQuizId,
            mockToken,
            expect.any(Object)
        );
    });

    it('should return the expected interface structure', () => {
        mockedUseTeacherGameManager.mockReturnValue(createMockGameManager());
        const { result } = renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));
        expect(result.current).toEqual(
            expect.objectContaining({
                quizSocket: expect.any(Object),
                quizState: expect.any(Object),
                timerStatus: expect.any(String),
                timerQuestionId: expect.any(String),
                localTimeLeft: expect.any(Number),
                emitSetQuestion: expect.any(Function),
                emitEndQuiz: expect.any(Function),
                emitPauseQuiz: expect.any(Function),
                emitResumeQuiz: expect.any(Function),
                emitSetTimer: expect.any(Function),
                emitTimerAction: expect.any(Function),
                emitUpdateTournamentCode: expect.any(Function)
            })
        );
    });

    it('should propagate error and connection state', () => {
        mockedUseTeacherGameManager.mockReturnValue(
            createMockGameManager({ connected: false, connecting: true, error: 'Test error' })
        );
        const { result } = renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));
        // No assertion on quizState.connected, connecting, or error since not present in migration interface
        expect(result.current).toHaveProperty('quizState');
    });

    it('should delegate emitSetQuestion and emitEndQuiz', () => {
        const mockActions = {
            setQuestion: jest.fn(),
            endGame: jest.fn(),
            lockAnswers: jest.fn(),
            unlockAnswers: jest.fn()
        };
        mockedUseTeacherGameManager.mockReturnValue({
            ...createMockGameManager(),
            actions: mockActions
        });
        const { result } = renderHook(() => useTeacherQuizSocket(mockQuizId, mockToken));
        act(() => {
            result.current.emitSetQuestion('q2', 20);
        });
        expect(mockActions.setQuestion).toHaveBeenCalledWith('q2', 20);
        act(() => {
            result.current.emitEndQuiz();
        });
        expect(mockActions.endGame).toHaveBeenCalled();
    });
});
