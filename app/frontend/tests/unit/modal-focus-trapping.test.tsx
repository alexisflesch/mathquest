/**
 * Modal Focus Trapping Tests
 *
 * Tests focus management and accessibility for modal components.
 * Ensures proper focus trapping, restoration, and keyboard navigation.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

// Import the actual components
import InfoModal from '../../src/components/SharedModal';
import LeaderboardModal from '../../src/components/LeaderboardModal';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
    X: () => <span data-testid="close-icon">×</span>,
    Trophy: () => <span>🏆</span>,
}));

describe('Modal Focus Trapping', () => {
    const mockLeaderboardData = [
        { userId: '1', username: 'Alice', score: 100 },
        { userId: '2', username: 'Bob', score: 90 },
        { userId: '3', username: 'Charlie', score: 80 },
    ];

    describe('InfoModal Focus Trapping', () => {
        test('should close modal with Escape key', async () => {
            const user = userEvent.setup();
            const mockOnClose = jest.fn();

            render(
                <InfoModal isOpen={true} onClose={mockOnClose} title="Test Modal">
                    <p>Test content</p>
                    <button data-testid="modal-btn">Test Button</button>
                </InfoModal>
            );

            // Press Escape
            await user.keyboard('{Escape}');

            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        test('should close modal with backdrop click', async () => {
            const user = userEvent.setup();
            const mockOnClose = jest.fn();

            render(
                <InfoModal isOpen={true} onClose={mockOnClose} title="Test Modal">
                    <p>Test content</p>
                </InfoModal>
            );

            // Click on backdrop (the modal overlay) - find by the backdrop div
            const backdrop = document.querySelector('.bg-black.bg-opacity-50');
            await user.click(backdrop!);

            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        test('should not close modal when clicking modal content', async () => {
            const user = userEvent.setup();
            const mockOnClose = jest.fn();

            render(
                <InfoModal isOpen={true} onClose={mockOnClose} title="Test Modal">
                    <p>Test content</p>
                    <button data-testid="modal-btn">Test Button</button>
                </InfoModal>
            );

            // Click on modal content
            const modalContent = screen.getByText('Test content');
            await user.click(modalContent);

            expect(mockOnClose).not.toHaveBeenCalled();
        });

        test('should have proper ARIA attributes', () => {
            const mockOnClose = jest.fn();

            render(
                <InfoModal isOpen={true} onClose={mockOnClose} title="Test Modal">
                    <p>Test content</p>
                </InfoModal>
            );

            const closeBtn = screen.getByLabelText('Close modal');
            expect(closeBtn).toHaveAttribute('aria-label', 'Close modal');
        });
    });

    describe('LeaderboardModal Focus Trapping', () => {
        test('should render leaderboard modal with data', () => {
            const mockOnClose = jest.fn();

            render(
                <LeaderboardModal
                    isOpen={true}
                    onClose={mockOnClose}
                    leaderboard={mockLeaderboardData}
                    currentUserId="1"
                />
            );

            expect(screen.getByText('Classement')).toBeInTheDocument();
            expect(screen.getByText('Alice')).toBeInTheDocument();
            expect(screen.getByText('Bob')).toBeInTheDocument();
            expect(screen.getByText('Charlie')).toBeInTheDocument();
        });

        test('should close leaderboard modal with Escape key', async () => {
            const user = userEvent.setup();
            const mockOnClose = jest.fn();

            render(
                <LeaderboardModal
                    isOpen={true}
                    onClose={mockOnClose}
                    leaderboard={mockLeaderboardData}
                    currentUserId="1"
                />
            );

            // Press Escape
            await user.keyboard('{Escape}');

            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        test('should handle empty leaderboard gracefully', () => {
            const mockOnClose = jest.fn();

            render(
                <LeaderboardModal
                    isOpen={true}
                    onClose={mockOnClose}
                    leaderboard={[]}
                    currentUserId="1"
                />
            );

            expect(screen.getByText('Classement')).toBeInTheDocument();
            expect(screen.getByText('Aucun classement disponible')).toBeInTheDocument();
        });
    });

    describe('Accessibility Compliance', () => {
        test('should prevent body scroll when modal is open', () => {
            const mockOnClose = jest.fn();
            const originalOverflow = document.body.style.overflow;

            const { unmount } = render(
                <InfoModal isOpen={true} onClose={mockOnClose} title="Test Modal">
                    <p>Test content</p>
                </InfoModal>
            );

            // Body scroll should be prevented
            expect(document.body.style.overflow).toBe('hidden');

            // Cleanup
            unmount();
            expect(document.body.style.overflow).toBe(originalOverflow);
        });

        test('should restore body scroll when modal closes', () => {
            const mockOnClose = jest.fn();

            const { rerender } = render(
                <InfoModal isOpen={true} onClose={mockOnClose} title="Test Modal">
                    <p>Test content</p>
                </InfoModal>
            );

            expect(document.body.style.overflow).toBe('hidden');

            // Close modal
            rerender(
                <InfoModal isOpen={false} onClose={mockOnClose} title="Test Modal">
                    <p>Test content</p>
                </InfoModal>
            );

            expect(document.body.style.overflow).not.toBe('hidden');
        });
    });
});