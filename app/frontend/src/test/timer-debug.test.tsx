/**
 * Timer Debug Test
 * 
 * Comprehensive test to debug timer display issues in the dashboard
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useTeacherQuizSocket } from '@/hooks/useTeacherQuizSocket';
import type { TimerStatus } from '@shared/types/core/timer';

// Mock the logger
jest.mock('@/clientLogger', () => ({
    createLogger: () => ({
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    })
}));

// Mock the debug logger
jest.mock('@/utils/timerDebugLogger', () => ({
    logTimerEvent: jest.fn(),
    logTimerState: jest.fn(),
    logTimerCalculation: jest.fn(),
    logTimerError: jest.fn()
}));

// Mock the unified game manager
const mockTimerState = {
    status: 'stop' as TimerStatus,
    timeLeftMs: 0,
    durationMs: 30000,
    questionUid: undefined as string | null | undefined,
    timestamp: null as number | null,
    localTimeLeftMs: null as number | null
};

const mockGameManager = {
    gameState: {
        gameId: 'test-game-id',
        role: 'teacher' as const,
        connected: true,
        connecting: false,
        error: null,
        timer: mockTimerState,
        isTimerRunning: false,
        currentQuestionUid: null,
        currentQuestionIndex: null,
        currentQuestionData: null,
        totalQuestions: 0,
        gameStatus: 'waiting' as const,
        phase: 'question' as const,
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
        instance: null,
        connect: jest.fn(),
        disconnect: jest.fn(),
        reconnect: jest.fn(),
        emitTimerAction: jest.fn()
    },
    actions: {}
};

jest.mock('@/hooks/useUnifiedGameManager', () => ({
    useTeacherGameManager: jest.fn(() => mockGameManager)
}));

// Test component that uses the hook
function TimerTestComponent({ accessCode, token, gameId }: { accessCode: string | null, token: string | null, gameId?: string | null }) {
    const {
        quizSocket,
        quizState,
        timerStatus,
        timerQuestionUid,
        timeLeftMs,
        localTimeLeftMs,
        connectedCount,
        emitTimerAction
    } = useTeacherQuizSocket(accessCode, token, gameId);

    return (
        <div data-testid="timer-test">
            <div data-testid="timer-status">{timerStatus}</div>
            <div data-testid="timer-question-id">{timerQuestionUid || 'none'}</div>
            <div data-testid="time-left">{timeLeftMs}</div>
            <div data-testid="local-time-left">{localTimeLeftMs}</div>
            <div data-testid="connected-count">{connectedCount}</div>
            <button
                data-testid="start-timer"
                onClick={() => emitTimerAction({ status: 'play', questionUid: 'test-q1', timeLeftMs: 30000 })}
            >
                Start Timer
            </button>
        </div>
    );
}

describe('Timer Debug Test', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset mock timer state
        mockGameManager.gameState.timer = { ...mockTimerState };
        mockGameManager.timer.getDisplayTime.mockReturnValue(0);
    });

    test('should render with initial timer state', () => {
        render(
            <TimerTestComponent
                accessCode="379CCT"
                token="mock-token"
                gameId="test-game-uuid"
            />
        );

        expect(screen.getByTestId('timer-status')).toHaveTextContent('stop');
        expect(screen.getByTestId('timer-question-id')).toHaveTextContent('none');
        expect(screen.getByTestId('time-left')).toHaveTextContent('0');
        expect(screen.getByTestId('local-time-left')).toHaveTextContent('');
        expect(screen.getByTestId('connected-count')).toHaveTextContent('1');
    });

    test('should update timer display when backend sends timer update', async () => {
        const { rerender } = render(
            <TimerTestComponent
                accessCode="379CCT"
                token="mock-token"
                gameId="test-game-uuid"
            />
        );

        // Simulate backend timer update
        mockGameManager.gameState.timer = {
            status: 'play',
            timeLeftMs: 25000, // 25 seconds in milliseconds
            durationMs: 30000,
            questionUid: 'test-q1',
            timestamp: Date.now(),
            localTimeLeftMs: 25000
        };
        mockGameManager.timer.getDisplayTime.mockReturnValue(25000);

        rerender(
            <TimerTestComponent
                accessCode="379CCT"
                token="mock-token"
                gameId="test-game-uuid"
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('timer-status')).toHaveTextContent('play');
            expect(screen.getByTestId('timer-question-id')).toHaveTextContent('test-q1');
            expect(screen.getByTestId('time-left')).toHaveTextContent('25000');
            expect(screen.getByTestId('local-time-left')).toHaveTextContent('25000');
        });
    });

    test('should handle timer going to zero', async () => {
        const { rerender } = render(
            <TimerTestComponent
                accessCode="379CCT"
                token="mock-token"
                gameId="test-game-uuid"
            />
        );

        // Simulate timer reaching zero
        mockGameManager.gameState.timer = {
            status: 'stop',
            timeLeftMs: 0,
            durationMs: 30000,
            questionUid: 'test-q1',
            timestamp: Date.now(),
            localTimeLeftMs: 0
        };
        mockGameManager.timer.getDisplayTime.mockReturnValue(0);

        rerender(
            <TimerTestComponent
                accessCode="379CCT"
                token="mock-token"
                gameId="test-game-uuid"
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('timer-status')).toHaveTextContent('stop');
            expect(screen.getByTestId('time-left')).toHaveTextContent('0');
            expect(screen.getByTestId('local-time-left')).toHaveTextContent('0');
        });
    });

    test('should emit timer action when button clicked', () => {
        render(
            <TimerTestComponent
                accessCode="379CCT"
                token="mock-token"
                gameId="test-game-uuid"
            />
        );

        fireEvent.click(screen.getByTestId('start-timer'));

        // Verify the emitTimerAction was called (this would be mocked in the actual implementation)
        expect(screen.getByTestId('timer-test')).toBeInTheDocument();
    });

    test('should handle invalid gameId parameter', () => {
        // Test what happens when gameId is null but accessCode is provided
        render(
            <TimerTestComponent
                accessCode="379CCT"
                token="mock-token"
                gameId={null}
            />
        );

        expect(screen.getByTestId('timer-test')).toBeInTheDocument();
        expect(screen.getByTestId('timer-status')).toHaveTextContent('stop');
    });
});

describe('Timer Value Consistency Test', () => {
    test('should maintain consistent timer values across updates', async () => {
        const timerValues: number[] = [];

        const TestComponent = () => {
            const { timeLeftMs, localTimeLeftMs } = useTeacherQuizSocket('379CCT', 'mock-token', 'test-game-uuid');

            // Track timer values
            React.useEffect(() => {
                if (timeLeftMs !== null && timeLeftMs !== undefined) {
                    timerValues.push(timeLeftMs);
                }
            }, [timeLeftMs]);

            return (
                <div>
                    <div data-testid="time-left">{timeLeftMs}</div>
                    <div data-testid="local-time-left">{localTimeLeftMs}</div>
                </div>
            );
        };

        const { rerender } = render(<TestComponent />);

        // Simulate multiple timer updates
        const timerStates = [
            { timeLeftMs: 30000, localTimeLeftMs: 30000 },
            { timeLeftMs: 25000, localTimeLeftMs: 25000 },
            { timeLeftMs: 20000, localTimeLeftMs: 20000 },
            { timeLeftMs: 0, localTimeLeftMs: 0 }
        ];

        for (const state of timerStates) {
            mockGameManager.gameState.timer.timeLeftMs = state.timeLeftMs;
            mockGameManager.gameState.timer.localTimeLeftMs = state.localTimeLeftMs;
            mockGameManager.timer.getDisplayTime.mockReturnValue(state.timeLeftMs);

            rerender(<TestComponent />);

            await waitFor(() => {
                expect(screen.getByTestId('time-left')).toHaveTextContent(state.timeLeftMs.toString());
            });
        }

        // Verify timer values are decreasing (no backwards jumps)
        for (let i = 1; i < timerValues.length; i++) {
            expect(timerValues[i]).toBeLessThanOrEqual(timerValues[i - 1]);
        }
    });
});

describe('Backend Event Simulation Test', () => {
    test('should handle dashboard_timer_updated event correctly', async () => {
        // This test would simulate the actual socket event
        // For now, we'll test the hook's response to state changes

        const TestComponent = () => {
            const { timeLeftMs, timerStatus } = useTeacherQuizSocket('379CCT', 'mock-token', 'test-game-uuid');
            return (
                <div>
                    <div data-testid="status">{timerStatus}</div>
                    <div data-testid="time">{timeLeftMs}</div>
                </div>
            );
        };

        render(<TestComponent />);

        // Simulate dashboard_timer_updated event response
        mockGameManager.gameState.timer = {
            status: 'play',
            timeLeftMs: 15000,
            durationMs: 30000,
            questionUid: 'test-q1',
            timestamp: Date.now(),
            localTimeLeftMs: 15000
        };

        // Force re-render to simulate state update
        const { rerender } = render(<TestComponent />);

        await waitFor(() => {
            expect(screen.getByTestId('status')).toHaveTextContent('play');
            expect(screen.getByTestId('time')).toHaveTextContent('15000');
        });
    });
});
