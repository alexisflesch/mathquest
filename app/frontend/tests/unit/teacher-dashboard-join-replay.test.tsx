import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import TeacherDashboardClient from '@/components/TeacherDashboardClient';
import { AuthContext } from '@/components/AuthProvider';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

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

const sampleState = {
    gameId: 'G1',
    accessCode: 'TEST123',
    templateName: 'T',
    gameInstanceName: 'I',
    status: 'active',
    currentQuestionUid: 'q42',
    questions: [],
    // Canonical timer state uses status: 'run' | 'pause' | 'stop'
    timer: { status: 'run', timerEndDateMs: Date.now() + 30000, questionUid: 'q42' },
    answersLocked: false,
    participantCount: 3,
    // Canonical answerStats for the CURRENT question only (legacy format supported)
    // Use simple record<string, number> representing percentages per answer index
    answerStats: { '0': 50, '1': 50 },
};

// Canonical timer update
const timerUpdate = { status: 'run', timerEndDateMs: Date.now() + 28000, questionUid: 'q42' };

describe('Teacher dashboard JOIN_DASHBOARD replay on connect', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        for (const k of Object.keys(listeners)) delete listeners[k];
        mockSocket.connected = false;
    });

    it('emits JOIN_DASHBOARD on connect and consumes state + timer events', async () => {
        render(
            <AuthContext.Provider value={mockAuth}>
                <TeacherDashboardClient code="TEST123" gameId="G1" />
            </AuthContext.Provider>
        );

        // Connect → expect JOIN_DASHBOARD
        await act(async () => { mockSocket.connect(); });
        // Flush deferred listener registration (bind uses setTimeout 0)
        await act(async () => { jest.runOnlyPendingTimers(); });

        await waitFor(() => {
            const joinCalls = mockSocket.emit.mock.calls.filter(([evt]) => evt === SOCKET_EVENTS.TEACHER.JOIN_DASHBOARD);
            expect(joinCalls.length).toBe(1);
            const [, payload] = joinCalls[0];
            expect(payload).toMatchObject({ accessCode: 'TEST123' });
        });

        // Emit GAME_CONTROL_STATE and a timer update to ensure handlers are wired
        await act(async () => {
            (listeners[SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE] || []).forEach(fn => fn(sampleState));
            (listeners[SOCKET_EVENTS.TEACHER.DASHBOARD_TIMER_UPDATED] || []).forEach(fn => fn(timerUpdate));
        });

        // UI hint: title or presence of controls indicates state has been ingested
        // We assert by existence of stats toggle control title to keep test stable
        await waitFor(() => {
            expect(screen.getAllByTitle('Afficher/Masquer les statistiques globales').length).toBeGreaterThan(0);
        });
    });
});
