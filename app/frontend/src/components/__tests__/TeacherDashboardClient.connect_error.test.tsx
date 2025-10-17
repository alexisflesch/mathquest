/**
 * TeacherDashboardClient error handling under connect_error
 *
 * This test documents current behavior: on connect_error, dashboard sets a fatal error
 * message "Failed to connect to game server". This contrasts with the hook, which retries.
 */

import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import TeacherDashboardClient from '@/components/TeacherDashboardClient';
import { AuthContext } from '@/components/AuthProvider';
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
    useSearchParams: () => ({ get: jest.fn() }),
    usePathname: () => '/teacher/dashboard/TEST123',
    useParams: () => ({ code: 'TEST123' }),
}));
import { io } from 'socket.io-client';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('socket.io-client', () => {
    const handlers: Record<string, Function[]> = {};
    const socket = {
        id: 'test-socket',
        connected: false,
        on: jest.fn((event: string, cb: Function) => {
            handlers[event] = handlers[event] || [];
            handlers[event].push(cb);
            return socket;
        }),
        off: jest.fn(),
        emit: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
    } as any;
    return { io: jest.fn(() => socket) };
});

// Mock auth to make the component render its socket logic paths
jest.mock('@/hooks/useAuthState', () => ({
    useAuthState: () => ({ isAuthenticated: true, authLoading: false, role: 'TEACHER' }),
}));

jest.mock('@/hooks/useAccessGuard', () => ({
    useAccessGuard: () => ({ hasAccess: true, loading: false, error: null }),
}));

describe('TeacherDashboardClient connect_error behavior (document current UX)', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllTimers();
    });

    it('sets fatal error on connect_error (current behavior)', async () => {
        const mockAuth = {
            // minimal AuthContext API for useAuthState utilities
            userState: 'teacher',
            userProfile: { role: 'TEACHER', username: 'T', userId: 'T1' },
            canCreateQuiz: () => true,
            canJoinGame: () => true,
            requiresAuth: () => false,
            setGuestProfile: async () => { },
            logout: async () => { },
            login: async () => ({ success: true } as any),
            refreshAuth: async () => { },
            isLoading: false,
            isAuthenticated: true,
            isStudent: false,
            isTeacher: true,
            authError: null,
            teacherId: 'T1',
        } as any;

        render(
            <AuthContext.Provider value={mockAuth}>
                <TeacherDashboardClient code="TEST123" gameId="GAME123" />
            </AuthContext.Provider>
        );

        // Trigger connect_error event
        // Access the mocked socket from our jest.mock factory
        const mockedIoFactory = (io as unknown) as any;
        const socket = mockedIoFactory();
        const calls = (socket.on as jest.Mock).mock.calls as any[];
        const connectErrorHandlers = calls.filter(c => c[0] === 'connect_error').map(c => c[1]) as Function[];
        connectErrorHandlers.forEach(cb => cb(new Error('network')));

        // Expect the error text to appear
        await waitFor(() => {
            expect(screen.getByText(/Failed to connect to game server/i)).toBeInTheDocument();
        });
    });
});
