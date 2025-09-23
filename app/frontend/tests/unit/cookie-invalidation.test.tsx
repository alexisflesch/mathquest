/**
 * Cookie Invalidation and Authentication Error Handling Tests
 *
 * Tests to reproduce and verify fixes for the issue where:
 * 1. Frontend doesn't properly recognize outdated/invalid cookies
 * 2. "Chargement en cours" spinner gets stuck when backend returns auth errors
 * 3. Users appear connected but can't access authenticated pages
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { jest } from '@jest/globals';
import { AuthProvider, useAuth } from '@/components/AuthProvider';
import LoadingScreen from '@/components/LoadingScreen';

// Mock the API module
jest.mock('@/config/api', () => ({
    makeApiRequest: jest.fn()
}));

// Get the mocked module
const mockedApi = jest.requireMock('@/config/api') as { makeApiRequest: jest.MockedFunction<any> };
const mockMakeApiRequest = mockedApi.makeApiRequest;

// Mock localStorage
const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock document.cookie
let mockCookies = '';
Object.defineProperty(document, 'cookie', {
    get: () => mockCookies,
    set: (value) => { mockCookies = value; }
});

// Test component that uses auth
function TestComponent() {
    const { userState, isLoading, userProfile } = useAuth();

    if (isLoading) {
        return <LoadingScreen message="Chargement..." />;
    }

    return (
        <div>
            <div data-testid="user-state">{userState}</div>
            <div data-testid="username">{userProfile.username || 'No username'}</div>
            <div data-testid="is-loading">{isLoading ? 'loading' : 'not-loading'}</div>
        </div>
    );
}

describe('Cookie Invalidation Scenarios', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockCookies = '';
        mockLocalStorage.getItem.mockClear();
        mockLocalStorage.setItem.mockClear();
        // Reset localStorage mock to return null by default
        mockLocalStorage.getItem.mockImplementation(() => null);
        mockLocalStorage.setItem.mockImplementation(() => { });
        mockLocalStorage.removeItem.mockImplementation(() => { });
    });

    describe('Invalid Cookie Handling', () => {
        test('should handle invalid cookies gracefully and not get stuck in loading', async () => {
            // Setup: User has localStorage data but invalid cookies
            mockLocalStorage.getItem.mockImplementation((key) => {
                if (key === 'mathquest_username') return 'TestUser';
                if (key === 'mathquest_avatar') return '🐼';
                if (key === 'mathquest_cookie_id') return 'guest_123';
                return null;
            });

            // Mock API call to auth/status to return anonymous (invalid cookies)
            mockMakeApiRequest.mockResolvedValue({
                authState: 'anonymous',
                cookiesFound: 0,
                cookieNames: [],
                hasAuthToken: false,
                hasTeacherToken: false,
                timestamp: new Date().toISOString()
            });

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            // Wait for the final anonymous state (may take multiple refresh cycles)
            await waitFor(() => {
                expect(screen.getByTestId('user-state')).toHaveTextContent('anonymous');
            }, { timeout: 2000 });

            // Should show anonymous state, not get stuck
            expect(screen.getByTestId('user-state')).toHaveTextContent('anonymous');
            expect(screen.getByTestId('is-loading')).toHaveTextContent('not-loading');
        });

        test('should handle API errors during auth check without infinite loading', async () => {
            // Setup: User has localStorage data but API call fails
            mockLocalStorage.getItem.mockImplementation((key) => {
                if (key === 'mathquest_username') return 'TestUser';
                if (key === 'mathquest_avatar') return '🐼';
                return null;
            });

            // Mock API call to fail (simulates network error or server issue)
            mockMakeApiRequest.mockRejectedValue(new Error('Network error'));

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            // Initially should show loading
            expect(screen.getByText('Chargement...')).toBeInTheDocument();

            // Wait for auth to complete despite error
            await waitFor(() => {
                expect(screen.queryByText('Chargement...')).not.toBeInTheDocument();
            }, { timeout: 5000 });

            // Should complete auth check and not be stuck loading
            expect(screen.getByTestId('is-loading')).toHaveTextContent('not-loading');
        });

        test('should handle expired JWT tokens gracefully', async () => {
            // Setup: User appears to have valid localStorage but JWT is expired
            mockLocalStorage.getItem.mockImplementation((key) => {
                if (key === 'mathquest_username') return 'TestUser';
                if (key === 'mathquest_avatar') return '🐼';
                return null;
            });

            // Set invalid cookies (expired token scenario)
            mockCookies = 'authToken=expired.jwt.token; teacherToken=also.expired.token';

            // Mock API to return anonymous due to expired tokens
            mockMakeApiRequest.mockResolvedValue({
                authState: 'anonymous',
                cookiesFound: 2, // Cookies exist but are invalid
                cookieNames: ['authToken', 'teacherToken'],
                hasAuthToken: true, // Cookie exists but invalid
                hasTeacherToken: true, // Cookie exists but invalid
                timestamp: new Date().toISOString()
            });

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            // Should not get stuck in loading
            await waitFor(() => {
                expect(screen.queryByText('Chargement...')).not.toBeInTheDocument();
            });

            // Should recognize invalid auth and show anonymous
            expect(screen.getByTestId('user-state')).toHaveTextContent('anonymous');
        });

        test('should handle app update cookie invalidation (user reported scenario)', async () => {
            // Setup: User has valid localStorage but cookies become invalid after app update
            mockLocalStorage.getItem.mockImplementation((key) => {
                if (key === 'mathquest_username') return 'TestUser';
                if (key === 'mathquest_avatar') return '�';
                return null;
            });

            // Mock API to return anonymous (cookies are invalid)
            mockMakeApiRequest.mockResolvedValue({
                authState: 'anonymous',
                cookiesFound: 0,
                cookieNames: [],
                hasAuthToken: false,
                hasTeacherToken: false,
                timestamp: new Date().toISOString()
            });

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            // Should not get stuck in loading
            await waitFor(() => {
                expect(screen.queryByText('Chargement...')).not.toBeInTheDocument();
            });

            // Wait for the final anonymous state
            await waitFor(() => {
                expect(screen.getByTestId('user-state')).toHaveTextContent('anonymous');
            }, { timeout: 2000 });

            // Should detect invalid cookies and clear them, forcing anonymous state
            expect(screen.getByTestId('user-state')).toHaveTextContent('anonymous');
            expect(screen.getByTestId('is-loading')).toHaveTextContent('not-loading');

            // Should have cleared localStorage data for invalid cookies
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('mathquest_username');
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('mathquest_avatar');
        });
    });

    describe('Loading State Management', () => {
        test('should not show loading indefinitely when auth check fails', async () => {
            // Setup: Normal user state
            mockLocalStorage.getItem.mockImplementation(() => null);

            // Mock API to fail repeatedly
            mockMakeApiRequest.mockRejectedValue(new Error('Server error'));

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            // Should eventually stop loading even with API errors
            await waitFor(() => {
                expect(screen.queryByText('Chargement...')).not.toBeInTheDocument();
            }, { timeout: 10000 });

            // Should complete the auth process
            expect(screen.getByTestId('is-loading')).toHaveTextContent('not-loading');
        });

        test('should handle rapid auth state changes without getting stuck', async () => {
            // Setup: User with valid localStorage
            mockLocalStorage.getItem.mockImplementation((key) => {
                if (key === 'mathquest_username') return 'TestUser';
                if (key === 'mathquest_avatar') return '🐼';
                return null;
            });

            // Mock API to return different states on subsequent calls
            let callCount = 0;
            mockMakeApiRequest.mockImplementation((): Promise<any> => {
                callCount++;
                if (callCount === 1) {
                    return Promise.resolve({
                        authState: 'student',
                        cookiesFound: 1,
                        cookieNames: ['authToken'],
                        hasAuthToken: true,
                        hasTeacherToken: false,
                        timestamp: new Date().toISOString(),
                        user: {
                            id: 'user123',
                            username: 'TestUser',
                            avatar: '🐼',
                            email: 'test@example.com',
                            role: 'STUDENT'
                        }
                    } as any);
                } else {
                    // Simulate cookie becoming invalid
                    return Promise.resolve({
                        authState: 'anonymous',
                        cookiesFound: 0,
                        cookieNames: [],
                        hasAuthToken: false,
                        hasTeacherToken: false,
                        timestamp: new Date().toISOString()
                    } as any);
                }
            });

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            // Should handle state transitions without getting stuck
            await waitFor(() => {
                expect(screen.queryByText('Chargement...')).not.toBeInTheDocument();
            });

            // Should eventually settle on a state
            expect(screen.getByTestId('is-loading')).toHaveTextContent('not-loading');
        });
    });

    describe('Error Recovery', () => {
        test('should allow user to recover from auth errors', async () => {
            // Setup: User with localStorage but API initially fails
            mockLocalStorage.getItem.mockImplementation((key) => {
                if (key === 'mathquest_username') return 'TestUser';
                if (key === 'mathquest_avatar') return '🐼';
                return null;
            });

            // Mock API to fail initially, then succeed
            let callCount = 0;
            mockMakeApiRequest.mockImplementation((): Promise<any> => {
                callCount++;
                if (callCount === 1) {
                    return Promise.reject(new Error('Network temporarily unavailable'));
                } else {
                    return Promise.resolve({
                        authState: 'anonymous',
                        cookiesFound: 0,
                        cookieNames: [],
                        hasAuthToken: false,
                        hasTeacherToken: false,
                        timestamp: new Date().toISOString()
                    } as any);
                }
            });

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            // Should eventually recover and not be stuck loading
            await waitFor(() => {
                expect(screen.queryByText('Chargement...')).not.toBeInTheDocument();
            }, { timeout: 10000 });

            // Should complete auth process
            expect(screen.getByTestId('is-loading')).toHaveTextContent('not-loading');
        });
    });
});