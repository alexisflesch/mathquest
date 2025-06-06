jest.mock('@/clientLogger', () => ({
    createLogger: jest.fn(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    })),
}));
jest.mock('../../useUnifiedGameManager', () => ({
    useProjectionGameManager: jest.fn(),
}));

import { renderHook, act } from '@testing-library/react';
import { useProjectionQuizSocket } from '../../migrations/useProjectionQuizSocketMigrated';
import { useProjectionGameManager } from '../../useUnifiedGameManager';
import { createLogger } from '@/clientLogger';
import type { TimerRole, TimerStatus } from '../../useGameTimer';
import type { Socket } from 'socket.io-client';

const mockedUseProjectionGameManager = jest.mocked(useProjectionGameManager);

const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

const createMockSocket = () => ({
    id: 'mockProjectionSocketId',
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    connected: true,
    toJSON: () => ({ id: 'mockProjectionSocketId', connected: true })
}) as unknown as Socket;

const createMockGameManager = (overrides = {}) => {
    const socketInstance = createMockSocket();
    const socketOn = jest.fn(() => () => { }); // always returns a cleanup function
    return {
        gameState: {
            gameId: 'quiz123',
            role: 'projection' as TimerRole,
            connected: true,
            connecting: false,
            error: null,
            timer: {
                timeLeft: 60,
                status: 'stopped' as TimerStatus,
                questionId: 'q1',
                duration: 60,
                timestamp: Date.now(),
                localTimeLeft: 60
            },
            isTimerRunning: false,
            currentQuestionId: 'q1',
            currentQuestionIndex: 0,
            totalQuestions: 10,
            gameStatus: 'waiting' as 'waiting',
            phase: 'question' as 'question',
            connectedCount: 1,
            answered: false,
            ...overrides
        },
        timer: {
            start: jest.fn(),
            pause: jest.fn(),
            resume: jest.fn(),
            stop: jest.fn(),
            reset: jest.fn(),
            setDuration: jest.fn(),
            formatTime: jest.fn(() => '1:00'),
            getDisplayTime: jest.fn(() => 60)
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
            getState: jest.fn()
        }
    };
};

describe('useProjectionQuizSocket (modern migration)', () => {
    const mockQuizId = 'quiz123';
    const mockToken = 'mock-projection-token';

    beforeEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
        (createLogger as jest.MockedFunction<typeof createLogger>).mockReturnValue(mockLogger);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should initialize with unified game manager', () => {
        mockedUseProjectionGameManager.mockReturnValue(createMockGameManager());
        renderHook(() => useProjectionQuizSocket(mockQuizId, mockToken));
        expect(mockedUseProjectionGameManager).toHaveBeenCalledWith(
            mockQuizId,
            expect.objectContaining({ timerConfig: expect.any(Object) })
        );
    });

    it('should return the expected interface structure', () => {
        mockedUseProjectionGameManager.mockReturnValue(createMockGameManager());
        const { result } = renderHook(() => useProjectionQuizSocket(mockQuizId, mockToken));
        expect(result.current).toEqual(
            expect.objectContaining({
                gameSocket: expect.any(Object),
                gameState: expect.any(Object),
                timerStatus: expect.any(String),
                timerQuestionId: expect.any(String),
                localTimeLeft: expect.any(Number),
                setLocalTimeLeft: expect.any(Function)
            })
        );
    });

    it('should provide gameState and timerStatus', () => {
        mockedUseProjectionGameManager.mockReturnValue(createMockGameManager());
        const { result } = renderHook(() => useProjectionQuizSocket(mockQuizId, mockToken));
        expect(result.current.gameState).toBeDefined();
        expect(result.current.timerStatus).toBeDefined();
    });
});
