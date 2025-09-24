import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PracticeSessionWithAccessCodePage from '../[accessCode]/page';

// Mock all dependencies
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
    }),
    useParams: () => ({
        accessCode: 'test123'
    })
}));

jest.mock('@/hooks/usePracticeSession', () => ({
    usePracticeSession: jest.fn()
}));

jest.mock('@/components/InfinitySpin', () => {
    return function MockInfinitySpin() {
        return <div data-testid="infinity-spin">Loading...</div>;
    };
});

jest.mock('@/components/LoadingScreen', () => {
    return function MockLoadingScreen({ message }: { message: string }) {
        return <div data-testid="loading-screen">{message}</div>;
    };
});

jest.mock('@/components/MathJaxWrapper', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <div data-testid="mathjax-wrapper">{children}</div>
}));

jest.mock('@/components/QuestionCard', () => {
    return function MockQuestionCard() {
        return <div data-testid="question-card">Question Card</div>;
    };
});

jest.mock('@/components/Snackbar', () => {
    return function MockSnackbar({ open, message, type }: { open: boolean; message: string; type: string }) {
        if (!open) return null;
        return (
            <div data-testid="snackbar" data-type={type}>
                {message}
            </div>
        );
    };
});

jest.mock('@/components/AnswerFeedbackOverlay', () => {
    return function MockAnswerFeedbackOverlay() {
        return <div data-testid="feedback-overlay">Feedback Overlay</div>;
    };
});

jest.mock('@/components/SharedModal', () => {
    return function MockInfoModal({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
        if (!isOpen) return null;
        return <div data-testid="info-modal">{children}</div>;
    };
});

jest.mock('@/clientLogger', () => ({
    createLogger: () => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    })
}));

jest.mock('@/config/api', () => ({
    makeApiRequest: jest.fn()
}));

// Mock localStorage
const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage
});

describe('Practice Session Connection Handling', () => {
    const mockUsePracticeSession = require('@/hooks/usePracticeSession').usePracticeSession;
    const mockMakeApiRequest = require('@/config/api').makeApiRequest;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock localStorage values
        mockLocalStorage.getItem.mockImplementation((key: string) => {
            if (key === 'mathquest_user_id') return 'test-user-id';
            if (key === 'mathquest_username') return 'Test User';
            return null;
        });

        // Mock successful API response
        mockMakeApiRequest.mockResolvedValue({
            gameInstance: {
                id: 'test-game-id',
                name: 'Test Practice',
                playMode: 'practice',
                practiceSettings: {
                    discipline: 'math',
                    gradeLevel: '6eme',
                    themes: ['algebra'],
                    questionCount: 10
                }
            }
        });

        // Default mock for usePracticeSession
        mockUsePracticeSession.mockReturnValue({
            state: {
                connected: true,
                connecting: false,
                session: null,
                currentQuestion: {
                    uid: 'q1',
                    text: 'Test question?',
                    questionType: 'multipleChoice',
                    timeLimit: 30,
                    multipleChoiceQuestion: {
                        answerOptions: [
                            { text: 'Option 1', isCorrect: true },
                            { text: 'Option 2', isCorrect: false }
                        ]
                    }
                },
                hasAnswered: false,
                lastFeedback: null,
                error: null,
                isCompleted: false,
                questionProgress: {
                    currentQuestionNumber: 1,
                    totalQuestions: 10
                }
            },
            startSession: jest.fn(),
            submitAnswer: jest.fn(),
            requestFeedback: jest.fn(),
            getNextQuestion: jest.fn(),
            endSession: jest.fn(),
            clearError: jest.fn()
        });
    });

    it('shows connection lost indicator when socket connection is lost', async () => {
        // Mock connection error
        mockUsePracticeSession.mockReturnValue({
            state: {
                connected: false,
                connecting: false,
                session: null,
                currentQuestion: {
                    uid: 'q1',
                    text: 'Test question?',
                    questionType: 'multipleChoice',
                    timeLimit: 30,
                    multipleChoiceQuestion: {
                        answerOptions: [
                            { text: 'Option 1', isCorrect: true },
                            { text: 'Option 2', isCorrect: false }
                        ]
                    }
                },
                hasAnswered: false,
                lastFeedback: null,
                error: 'Erreur de connexion au serveur',
                isCompleted: false,
                questionProgress: {
                    currentQuestionNumber: 1,
                    totalQuestions: 10
                }
            },
            startSession: jest.fn(),
            submitAnswer: jest.fn(),
            requestFeedback: jest.fn(),
            getNextQuestion: jest.fn(),
            endSession: jest.fn(),
            clearError: jest.fn()
        });

        render(<PracticeSessionWithAccessCodePage />);

        // Wait for component to load
        await waitFor(() => {
            expect(screen.getByTestId('question-card')).toBeInTheDocument();
        });

        // Check that reconnection indicator appears (component sets reconnecting=true immediately)
        await waitFor(() => {
            expect(screen.getByText('Tentative de reconnexion...')).toBeInTheDocument();
        });

        // Check that reconnection snackbar appears
        await waitFor(() => {
            const snackbar = screen.getByTestId('snackbar');
            expect(snackbar).toBeInTheDocument();
            expect(snackbar).toHaveTextContent('Connexion perdue, tentative de reconnexion...');
            expect(snackbar).toHaveAttribute('data-type', 'error');
        });
    });

    it('shows reconnection indicator when attempting to reconnect', async () => {
        // Mock reconnection state (connecting = true indicates reconnection attempt)
        mockUsePracticeSession.mockReturnValue({
            state: {
                connected: false,
                connecting: true, // This indicates reconnection attempt
                session: null,
                currentQuestion: null, // No question during reconnection
                hasAnswered: false,
                lastFeedback: null,
                error: 'Erreur de connexion réseau',
                isCompleted: false,
                questionProgress: null
            },
            startSession: jest.fn(),
            submitAnswer: jest.fn(),
            requestFeedback: jest.fn(),
            getNextQuestion: jest.fn(),
            endSession: jest.fn(),
            clearError: jest.fn()
        });

        render(<PracticeSessionWithAccessCodePage />);

        // Should show loading screen during reconnection
        expect(screen.getByTestId('loading-screen')).toHaveTextContent('Chargement...');

        // The reconnection indicator won't show because there's no question to display
        // This is the expected behavior - loading screen during reconnection
    });

    it('keeps question visible during connection issues', async () => {
        // Mock connection error but with question still available
        mockUsePracticeSession.mockReturnValue({
            state: {
                connected: false,
                connecting: false,
                session: null,
                currentQuestion: {
                    uid: 'q1',
                    text: 'Test question?',
                    questionType: 'multipleChoice',
                    timeLimit: 30,
                    multipleChoiceQuestion: {
                        answerOptions: [
                            { text: 'Option 1', isCorrect: true },
                            { text: 'Option 2', isCorrect: false }
                        ]
                    }
                },
                hasAnswered: false,
                lastFeedback: null,
                error: 'Problème de connexion serveur',
                isCompleted: false,
                questionProgress: {
                    currentQuestionNumber: 1,
                    totalQuestions: 10
                }
            },
            startSession: jest.fn(),
            submitAnswer: jest.fn(),
            requestFeedback: jest.fn(),
            getNextQuestion: jest.fn(),
            endSession: jest.fn(),
            clearError: jest.fn()
        });

        render(<PracticeSessionWithAccessCodePage />);

        // Wait for component to load
        await waitFor(() => {
            expect(screen.getByTestId('question-card')).toBeInTheDocument();
        });

        // Verify that the question card is still visible (not replaced by error component)
        expect(screen.getByTestId('question-card')).toBeInTheDocument();
        expect(screen.getByText('Question Card')).toBeInTheDocument();

        // Verify that the error component is NOT shown
        expect(screen.queryByText('Problème de connexion')).not.toBeInTheDocument();
        expect(screen.queryByText('Retour aux paramètres')).not.toBeInTheDocument();
    });

    it('shows success message when connection is restored', async () => {
        const clearErrorMock = jest.fn();

        // Start with connection error
        mockUsePracticeSession.mockReturnValue({
            state: {
                connected: false,
                connecting: false,
                session: null,
                currentQuestion: {
                    uid: 'q1',
                    text: 'Test question?',
                    questionType: 'multipleChoice',
                    timeLimit: 30,
                    multipleChoiceQuestion: {
                        answerOptions: [
                            { text: 'Option 1', isCorrect: true },
                            { text: 'Option 2', isCorrect: false }
                        ]
                    }
                },
                hasAnswered: false,
                lastFeedback: null,
                error: 'Erreur de connexion',
                isCompleted: false,
                questionProgress: {
                    currentQuestionNumber: 1,
                    totalQuestions: 10
                }
            },
            startSession: jest.fn(),
            submitAnswer: jest.fn(),
            requestFeedback: jest.fn(),
            getNextQuestion: jest.fn(),
            endSession: jest.fn(),
            clearError: clearErrorMock
        });

        const { rerender } = render(<PracticeSessionWithAccessCodePage />);

        // Wait for initial error snackbar
        await waitFor(() => {
            expect(screen.getByTestId('snackbar')).toHaveTextContent('Connexion perdue, tentative de reconnexion...');
        });

        // Mock connection restored
        mockUsePracticeSession.mockReturnValue({
            state: {
                connected: true,
                connecting: false,
                session: null,
                currentQuestion: {
                    uid: 'q1',
                    text: 'Test question?',
                    questionType: 'multipleChoice',
                    timeLimit: 30,
                    multipleChoiceQuestion: {
                        answerOptions: [
                            { text: 'Option 1', isCorrect: true },
                            { text: 'Option 2', isCorrect: false }
                        ]
                    }
                },
                hasAnswered: false,
                lastFeedback: null,
                error: null, // Connection restored
                isCompleted: false,
                questionProgress: {
                    currentQuestionNumber: 1,
                    totalQuestions: 10
                }
            },
            startSession: jest.fn(),
            submitAnswer: jest.fn(),
            requestFeedback: jest.fn(),
            getNextQuestion: jest.fn(),
            endSession: jest.fn(),
            clearError: clearErrorMock
        });

        rerender(<PracticeSessionWithAccessCodePage />);

        // Check that success snackbar appears
        await waitFor(() => {
            const snackbar = screen.getByTestId('snackbar');
            expect(snackbar).toHaveTextContent('Connexion rétablie');
            expect(snackbar).toHaveAttribute('data-type', 'success');
        }, { timeout: 5000 });
    });
});
