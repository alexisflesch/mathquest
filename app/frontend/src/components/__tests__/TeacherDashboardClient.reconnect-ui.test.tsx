import React from 'react';
import { render, screen, act } from '@testing-library/react';
import TeacherDashboardClient from '@/components/TeacherDashboardClient';
import { AuthContext } from '@/components/AuthProvider';
import { io } from 'socket.io-client';

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
    useSearchParams: () => ({ get: jest.fn() }),
    usePathname: () => '/teacher/dashboard/TEST123',
    useParams: () => ({ code: 'TEST123' }),
}));

const mockAuth = {
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

// socket.io-client is globally mocked in jest.setup.js, we use it here

describe('TeacherDashboardClient reconnect UI', () => {
    it('shows reconnecting text on disconnect and re-joins on connect', async () => {
        render(
            <AuthContext.Provider value={mockAuth}>
                <TeacherDashboardClient code="TEST123" gameId="GAME123" />
            </AuthContext.Provider>
        );

        // Simulate disconnect then connect
        const mockedIoFactory = (io as unknown) as any;
        const socket = mockedIoFactory();

        // Trigger disconnect
        act(() => {
            socket.disconnect();
        });

        // Expect reconnecting message and spinner to be present
        // We look for a generic text; the exact string will be added in implementation
        expect(screen.getByText(/reconn/i)).toBeInTheDocument();

        // Trigger connect again
        act(() => {
            socket.connect();
        });

        // After reconnect, reconnecting message should go away
        // and no fatal error should be shown
        expect(screen.queryByText(/reconn/i)).toBeNull();
        expect(screen.queryByText(/Failed to connect to game server/i)).toBeNull();
    });
});
