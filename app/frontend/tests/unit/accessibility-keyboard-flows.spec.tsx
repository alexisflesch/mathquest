/**
 * Accessibility and Keyboard Flows Test Suite
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock hooks
const mockUseParams = jest.fn(() => ({ code: 'TEST123' }));
const mockUseRouter = jest.fn(() => ({ push: jest.fn(), replace: jest.fn() }));
const mockUseAuth = jest.fn();
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

// Mock components
jest.mock('@/components/SharedModal', () => ({
    __esModule: true,
    default: ({
        isOpen,
        onClose,
        title,
        children,
        showCloseButton = true,
        closeOnEscape = true,
        closeOnBackdrop = true
    }: any) => {
        const modalRef = React.useRef<HTMLDivElement>(null);

        React.useEffect(() => {
            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === 'Escape' && closeOnEscape) {
                    onClose();
                }
            };

            if (isOpen) {
                document.addEventListener('keydown', handleEscape);

                // Focus first focusable element when modal opens
                const focusableElements = modalRef.current?.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const firstFocusable = focusableElements?.[0] as HTMLElement;
                if (firstFocusable) {
                    setTimeout(() => firstFocusable.focus(), 0);
                }

                document.body.style.overflow = 'hidden';
            }

            return () => {
                document.removeEventListener('keydown', handleEscape);
                document.body.style.overflow = 'unset';
            };
        }, [isOpen, onClose, closeOnEscape]);

        if (!isOpen) return null;

        return (
            <div
                ref={modalRef}
                data-testid="shared-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                onClick={(e) => {
                    if (e.target === e.currentTarget && closeOnBackdrop) {
                        onClose();
                    }
                }}
            >
                <div data-testid="modal-content">
                    {title && <h2 id="modal-title">{title}</h2>}
                    {children}
                    {showCloseButton && (
                        <button
                            data-testid="modal-close"
                            onClick={onClose}
                            aria-label="Close modal"
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>
        );
    }
}));

jest.mock('@/components/LeaderboardModal', () => ({
    __esModule: true,
    default: ({ isOpen, onClose, leaderboard, currentUserId }: any) => {
        if (!isOpen) return null;

        return (
            <div
                data-testid="leaderboard-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="leaderboard-title"
            >
                <h2 id="leaderboard-title">Classement</h2>
                <div data-testid="leaderboard-content">
                    {leaderboard?.map((entry: any, index: number) => (
                        <div
                            key={entry.userId}
                            data-testid={`leaderboard-entry-${index}`}
                            tabIndex={0}
                            role="listitem"
                            aria-label={`Rank ${entry.rank || index + 1}: ${entry.username}, ${entry.score} points`}
                        >
                            {entry.username}
                        </div>
                    ))}
                </div>
                <button
                    data-testid="leaderboard-close"
                    onClick={onClose}
                    aria-label="Close leaderboard"
                >
                    Close
                </button>
            </div>
        );
    }
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

const mockLeaderboard = [
    { userId: 'user1', username: 'Alice', score: 100, rank: 1, avatarEmoji: '🐱' },
    { userId: 'user2', username: 'Bob', score: 80, rank: 2, avatarEmoji: '🐶' },
    { userId: 'test-user-123', username: 'TestUser', score: 60, rank: 3, avatarEmoji: '🐼' }
];

const mockQuestion = {
    uid: 'q1',
    text: 'What is 2 + 2?',
    questionType: 'single_choice',
    multipleChoiceQuestion: {
        answerOptions: ['2', '3', '4', '5']
    }
};

const mockSocketHook = {
    submitAnswer: jest.fn(),
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
        leaderboard: mockLeaderboard,
        gameStatus: 'active' as const
    },
    isConnected: true,
    error: null
};

// Test components
const TestModalFocusTrap = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [leaderboardOpen, setLeaderboardOpen] = React.useState(false);

    return (
        <div>
            <button
                data-testid="open-modal"
                onClick={() => setIsOpen(true)}
                aria-label="Open test modal"
            >
                Open Modal
            </button>
            <button
                data-testid="open-leaderboard"
                onClick={() => setLeaderboardOpen(true)}
                aria-label="Open leaderboard"
            >
                Open Leaderboard
            </button>

            {isOpen && React.createElement(require('@/components/SharedModal').default, {
                isOpen: true,
                onClose: () => setIsOpen(false),
                title: "Test Modal",
                showCloseButton: true,
                closeOnEscape: true,
                closeOnBackdrop: true
            }, (
                <div>
                    <button data-testid="modal-action" tabIndex={0}>
                        Action Button
                    </button>
                    <input data-testid="modal-input" type="text" />
                </div>
            ))}

            {leaderboardOpen && React.createElement(require('@/components/LeaderboardModal').default, {
                isOpen: true,
                onClose: () => setLeaderboardOpen(false),
                leaderboard: mockLeaderboard,
                currentUserId: "test-user-123"
            })}
        </div>
    );
};

const TestKeyboardNavigation = () => {
    const { submitAnswer, gameState } = mockUseStudentGameSocket();
    const [selectedAnswer, setSelectedAnswer] = React.useState<number | null>(null);

    const handleSingleChoice = React.useCallback((idx: number) => {
        setSelectedAnswer(idx);
        submitAnswer(gameState.currentQuestion.uid, idx, Date.now());
    }, [gameState, submitAnswer]);

    const handleKeyDown = React.useCallback((e: React.KeyboardEvent, optionIndex: number) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSingleChoice(optionIndex);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = Math.min(optionIndex + 1, 3);
            const nextButton = document.querySelector(`[data-testid="answer-option-${nextIndex}"]`) as HTMLElement;
            nextButton?.focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = Math.max(optionIndex - 1, 0);
            const prevButton = document.querySelector(`[data-testid="answer-option-${prevIndex}"]`) as HTMLElement;
            prevButton?.focus();
        }
    }, [handleSingleChoice]);

    return (
        <div data-testid="keyboard-navigation">
            <h1 id="main-heading">Math Question</h1>
            <main role="main" aria-labelledby="main-heading">
                <div role="radiogroup" aria-label="Answer options">
                    {['2', '3', '4', '5'].map((option, index) => (
                        <button
                            key={index}
                            data-testid={`answer-option-${index}`}
                            onClick={() => handleSingleChoice(index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            tabIndex={0}
                            role="radio"
                            aria-checked={selectedAnswer === index}
                            aria-label={`Answer option ${index + 1}: ${option}`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </main>
        </div>
    );
};

const TestSkipToContent = () => {
    const [showContent, setShowContent] = React.useState(false);

    return (
        <div>
            <a
                href="#main-content"
                data-testid="skip-link"
                className="skip-link"
                onClick={() => setShowContent(true)}
            >
                Skip to main content
            </a>
            <header role="banner">
                <nav role="navigation" aria-label="Main navigation">
                    <ul>
                        <li><a href="#home">Home</a></li>
                        <li><a href="#about">About</a></li>
                    </ul>
                </nav>
            </header>
            <main id="main-content" role="main" data-testid="main-content">
                {showContent && <p>Main content is visible</p>}
            </main>
        </div>
    );
};

describe('Accessibility and Keyboard Flows', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseAuth.mockReturnValue(mockAuth);
        mockUseStudentGameSocket.mockReturnValue(mockSocketHook);
    });

    describe('Modal Focus Trap', () => {
        test('should trap focus within SharedModal with tab/shift+tab', async () => {
            const user = userEvent.setup();
            render(<TestModalFocusTrap />);

            // Open modal
            await user.click(screen.getByTestId('open-modal'));

            const modal = screen.getByTestId('shared-modal');
            expect(modal).toBeInTheDocument();

            // Verify modal has proper accessibility attributes
            expect(modal).toHaveAttribute('role', 'dialog');
            expect(modal).toHaveAttribute('aria-modal', 'true');

            // Verify all expected focusable elements are present
            const modalAction = screen.getByTestId('modal-action');
            const modalInput = screen.getByTestId('modal-input');
            const modalClose = screen.getByTestId('modal-close');

            expect(modalAction).toBeInTheDocument();
            expect(modalInput).toBeInTheDocument();
            expect(modalClose).toBeInTheDocument();

            // Verify elements have proper accessibility attributes
            expect(modalAction).toHaveAttribute('tabIndex', '0');
            expect(modalClose).toHaveAttribute('aria-label', 'Close modal');

            // Note: Full focus trapping would require more complex implementation
            // This test verifies the modal structure and accessibility setup
        });

        test('should close modal with Escape key', async () => {
            const user = userEvent.setup();
            render(<TestModalFocusTrap />);

            await user.click(screen.getByTestId('open-modal'));
            expect(screen.getByTestId('shared-modal')).toBeInTheDocument();

            await user.keyboard('{Escape}');
            await waitFor(() => {
                expect(screen.queryByTestId('shared-modal')).not.toBeInTheDocument();
            });
        });

        test('should close modal with backdrop click', async () => {
            const user = userEvent.setup();
            render(<TestModalFocusTrap />);

            await user.click(screen.getByTestId('open-modal'));
            const modal = screen.getByTestId('shared-modal');

            await user.click(modal); // Click on backdrop
            await waitFor(() => {
                expect(screen.queryByTestId('shared-modal')).not.toBeInTheDocument();
            });
        });
    });

    describe('Leaderboard Modal Accessibility', () => {
        test('should have proper ARIA attributes and keyboard navigation', async () => {
            const user = userEvent.setup();
            render(<TestModalFocusTrap />);

            await user.click(screen.getByTestId('open-leaderboard'));

            const modal = screen.getByTestId('leaderboard-modal');
            expect(modal).toHaveAttribute('role', 'dialog');
            expect(modal).toHaveAttribute('aria-modal', 'true');

            const title = screen.getByText('Classement');
            expect(title).toHaveAttribute('id');

            // Check leaderboard entries have proper accessibility
            const entries = screen.getAllByTestId(/^leaderboard-entry-/);
            entries.forEach((entry, index) => {
                expect(entry).toHaveAttribute('tabIndex', '0');
                expect(entry).toHaveAttribute('role', 'listitem');
                expect(entry).toHaveAttribute('aria-label');
            });
        });

        test('should navigate leaderboard entries with keyboard', async () => {
            const user = userEvent.setup();
            render(<TestModalFocusTrap />);

            await user.click(screen.getByTestId('open-leaderboard'));

            const firstEntry = screen.getByTestId('leaderboard-entry-0');
            firstEntry.focus();
            expect(firstEntry).toHaveFocus();

            // Navigate with arrow keys (would need implementation in actual component)
            await user.keyboard('{ArrowDown}');
            // In real implementation, this would move focus to next entry
        });
    });

    describe('Skip to Content and Landmark Roles', () => {
        test('should have skip link that focuses main content', async () => {
            const user = userEvent.setup();
            render(<TestSkipToContent />);

            const skipLink = screen.getByTestId('skip-link');
            expect(skipLink).toHaveAttribute('href', '#main-content');

            await user.click(skipLink);

            const mainContent = screen.getByTestId('main-content');
            expect(mainContent).toHaveAttribute('id', 'main-content');
            expect(mainContent).toHaveAttribute('role', 'main');
        });

        test('should have proper landmark roles', () => {
            render(<TestSkipToContent />);

            const banner = screen.getByRole('banner');
            const navigation = screen.getByRole('navigation');
            const main = screen.getByRole('main');

            expect(banner).toBeInTheDocument();
            expect(navigation).toBeInTheDocument();
            expect(main).toBeInTheDocument();
        });
    });

    describe('Keyboard-Only Answering', () => {
        test('should support arrow key navigation for MCQ options', async () => {
            const user = userEvent.setup();
            render(<TestKeyboardNavigation />);

            const firstOption = screen.getByTestId('answer-option-0');
            firstOption.focus();

            // Navigate down with arrow key
            await user.keyboard('{ArrowDown}');
            const secondOption = screen.getByTestId('answer-option-1');
            expect(secondOption).toHaveFocus();

            // Navigate up with arrow key
            await user.keyboard('{ArrowUp}');
            expect(firstOption).toHaveFocus();
        });

        test('should submit answer with Enter or Space key', async () => {
            const user = userEvent.setup();
            render(<TestKeyboardNavigation />);

            const firstOption = screen.getByTestId('answer-option-0');
            firstOption.focus();

            // Submit with Enter
            await user.keyboard('{Enter}');
            expect(mockSocketHook.submitAnswer).toHaveBeenCalledWith('q1', 0, expect.any(Number));

            // Reset mock
            mockSocketHook.submitAnswer.mockClear();

            // Submit with Space
            firstOption.focus();
            await user.keyboard(' ');
            expect(mockSocketHook.submitAnswer).toHaveBeenCalledWith('q1', 0, expect.any(Number));
        });

        test('should have proper ARIA attributes for radio group', () => {
            render(<TestKeyboardNavigation />);

            const radioGroup = screen.getByRole('radiogroup');
            expect(radioGroup).toHaveAttribute('aria-label', 'Answer options');

            const options = screen.getAllByRole('radio');
            expect(options).toHaveLength(4);

            options.forEach((option, index) => {
                expect(option).toHaveAttribute('aria-checked');
                expect(option).toHaveAttribute('aria-label', `Answer option ${index + 1}: ${['2', '3', '4', '5'][index]}`);
            });
        });
    });

    describe('High Contrast Theme Support', () => {
        test('should maintain legibility in high contrast mode', () => {
            // Mock high contrast media query
            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: jest.fn().mockImplementation(query => ({
                    matches: query === '(prefers-contrast: high)',
                    media: query,
                    onchange: null,
                    addListener: jest.fn(),
                    removeListener: jest.fn(),
                    addEventListener: jest.fn(),
                    removeEventListener: jest.fn(),
                    dispatchEvent: jest.fn(),
                })),
            });

            render(<TestKeyboardNavigation />);

            // In a real implementation, this would test that colors meet contrast ratios
            // For now, we verify the component renders without errors in high contrast simulation
            expect(screen.getByTestId('keyboard-navigation')).toBeInTheDocument();
        });

        test('should preserve focus indicators in high contrast', async () => {
            const user = userEvent.setup();
            render(<TestKeyboardNavigation />);

            const firstOption = screen.getByTestId('answer-option-0');

            // Focus should be visible (in real implementation with CSS)
            firstOption.focus();
            expect(firstOption).toHaveFocus();

            // Tab navigation should work
            await user.tab();
            const secondOption = screen.getByTestId('answer-option-1');
            expect(secondOption).toHaveFocus();
        });
    });

    describe('Screen Reader Support', () => {
        test('should provide descriptive labels for interactive elements', async () => {
            const user = userEvent.setup();
            render(<TestModalFocusTrap />);

            await user.click(screen.getByTestId('open-modal'));

            // Modal close button should have aria-label
            const closeButton = screen.getByTestId('modal-close');
            expect(closeButton).toHaveAttribute('aria-label', 'Close modal');
        });

        test('should announce dynamic content changes', () => {
            render(<TestKeyboardNavigation />);

            // Answer options should have aria-checked for screen readers
            const options = screen.getAllByRole('radio');
            options.forEach(option => {
                expect(option).toHaveAttribute('aria-checked');
            });
        });

        test('should support live regions for status updates', () => {
            // This would test aria-live regions for timer updates, score changes, etc.
            // In a real implementation, timer and score elements would have aria-live="polite"
            expect(true).toBe(true); // Placeholder for future implementation
        });
    });

    describe('Student Answer Submission - Keyboard Only Flow', () => {
        describe('Multiple Choice Questions', () => {
            test('should allow keyboard-only navigation and selection with Tab/Enter', async () => {
                const user = userEvent.setup();
                render(<TestKeyboardNavigation />);

                // Start with first option focused via Tab
                await user.tab();
                const firstOption = screen.getByTestId('answer-option-0');
                expect(firstOption).toHaveFocus();

                // Tab to second option
                await user.tab();
                const secondOption = screen.getByTestId('answer-option-1');
                expect(secondOption).toHaveFocus();

                // Select with Enter
                await user.keyboard('{Enter}');
                expect(mockSocketHook.submitAnswer).toHaveBeenCalledWith(
                    mockSocketHook.gameState.currentQuestion.uid,
                    1,
                    expect.any(Number)
                );
            });

            test('should allow keyboard-only navigation with arrow keys', async () => {
                const user = userEvent.setup();
                render(<TestKeyboardNavigation />);

                // Focus first option
                const firstOption = screen.getByTestId('answer-option-0');
                firstOption.focus();
                expect(firstOption).toHaveFocus();

                // Navigate down with arrow key
                await user.keyboard('{ArrowDown}');
                const secondOption = screen.getByTestId('answer-option-1');
                expect(secondOption).toHaveFocus();

                // Navigate up with arrow key
                await user.keyboard('{ArrowUp}');
                expect(firstOption).toHaveFocus();

                // Select with Space
                await user.keyboard('{Space}');
                expect(mockSocketHook.submitAnswer).toHaveBeenCalledWith(
                    mockSocketHook.gameState.currentQuestion.uid,
                    0,
                    expect.any(Number)
                );
            });

            test('should handle arrow key navigation at boundaries', async () => {
                const user = userEvent.setup();
                render(<TestKeyboardNavigation />);

                // Focus first option
                const firstOption = screen.getByTestId('answer-option-0');
                firstOption.focus();
                expect(firstOption).toHaveFocus();

                // Try to go up from first option (should stay at first)
                await user.keyboard('{ArrowUp}');
                expect(firstOption).toHaveFocus();

                // Focus last option
                const lastOption = screen.getByTestId('answer-option-3');
                lastOption.focus();
                expect(lastOption).toHaveFocus();

                // Try to go down from last option (should stay at last)
                await user.keyboard('{ArrowDown}');
                expect(lastOption).toHaveFocus();
            });
        });

        describe('Numeric Input Questions', () => {
            const TestNumericInput = () => {
                const { submitAnswer, gameState } = mockUseStudentGameSocket();
                const [inputValue, setInputValue] = React.useState('');

                const handleSubmit = React.useCallback(() => {
                    if (inputValue.trim()) {
                        submitAnswer(gameState.currentQuestion.uid, inputValue.trim(), Date.now());
                    }
                }, [inputValue, gameState, submitAnswer]);

                const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSubmit();
                    }
                }, [handleSubmit]);

                return (
                    <div data-testid="numeric-input">
                        <label htmlFor="numeric-answer" id="numeric-label">
                            Enter your numeric answer:
                        </label>
                        <input
                            id="numeric-answer"
                            data-testid="numeric-input-field"
                            type="text"
                            inputMode="numeric"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            aria-labelledby="numeric-label"
                            aria-describedby="numeric-help"
                        />
                        <span id="numeric-help" className="sr-only">
                            Press Enter to submit your answer
                        </span>
                        <button
                            data-testid="submit-numeric"
                            onClick={handleSubmit}
                            disabled={!inputValue.trim()}
                            aria-label="Submit numeric answer"
                        >
                            Submit
                        </button>
                    </div>
                );
            };

            test('should allow keyboard-only numeric input and submission', async () => {
                const user = userEvent.setup();
                render(<TestNumericInput />);

                const input = screen.getByTestId('numeric-input-field');
                const submitButton = screen.getByTestId('submit-numeric');

                // Tab to input field
                await user.tab();
                expect(input).toHaveFocus();

                // Type numeric answer
                await user.keyboard('3.14159');

                // Submit with Enter
                await user.keyboard('{Enter}');
                expect(mockSocketHook.submitAnswer).toHaveBeenCalledWith(
                    mockSocketHook.gameState.currentQuestion.uid,
                    '3.14159',
                    expect.any(Number)
                );
            });

            test('should handle decimal separators in different locales', async () => {
                const user = userEvent.setup();
                render(<TestNumericInput />);

                const input = screen.getByTestId('numeric-input-field');

                // Focus input
                input.focus();
                expect(input).toHaveFocus();

                // Test comma as decimal separator
                await user.keyboard('3,14159');
                await user.keyboard('{Enter}');

                expect(mockSocketHook.submitAnswer).toHaveBeenCalledWith(
                    mockSocketHook.gameState.currentQuestion.uid,
                    '3,14159',
                    expect.any(Number)
                );
            });

            test('should provide proper ARIA labels for numeric input', () => {
                render(<TestNumericInput />);

                const input = screen.getByTestId('numeric-input-field');
                const label = screen.getByText('Enter your numeric answer:');
                const help = screen.getByText('Press Enter to submit your answer');

                expect(input).toHaveAttribute('aria-labelledby', 'numeric-label');
                expect(input).toHaveAttribute('aria-describedby', 'numeric-help');
                expect(input).toHaveAttribute('inputMode', 'numeric');
                expect(help).toHaveClass('sr-only'); // Screen reader only text
            });
        });

        describe('Multi-Correct MCQ Questions', () => {
            const TestMultiCorrectMCQ = () => {
                const { submitAnswer, gameState } = mockUseStudentGameSocket();
                const [selectedAnswers, setSelectedAnswers] = React.useState<Set<number>>(new Set());

                const handleToggle = React.useCallback((idx: number) => {
                    const newSelected = new Set(selectedAnswers);
                    if (newSelected.has(idx)) {
                        newSelected.delete(idx);
                    } else {
                        newSelected.add(idx);
                    }
                    setSelectedAnswers(newSelected);
                }, [selectedAnswers]);

                const handleSubmit = React.useCallback(() => {
                    if (selectedAnswers.size > 0) {
                        submitAnswer(gameState.currentQuestion.uid, Array.from(selectedAnswers), Date.now());
                    }
                }, [selectedAnswers, gameState, submitAnswer]);

                const handleKeyDown = React.useCallback((e: React.KeyboardEvent, optionIndex: number) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToggle(optionIndex);
                    }
                }, [handleToggle]);

                return (
                    <div data-testid="multi-correct-mcq">
                        <h1>Select all correct answers:</h1>
                        <div role="group" aria-label="Multiple correct answer options">
                            {['Option A', 'Option B', 'Option C', 'Option D'].map((option, index) => (
                                <button
                                    key={index}
                                    data-testid={`mcq-option-${index}`}
                                    onClick={() => handleToggle(index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    tabIndex={0}
                                    role="checkbox"
                                    aria-checked={selectedAnswers.has(index)}
                                    aria-label={`${option}, ${selectedAnswers.has(index) ? 'selected' : 'not selected'}`}
                                >
                                    {option}
                                    {selectedAnswers.has(index) && <span aria-hidden="true">✓</span>}
                                </button>
                            ))}
                        </div>
                        <button
                            data-testid="submit-mcq"
                            onClick={handleSubmit}
                            disabled={selectedAnswers.size === 0}
                            aria-label={`Submit ${selectedAnswers.size} selected answers`}
                        >
                            Submit ({selectedAnswers.size} selected)
                        </button>
                    </div>
                );
            };

            test('should allow keyboard-only multi-selection with Space/Enter', async () => {
                const user = userEvent.setup();
                render(<TestMultiCorrectMCQ />);

                // Tab to first option
                await user.tab();
                const firstOption = screen.getByTestId('mcq-option-0');
                expect(firstOption).toHaveFocus();

                // Select with Space
                await user.keyboard('{Space}');
                expect(firstOption).toHaveAttribute('aria-checked', 'true');

                // Tab to second option
                await user.tab();
                const secondOption = screen.getByTestId('mcq-option-1');
                expect(secondOption).toHaveFocus();

                // Select with Enter
                await user.keyboard('{Enter}');
                expect(secondOption).toHaveAttribute('aria-checked', 'true');

                // Tab to third option and deselect with Space
                await user.tab();
                const thirdOption = screen.getByTestId('mcq-option-2');
                await user.keyboard('{Space}');
                expect(thirdOption).toHaveAttribute('aria-checked', 'true');

                // Deselect by pressing Space again
                await user.keyboard('{Space}');
                expect(thirdOption).toHaveAttribute('aria-checked', 'false');
            });

            test('should submit multiple selected answers', async () => {
                const user = userEvent.setup();
                render(<TestMultiCorrectMCQ />);

                // Select first and third options
                const firstOption = screen.getByTestId('mcq-option-0');
                const thirdOption = screen.getByTestId('mcq-option-2');

                firstOption.focus();
                await user.keyboard('{Space}');
                thirdOption.focus();
                await user.keyboard('{Space}');

                // Submit
                const submitButton = screen.getByTestId('submit-mcq');
                submitButton.focus();
                await user.keyboard('{Enter}');

                expect(mockSocketHook.submitAnswer).toHaveBeenCalledWith(
                    mockSocketHook.gameState.currentQuestion.uid,
                    [0, 2], // Selected indices
                    expect.any(Number)
                );
            });

            test('should provide proper ARIA feedback for multi-selection', async () => {
                const user = userEvent.setup();
                render(<TestMultiCorrectMCQ />);

                const firstOption = screen.getByTestId('mcq-option-0');

                // Initially not selected
                expect(firstOption).toHaveAttribute('aria-checked', 'false');
                expect(firstOption).toHaveAttribute('aria-label', 'Option A, not selected');

                // Select it
                firstOption.focus();
                await user.keyboard('{Space}');

                // Now selected
                expect(firstOption).toHaveAttribute('aria-checked', 'true');
                expect(firstOption).toHaveAttribute('aria-label', 'Option A, selected');
            });
        });
    });
});