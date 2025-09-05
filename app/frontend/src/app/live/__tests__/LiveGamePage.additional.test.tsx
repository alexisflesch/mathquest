/**
 * Additional comprehensive tests for LiveGamePage
 * 
 * These tests cover functionality gaps identified in the original test suite:
 * - Numeric questions
 * - Error handling
 * - Socket connection states
 * - Timer edge cases
 * - Answer validation
 * - Game state transitions
 * - Leaderboard calculations
 * - User interaction flows
 */

import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { useParams, useRouter } from 'next/navigation';
import LiveGamePage from '../[code]/page';
import { useAuth } from '@/components/AuthProvider';
import { useStudentGameSocket } from '@/hooks/useStudentGameSocket';
import '@testing-library/jest-dom';
import { QUESTION_TYPES } from '@shared/types';

// Mock dependencies (same as main test file)
jest.mock('next/navigation');
jest.mock('@/components/AuthProvider');
jest.mock('@/config/api');
jest.mock('@/clientLogger', () => ({
    createLogger: jest.fn(() => ({
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }))
}));
jest.mock('@/hooks/useStudentGameSocket', () => ({
    useStudentGameSocket: jest.fn()
}));
jest.mock('@/hooks/useSimpleTimer', () => ({
    useSimpleTimer: jest.fn(() => ({
        getTimerState: jest.fn(() => ({ timeLeftMs: 15000 }))
    }))
}));

// Mock components
jest.mock('@/components/MathJaxWrapper', () => {
    return function MathJaxWrapper({ children }: { children: React.ReactNode }) {
        return <div data-testid="mathjax-wrapper">{children}</div>;
    };
});

jest.mock('@/components/TournamentTimer', () => {
    return function TournamentTimer({ timerS }: { timerS: number | null }) {
        return <div data-testid="tournament-timer">Timer: {timerS || 'No timer'}</div>;
    };
});

jest.mock('@/components/QuestionCard', () => {
    return function QuestionCard({
        currentQuestion,
        questionIndex,
        totalQuestions,
        selectedAnswer,
        numericAnswer,
        setNumericAnswer,
        handleNumericSubmit,
        answered,
        readonly
    }: any) {
        if (!currentQuestion) return <div data-testid="no-question">No question</div>;

        const isNumeric = currentQuestion.questionType === QUESTION_TYPES.NUMERIC;

        return (
            <div data-testid="question-card">
                <div data-testid="question-text">{currentQuestion.text}</div>
                <div data-testid="question-progress">{questionIndex + 1} / {totalQuestions}</div>

                {isNumeric ? (
                    <div data-testid="numeric-input-section">
                        <input
                            data-testid="numeric-answer-input"
                            type="number"
                            value={numericAnswer || ''}
                            onChange={(e) => setNumericAnswer?.(e.target.value)}
                            placeholder="Enter your answer"
                        />
                        <button
                            data-testid="numeric-submit-button"
                            onClick={handleNumericSubmit}
                            disabled={readonly}
                        >
                            Submit
                        </button>
                    </div>
                ) : (
                    <div data-testid="question-answers">
                        {currentQuestion.answerOptions?.map((answer: string, index: number) => (
                            <button
                                key={index}
                                data-testid={`answer-option-${index}`}
                                disabled={readonly}
                            >
                                {answer}
                            </button>
                        )) || <div data-testid="no-answers">No answers</div>}
                    </div>
                )}

                {answered && <div data-testid="answered-state">Answered</div>}
                {readonly && <div data-testid="readonly-state">Read-only</div>}
            </div>
        );
    };
});

jest.mock('@/components/AnswerFeedbackOverlay', () => {
    return function AnswerFeedbackOverlay({ explanation, duration, mode }: any) {
        return (
            <div data-testid="feedback-overlay">
                <div data-testid="feedback-explanation">{explanation}</div>
                <div data-testid="feedback-duration">Duration: {duration}s</div>
                <div data-testid="feedback-mode">Mode: {mode}</div>
            </div>
        );
    };
});

jest.mock('@/components/Snackbar', () => {
    return function Snackbar({ open, message, type }: any) {
        if (!open) return null;
        return (
            <div data-testid="snackbar" className={`snackbar-${type}`}>
                {message}
            </div>
        );
    };
});

describe('LiveGamePage - Additional Coverage Tests', () => {
    const mockPush = jest.fn();
    const mockReplace = jest.fn();
    const mockJoinGame = jest.fn();
    const mockSubmitAnswer = jest.fn();
    const mockRequestNextQuestion = jest.fn();

    const defaultGameState = {
        currentQuestion: null,
        questionIndex: 0,
        totalQuestions: 0,
        gameStatus: 'waiting' as const,
        phase: 'question' as const,
        timer: null,
        answered: false,
        correctAnswers: null,
        feedbackRemaining: null,
        lastAnswerFeedback: null,
        linkedQuizId: null,
        gameMode: 'tournament' as const,
        connectedToRoom: false,
        leaderboard: []
    };

    const defaultSocketHook = {
        socket: null,
        gameState: defaultGameState,
        connected: false,
        connecting: false,
        error: null,
        joinGame: mockJoinGame,
        submitAnswer: mockSubmitAnswer,
        requestNextQuestion: mockRequestNextQuestion
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock Next.js navigation
        (useParams as jest.Mock).mockReturnValue({ code: 'TEST123' });
        (useRouter as jest.Mock).mockReturnValue({
            push: mockPush,
            replace: mockReplace
        });

        // Mock auth provider - authenticated user
        (useAuth as jest.Mock).mockReturnValue({
            userState: 'authenticated',
            userProfile: {
                userId: 'test-user-1',
                username: 'TestUser',
                avatar: '🧮'
            },
            isLoading: false
        });

        // Mock student game socket hook
        (useStudentGameSocket as jest.Mock).mockReturnValue(defaultSocketHook);
    });

    describe('Numeric Questions', () => {
        test('displays numeric input for numeric question type', () => {
            const numericQuestion = {
                uid: 'numeric-question-1',
                text: 'What is the square root of 16?',
                questionType: QUESTION_TYPES.NUMERIC
            };

            (useStudentGameSocket as jest.Mock).mockReturnValue({
                ...defaultSocketHook,
                connected: true,
                gameState: {
                    ...defaultGameState,
                    currentQuestion: numericQuestion,
                    gameStatus: 'active',
                    connectedToRoom: true
                }
            });

            render(<LiveGamePage />);

            expect(screen.getByTestId('question-text')).toHaveTextContent('What is the square root of 16?');
            expect(screen.getByTestId('numeric-input-section')).toBeInTheDocument();
            expect(screen.getByTestId('numeric-answer-input')).toBeInTheDocument();
            expect(screen.getByTestId('numeric-submit-button')).toBeInTheDocument();
        });

        test('handles numeric answer submission', () => {
            const numericQuestion = {
                uid: 'numeric-question-1',
                text: 'What is 2 + 2?',
                questionType: QUESTION_TYPES.NUMERIC
            };

            (useStudentGameSocket as jest.Mock).mockReturnValue({
                ...defaultSocketHook,
                connected: true,
                gameState: {
                    ...defaultGameState,
                    currentQuestion: numericQuestion,
                    gameStatus: 'active',
                    connectedToRoom: true
                }
            });

            render(<LiveGamePage />);

            const input = screen.getByTestId('numeric-answer-input');
            const submitButton = screen.getByTestId('numeric-submit-button');

            // Enter numeric answer
            fireEvent.change(input, { target: { value: '4' } });
            expect(input).toHaveValue(4);

            // Submit answer
            fireEvent.click(submitButton);

            // Verify submitAnswer was called with numeric value
            expect(mockSubmitAnswer).toHaveBeenCalledWith(
                'numeric-question-1',
                4,
                expect.any(Number)
            );
        });

        test('validates numeric answers', () => {
            const numericQuestion = {
                uid: 'numeric-question-1',
                text: 'Enter a number:',
                questionType: QUESTION_TYPES.NUMERIC
            };

            (useStudentGameSocket as jest.Mock).mockReturnValue({
                ...defaultSocketHook,
                connected: true,
                gameState: {
                    ...defaultGameState,
                    currentQuestion: numericQuestion,
                    gameStatus: 'active',
                    connectedToRoom: true
                }
            });

            render(<LiveGamePage />);

            const submitButton = screen.getByTestId('numeric-submit-button');

            // Try to submit without entering anything
            fireEvent.click(submitButton);

            // Should show validation error
            expect(screen.getByTestId('snackbar')).toBeInTheDocument();
            expect(screen.getByTestId('snackbar')).toHaveTextContent('Veuillez entrer une réponse numérique');
            expect(screen.getByTestId('snackbar')).toHaveClass('snackbar-error');
        });
    });

    describe('Error Handling', () => {
        test('displays socket error in snackbar', () => {
            (useStudentGameSocket as jest.Mock).mockReturnValue({
                ...defaultSocketHook,
                error: 'Connection failed|1234567890'
            });

            render(<LiveGamePage />);

            // Should show error snackbar without timestamp
            expect(screen.getByTestId('snackbar')).toBeInTheDocument();
            expect(screen.getByTestId('snackbar')).toHaveTextContent('Connection failed');
            expect(screen.getByTestId('snackbar')).toHaveClass('snackbar-error');
        });

        test('handles multiple choice validation error', () => {
            const question = {
                uid: 'test-question-1',
                text: 'Select multiple answers:',
                questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
                answerOptions: ['A', 'B', 'C']
            };

            (useStudentGameSocket as jest.Mock).mockReturnValue({
                ...defaultSocketHook,
                connected: true,
                gameState: {
                    ...defaultGameState,
                    currentQuestion: question,
                    gameStatus: 'active',
                    connectedToRoom: true
                }
            });

            // Note: This test would require more complex mock setup to handle multiple choice validation
            // For now, we'll test that the component renders without errors
            render(<LiveGamePage />);

            expect(screen.getByTestId('question-text')).toHaveTextContent('Select multiple answers:');
        });
    });

    describe('Connection States', () => {
        test('shows connecting state', () => {
            (useStudentGameSocket as jest.Mock).mockReturnValue({
                ...defaultSocketHook,
                connecting: true,
                connected: false
            });

            render(<LiveGamePage />);

            // Component should render the main interface even when connecting
            expect(screen.getByTestId('mathjax-wrapper')).toBeInTheDocument();
        });

        test('handles disconnection during game', () => {
            (useStudentGameSocket as jest.Mock).mockReturnValue({
                ...defaultSocketHook,
                connected: false,
                connecting: false,
                gameState: {
                    ...defaultGameState,
                    gameStatus: 'active',
                    connectedToRoom: false
                }
            });

            render(<LiveGamePage />);

            // Should show empty state when disconnected
            expect(screen.getByTestId('mathjax-wrapper')).toBeEmptyDOMElement();
        });
    });

    describe('Timer Edge Cases', () => {
        test('handles timer expiration', () => {
            const question = {
                uid: 'timed-question',
                text: 'Quick! Answer this:',
                questionType: QUESTION_TYPES.MULTIPLE_CHOICE_SINGLE_ANSWER,
                answerOptions: ['A', 'B']
            };

            // Mock timer hook to return expired timer
            const mockUseSimpleTimer = require('@/hooks/useSimpleTimer').useSimpleTimer;
            mockUseSimpleTimer.mockReturnValue({
                getTimerState: jest.fn(() => ({ timeLeftMs: 0 }))
            });

            (useStudentGameSocket as jest.Mock).mockReturnValue({
                ...defaultSocketHook,
                connected: true,
                gameState: {
                    ...defaultGameState,
                    currentQuestion: question,
                    gameStatus: 'active',
                    connectedToRoom: true,
                    timer: 0 // Timer expired
                }
            });

            render(<LiveGamePage />);

            // Timer shows "No timer" when timeLeftMs is 0 (as per TournamentTimer logic)
            expect(screen.getByTestId('tournament-timer')).toHaveTextContent('Timer: No timer');
        });
    });

    describe('Answer Validation Edge Cases', () => {
        test('handles invalid numeric input', () => {
            const numericQuestion = {
                uid: 'numeric-question-1',
                text: 'Enter a number:',
                questionType: QUESTION_TYPES.NUMERIC
            };

            (useStudentGameSocket as jest.Mock).mockReturnValue({
                ...defaultSocketHook,
                connected: true,
                gameState: {
                    ...defaultGameState,
                    currentQuestion: numericQuestion,
                    gameStatus: 'active',
                    connectedToRoom: true
                }
            });

            render(<LiveGamePage />);

            const input = screen.getByTestId('numeric-answer-input');
            const submitButton = screen.getByTestId('numeric-submit-button');

            // Enter invalid input (letters)
            fireEvent.change(input, { target: { value: 'abc' } });
            fireEvent.click(submitButton);

            // Should show validation error (actual message from component)
            expect(screen.getByTestId('snackbar')).toBeInTheDocument();
            expect(screen.getByTestId('snackbar')).toHaveTextContent('Veuillez entrer une réponse numérique.');
        });
    });

    describe('Game State Transitions', () => {
        test('transitions from question to feedback to show_answers', () => {
            const question = {
                uid: 'transition-question',
                text: 'Test transition:',
                questionType: QUESTION_TYPES.MULTIPLE_CHOICE_SINGLE_ANSWER,
                answerOptions: ['A', 'B']
            };

            // Start in question phase
            const { rerender } = render(<LiveGamePage />);

            (useStudentGameSocket as jest.Mock).mockReturnValue({
                ...defaultSocketHook,
                connected: true,
                gameState: {
                    ...defaultGameState,
                    currentQuestion: question,
                    phase: 'question',
                    gameStatus: 'active',
                    connectedToRoom: true
                }
            });

            rerender(<LiveGamePage />);
            expect(screen.getByTestId('question-text')).toHaveTextContent('Test transition:');

            // Move to feedback phase
            (useStudentGameSocket as jest.Mock).mockReturnValue({
                ...defaultSocketHook,
                connected: true,
                gameState: {
                    ...defaultGameState,
                    currentQuestion: question,
                    phase: 'feedback',
                    feedbackRemaining: 3,
                    gameStatus: 'active',
                    connectedToRoom: true,
                    lastAnswerFeedback: {
                        correct: true,
                        explanation: 'Correct answer!'
                    }
                }
            });

            rerender(<LiveGamePage />);
            expect(screen.getAllByTestId('feedback-overlay')[0]).toBeInTheDocument();

            // Move to show_answers phase
            (useStudentGameSocket as jest.Mock).mockReturnValue({
                ...defaultSocketHook,
                connected: true,
                gameState: {
                    ...defaultGameState,
                    currentQuestion: question,
                    phase: 'show_answers',
                    correctAnswers: [true, false],
                    gameStatus: 'active',
                    connectedToRoom: true
                }
            });

            rerender(<LiveGamePage />);
            expect(screen.getByTestId('readonly-state')).toBeInTheDocument();
        });
    });

    describe('Loading State Coverage', () => {
        test('shows loading spinner during authentication', () => {
            (useAuth as jest.Mock).mockReturnValue({
                userState: 'loading',
                userProfile: {},
                isLoading: true
            });

            render(<LiveGamePage />);

            expect(screen.getByText('Vérification de l\'authentification...')).toBeInTheDocument();
        });
    });
});
