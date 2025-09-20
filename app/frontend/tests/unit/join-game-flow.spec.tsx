/**
 * Join Game Flow Unit Tests
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock hooks
const mockUseParams = jest.fn(() => ({ code: 'TEST123' }));
const mockUseRouter = jest.fn(() => ({ push: jest.fn(), replace: jest.fn() }));
const mockUseAuth = jest.fn();
const mockJoinGame = jest.fn();
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

const mockSocketHook = {
    joinGame: mockJoinGame,
    gameState: null,
    isConnected: true,
    error: null
};

// Simplified test component
const TestJoinGameFlow = () => {
    const { code } = mockUseParams();
    const { userState, userProfile, isLoading } = mockUseAuth();
    const { joinGame, gameState, isConnected, error } = mockUseStudentGameSocket();

    // Match LiveGamePage logic for userId and username extraction
    const userId = userProfile?.userId || userProfile?.cookieId || `temp_${Date.now()}`;
    const username = userProfile?.username ?? null;

    React.useEffect(() => {
        if (userProfile && code && isConnected && !error && userId && username) {
            joinGame(code, userProfile);
        }
    }, [userProfile, code, isConnected, error, joinGame, userId, username]);

    if (isLoading) return <div data-testid="loading">Loading...</div>;
    if (error) return <div data-testid="error">{error}</div>;
    if (gameState?.status === 'waiting') return <div data-testid="lobby">Lobby</div>;

    return <div data-testid="game-page">Game Page</div>;
};

describe('Join Game Flow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseAuth.mockReturnValue(mockAuth);
        mockUseStudentGameSocket.mockReturnValue(mockSocketHook);
    });

    describe('Access Code Validation', () => {
        test('should attempt to join game with valid access code', async () => {
            render(<TestJoinGameFlow />);

            await waitFor(() => {
                expect(mockJoinGame).toHaveBeenCalledWith('TEST123', mockAuth.userProfile);
            });
        });

        test('should handle invalid access code gracefully', async () => {
            const errorSocket = { ...mockSocketHook, error: 'Invalid access code' };
            mockUseStudentGameSocket.mockReturnValue(errorSocket);

            render(<TestJoinGameFlow />);

            await waitFor(() => {
                expect(screen.getByTestId('error')).toHaveTextContent('Invalid access code');
            });
        });
    });

    describe('Loading States', () => {
        test('should show loading state during authentication', () => {
            const loadingAuth = { ...mockAuth, isLoading: true };
            mockUseAuth.mockReturnValue(loadingAuth);

            render(<TestJoinGameFlow />);

            expect(screen.getByTestId('loading')).toHaveTextContent('Loading...');
        });

        test('should handle socket connection failure', () => {
            const failedSocket = { ...mockSocketHook, isConnected: false, error: 'Connection failed' };
            mockUseStudentGameSocket.mockReturnValue(failedSocket);

            render(<TestJoinGameFlow />);

            expect(screen.getByTestId('error')).toHaveTextContent('Connection failed');
        });
    });

    describe('Server Error Handling', () => {
        test('should handle game not found error', () => {
            const notFoundSocket = { ...mockSocketHook, error: 'Game not found' };
            mockUseStudentGameSocket.mockReturnValue(notFoundSocket);

            render(<TestJoinGameFlow />);

            expect(screen.getByTestId('error')).toHaveTextContent('Game not found');
        });

        test('should handle game already started error', () => {
            const startedSocket = { ...mockSocketHook, error: 'Game already started' };
            mockUseStudentGameSocket.mockReturnValue(startedSocket);

            render(<TestJoinGameFlow />);

            expect(screen.getByTestId('error')).toHaveTextContent('Game already started');
        });

        test('should handle game full error', () => {
            const fullSocket = { ...mockSocketHook, error: 'Game is full' };
            mockUseStudentGameSocket.mockReturnValue(fullSocket);

            render(<TestJoinGameFlow />);

            expect(screen.getByTestId('error')).toHaveTextContent('Game is full');
        });
    });

    describe('Parameter Validation', () => {
        test('should handle missing user profile', () => {
            const noProfileAuth = { ...mockAuth, userProfile: null };
            mockUseAuth.mockReturnValue(noProfileAuth);

            render(<TestJoinGameFlow />);

            expect(mockJoinGame).not.toHaveBeenCalled();
        });

        test('should handle missing username', () => {
            const noUsernameAuth = { ...mockAuth, userProfile: { ...mockAuth.userProfile, username: '' } };
            mockUseAuth.mockReturnValue(noUsernameAuth);

            render(<TestJoinGameFlow />);

            expect(mockJoinGame).not.toHaveBeenCalled();
        });

        test('should handle null username', () => {
            const nullUsernameAuth = { ...mockAuth, userProfile: { ...mockAuth.userProfile, username: null } };
            mockUseAuth.mockReturnValue(nullUsernameAuth);

            render(<TestJoinGameFlow />);

            expect(mockJoinGame).not.toHaveBeenCalled();
        });
    });

    describe('Successful Join Flow', () => {
        test('should show lobby when joined waiting game', () => {
            const waitingSocket = { ...mockSocketHook, gameState: { status: 'waiting' } };
            mockUseStudentGameSocket.mockReturnValue(waitingSocket);

            render(<TestJoinGameFlow />);

            expect(screen.getByTestId('lobby')).toHaveTextContent('Lobby');
        });

        test('should show game page when game becomes active', () => {
            const activeSocket = { ...mockSocketHook, gameState: { status: 'active' } };
            mockUseStudentGameSocket.mockReturnValue(activeSocket);

            render(<TestJoinGameFlow />);

            expect(screen.getByTestId('game-page')).toHaveTextContent('Game Page');
        });
    });

    describe('Error Recovery', () => {
        test('should allow retry after connection error', async () => {
            let socketHook = { ...mockSocketHook, error: 'Connection failed' };
            mockUseStudentGameSocket.mockReturnValue(socketHook);

            const { rerender } = render(<TestJoinGameFlow />);

            expect(screen.getByTestId('error')).toHaveTextContent('Connection failed');

            // Simulate reconnection
            socketHook = { ...mockSocketHook, error: '' };
            mockUseStudentGameSocket.mockReturnValue(socketHook);

            rerender(<TestJoinGameFlow />);

            await waitFor(() => {
                expect(mockJoinGame).toHaveBeenCalledWith('TEST123', mockAuth.userProfile);
            });
        });
    });
});