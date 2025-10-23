/**
 * Global auth redirect: protected routes should logout and redirect to login
 * when client auth resolves to anonymous or incomplete profile.
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import ClientLayout from '@/app/ClientLayout';
import { useAuth } from '@/components/AuthProvider';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

jest.mock('next/navigation');

// Mock AuthProvider to pass-through children and expose useAuth
jest.mock('@/components/AuthProvider', () => {
  const original = jest.requireActual('@/components/AuthProvider');
  return {
    __esModule: true,
    ...original,
    AuthProvider: ({ children }: any) => <>{children}</>,
    useAuth: jest.fn(),
  };
});

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Global auth guard in ClientLayout', () => {
  let logoutMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    (usePathname as jest.Mock).mockReturnValue('/profile');
    (useSearchParams as jest.Mock).mockReturnValue({
      get: () => null,
      toString: () => '',
    });

    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    });

    logoutMock = jest.fn().mockResolvedValue(true);

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
  });

  it('logs out and redirects to /login for protected route /profile', async () => {
    const router = useRouter();

    render(
      <ClientLayout>
        <div>Protected content</div>
      </ClientLayout>
    );

    expect(logoutMock).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/login?returnTo=%2Fprofile');
    });
  });

  it('does NOT redirect on public routes (e.g., /login)', async () => {
    (usePathname as jest.Mock).mockReturnValue('/login');
    const router = useRouter();

    render(
      <ClientLayout>
        <div>Login page</div>
      </ClientLayout>
    );

    // No logout, no redirect for a public route
    expect(logoutMock).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });
});
