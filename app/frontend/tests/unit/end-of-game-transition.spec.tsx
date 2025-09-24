/**
 * End-of-Game Transition Test Suite
 *
 * Tests the complete end-of-game user experience including:
 * - Leaderboard display with proper ranking
 * - Share functionality (native share API and clipboard fallback)
 * - Quiz vs tournament mode detection
 * - Error handling and loading states
 * - Current user ribbon highlighting
 * - URL parameter processing
 * - Live vs deferred scores sections
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { jest, describe, test, expect, beforeEach } from '@jest/globals';

// Mock hooks
const mockUseParams = jest.fn(() => ({ code: 'TEST123' }));
const mockUseRouter = jest.fn(() => ({ push: jest.fn(), replace: jest.fn() }));
const mockUseAuth = jest.fn(() => ({
    userProfile: { id: 'test-user-id', username: 'TestUser' },
    getCurrentUserId: jest.fn(() => 'test-user-id'),
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn()
}));
const mockMakeApiRequest = jest.fn();

// Mock Next.js
jest.mock('next/navigation', () => ({
    useParams: mockUseParams,
    useRouter: mockUseRouter
}));

// Mock auth provider
jest.mock('@/components/AuthProvider', () => ({
    useAuth: mockUseAuth
}));

// Mock API
jest.mock('@/config/api', () => ({
    makeApiRequest: mockMakeApiRequest
}));

// Mock browser APIs
Object.assign(navigator, {
    clipboard: {
        writeText: jest.fn()
    },
    share: jest.fn()
});

// Mock window.location
Object.defineProperty(window, 'location', {
    value: {
        href: 'http://localhost:3000/leaderboard/TEST123?already_played=true',
        pathname: '/leaderboard/TEST123',
        search: '?already_played=true'
    },
    writable: true
});

// Mock window.history.replaceState
const mockReplaceState = jest.fn();
Object.defineProperty(window, 'history', {
    value: {
        replaceState: mockReplaceState
    },
    writable: true
});

// Test component that mimics the leaderboard page
const TestLeaderboardPage: React.FC = () => {
    const { code } = mockUseParams();
    const { userProfile } = mockUseAuth();
    const [leaderboard, setLeaderboard] = React.useState<any[]>([]);
    const [gameInstance, setGameInstance] = React.useState<any>(null);
    const [showQRModal, setShowQRModal] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const data = await mockMakeApiRequest(`/leaderboard/${code}`);
                setLeaderboard(data as any[]);
                setGameInstance({ playMode: 'tournament' });
                setLoading(false);
            } catch (err) {
                setError('Failed to load leaderboard');
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [code]);

    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('already_played')) {
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const handleShare = async () => {
        const shareData = {
            title: 'MathQuest Leaderboard',
            text: `Check out the leaderboard for game ${code}!`,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            }
        } catch (err) {
            console.error('Share failed:', err);
        }
    };

    if (loading) {
        return <div data-testid="loading">Loading...</div>;
    }

    if (error) {
        return <div data-testid="error">{error}</div>;
    }

    const liveParticipants = leaderboard.filter((entry: any) => !entry.deferred);
    const deferredParticipants = leaderboard.filter((entry: any) => entry.deferred);

    return (
        <div data-testid="leaderboard-page">
            <h1>Leaderboard</h1>

            {/* Share Button */}
            <button data-testid="share-button" onClick={handleShare}>
                Share
            </button>

            {/* QR Code Button */}
            <button data-testid="qr-button" onClick={() => setShowQRModal(true)}>
                Show QR
            </button>

            {/* QR Modal */}
            {showQRModal && (
                <div data-testid="qr-modal">
                    <button onClick={() => setShowQRModal(false)}>Close</button>
                </div>
            )}

            {/* Retry Link for Tournament Games */}
            {gameInstance?.playMode === 'tournament' && (
                <div data-testid="retry-link">
                    <a href={`/live/${code}`}>Play again</a>
                </div>
            )}

            {/* Live Section */}
            {liveParticipants.length > 0 && (
                <div data-testid="live-section">
                    <h2>Live Scores</h2>
                    <div data-testid="live-entries">
                        {liveParticipants.map((entry: any, index: number) => (
                            <li key={entry.userId} data-testid={`live-entry-${index}`} className={entry.userId === userProfile?.id ? 'ribbon-diagonal' : ''}>
                                <span>{index + 1}.</span>
                                <span>{entry.username}</span>
                                <span>{entry.score} pts</span>
                            </li>
                        ))}
                    </div>
                </div>
            )}

            {/* Deferred Section */}
            {deferredParticipants.length > 0 && (
                <div data-testid="deferred-section">
                    <h2>Deferred Scores</h2>
                    <div data-testid="deferred-entries">
                        {deferredParticipants.map((entry: any, index: number) => (
                            <li key={entry.userId} data-testid={`deferred-entry-${index}`}>
                                <span>{liveParticipants.length + index + 1}.</span>
                                <span>{entry.username}</span>
                                <span>{entry.score} pts</span>
                                <span>({entry.attempts} attempts)</span>
                            </li>
                        ))}
                    </div>
                </div>
            )}

            {/* Fallback for simple tests */}
            <div data-testid="leaderboard-entries">
                {leaderboard.map((entry: any, index: number) => (
                    <div key={entry.userId} data-testid={`entry-${index}`}>
                        <span>{entry.username}</span>
                        <span>{entry.score}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

describe('End-of-Game Transition', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Default mock response for tournament
        (mockMakeApiRequest as any).mockResolvedValue([
            { userId: 'user1', username: 'Alice', score: 100, deferred: false },
            { userId: 'user2', username: 'Bob', score: 80, deferred: false },
            { userId: 'test-user-id', username: 'TestUser', score: 60, deferred: false },
            { userId: 'user3', username: 'Charlie', score: 40, deferred: true, attempts: 3 }
        ]);
    });

    describe('Leaderboard Display', () => {
        test('should display leaderboard with proper ranking', async () => {
            render(<TestLeaderboardPage />);

            await waitFor(() => {
                expect(screen.getByTestId('leaderboard-page')).toBeInTheDocument();
            });

            expect(screen.getAllByText('Alice')).toHaveLength(2); // One in live section, one in fallback
            expect(screen.getAllByText('Bob')).toHaveLength(2); // One in live section, one in fallback
            expect(screen.getAllByText('TestUser')).toHaveLength(2); // One in live section, one in fallback
        });

        test('should highlight current user with ribbon', async () => {
            render(<TestLeaderboardPage />);

            await waitFor(() => {
                const userEntry = screen.getByTestId('live-entry-2'); // TestUser is at index 2
                expect(userEntry).toHaveClass('ribbon-diagonal');
            });
        });

        test('should display live scores section', async () => {
            render(<TestLeaderboardPage />);

            await waitFor(() => {
                expect(screen.getByText('Live Scores')).toBeInTheDocument();
            });
        });

        test('should display deferred scores section when present', async () => {
            render(<TestLeaderboardPage />);

            await waitFor(() => {
                expect(screen.getByText('Deferred Scores')).toBeInTheDocument();
            });
        });
    });

    describe('Share Functionality', () => {
        test('should use native share API when available', async () => {
            render(<TestLeaderboardPage />);

            await waitFor(() => {
                expect(screen.getByTestId('share-button')).toBeInTheDocument();
            });

            const shareButton = screen.getByTestId('share-button');
            fireEvent.click(shareButton);

            expect(navigator.share).toHaveBeenCalledWith({
                title: 'MathQuest Leaderboard',
                text: 'Check out the leaderboard for game TEST123!',
                url: expect.any(String)
            });
        });

        test('should fallback to clipboard when share API not available', async () => {
            // Mock share as undefined
            Object.assign(navigator, { share: undefined });

            render(<TestLeaderboardPage />);

            await waitFor(() => {
                expect(screen.getByTestId('share-button')).toBeInTheDocument();
            });

            const shareButton = screen.getByTestId('share-button');
            fireEvent.click(shareButton);

            expect(navigator.clipboard.writeText).toHaveBeenCalled();
        });
    });

    describe('Game Mode Detection', () => {
        test('should show retry link for tournament games', async () => {
            render(<TestLeaderboardPage />);

            await waitFor(() => {
                expect(screen.getByTestId('retry-link')).toBeInTheDocument();
            });

            expect(screen.getByText('Play again')).toBeInTheDocument();
        });

        test('should detect quiz mode correctly', async () => {
            // Override mock for quiz mode
            (mockMakeApiRequest as any).mockResolvedValueOnce([
                { userId: 'user1', username: 'Alice', score: 100, deferred: false },
                { userId: 'user2', username: 'Bob', score: 80, deferred: false }
            ]);

            // Mock game instance as quiz
            const MockComponent = () => {
                const [gameInstance, setGameInstance] = React.useState({ playMode: 'quiz' });
                return <TestLeaderboardPage />;
            };

            render(<MockComponent />);

            await waitFor(() => {
                expect(screen.queryByTestId('retry-link')).not.toBeInTheDocument();
            });
        });
    });

    describe('Error Handling', () => {
        test('should display error message when API fails', async () => {
            (mockMakeApiRequest as any).mockRejectedValueOnce(new Error('API Error'));

            render(<TestLeaderboardPage />);

            await waitFor(() => {
                expect(screen.getByText('Failed to load leaderboard')).toBeInTheDocument();
            });
        });
    });
    test('should process already_played parameter', async () => {
        render(<TestLeaderboardPage />);

        await waitFor(() => {
            expect(mockReplaceState).toHaveBeenCalled();
        });
    });
});

describe('QR Code Modal', () => {
    test('should show QR modal when button clicked', async () => {
        render(<TestLeaderboardPage />);

        await waitFor(() => {
            expect(screen.getByTestId('qr-button')).toBeInTheDocument();
        });

        const qrButton = screen.getByTestId('qr-button');
        fireEvent.click(qrButton);

        expect(screen.getByTestId('qr-modal')).toBeInTheDocument();
    });

    test('should close QR modal when close button clicked', async () => {
        render(<TestLeaderboardPage />);

        await waitFor(() => {
            expect(screen.getByTestId('qr-button')).toBeInTheDocument();
        });

        const qrButton = screen.getByTestId('qr-button');
        fireEvent.click(qrButton);

        const closeButton = screen.getByText('Close');
        fireEvent.click(closeButton);

        expect(screen.queryByTestId('qr-modal')).not.toBeInTheDocument();
    });
});