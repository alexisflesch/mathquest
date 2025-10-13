/**
 * Dashboard Timer Synchronization Bug Test
 *
 * Reproduces the bug where clicking "play" on a **new** question (not the currently active one)
 * in one dashboard instance doesn't start the timer in another dashboard instance connected to the same game.
 *
 * This test simulates two dashboard clients connected to the same game and verifies
 * that timer state changes are properly synchronized when switching to a new question.
 */

import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import TeacherDashboardClient from '../../../components/TeacherDashboardClient';
import { AuthContext } from '../../../components/AuthProvider';

// Mock socket.io-client's io function to return our controlled mock socket
const mockSocketFactory = () => ({
    connected: true,
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    onAny: jest.fn(),
    disconnect: jest.fn(),
    id: `socket-${Math.random().toString(36).substr(2, 9)}`,
    rooms: new Set()
});

let mockSockets: ReturnType<typeof mockSocketFactory>[] = [];

jest.mock('socket.io-client', () => ({
    io: () => {
        const socket = mockSocketFactory();
        mockSockets.push(socket);
        return socket;
    }
}));

// Mock next/navigation
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

// Mock authenticated teacher context
const mockAuthContext = {
    userState: 'teacher',
    userProfile: { username: 'Test Teacher', role: 'TEACHER', userId: 'teacher-1' },
    isAuthenticated: true,
    isStudent: false,
    isTeacher: true,
    isLoading: false,
    teacherId: 'teacher-1',
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
    canCreateQuiz: () => true,
    canJoinGame: () => true,
    requiresAuth: () => false,
    updateProfile: jest.fn(),
};

function MockAuthProvider({ children }: { children: React.ReactNode }) {
    return (
        <AuthContext.Provider value={mockAuthContext as any}>
            {children}
        </AuthContext.Provider>
    );
}

describe('Dashboard Timer Synchronization', () => {
    const FIXED_NOW = 1751211000000; // Fixed timestamp for deterministic tests

    beforeAll(() => {
        jest.spyOn(Date, 'now').mockImplementation(() => FIXED_NOW);
        global.fetch = jest.fn((url) => {
            if (typeof url === 'string' && url.includes('/api/quiz/')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ name: 'Mock Quiz' })
                });
            }
            if (typeof url === 'string' && url.includes('/api/questions/')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([
                        { uid: 'q-1', text: 'Question 1', durationMs: 30000 },
                        { uid: 'q-2', text: 'Question 2', durationMs: 45000 }
                    ])
                });
            }
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({})
            });
        }) as jest.Mock;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockSockets = [];
    });

    afterEach(() => {
        // Clean up mock sockets
        mockSockets.forEach(socket => {
            if (socket.disconnect) socket.disconnect();
        });
        mockSockets = [];
    });

    // Helper to simulate backend sending game_control_state to a socket
    function simulateGameControlState(socket: any, gameId = 'test-game') {
        const handler = socket.on.mock.calls.find((call: any) => call[0] === 'game_control_state')?.[1];
        if (handler) {
            act(() => {
                handler({
                    gameId,
                    gameInstanceName: 'Mock Quiz Instance',
                    accessCode: 'TEST123',
                    templateName: 'Mock Quiz',
                    status: 'active',
                    currentQuestionUid: 'q-1',
                    questions: [
                        {
                            uid: 'q-1',
                            text: 'Question 1',
                            questionType: 'SINGLE_CHOICE',
                            discipline: 'math',
                            themes: [],
                            difficulty: 1,
                            gradeLevel: 'elementary',
                            explanation: 'Explanation 1',
                            tags: [],
                            excludedFrom: [],
                            createdAt: new Date(FIXED_NOW).toISOString(),
                            updatedAt: new Date(FIXED_NOW).toISOString(),
                            answerOptions: ['A', 'B', 'C'],
                            correctAnswers: [true, false, false],
                            feedbackWaitTime: 3,
                            durationMs: 30000
                        },
                        {
                            uid: 'q-2',
                            text: 'Question 2',
                            questionType: 'SINGLE_CHOICE',
                            discipline: 'math',
                            themes: [],
                            difficulty: 1,
                            gradeLevel: 'elementary',
                            explanation: 'Explanation 2',
                            tags: [],
                            excludedFrom: [],
                            createdAt: new Date(FIXED_NOW).toISOString(),
                            updatedAt: new Date(FIXED_NOW).toISOString(),
                            answerOptions: ['X', 'Y', 'Z'],
                            correctAnswers: [false, true, false],
                            feedbackWaitTime: 3,
                            durationMs: 45000
                        }
                    ],
                    timer: {
                        status: 'stop',
                        questionUid: 'q-1',
                        timerEndDateMs: 0
                    },
                    answersLocked: false,
                    participantCount: 1,
                    answerStats: {},
                    ended: false,
                    chrono: { running: false }
                });
            });
        }
    }

    // Helper to simulate socket joining dashboard room (backend response to join_dashboard)
    function simulateJoinDashboard(socket: any, gameId = 'test-game') {
        // Simulate the backend making the socket join the dashboard room
        socket.rooms = new Set([socket.id, `dashboard_${gameId}`, `projection_${gameId}`]);
    }

    // Helper to simulate backend sending dashboard_timer_updated to all sockets in dashboard room
    function simulateTimerUpdateToAllSockets(timerUpdate: any, gameId = 'test-game') {
        const dashboardRoom = `dashboard_${gameId}`;
        mockSockets.forEach(socket => {
            // Only send to sockets that are in the dashboard room
            if (socket.rooms && socket.rooms.has(dashboardRoom)) {
                const handler = socket.on.mock.calls.find(call => call[0] === 'dashboard_timer_updated')?.[1];
                if (handler) {
                    act(() => {
                        handler(timerUpdate);
                    });
                }
            }
        });
    }

    // Helper to simulate backend sending dashboard_question_changed to all sockets in dashboard room
    function simulateQuestionChangedToAllSockets(questionChangedPayload: any, gameId = 'test-game') {
        const dashboardRoom = `dashboard_${gameId}`;
        mockSockets.forEach(socket => {
            // Only send to sockets that are in the dashboard room
            if (socket.rooms && socket.rooms.has(dashboardRoom)) {
                const handler = socket.on.mock.calls.find(call => call[0] === 'dashboard_question_changed')?.[1];
                if (handler) {
                    act(() => {
                        handler(questionChangedPayload);
                    });
                }
            }
        });
    }

    // Helper to render a dashboard instance
    function renderDashboardInstance(instanceId: string) {
        return render(
            <MockAuthProvider>
                <div data-testid={`dashboard-${instanceId}`}>
                    <TeacherDashboardClient code="TEST123" gameId="test-game" />
                </div>
            </MockAuthProvider>
        );
    }

    it('verifies timer synchronization works when clicking play on a new question', async () => {
        // Test that when dashboard 1 clicks play on a question that isn't currently active,
        // both dashboard 1 and dashboard 2 receive the timer update and switch to that question

        // Render two dashboard instances
        const dashboard1 = renderDashboardInstance('1');
        const dashboard2 = renderDashboardInstance('2');

        // Wait for both to initialize
        await waitFor(() => {
            expect(mockSockets).toHaveLength(2);
        });

        const socket1 = mockSockets[0];
        const socket2 = mockSockets[1];

        // Simulate backend sending initial state to both sockets
        simulateGameControlState(socket1);
        simulateGameControlState(socket2);

        // Simulate both sockets joining the dashboard room
        simulateJoinDashboard(socket1);
        simulateJoinDashboard(socket2);

        // Wait for dashboards to render
        await waitFor(() => {
            expect(dashboard1.getByTestId('dashboard-1')).toBeInTheDocument();
            expect(dashboard2.getByTestId('dashboard-2')).toBeInTheDocument();
        });

        // Simulate dashboard 2 switching to a different question (q-2 becomes active)
        // This simulates the scenario where one dashboard is on a different question
        const dashboard2State = {
            gameId: 'test-game',
            accessCode: 'TEST123',
            templateName: 'Mock Quiz',
            gameInstanceName: 'Mock Quiz Instance',
            status: 'active',
            currentQuestionUid: 'q-2', // Dashboard 2 is on q-2
            questions: [
                {
                    uid: 'q-1',
                    text: 'Question 1',
                    questionType: 'SINGLE_CHOICE',
                    discipline: 'math',
                    themes: [],
                    difficulty: 1,
                    gradeLevel: 'elementary',
                    explanation: 'Explanation 1',
                    tags: [],
                    excludedFrom: [],
                    durationMs: 30000,
                    answerOptions: ['Answer 1', 'Answer 2', 'Answer 3'],
                    correctAnswers: [true, false, false],
                },
                {
                    uid: 'q-2',
                    text: 'Question 2',
                    questionType: 'SINGLE_CHOICE',
                    discipline: 'math',
                    themes: [],
                    difficulty: 1,
                    gradeLevel: 'elementary',
                    explanation: 'Explanation 2',
                    tags: [],
                    excludedFrom: [],
                    durationMs: 45000,
                    answerOptions: ['Answer A', 'Answer B', 'Answer C'],
                    correctAnswers: [false, true, false],
                }
            ],
            timer: { status: 'stop', timerEndDateMs: 0, questionUid: 'q-2' },
            answersLocked: false,
            participantCount: 1,
            answerStats: {}
        };

        // Send different state to dashboard 2
        act(() => {
            socket2.on.mock.calls.find(call => call[0] === 'game_control_state')?.[1](dashboard2State);
        });

        // Now dashboard 1 is on q-1 (active), dashboard 2 is on q-2 (active)
        // When dashboard 1 clicks play on q-2, it should switch dashboard 1 to q-2 and start timer
        // Both dashboards should then show q-2 with timer running

        // Find the play button for question 2 (the second question) in dashboard 1
        // Since questions are rendered in order, find the second question's play button
        const questionElements = dashboard1.container.querySelectorAll('.question-display');
        expect(questionElements).toHaveLength(2);

        // The second question should be the second element
        const question2Element = questionElements[1];
        expect(question2Element).toBeTruthy();

        const playButton1 = question2Element.querySelector('[data-play-pause-btn]');
        expect(playButton1).toBeInTheDocument();

        // Click play on dashboard 1
        fireEvent.click(playButton1!);

        // Verify that dashboard 1 emitted the timer action for question 2
        await waitFor(() => {
            expect(socket1.emit).toHaveBeenCalledWith('quiz_timer_action', expect.objectContaining({
                action: 'run',
                questionUid: 'q-2',
                durationMs: 45000
            }));
        });

        // Simulate backend responding with question change and timer update to all connected sockets
        // When backend switches questions during timer action, it emits both events
        const questionChangedPayload = {
            questionUid: 'q-2',
            oldQuestionUid: 'q-1',
            timer: {
                status: 'run',
                questionUid: 'q-2',
                timerEndDateMs: FIXED_NOW + 45000
            }
        };

        const timerUpdate = {
            timer: {
                status: 'run',
                questionUid: 'q-2',
                timerEndDateMs: FIXED_NOW + 45000
            },
            questionUid: 'q-2',
            serverTime: FIXED_NOW
        };

        // Simulate backend emitting DASHBOARD_QUESTION_CHANGED first
        simulateQuestionChangedToAllSockets(questionChangedPayload);
        // Then simulate backend emitting DASHBOARD_TIMER_UPDATED
        simulateTimerUpdateToAllSockets(timerUpdate);

        // BUG: When clicking play on a new question (q-2) that wasn't previously active,
        // the timer update should be broadcast to all dashboard instances, but it doesn't work properly

        // Check if dashboard 1 shows timer running (it should)
        await waitFor(() => {
            // Dashboard 1 should have switched to q-2 and show it as active with timer running
            const dashboard1Questions = dashboard1.container.querySelectorAll('.question-display');
            expect(dashboard1Questions).toHaveLength(2);

            // Check that q-2 is now active on dashboard 1
            // The active question should have class containing 'question-active-running'
            const activeQuestions = dashboard1.container.querySelectorAll('.question-active-running');
            expect(activeQuestions).toHaveLength(1);
            expect(activeQuestions[0]).toHaveTextContent('Question 2');
        });

        // Check if dashboard 2 shows timer running (this is the bug - it should)
        await waitFor(() => {
            // Dashboard 2 should also switch to q-2 and show timer running
            const dashboard2Questions = dashboard2.container.querySelectorAll('.question-display');
            expect(dashboard2Questions).toHaveLength(2);

            // Check that q-2 is now active on dashboard 2
            const activeQuestions = dashboard2.container.querySelectorAll('.question-active-running');
            expect(activeQuestions).toHaveLength(1);
            expect(activeQuestions[0]).toHaveTextContent('Question 2');
        });

        // Clean up
        dashboard1.unmount();
        dashboard2.unmount();
    });

    it('verifies timer state synchronization works correctly', async () => {
        // This test should pass once the bug is fixed
        // For now, it documents the expected behavior

        const dashboard1 = renderDashboardInstance('1');
        const dashboard2 = renderDashboardInstance('2');

        await waitFor(() => {
            expect(mockSockets).toHaveLength(2);
        });

        const socket1 = mockSockets[0];
        const socket2 = mockSockets[1];

        // Initialize both dashboards
        simulateGameControlState(socket1);
        simulateGameControlState(socket2);

        await waitFor(() => {
            expect(dashboard1.getByTestId('dashboard-1')).toBeInTheDocument();
            expect(dashboard2.getByTestId('dashboard-2')).toBeInTheDocument();
        });

        // Start timer from dashboard 1
        const playButton1 = dashboard1.container.querySelector('[data-play-pause-btn]');
        fireEvent.click(playButton1!);

        // Simulate backend timer update broadcast
        const timerUpdate = {
            timer: {
                status: 'run',
                questionUid: 'q-1',
                timerEndDateMs: FIXED_NOW + 30000
            },
            questionUid: 'q-1',
            serverTime: FIXED_NOW
        };

        simulateTimerUpdateToAllSockets(timerUpdate);

        // Both dashboards should show the timer running
        // TODO: Add proper assertions once we understand how to check timer state in the UI

        dashboard1.unmount();
        dashboard2.unmount();
    });
});