import React from 'react';
import { render, screen, act } from '@testing-library/react';
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

describe('Teacher dashboard numeric stats payload', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        for (const k of Object.keys(listeners)) delete listeners[k];
        mockSocket.connected = false;
    });

    it('accepts numeric stats shape without breaking MC stats path', async () => {
        render(
            <AuthContext.Provider value={mockAuth}>
                <TeacherDashboardClient code="TEST123" gameId="G1" />
            </AuthContext.Provider>
        );

        await act(async () => { mockSocket.connect(); });
        await act(async () => { jest.runOnlyPendingTimers(); });

        // Send a minimal valid GAME_CONTROL_STATE to set current question
        const state = {
            gameId: 'G1', accessCode: 'TEST123', templateName: 'T', gameInstanceName: 'I', status: 'active',
            currentQuestionUid: 'qN', questions: [{ uid: 'qN', text: '2+2?', questionType: 'numeric', discipline: 'math', durationMs: 10000, numericQuestion: { correctAnswer: 4 } }],
            timer: { status: 'stop', timerEndDateMs: Date.now() + 10000, questionUid: 'qN' }, answersLocked: false, participantCount: 1,
        };

        await act(async () => {
            (listeners[SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE] || []).forEach(fn => fn(state));
        });

        // Now send numeric stats update via DASHBOARD_ANSWER_STATS_UPDATE path
        const numericStatsPayload = { questionUid: 'qN', stats: { type: 'numeric', values: [3.9, 4.0, 4.2], totalAnswers: 3 } } as any;
        await act(async () => {
            (listeners[SOCKET_EVENTS.TEACHER.DASHBOARD_ANSWER_STATS_UPDATE] || []).forEach(fn => fn(numericStatsPayload));
        });

        // Toggle stats button should exist even if numeric stats present
        // (we assert by presence to ensure component didn't crash)
        expect(screen.getAllByTitle('Afficher/Masquer les statistiques globales').length).toBeGreaterThan(0);
    });
});
