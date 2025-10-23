/**
 * Regression test: live/[code] should redirect anonymous users to login
 * when client-side auth resolves to anonymous after a stale/invalid cookie.
 *
 * Context: Middleware only checks cookie presence and may allow /live/[code]
 * through even if the cookie is invalid post-deploy. The page must gracefully
 * redirect to /login?returnTo=/live/[code] instead of rendering nothing or a
 * perpetual loader.
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import LiveGamePage from '@/app/live/[code]/page';
import { useAuth } from '@/components/AuthProvider';
import { useParams, useRouter } from 'next/navigation';

jest.mock('next/navigation');
jest.mock('@/components/AuthProvider');
jest.mock('@/hooks/useStudentGameSocket', () => ({
    useStudentGameSocket: jest.fn().mockReturnValue({
        socket: null,
        gameState: {
            gameStatus: 'waiting',
            gameMode: 'tournament',
            connectedToRoom: false,
            currentQuestion: undefined,
            questionIndex: 0,
            totalQuestions: 0,
            answered: false,
            phase: 'lobby',
            leaderboard: [],
            lastAnswerFeedback: null,
            feedbackRemaining: null,
            correctAnswers: null,
            numericAnswer: null,
        },
        connected: false,
        error: null,
        joinGame: jest.fn(),
        submitAnswer: jest.fn(),
        requestNextQuestion: jest.fn(),
    })
}));

// Keep logger quiet
jest.mock('@/clientLogger', () => ({
    createLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }),
}));

describe('live/[code] redirects anonymous users to login', () => {
    const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
    const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;
    const mockUseRouter = useRouter as unknown as jest.Mock;

    let logoutMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        // Simulate route /live/ABC123
        (useParams as jest.Mock).mockReturnValue({ code: 'ABC123' });

        // Simulate client-side auth resolved to anonymous (invalid/stale cookie cleared)
        logoutMock = jest.fn();
        mockUseAuth.mockReturnValue({
            userState: 'anonymous',
            userProfile: {},
            isLoading: false,
            isAuthenticated: false,
            isStudent: false,
            isTeacher: false,
            teacherId: undefined,
            authError: 'Votre session a expiré. Veuillez vous reconnecter.',
            refreshAuth: jest.fn(),
            logout: logoutMock,
            setGuestProfile: jest.fn(),
            clearGuestProfile: jest.fn(),
            upgradeGuestToAccount: jest.fn(),
            universalLogin: jest.fn(),
            loginStudent: jest.fn(),
            registerStudent: jest.fn(),
            loginTeacher: jest.fn(),
            registerTeacher: jest.fn(),
            upgradeToTeacher: jest.fn(),
            canCreateQuiz: jest.fn().mockReturnValue(false),
            canJoinGame: jest.fn().mockReturnValue(false),
            requiresAuth: jest.fn().mockReturnValue(true),
            updateProfile: jest.fn(),
            getCurrentUserId: jest.fn(),
        } as any);

        // Mock router
        (useRouter as jest.Mock).mockReturnValue({
            push: jest.fn(),
            replace: jest.fn(),
            back: jest.fn(),
            forward: jest.fn(),
            refresh: jest.fn(),
            prefetch: jest.fn(),
        });
    });

    it('logs out then redirects to /login with returnTo param when user is anonymous', async () => {
        const router = useRouter();

        render(<LiveGamePage />);

        // Ensure we asked to clear any stale cookies before redirect
        expect(logoutMock).toHaveBeenCalledTimes(1);

        // Expect a client-side redirect to login with returnTo of current page
        // We use replace to avoid adding the broken page to history
        await waitFor(() => {
            expect(router.replace).toHaveBeenCalledWith('/login?returnTo=%2Flive%2FABC123');
        });
    });
});
