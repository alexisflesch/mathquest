import React from 'react';
import { render, screen, act } from '@testing-library/react';
import TeacherDashboardClient from '@/components/TeacherDashboardClient';
import { AuthContext } from '@/components/AuthProvider';

const listeners: Record<string, Function[]> = {};

jest.mock('socket.io-client', () => ({ io: () => mockSocket }));

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
    useSearchParams: () => ({ get: jest.fn() }),
    usePathname: () => '/teacher/dashboard/TEST123',
    useParams: () => ({ code: 'TEST123' }),
}));

const mockSocket = {
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
    connect: jest.fn(() => { mockSocket.connected = true; (listeners['connect'] || []).forEach(fn => fn()); }),
    disconnect: jest.fn(() => { mockSocket.connected = false; (listeners['disconnect'] || []).forEach(fn => fn('io server disconnect')); }),
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

describe('Teacher dashboard error overlay', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        for (const k of Object.keys(listeners)) delete listeners[k];
        mockSocket.connected = false;
        // Default connect should NOT auto-succeed in this test suite
        // We override it per test to simulate connect_error path
        (mockSocket as any).connect = jest.fn(() => { /* no-op by default */ });
    });

    it('shows error UI when connect_error occurs and not reconnecting', async () => {
        // When the hook calls connect(), fire connect_error instead of connect
        (mockSocket as any).connect = jest.fn(() => {
            (listeners['connect_error'] || []).forEach(fn => fn(new Error('ECONNREFUSED')));
        });

        render(
            <AuthContext.Provider value={mockAuth}>
                <TeacherDashboardClient code="TEST123" gameId="G1" />
            </AuthContext.Provider>
        );

        // Expect error UI after the hook processes connect_error
        // Use findByText to allow state propagation
        expect(await screen.findByText(/Erreur:/i)).toBeInTheDocument();
        expect(await screen.findByText(/Failed to connect to game server/i)).toBeInTheDocument();
    });
});
