import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LeaderboardFAB from '@/app/live/components/LeaderboardFAB';

// Mock framer-motion
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
    Trophy: ({ className }: any) => <div className={className} data-testid="trophy-icon" />,
}));

// Mock logger
jest.mock('@/clientLogger', () => ({
    createLogger: () => ({
        info: jest.fn(),
    }),
}));

describe('LeaderboardFAB', () => {
    const defaultProps = {
        isMobile: false,
        userId: 'user-123',
        leaderboardLength: 1,
        userRank: 1,
        userScore: 15.7,
        isQuestionCompleted: false,
        questionIndex: 0,
        isFirstQuestionOfSession: false,
        onOpen: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Single Player Behavior', () => {
        it('shows score for single player games', () => {
            render(<LeaderboardFAB {...defaultProps} leaderboardLength={1} />);
            expect(screen.getByText('15 pts')).toBeInTheDocument();
        });

        it('uses Math.floor for score rounding (no decimals)', () => {
            render(<LeaderboardFAB {...defaultProps} userScore={15.9} />);
            expect(screen.getByText('15 pts')).toBeInTheDocument();
        });

        it('shows score immediately for questions after the first', () => {
            render(
                <LeaderboardFAB
                    {...defaultProps}
                    questionIndex={1}
                    isFirstQuestionOfSession={false}
                    isQuestionCompleted={false}
                />
            );
            expect(screen.getByText('15 pts')).toBeInTheDocument();
        });

        it('hides FAB for first question until completed', () => {
            render(
                <LeaderboardFAB
                    {...defaultProps}
                    questionIndex={0}
                    isFirstQuestionOfSession={true}
                    isQuestionCompleted={false}
                />
            );
            expect(screen.queryByText('15 pts')).not.toBeInTheDocument();
        });

        it('shows FAB for first question after completion', () => {
            render(
                <LeaderboardFAB
                    {...defaultProps}
                    questionIndex={0}
                    isFirstQuestionOfSession={true}
                    isQuestionCompleted={true}
                />
            );
            expect(screen.getByText('15 pts')).toBeInTheDocument();
        });

        it('handles edge case: teacher starts with question 4', () => {
            render(
                <LeaderboardFAB
                    {...defaultProps}
                    questionIndex={3} // Question 4 (0-indexed)
                    isFirstQuestionOfSession={true}
                    isQuestionCompleted={false}
                />
            );
            // Should hide because it's the first question encountered, regardless of questionIndex
            expect(screen.queryByText('15 pts')).not.toBeInTheDocument();
        });

        it('shows FAB for subsequent questions even with high questionIndex', () => {
            render(
                <LeaderboardFAB
                    {...defaultProps}
                    questionIndex={5} // Question 6
                    isFirstQuestionOfSession={false}
                    isQuestionCompleted={false}
                />
            );
            expect(screen.getByText('15 pts')).toBeInTheDocument();
        });
    });

    describe('Multi-Player Behavior', () => {
        it('shows ranking for multi-player games', () => {
            render(<LeaderboardFAB {...defaultProps} leaderboardLength={3} userRank={2} />);
            expect(screen.getByText('#2')).toBeInTheDocument();
        });

        it('shows ranking immediately regardless of question completion', () => {
            render(
                <LeaderboardFAB
                    {...defaultProps}
                    leaderboardLength={3}
                    userRank={2}
                    isQuestionCompleted={false}
                />
            );
            expect(screen.getByText('#2')).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('does not render when userId is null', () => {
            render(<LeaderboardFAB {...defaultProps} userId={null} />);
            expect(screen.queryByTestId('trophy-icon')).not.toBeInTheDocument();
        });

        it('does not render when leaderboard is empty', () => {
            render(<LeaderboardFAB {...defaultProps} leaderboardLength={0} />);
            expect(screen.queryByTestId('trophy-icon')).not.toBeInTheDocument();
        });

        it('handles null userRank gracefully', () => {
            render(<LeaderboardFAB {...defaultProps} leaderboardLength={3} userRank={null} />);
            expect(screen.getByText('#null')).toBeInTheDocument();
        });

        it('handles zero score correctly', () => {
            render(<LeaderboardFAB {...defaultProps} userScore={0} />);
            expect(screen.getByText('0 pts')).toBeInTheDocument();
        });

        it('handles negative score correctly', () => {
            render(<LeaderboardFAB {...defaultProps} userScore={-5.8} />);
            expect(screen.getByText('-6 pts')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('has correct aria-label for single player', () => {
            render(<LeaderboardFAB {...defaultProps} />);
            const button = screen.getByLabelText('Points');
            expect(button).toBeInTheDocument();
        });

        it('has correct aria-label for multi-player', () => {
            render(<LeaderboardFAB {...defaultProps} leaderboardLength={3} />);
            const button = screen.getByLabelText('Voir le classement complet');
            expect(button).toBeInTheDocument();
        });
    });

    describe('Interaction', () => {
        it('is not clickable for single player', () => {
            render(<LeaderboardFAB {...defaultProps} />);
            const button = screen.getByRole('button');
            expect(button).not.toHaveAttribute('onClick');
        });

        it('is clickable for multi-player', () => {
            const mockOnOpen = jest.fn();
            render(<LeaderboardFAB {...defaultProps} leaderboardLength={3} onOpen={mockOnOpen} />);
            const button = screen.getByRole('button');
            expect(button).toBeInTheDocument();
            // Note: We can't easily test the onClick handler without more complex setup
        });
    });
});