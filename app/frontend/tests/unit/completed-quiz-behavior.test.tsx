import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import TeacherDashboardClient from '@/components/TeacherDashboardClient';
import { AuthContext } from '@/components/AuthProvider';

// Mock socket.io-client's io function to always return our mockSocket
jest.mock('socket.io-client', () => ({
    io: () => mockSocket
}));

// Mock next/navigation's useRouter to prevent invariant error
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        refresh: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        pathname: '/',
        query: {},
    })
}));

// Mock window.location for redirect testing
const mockLocation = {
    href: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
};
Object.defineProperty(window, 'location', {
    value: mockLocation,
    writable: true,
});

// Use the same mock socket pattern as existing tests
const mockSocket = {
    connected: true,
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    onAny: jest.fn(),
    disconnect: jest.fn(),
};

// Helper: Provide a mock authenticated teacher context
const mockAuthContext = {
    userState: 'teacher' as const,
    userProfile: { username: 'Test Teacher', role: 'TEACHER' as const, userId: 'teacher-1' },
    isAuthenticated: true,
    isStudent: false,
    isTeacher: true,
    isLoading: false,
    teacherId: 'teacher-1',
    authError: null,
    refreshAuth: jest.fn(),
    logout: jest.fn(),
    setGuestProfile: jest.fn(),
    clearGuestProfile: jest.fn(),
    upgradeGuestToAccount: jest.fn(),
    universalLogin: jest.fn(),
    loginStudent: jest.fn(),
    registerStudent: jest.fn(),
    loginTeacher: jest.fn(),
    registerTeacher: jest.fn(),
    upgradeToTeacher: jest.fn(),
    updateProfile: jest.fn(),
    canCreateQuiz: jest.fn(() => true),
    canJoinGame: jest.fn(() => true),
    requiresAuth: jest.fn(() => false),
    getCurrentUserId: jest.fn(() => 'teacher-1'),
};

describe('TeacherDashboardClient - Completed Quiz Behavior', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockLocation.href = '';
    });

    const renderComponent = (props = {}) => {
        return render(
            <AuthContext.Provider value={mockAuthContext}>
                <TeacherDashboardClient code="TEST123" gameId="test-game" {...props} />
            </AuthContext.Provider>
        );
    };

    it('redirects to leaderboard when quiz is already completed on initial load', async () => {
        // Mock socket to emit completed quiz state on initial load
        mockSocket.on.mockImplementation((event, callback) => {
            if (event === 'game_control_state') {
                // Simulate receiving completed quiz state on initial load
                act(() => {
                    callback({
                        gameId: 'test-game',
                        accessCode: 'TEST123',
                        templateName: 'Test Quiz',
                        gameInstanceName: 'Test Instance',
                        status: 'completed', // Quiz is already completed when page loads
                        currentQuestionUid: null,
                        questions: [],
                        timer: {
                            status: 'stop',
                            timerEndDateMs: Date.now() + 60000,
                            questionUid: 'test-question'
                        },
                        answersLocked: false,
                        participantCount: 0,
                        answerStats: {}
                    });
                });
            }
        });

        renderComponent();

        // Wait for redirect to happen (only on initial load when already completed)
        await waitFor(() => {
            expect(mockLocation.href).toBe('/leaderboard/TEST123');
        });
    });

    it('does not redirect when quiz status changes to completed during session', async () => {
        let emitCallback: any = null;

        // Mock socket to emit active quiz state initially, then change to completed
        mockSocket.on.mockImplementation((event, callback) => {
            if (event === 'game_control_state') {
                emitCallback = callback;
                // Start with active quiz
                act(() => {
                    callback({
                        gameId: 'test-game',
                        accessCode: 'TEST123',
                        templateName: 'Test Quiz',
                        gameInstanceName: 'Test Instance',
                        status: 'active', // Initially active
                        currentQuestionUid: null,
                        questions: [],
                        timer: {
                            status: 'stop',
                            timerEndDateMs: Date.now() + 60000,
                            questionUid: 'test-question'
                        },
                        answersLocked: false,
                        participantCount: 0,
                        answerStats: {}
                    });
                });
            }
        });

        renderComponent();

        // Wait for initial state to be received
        await waitFor(() => {
            expect(mockLocation.href).toBe(''); // Should not redirect initially
        });

        // Now simulate the status changing to completed (like when clicking "cloturer")
        act(() => {
            emitCallback({
                gameId: 'test-game',
                accessCode: 'TEST123',
                templateName: 'Test Quiz',
                gameInstanceName: 'Test Instance',
                status: 'completed', // Status changes during session
                currentQuestionUid: null,
                questions: [],
                timer: {
                    status: 'stop',
                    timerEndDateMs: Date.now() + 60000,
                    questionUid: 'test-question'
                },
                answersLocked: false,
                participantCount: 0,
                answerStats: {}
            });
        });

        // Should NOT redirect when status changes during session
        await waitFor(() => {
            expect(mockLocation.href).toBe(''); // Should remain on dashboard
        });
    });

    it('shows completion message and disables controls when quiz is completed', async () => {
        // Mock socket to emit completed quiz state
        mockSocket.on.mockImplementation((event, callback) => {
            if (event === 'game_control_state') {
                act(() => {
                    callback({
                        gameId: 'test-game',
                        accessCode: 'TEST123',
                        templateName: 'Test Quiz',
                        gameInstanceName: 'Test Instance',
                        status: 'completed',
                        currentQuestionUid: null,
                        questions: [],
                        timer: {
                            status: 'stop',
                            timerEndDateMs: Date.now() + 60000,
                            questionUid: 'test-question'
                        },
                        answersLocked: false,
                        participantCount: 0,
                        answerStats: {}
                    });
                });
            }
        });

        renderComponent();

        // Wait for component to render with completed state
        await waitFor(() => {
            // Check completion message is shown
            expect(screen.getByText(/Le quiz est maintenant terminé/)).toBeInTheDocument();
            expect(screen.getByText(/Voir le classement final/)).toBeInTheDocument();
        });

        // Check that "Clôturer" button shows "Quiz Terminé"
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Quiz Terminé/ })).toBeInTheDocument();
        });

        // Check that the button is disabled
        const cloturerButton = screen.getByRole('button', { name: /Quiz Terminé/ });
        expect(cloturerButton).toBeDisabled();
    });

    it('shows normal state when quiz is active', async () => {
        // Mock socket to emit active quiz state
        mockSocket.on.mockImplementation((event, callback) => {
            if (event === 'game_control_state') {
                act(() => {
                    callback({
                        gameId: 'test-game',
                        accessCode: 'TEST123',
                        templateName: 'Test Quiz',
                        gameInstanceName: 'Test Instance',
                        status: 'active',
                        currentQuestionUid: null,
                        questions: [],
                        timer: {
                            status: 'stop',
                            timerEndDateMs: Date.now() + 60000,
                            questionUid: 'test-question'
                        },
                        answersLocked: false,
                        participantCount: 0,
                        answerStats: {}
                    });
                });
            }
        });

        renderComponent();

        // Wait for component to render
        await waitFor(() => {
            // Check that completion message is NOT shown
            expect(screen.queryByText(/Le quiz est maintenant terminé/)).not.toBeInTheDocument();
        });

        // Check that "Clôturer" button shows normal text
        await waitFor(() => {
            const cloturerButtons = screen.getAllByRole('button', { name: /Clôturer/ });
            expect(cloturerButtons.length).toBeGreaterThan(0);
        });
    });
});