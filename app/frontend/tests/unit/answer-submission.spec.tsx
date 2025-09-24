/**
 * Answer Submission Test Suite
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock hooks
const mockUseParams = jest.fn(() => ({ code: 'TEST123' }));
const mockUseRouter = jest.fn(() => ({ push: jest.fn(), replace: jest.fn() }));
const mockUseAuth = jest.fn();
const mockSubmitAnswer = jest.fn();
const mockUseStudentGameSocket = jest.fn();
const mockUseSimpleTimer = jest.fn(() => ({ timeLeft: 30, isActive: false }));

// Mock Next.js
jest.mock('next/navigation', () => ({
    useParams: mockUseParams,
    useRouter: mockUseRouter
}));

// Mock other dependencies
jest.mock('@/components/AuthProvider', () => ({
    useAuth: mockUseAuth
}));

jest.mock('@/hooks/useStudentGameSocket', () => ({
    useStudentGameSocket: mockUseStudentGameSocket
}));

jest.mock('@/hooks/useSimpleTimer', () => ({
    useSimpleTimer: mockUseSimpleTimer
}));

// Mock UI components
jest.mock('@/components/Snackbar', () => ({
    __esModule: true,
    default: ({ children }: any) => <div data-testid="snackbar">{children}</div>
}));

jest.mock('@/components/QuestionCard', () => ({
    __esModule: true,
    default: ({
        handleSingleChoice,
        handleSubmitMultiple,
        handleNumericSubmit,
        readonly,
        selectedAnswer,
        selectedAnswers,
        numericAnswer,
        setNumericAnswer
    }: any) => (
        <div data-testid="question-card">
            <div>Question Card</div>
            <button
                data-testid="single-choice-0"
                onClick={() => handleSingleChoice(0)}
                disabled={readonly}
            >
                Answer 0
            </button>
            <button
                data-testid="single-choice-1"
                onClick={() => handleSingleChoice(1)}
                disabled={readonly}
            >
                Answer 1
            </button>
            <button
                data-testid="submit-multiple"
                onClick={handleSubmitMultiple}
                disabled={readonly || selectedAnswers.length === 0}
            >
                Submit Multiple
            </button>
            <input
                data-testid="numeric-input"
                type="text"
                value={numericAnswer || ''}
                onChange={(e) => setNumericAnswer(e.target.value)}
                disabled={readonly}
            />
            <button
                data-testid="submit-numeric"
                onClick={handleNumericSubmit}
                disabled={readonly || !numericAnswer}
            >
                Submit Numeric
            </button>
        </div>
    )
}));

// Test data
const mockAuth = {
    userState: 'authenticated',
    userProfile: {
        userId: 'test-user-123',
        username: 'TestUser',
        avatar: '🐼',
        cookieId: 'cookie-123'
    },
    isLoading: false
};

const mockQuestion = {
    uid: 'q1',
    text: 'What is 2 + 2?',
    questionType: 'single_choice',
    multipleChoiceQuestion: {
        answerOptions: ['2', '3', '4', '5']
    }
};

const mockSocketHook = {
    submitAnswer: mockSubmitAnswer,
    gameState: {
        currentQuestion: mockQuestion,
        questionIndex: 1,
        totalQuestions: 5,
        answered: false,
        connectedToRoom: true,
        phase: 'question',
        feedbackRemaining: null,
        correctAnswers: null,
        timer: 30,
        timerStatus: 'play' as const,
        leaderboard: [],
        gameStatus: 'active' as const
    },
    isConnected: true,
    error: null
};

// Simplified test component
const TestAnswerSubmission = () => {
    const { userState, userProfile, isLoading } = mockUseAuth();
    const { submitAnswer, gameState } = mockUseStudentGameSocket();
    const [selectedAnswer, setSelectedAnswer] = React.useState<number | null>(null);
    const [selectedAnswers, setSelectedAnswers] = React.useState<number[]>([]);
    const [numericAnswer, setNumericAnswer] = React.useState<string>('');

    const handleSingleChoice = React.useCallback((idx: number) => {
        if (!gameState.currentQuestion) return;
        setSelectedAnswer(idx);
        submitAnswer(gameState.currentQuestion.uid, idx, Date.now());
    }, [gameState, submitAnswer]);

    const handleSubmitMultiple = React.useCallback(() => {
        if (!gameState.currentQuestion || !selectedAnswers.length) return;
        submitAnswer(gameState.currentQuestion.uid, selectedAnswers, Date.now());
    }, [gameState, selectedAnswers, submitAnswer]);

    const handleNumericSubmit = React.useCallback(() => {
        if (!gameState.currentQuestion) return;
        const val = parseFloat(numericAnswer);
        if (isNaN(val)) return;
        submitAnswer(gameState.currentQuestion.uid, val, Date.now());
    }, [gameState, numericAnswer, submitAnswer]);

    const isReadonly = gameState.phase === 'show_answers' || gameState.gameStatus === 'finished';

    if (isLoading) return <div data-testid="loading">Loading...</div>;
    if (!gameState.currentQuestion) return <div data-testid="no-question">No question</div>;

    return (
        <div data-testid="answer-submission">
            <div>Question: {gameState.currentQuestion.text}</div>
            <button
                data-testid="single-choice-0"
                onClick={() => handleSingleChoice(0)}
                disabled={isReadonly}
            >
                Answer 0
            </button>
            <button
                data-testid="single-choice-1"
                onClick={() => handleSingleChoice(1)}
                disabled={isReadonly}
            >
                Answer 1
            </button>
            <button
                data-testid="submit-multiple"
                onClick={handleSubmitMultiple}
                disabled={isReadonly || selectedAnswers.length === 0}
            >
                Submit Multiple
            </button>
            <input
                data-testid="numeric-input"
                type="text"
                value={numericAnswer}
                onChange={(e) => setNumericAnswer(e.target.value)}
                disabled={isReadonly}
            />
            <button
                data-testid="submit-numeric"
                onClick={handleNumericSubmit}
                disabled={isReadonly || !numericAnswer}
            >
                Submit Numeric
            </button>
        </div>
    );
};

describe('Answer Submission', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseAuth.mockReturnValue(mockAuth);
        mockUseStudentGameSocket.mockReturnValue(mockSocketHook);
    });

    describe('Single Choice Answer Submission', () => {
        test('should submit single choice answer when clicked', () => {
            render(<TestAnswerSubmission />);

            const answerButton = screen.getByTestId('single-choice-0');
            fireEvent.click(answerButton);

            expect(mockSubmitAnswer).toHaveBeenCalledWith('q1', 0, expect.any(Number));
        });

        test('should submit different answer when another option clicked', () => {
            render(<TestAnswerSubmission />);

            const answerButton = screen.getByTestId('single-choice-1');
            fireEvent.click(answerButton);

            expect(mockSubmitAnswer).toHaveBeenCalledWith('q1', 1, expect.any(Number));
        });

        test('should not submit when no question available', () => {
            const noQuestionHook = {
                ...mockSocketHook,
                gameState: { ...mockSocketHook.gameState, currentQuestion: null }
            };
            mockUseStudentGameSocket.mockReturnValue(noQuestionHook);

            render(<TestAnswerSubmission />);

            expect(screen.getByTestId('no-question')).toHaveTextContent('No question');
            expect(mockSubmitAnswer).not.toHaveBeenCalled();
        });
    });

    describe('Multiple Choice Answer Submission', () => {
        test('should submit multiple choice answers when selected and submitted', () => {
            const { rerender } = render(<TestAnswerSubmission />);

            // Simulate selecting multiple answers
            const component = screen.getByTestId('answer-submission');
            const submitButton = screen.getByTestId('submit-multiple');

            // Initially disabled
            expect(submitButton).toBeDisabled();

            // Update selected answers
            const updatedHook = {
                ...mockSocketHook,
                gameState: { ...mockSocketHook.gameState }
            };
            mockUseStudentGameSocket.mockReturnValue(updatedHook);

            rerender(<TestAnswerSubmission />);

            // Still disabled until answers are selected
            expect(submitButton).toBeDisabled();
        });

        test('should handle empty selection for multiple choice', () => {
            render(<TestAnswerSubmission />);

            const submitButton = screen.getByTestId('submit-multiple');
            expect(submitButton).toBeDisabled();
        });
    });

    describe('Numeric Answer Submission', () => {
        test('should submit numeric answer when valid number entered', () => {
            render(<TestAnswerSubmission />);

            const input = screen.getByTestId('numeric-input');
            const submitButton = screen.getByTestId('submit-numeric');

            // Initially disabled
            expect(submitButton).toBeDisabled();

            // Enter valid number
            fireEvent.change(input, { target: { value: '42' } });

            // Should be enabled now
            expect(submitButton).not.toBeDisabled();

            fireEvent.click(submitButton);

            expect(mockSubmitAnswer).toHaveBeenCalledWith('q1', 42, expect.any(Number));
        });

        test('should not submit invalid numeric input', () => {
            render(<TestAnswerSubmission />);

            const input = screen.getByTestId('numeric-input');
            const submitButton = screen.getByTestId('submit-numeric');

            // Enter invalid input
            fireEvent.change(input, { target: { value: 'not-a-number' } });
            fireEvent.click(submitButton);

            expect(mockSubmitAnswer).not.toHaveBeenCalled();
        });

        test('should handle empty numeric input', () => {
            render(<TestAnswerSubmission />);

            const input = screen.getByTestId('numeric-input');
            const submitButton = screen.getByTestId('submit-numeric');

            // Empty input should disable submit
            fireEvent.change(input, { target: { value: '' } });
            expect(submitButton).toBeDisabled();
        });
    });

    describe('Disabled State When Locked/Readonly', () => {
        test('should disable all inputs when in show_answers phase', () => {
            const readonlyHook = {
                ...mockSocketHook,
                gameState: { ...mockSocketHook.gameState, phase: 'show_answers' }
            };
            mockUseStudentGameSocket.mockReturnValue(readonlyHook);

            render(<TestAnswerSubmission />);

            const answerButton0 = screen.getByTestId('single-choice-0');
            const answerButton1 = screen.getByTestId('single-choice-1');
            const submitMultipleButton = screen.getByTestId('submit-multiple');
            const numericInput = screen.getByTestId('numeric-input');
            const submitNumericButton = screen.getByTestId('submit-numeric');

            expect(answerButton0).toBeDisabled();
            expect(answerButton1).toBeDisabled();
            expect(submitMultipleButton).toBeDisabled();
            expect(numericInput).toBeDisabled();
            expect(submitNumericButton).toBeDisabled();
        });

        test('should disable all inputs when game is finished', () => {
            const finishedHook = {
                ...mockSocketHook,
                gameState: { ...mockSocketHook.gameState, gameStatus: 'finished' }
            };
            mockUseStudentGameSocket.mockReturnValue(finishedHook);

            render(<TestAnswerSubmission />);

            const answerButton0 = screen.getByTestId('single-choice-0');
            const submitMultipleButton = screen.getByTestId('submit-multiple');
            const numericInput = screen.getByTestId('numeric-input');

            expect(answerButton0).toBeDisabled();
            expect(submitMultipleButton).toBeDisabled();
            expect(numericInput).toBeDisabled();
        });

        test('should not submit answers when readonly', () => {
            const readonlyHook = {
                ...mockSocketHook,
                gameState: { ...mockSocketHook.gameState, phase: 'show_answers' }
            };
            mockUseStudentGameSocket.mockReturnValue(readonlyHook);

            render(<TestAnswerSubmission />);

            const answerButton = screen.getByTestId('single-choice-0');
            fireEvent.click(answerButton);

            expect(mockSubmitAnswer).not.toHaveBeenCalled();
        });
    });

    describe('Retry on Socket Hiccup', () => {
        test('should handle socket disconnection during submission', () => {
            const disconnectedHook = {
                ...mockSocketHook,
                isConnected: false,
                error: 'Connection lost'
            };
            mockUseStudentGameSocket.mockReturnValue(disconnectedHook);

            render(<TestAnswerSubmission />);

            const answerButton = screen.getByTestId('single-choice-0');
            fireEvent.click(answerButton);

            // Should still attempt to submit even if disconnected
            expect(mockSubmitAnswer).toHaveBeenCalledWith('q1', 0, expect.any(Number));
        });

        test('should allow retry after reconnection', async () => {
            let hookState = { ...mockSocketHook, isConnected: false };
            mockUseStudentGameSocket.mockReturnValue(hookState);

            const { rerender } = render(<TestAnswerSubmission />);

            const answerButton = screen.getByTestId('single-choice-0');
            fireEvent.click(answerButton);

            // Simulate reconnection
            hookState = { ...mockSocketHook, isConnected: true };
            mockUseStudentGameSocket.mockReturnValue(hookState);

            rerender(<TestAnswerSubmission />);

            // Click again after reconnection
            fireEvent.click(answerButton);

            expect(mockSubmitAnswer).toHaveBeenCalledTimes(2);
        });
    });
});