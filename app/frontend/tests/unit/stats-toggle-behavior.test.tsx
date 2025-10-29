import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import TeacherDashboardClient from '@/components/TeacherDashboardClient';
import { AuthContext } from '@/components/AuthProvider';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

// Capture handlers registered via socket.on
const listeners: Record<string, Function[]> = {};

// Mock socket.io-client's io function to always return our mockSocket
jest.mock('socket.io-client', () => ({
    io: () => mockSocket,
}));

// Mock next/navigation's useRouter
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

const mockSocket = {
    connected: true,
    emit: jest.fn(),
    on: jest.fn((event: string, cb: Function) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(cb);
    }),
    off: jest.fn((event: string, cb: Function) => {
        if (!listeners[event]) return;
        listeners[event] = listeners[event].filter(fn => fn !== cb);
    }),
    onAny: jest.fn(),
    disconnect: jest.fn(),
};

// Helper to emit a socket event to all registered listeners
function emitTo(event: string, payload: any) {
    (listeners[event] || []).forEach(fn => fn(payload));
}

// Mock authenticated teacher context
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

// Minimal initial GAME_CONTROL_STATE payload to exit loading
const initialGameState = {
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
        questionUid: 'q-1',
    },
    answersLocked: false,
    participantCount: 0,
    answerStats: {},
};

describe('TeacherDashboardClient - Stats Toggle Behavior', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        for (const k of Object.keys(listeners)) delete listeners[k];
    });

    const renderDashboard = () =>
        render(
            <AuthContext.Provider value={mockAuthContext as any}>
                <TeacherDashboardClient code="TEST123" gameId="test-game" />
            </AuthContext.Provider>
        );

    it('requests toggle and updates only after backend confirmation', async () => {
        // Arrange: when the hook registers listeners, emit initial game state to leave loading
        // We don't know the constant value here, but in runtime it's 'game_control_state'.
        // After render, the hook binds listeners with a small timeout; we simulate after that.
        const view = renderDashboard();

        // Wait for the dashboard to exit loading by sending game_control_state
        await waitFor(() => {
            expect(listeners[SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE]?.length).toBeGreaterThan(0);
        });
        await act(async () => {
            emitTo(SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE, initialGameState);
        });

        // Ensure initial backend-confirmed state is show=false for determinism
        await waitFor(() => {
            expect(listeners[SOCKET_EVENTS.TEACHER.TOGGLE_PROJECTION_STATS]?.length).toBeGreaterThan(0);
        });
        await act(async () => {
            emitTo(SOCKET_EVENTS.TEACHER.TOGGLE_PROJECTION_STATS, { show: false });
        });

        // Find the stats button by title (visible in both desktop and mobile)
        const statsButtons = await screen.findAllByTitle('Afficher/Masquer les statistiques globales');
        // Pick the desktop header button (has aria-pressed attribute)
        const statsButton = statsButtons.find(btn => (btn as HTMLElement).hasAttribute('aria-pressed')) as HTMLElement;
        expect(statsButton).toBeTruthy();
        // We forced initial backend-confirmed state to false above
        const initialPressed = false;

        // Act: click the button to request toggle
        fireEvent.click(statsButton);

        // Verify emit: backend request sent with the opposite of current state
        const emitCalls = mockSocket.emit.mock.calls.filter(([evt]) => evt === SOCKET_EVENTS.TEACHER.TOGGLE_PROJECTION_STATS);
        expect(emitCalls.length).toBeGreaterThan(0);
        const lastPayload = emitCalls[emitCalls.length - 1][1];
        expect(lastPayload).toMatchObject({ accessCode: 'TEST123', show: !initialPressed });

        // UI should NOT update optimistically
        expect(statsButton).toHaveAttribute('aria-pressed', initialPressed ? 'true' : 'false');

        // Ensure the toggle listener is registered, then simulate backend confirmation
        await waitFor(() => {
            expect(listeners[SOCKET_EVENTS.TEACHER.TOGGLE_PROJECTION_STATS]?.length).toBeGreaterThan(0);
        });
        const confirmedShow = true;
        await act(async () => {
            emitTo(SOCKET_EVENTS.TEACHER.TOGGLE_PROJECTION_STATS, { show: confirmedShow });
        });

        // Wait for UI to reflect backend-confirmed state
        await waitFor(() => {
            expect(statsButton).toHaveAttribute('aria-pressed', confirmedShow ? 'true' : 'false');
        });

        // End of single cycle validation

        // Cleanup to avoid act warnings
        view.unmount();
    });

    it('also reacts to canonical projection_show_stats confirmation', async () => {
        renderDashboard();
        await waitFor(() => {
            expect(listeners[SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE]?.length).toBeGreaterThan(0);
        });
        await act(async () => {
            emitTo(SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE, initialGameState);
        });

        // Force initial state to false to remove flake from any prior emissions
        await waitFor(() => {
            expect(listeners[SOCKET_EVENTS.TEACHER.TOGGLE_PROJECTION_STATS]?.length).toBeGreaterThan(0);
        });
        await act(async () => {
            emitTo(SOCKET_EVENTS.TEACHER.TOGGLE_PROJECTION_STATS, { show: false });
        });

        const statsButtons = await screen.findAllByTitle('Afficher/Masquer les statistiques globales');
        const statsButton = statsButtons.find(btn => (btn as HTMLElement).hasAttribute('aria-pressed')) as HTMLElement;
        expect(statsButton).toHaveAttribute('aria-pressed', 'false');

        // Confirm via canonical projector event name
        await waitFor(() => {
            expect(listeners[SOCKET_EVENTS.PROJECTOR.PROJECTION_SHOW_STATS]?.length).toBeGreaterThan(0);
        });
        await act(async () => {
            emitTo(SOCKET_EVENTS.PROJECTOR.PROJECTION_SHOW_STATS, { show: true });
        });
        await waitFor(() => {
            expect(statsButton).toHaveAttribute('aria-pressed', 'true');
        });
    });
});
