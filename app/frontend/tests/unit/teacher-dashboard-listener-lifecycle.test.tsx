import React from 'react';
import { render, act } from '@testing-library/react';
import TeacherDashboardClient from '@/components/TeacherDashboardClient';
import { AuthContext } from '@/components/AuthProvider';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

// Track socket listeners
const listeners: Record<string, Function[]> = {};

jest.mock('socket.io-client', () => ({ io: () => mockSocket }));

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

describe('Teacher dashboard listener lifecycle', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        for (const k of Object.keys(listeners)) delete listeners[k];
        mockSocket.connected = false;
    });

    it('does not accumulate duplicate handlers across unmount/remount', async () => {
        const mountOnce = () => render(
            <AuthContext.Provider value={mockAuth}>
                <TeacherDashboardClient code="TEST123" gameId="G1" />
            </AuthContext.Provider>
        );

        // Mount #1
        const r1 = mountOnce();
        await act(async () => { mockSocket.connect(); });
        await act(async () => { jest.runOnlyPendingTimers(); });

        // After bind, exactly one GAME_CONTROL_STATE handler
        expect((listeners[SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE] || []).length).toBe(1);

        // Unmount should remove handlers
        r1.unmount();
        // Emulate cleanup delay
        await act(async () => { jest.runOnlyPendingTimers(); });

        // All handlers for the event should be removed
        expect((listeners[SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE] || []).length).toBe(0);

        // Mount #2
        const r2 = mountOnce();
        await act(async () => { mockSocket.connect(); });
        await act(async () => { jest.runOnlyPendingTimers(); });

        // Again, only one handler registered
        expect((listeners[SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE] || []).length).toBe(1);

        r2.unmount();
    });
});
