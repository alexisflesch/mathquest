import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import TeacherDashboardClient from '@/components/TeacherDashboardClient';
import { AuthContext } from '@/components/AuthProvider';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

// Capture handlers registered via socket.on
const listeners: Record<string, Function[]> = {};

// Mock socket.io-client's io to return a controllable socket
jest.mock('socket.io-client', () => ({
    io: () => mockSocket,
}));

// Mock next/navigation to stabilize routing
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
    useSearchParams: () => ({ get: jest.fn() }),
    usePathname: () => '/teacher/dashboard/TEST123',
    useParams: () => ({ code: 'TEST123' }),
}));

const mockSocket = {
    id: 'sock1',
    connected: false,
    emit: jest.fn(),
    on: jest.fn((event: string, cb: Function) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(cb);
    }),
    off: jest.fn((event: string, cb: Function) => {
        if (!listeners[event]) return;
        listeners[event] = listeners[event].filter(fn => fn !== cb);
    }),
    connect: jest.fn(() => {
        mockSocket.connected = true;
        (listeners['connect'] || []).forEach(fn => fn());
    }),
    disconnect: jest.fn(() => {
        mockSocket.connected = false;
        (listeners['disconnect'] || []).forEach(fn => fn('transport close'));
    }),
};

const mockAuth = {
    userState: 'teacher',
    userProfile: { role: 'TEACHER', username: 'T', userId: 'T1' },
    canCreateQuiz: () => true,
    canJoinGame: () => true,
    requiresAuth: () => false,
    isLoading: false,
    isAuthenticated: true,
    isStudent: false,
    isTeacher: true,
    authError: null,
    teacherId: 'T1',
} as any;

// Minimal valid game state to exit loading quickly
const initialGameState = {
    gameId: 'G1',
    accessCode: 'TEST123',
    templateName: 'T',
    gameInstanceName: 'I',
    status: 'active',
    currentQuestionUid: null,
    questions: [],
    timer: { status: 'stop', timerEndDateMs: Date.now() + 60000, questionUid: 'q1' },
    answersLocked: false,
    participantCount: 0,
    answerStats: {},
};

describe('Teacher dashboard reconnect + JOIN replay', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        for (const k of Object.keys(listeners)) delete listeners[k];
        mockSocket.connected = false;
    });

    it('shows reconnect overlay on disconnect and removes it on reconnect', async () => {
        render(
            <AuthContext.Provider value={mockAuth}>
                <TeacherDashboardClient code="TEST123" gameId="G1" />
            </AuthContext.Provider>
        );

        // Connect → should emit JOIN_DASHBOARD and process game state
        await act(async () => {
            mockSocket.connect();
        });

        // Wait for JOIN_DASHBOARD emit
        await waitFor(() => {
            const calls = mockSocket.emit.mock.calls as any[];
            expect(calls.some(([evt]) => evt === SOCKET_EVENTS.TEACHER.JOIN_DASHBOARD)).toBe(true);
        });

        // Provide initial state so UI leaves loading
        await act(async () => {
            (listeners[SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE] || []).forEach(fn => fn(initialGameState));
        });

        // Now simulate a disconnect
        await act(async () => {
            mockSocket.disconnect();
        });

        // Reconnecting overlay should appear
        expect(screen.getByText(/Reconnexion/i)).toBeInTheDocument();

        // Reconnect
        await act(async () => {
            mockSocket.connect();
        });

        // JOIN_DASHBOARD should be re-emitted on connect
        await waitFor(() => {
            const joinCalls = mockSocket.emit.mock.calls.filter(([evt]) => evt === SOCKET_EVENTS.TEACHER.JOIN_DASHBOARD);
            expect(joinCalls.length).toBeGreaterThanOrEqual(2);
        });

        // Overlay should disappear
        expect(screen.queryByText(/Reconnexion/i)).toBeNull();
    });
});
