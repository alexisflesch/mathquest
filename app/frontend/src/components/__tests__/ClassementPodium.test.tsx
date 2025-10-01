import React from 'react';
import { render, screen, act } from '@testing-library/react';
import ClassementPodium, { PodiumUser } from '../ClassementPodium';

// Mock framer-motion
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockLeaderboard: PodiumUser[] = [
    { userId: '1', name: 'Alice', avatarEmoji: '🦉', score: 100 },
    { userId: '2', name: 'Bob', avatarEmoji: '🦊', score: 95 },
    { userId: '3', name: 'Charlie', avatarEmoji: '🐻', score: 90 },
];

describe('ClassementPodium Animation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should trigger score animation on first score change', () => {
        const { rerender } = render(
            <ClassementPodium leaderboard={mockLeaderboard} />
        );

        // Update Alice's score
        const updatedLeaderboard = mockLeaderboard.map(player =>
            player.userId === '1'
                ? { ...player, score: 120 }
                : player
        );

        rerender(<ClassementPodium leaderboard={updatedLeaderboard} />);

        // Check if the cyan overlay (glitch effect) is present for Alice's score
        const aliceContainer = screen.getByText('Alice').closest('.flex-col');
        const glitchOverlay = aliceContainer?.querySelector('.text-cyan-400');
        expect(glitchOverlay).toBeInTheDocument();
        expect(glitchOverlay).toHaveTextContent('120');
    });

    it('should trigger score animation on consecutive score changes', () => {
        const { rerender } = render(
            <ClassementPodium leaderboard={mockLeaderboard} />
        );

        // First update: Alice 100 -> 120
        const firstUpdate = mockLeaderboard.map(player =>
            player.userId === '1'
                ? { ...player, score: 120 }
                : player
        );

        rerender(<ClassementPodium leaderboard={firstUpdate} />);

        // Second update: Alice 120 -> 140 (consecutive change)
        const secondUpdate = firstUpdate.map(player =>
            player.userId === '1'
                ? { ...player, score: 140 }
                : player
        );

        rerender(<ClassementPodium leaderboard={secondUpdate} />);

        // Check if the glitch overlay is present for the second change
        const aliceContainer = screen.getByText('Alice').closest('.flex-col');
        const glitchOverlay = aliceContainer?.querySelector('.text-cyan-400');
        expect(glitchOverlay).toBeInTheDocument();
        expect(glitchOverlay).toHaveTextContent('140');
    });

    it('should not trigger animation when score stays the same', () => {
        const { rerender } = render(
            <ClassementPodium leaderboard={mockLeaderboard} />
        );

        // Update leaderboard but keep Alice's score the same
        rerender(<ClassementPodium leaderboard={mockLeaderboard} />);

        // Should not trigger animation
        expect(screen.getByText('100')).toBeInTheDocument();
    });
});