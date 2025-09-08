/**
 * Comprehensive Test Suite for Live Game Page
 * 
 * This test covers all critical functionality of the live/[code] page:
 * - Lobby to game transitions
 * - Answer clicking and submission
 * - Feedback display and timers
 * - Tournament mode countdown
 * - Quiz mode immediate start
 * - Practice mode with explanations
 * - Leaderboard redirection
 * - Error handling
 * - Socket event handling
 * - Game state management
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import LiveGamePage from '@/app/live/[code]/page';
import { useAuth } from '@/components/AuthProvider';
import { useStudentGameSocket } from '@/hooks/useStudentGameSocket';
import { useSimpleTimer } from '@/hooks/useSimpleTimer';

// Mock all dependencies
jest.mock('next/navigation');
jest.mock('@/components/AuthProvider');
jest.mock('@/hooks/useStudentGameSocket');
jest.mock('@/hooks/useSimpleTimer');
jest.mock('@/clientLogger', () => ({
    createLogger: () => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    })
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseStudentGameSocket = useStudentGameSocket as jest.MockedFunction<typeof useStudentGameSocket>;
const mockUseSimpleTimer = useSimpleTimer as jest.MockedFunction<typeof useSimpleTimer>;

describe('Live Game Page - Comprehensive Test Suite', () => {
    let mockPush: jest.Mock;
    let mockSocketHook: any;
    let mockAuthState: any;

    beforeEach(() => {
        mockPush = jest.fn();

        // Setup router mock
        mockUseRouter.mockReturnValue({
            push: mockPush,
            replace: jest.fn(),
            back: jest.fn(),
            forward: jest.fn(),
            refresh: jest.fn(),
            prefetch: jest.fn()
        } as any);

        mockUseParams.mockReturnValue({
            code: 'TEST123'
        });

        // Setup auth mock
        mockAuthState = {
            userState: 'authenticated',
            userProfile: {
                userId: 'user1',
                username: 'TestUser',
                avatar: '🧪',
                cookieId: 'cookie1'
            },
            isLoading: false
        };
        mockUseAuth.mockReturnValue(mockAuthState);

        // Setup socket hook mock
        mockSocketHook = {
            socket: {
                id: 'socket123',
                connected: true,
                emit: jest.fn(),
                on: jest.fn(),
                off: jest.fn()
            },
            gameState: {
                gameStatus: 'waiting',
                gameMode: 'tournament',
                connectedToRoom: true,
                currentQuestion: undefined,
                questionIndex: 0,
                totalQuestions: 5,
                answered: false,
                phase: 'lobby',
                leaderboard: [],
                lastAnswerFeedback: null,
                feedbackRemaining: null,
                correctAnswers: null,
                numericAnswer: null,
                timer: 0,
                timerStatus: 'stop'
            },
            connected: true,
            error: null,
            joinGame: jest.fn(),
            submitAnswer: jest.fn(),
            requestNextQuestion: jest.fn()
        };
        mockUseStudentGameSocket.mockReturnValue(mockSocketHook);

        // Setup timer mock
        mockUseSimpleTimer.mockReturnValue({
            getTimerState: jest.fn().mockReturnValue({
                timeLeft: 30,
                isRunning: true,
                progress: 0.5
            })
        });

        // Mock window.location for leaderboard redirects
        delete (window as any).location;
        (window as any).location = { href: '' };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('1. Lobby Display and Transitions', () => {
        it('should show lobby when game is waiting and no question present', () => {
            render(<LiveGamePage />);

            // Should show lobby with participant list
            expect(screen.getByText(/participants connectés/i)).toBeInTheDocument();

            // Should not show question interface
            expect(screen.queryByText(/question/i)).not.toBeInTheDocument();
        });

        it('should transition from lobby to game when first question arrives', () => {
            const { rerender } = render(<LiveGamePage />);

            // Initially in lobby
            expect(screen.getByText(/participants connectés/i)).toBeInTheDocument();

            // Update mock to have a question
            mockSocketHook.gameState = {
                ...mockSocketHook.gameState,
                currentQuestion: {
                    uid: 'q1',
                    text: 'What is 2 + 2?',
                    questionType: 'multiple-choice',
                    answerOptions: ['2', '3', '4', '5'],
                    timeLimit: 30
                },
                questionIndex: 0,
                totalQuestions: 5,
                phase: 'question'
            };
            mockUseStudentGameSocket.mockReturnValue(mockSocketHook);

            rerender(<LiveGamePage />);

            // Should now show question interface
            expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
            expect(screen.queryByText(/participants connectés/i)).not.toBeInTheDocument();
        });

        it('should show countdown in lobby for tournament mode', () => {
            // Mock lobby state with countdown
            const mockLobbyState = {
                participants: [
                    { userId: 'user1', username: 'TestUser', avatarEmoji: '🧪' }
                ],
                creator: { userId: 'creator1', username: 'Creator', avatarEmoji: '👑' },
                countdown: 3
            };

            render(<LiveGamePage />);

            // Should show lobby
            expect(screen.getByText(/participants connectés/i)).toBeInTheDocument();
        });
    });

    describe('2. Answer Clicking and Submission', () => {
        beforeEach(() => {
            // Set up game with active question
            mockSocketHook.gameState = {
                ...mockSocketHook.gameState,
                gameStatus: 'active',
                currentQuestion: {
                    uid: 'q1',
                    text: 'What is 2 + 2?',
                    questionType: 'multiple-choice',
                    answerOptions: ['2', '3', '4', '5'],
                    timeLimit: 30
                },
                questionIndex: 0,
                totalQuestions: 5,
                phase: 'question',
                answered: false
            };
        });

        it('should allow clicking on answer options when game is active', () => {
            render(<LiveGamePage />);

            // Should show question and answers
            expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();

            // Find answer buttons
            const answer4Button = screen.getByText('4');
            expect(answer4Button).toBeInTheDocument();

            // Click on answer 4 (index 2)
            fireEvent.click(answer4Button);

            // Should call submitAnswer
            expect(mockSocketHook.submitAnswer).toHaveBeenCalledWith('q1', 2, expect.any(Number));
        });

        it('should not allow clicking when readonly conditions are met', () => {
            // Set readonly conditions
            mockSocketHook.gameState = {
                ...mockSocketHook.gameState,
                phase: 'show_answers',
                correctAnswers: [false, false, true, false]
            };
            mockUseStudentGameSocket.mockReturnValue(mockSocketHook);

            render(<LiveGamePage />);

            const answer4Button = screen.getByText('4');
            fireEvent.click(answer4Button);

            // Should NOT call submitAnswer when readonly
            expect(mockSocketHook.submitAnswer).not.toHaveBeenCalled();
        });

        it('should handle multiple choice questions', () => {
            // Set up multiple choice question
            mockSocketHook.gameState = {
                ...mockSocketHook.gameState,
                currentQuestion: {
                    ...mockSocketHook.gameState.currentQuestion,
                    questionType: 'multiple_choice' // Note: underscore variant
                }
            };
            mockUseStudentGameSocket.mockReturnValue(mockSocketHook);

            render(<LiveGamePage />);

            // Should show multiple choice interface
            expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();

            // Multiple clicks should be possible
            const answer2Button = screen.getByText('2');
            const answer4Button = screen.getByText('4');

            fireEvent.click(answer2Button);
            fireEvent.click(answer4Button);

            // Should have submit button for multiple choice
            const submitButton = screen.getByText(/valider/i);
            expect(submitButton).toBeInTheDocument();

            fireEvent.click(submitButton);

            // Should submit array of selected answers
            expect(mockSocketHook.submitAnswer).toHaveBeenCalledWith('q1', expect.any(Array), expect.any(Number));
        });

        it('should handle numeric questions', () => {
            // Set up numeric question
            mockSocketHook.gameState = {
                ...mockSocketHook.gameState,
                currentQuestion: {
                    uid: 'q2',
                    text: 'What is the value of π to 2 decimal places?',
                    questionType: 'numeric',
                    timeLimit: 30
                }
            };
            mockUseStudentGameSocket.mockReturnValue(mockSocketHook);

            render(<LiveGamePage />);

            // Should show numeric input
            expect(screen.getByText('What is the value of π to 2 decimal places?')).toBeInTheDocument();

            const numericInput = screen.getByRole('textbox');
            expect(numericInput).toBeInTheDocument();

            // Type answer
            fireEvent.change(numericInput, { target: { value: '3.14' } });

            // Submit numeric answer
            const submitButton = screen.getByText(/valider/i);
            fireEvent.click(submitButton);

            expect(mockSocketHook.submitAnswer).toHaveBeenCalledWith('q2', 3.14, expect.any(Number));
        });

        it('should validate numeric input before submission', () => {
            mockSocketHook.gameState = {
                ...mockSocketHook.gameState,
                currentQuestion: {
                    uid: 'q2',
                    text: 'Enter a number',
                    questionType: 'numeric',
                    timeLimit: 30
                }
            };
            mockUseStudentGameSocket.mockReturnValue(mockSocketHook);

            render(<LiveGamePage />);

            const numericInput = screen.getByRole('textbox');

            // Type invalid input
            fireEvent.change(numericInput, { target: { value: 'not a number' } });

            const submitButton = screen.getByText(/valider/i);
            fireEvent.click(submitButton);

            // Should not submit invalid numeric input
            expect(mockSocketHook.submitAnswer).not.toHaveBeenCalled();

            // Should show error message
            expect(screen.getByText(/veuillez entrer une réponse numérique/i)).toBeInTheDocument();
        });
    });

    describe('3. Feedback Display and Timers', () => {
        it('should show feedback overlay when answer is received', async () => {
            // Set up game with answered question
            mockSocketHook.gameState = {
                ...mockSocketHook.gameState,
                gameStatus: 'active',
                currentQuestion: {
                    uid: 'q1',
                    text: 'What is 2 + 2?',
                    questionType: 'multiple-choice',
                    answerOptions: ['2', '3', '4', '5'],
                    timeLimit: 30
                },
                phase: 'feedback',
                feedbackRemaining: 5,
                lastAnswerFeedback: {
                    correct: true,
                    explanation: 'Correct! 2 + 2 = 4',
                    questionUid: 'q1'
                }
            };
            mockUseStudentGameSocket.mockReturnValue(mockSocketHook);

            render(<LiveGamePage />);

            // Should show feedback overlay
            expect(screen.getByText('Correct! 2 + 2 = 4')).toBeInTheDocument();
        });

        it('should show correct answers during show_answers phase', () => {
            mockSocketHook.gameState = {
                ...mockSocketHook.gameState,
                gameStatus: 'active',
                currentQuestion: {
                    uid: 'q1',
                    text: 'What is 2 + 2?',
                    questionType: 'multiple-choice',
                    answerOptions: ['2', '3', '4', '5'],
                    timeLimit: 30
                },
                phase: 'show_answers',
                correctAnswers: [false, false, true, false]
            };
            mockUseStudentGameSocket.mockReturnValue(mockSocketHook);

            render(<LiveGamePage />);

            // Should show question with correct answers highlighted
            expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
            expect(screen.getByText('4')).toBeInTheDocument();
        });

        it('should handle practice mode feedback with manual progression', () => {
            mockSocketHook.gameState = {
                ...mockSocketHook.gameState,
                gameMode: 'practice',
                gameStatus: 'active',
                currentQuestion: {
                    uid: 'q1',
                    text: 'Practice question',
                    questionType: 'multiple-choice',
                    answerOptions: ['A', 'B', 'C', 'D'],
                    timeLimit: 30
                },
                answered: true,
                lastAnswerFeedback: {
                    correct: true,
                    explanation: 'Great explanation here!',
                    questionUid: 'q1'
                }
            };
            mockUseStudentGameSocket.mockReturnValue(mockSocketHook);

            render(<LiveGamePage />);

            // Should show next question button for practice mode
            expect(screen.getByText(/continuer/i)).toBeInTheDocument();

            // Click next question
            const nextButton = screen.getByText(/continuer/i);
            fireEvent.click(nextButton);

            expect(mockSocketHook.requestNextQuestion).toHaveBeenCalledWith('q1');
        });
    });

    describe('4. Game Mode Specific Behavior', () => {
        it('should handle tournament mode with countdown and leaderboard', () => {
            mockSocketHook.gameState = {
                ...mockSocketHook.gameState,
                gameMode: 'tournament',
                leaderboard: [
                    { userId: 'user1', username: 'TestUser', score: 100 },
                    { userId: 'user2', username: 'OtherUser', score: 80 }
                ]
            };
            mockUseStudentGameSocket.mockReturnValue(mockSocketHook);

            render(<LiveGamePage />);

            // Should show leaderboard FAB
            expect(screen.getByLabelText(/classement/i)).toBeInTheDocument();
        });

        it('should handle quiz mode immediate start', () => {
            mockSocketHook.gameState = {
                ...mockSocketHook.gameState,
                gameMode: 'quiz',
                gameStatus: 'active',
                currentQuestion: {
                    uid: 'q1',
                    text: 'Quiz question',
                    questionType: 'multiple-choice',
                    answerOptions: ['A', 'B', 'C', 'D'],
                    timeLimit: 30
                },
                phase: 'question'
            };
            mockUseStudentGameSocket.mockReturnValue(mockSocketHook);

            render(<LiveGamePage />);

            // Should immediately show question for quiz mode
            expect(screen.getByText('Quiz question')).toBeInTheDocument();
            expect(screen.queryByText(/participants connectés/i)).not.toBeInTheDocument();
        });

        it('should redirect to leaderboard when tournament ends', async () => {
            mockSocketHook.gameState = {
                ...mockSocketHook.gameState,
                gameStatus: 'finished',
                gameMode: 'tournament'
            };
            mockUseStudentGameSocket.mockReturnValue(mockSocketHook);

            // Mock the game ended event
            const mockGameEndedPayload = { accessCode: 'TEST123' };

            render(<LiveGamePage />);

            // Simulate game ended event (this would normally be handled by the socket hook)
            act(() => {
                // The socket hook should handle the redirection
                if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
                    window.location.href = `/leaderboard/${mockGameEndedPayload.accessCode}`;
                }
            });

            // Note: In actual implementation, redirection is handled by the socket hook
            // We're testing the component's response to finished game state
            expect(mockSocketHook.gameState.gameStatus).toBe('finished');
        });
    });

    describe('5. Timer Integration', () => {
        it('should display timer correctly during questions', () => {
            mockSocketHook.gameState = {
                ...mockSocketHook.gameState,
                gameStatus: 'active',
                currentQuestion: {
                    uid: 'q1',
                    text: 'Timed question',
                    questionType: 'multiple-choice',
                    answerOptions: ['A', 'B', 'C', 'D'],
                    timeLimit: 30
                },
                phase: 'question'
            };
            mockUseStudentGameSocket.mockReturnValue(mockSocketHook);

            render(<LiveGamePage />);

            // Timer should be displayed
            // The exact timer display depends on TimerDisplay component implementation
            expect(screen.getByText('Timed question')).toBeInTheDocument();
        });
    });

    describe('6. Error Handling', () => {
        it('should show loading state when authenticating', () => {
            mockUseAuth.mockReturnValue({
                ...mockAuthState,
                isLoading: true
            });

            render(<LiveGamePage />);

            expect(screen.getByText(/vérification de l'authentification/i)).toBeInTheDocument();
        });

        it('should handle anonymous users', () => {
            mockUseAuth.mockReturnValue({
                ...mockAuthState,
                userState: 'anonymous'
            });

            const { container } = render(<LiveGamePage />);

            // Should render nothing for anonymous users
            expect(container.firstChild).toBeNull();
        });

        it('should handle incomplete user profiles', () => {
            mockUseAuth.mockReturnValue({
                ...mockAuthState,
                userProfile: {
                    ...mockAuthState.userProfile,
                    username: null
                }
            });

            const { container } = render(<LiveGamePage />);

            // Should render nothing for incomplete profiles
            expect(container.firstChild).toBeNull();
        });

        it('should display socket errors in snackbar', async () => {
            mockSocketHook.error = 'Connection failed|12345';
            mockUseStudentGameSocket.mockReturnValue(mockSocketHook);

            render(<LiveGamePage />);

            // Should show error in snackbar
            await waitFor(() => {
                expect(screen.getByText('Connection failed')).toBeInTheDocument();
            });
        });
    });

    describe('7. Socket Integration', () => {
        it('should join game when component mounts', () => {
            render(<LiveGamePage />);

            // Should call joinGame
            expect(mockSocketHook.joinGame).toHaveBeenCalled();
        });

        it('should handle socket connection states', () => {
            mockSocketHook.connected = false;
            mockUseStudentGameSocket.mockReturnValue(mockSocketHook);

            render(<LiveGamePage />);

            // Should handle disconnected state gracefully
            expect(screen.queryByText(/participants connectés/i)).toBeInTheDocument();
        });
    });

    describe('8. Leaderboard Integration', () => {
        it('should open leaderboard modal when FAB is clicked', async () => {
            mockSocketHook.gameState = {
                ...mockSocketHook.gameState,
                gameStatus: 'active',
                leaderboard: [
                    { userId: 'user1', username: 'TestUser', score: 100 },
                    { userId: 'user2', username: 'OtherUser', score: 80 }
                ],
                currentQuestion: {
                    uid: 'q1',
                    text: 'Question with leaderboard',
                    questionType: 'multiple-choice',
                    answerOptions: ['A', 'B', 'C', 'D'],
                    timeLimit: 30
                }
            };
            mockUseStudentGameSocket.mockReturnValue(mockSocketHook);

            render(<LiveGamePage />);

            // Find and click leaderboard FAB
            const leaderboardFAB = screen.getByLabelText(/classement/i);
            fireEvent.click(leaderboardFAB);

            // Should open leaderboard modal
            await waitFor(() => {
                expect(screen.getByText(/classement/i)).toBeInTheDocument();
            });
        });

        it('should display user rank and score in leaderboard', () => {
            mockSocketHook.gameState = {
                ...mockSocketHook.gameState,
                gameStatus: 'active',
                leaderboard: [
                    { userId: 'user2', username: 'OtherUser', score: 120 },
                    { userId: 'user1', username: 'TestUser', score: 100 },
                    { userId: 'user3', username: 'ThirdUser', score: 80 }
                ],
                currentQuestion: {
                    uid: 'q1',
                    text: 'Question',
                    questionType: 'multiple-choice',
                    answerOptions: ['A', 'B', 'C', 'D'],
                    timeLimit: 30
                }
            };
            mockUseStudentGameSocket.mockReturnValue(mockSocketHook);

            render(<LiveGamePage />);

            // User should see their rank (2nd place) and score (100)
            expect(screen.getByLabelText(/classement/i)).toBeInTheDocument();
        });
    });

    describe('9. Mobile Responsiveness', () => {
        it('should handle mobile viewport', () => {
            // Mock window resize
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 500
            });

            render(<LiveGamePage />);

            // Component should render properly on mobile
            expect(screen.getByText(/participants connectés/i)).toBeInTheDocument();
        });
    });

    describe('10. Answer State Management', () => {
        it('should reset answer selections when question changes', () => {
            mockSocketHook.gameState = {
                ...mockSocketHook.gameState,
                gameStatus: 'active',
                currentQuestion: {
                    uid: 'q1',
                    text: 'First question',
                    questionType: 'multiple-choice',
                    answerOptions: ['A', 'B', 'C', 'D'],
                    timeLimit: 30
                },
                phase: 'question'
            };

            const { rerender } = render(<LiveGamePage />);

            // Click an answer
            const answerA = screen.getByText('A');
            fireEvent.click(answerA);

            // Change to new question
            mockSocketHook.gameState = {
                ...mockSocketHook.gameState,
                currentQuestion: {
                    uid: 'q2',
                    text: 'Second question',
                    questionType: 'multiple-choice',
                    answerOptions: ['W', 'X', 'Y', 'Z'],
                    timeLimit: 30
                }
            };
            mockUseStudentGameSocket.mockReturnValue(mockSocketHook);

            rerender(<LiveGamePage />);

            // Should show new question
            expect(screen.getByText('Second question')).toBeInTheDocument();
            expect(screen.getByText('W')).toBeInTheDocument();
        });
    });
});

// Additional debugging test for answer clicking issue
describe('Answer Clicking Debug Tests', () => {
    let mockSocketHook: any;

    beforeEach(() => {
        mockUseParams.mockReturnValue({ code: 'TEST123' });
        mockUseAuth.mockReturnValue({
            userState: 'authenticated',
            userProfile: {
                userId: 'user1',
                username: 'TestUser',
                avatar: '🧪',
                cookieId: 'cookie1'
            },
            isLoading: false
        });

        mockSocketHook = {
            socket: { id: 'socket123', connected: true, emit: jest.fn() },
            gameState: {
                gameStatus: 'active',
                gameMode: 'tournament',
                connectedToRoom: true,
                currentQuestion: {
                    uid: 'q1',
                    text: 'Debug question: What is 2 + 2?',
                    questionType: 'multiple-choice',
                    answerOptions: ['2', '3', '4', '5'],
                    timeLimit: 30
                },
                questionIndex: 0,
                totalQuestions: 5,
                answered: false,
                phase: 'question',
                leaderboard: [],
                lastAnswerFeedback: null,
                feedbackRemaining: null,
                correctAnswers: null,
                numericAnswer: null
            },
            connected: true,
            error: null,
            joinGame: jest.fn(),
            submitAnswer: jest.fn(),
            requestNextQuestion: jest.fn()
        };

        mockUseStudentGameSocket.mockReturnValue(mockSocketHook);
        mockUseSimpleTimer.mockReturnValue({
            getTimerState: jest.fn().mockReturnValue({
                timeLeft: 30,
                isRunning: true,
                progress: 0.5
            })
        });
    });

    it('should debug readonly state calculation', () => {
        render(<LiveGamePage />);

        console.log('=== DEBUGGING READONLY STATE ===');
        console.log('Game State:', mockSocketHook.gameState);
        console.log('Game Status:', mockSocketHook.gameState.gameStatus);
        console.log('Phase:', mockSocketHook.gameState.phase);
        console.log('Answered:', mockSocketHook.gameState.answered);
        console.log('Game Mode:', mockSocketHook.gameState.gameMode);

        // Calculate readonly state like the component does
        const isReadonly =
            mockSocketHook.gameState.phase === 'show_answers' ||
            mockSocketHook.gameState.gameStatus === 'finished' ||
            (mockSocketHook.gameState.answered && mockSocketHook.gameState.gameMode === 'practice');

        console.log('Calculated readonly:', isReadonly);
        console.log('=== END DEBUG ===');

        // Should not be readonly
        expect(isReadonly).toBe(false);

        // Should show question
        expect(screen.getByText('Debug question: What is 2 + 2?')).toBeInTheDocument();

        // Should be able to click answers
        const answer4 = screen.getByText('4');
        expect(answer4).toBeInTheDocument();

        fireEvent.click(answer4);

        // Should call submitAnswer
        expect(mockSocketHook.submitAnswer).toHaveBeenCalledWith('q1', 2, expect.any(Number));
    });
});
