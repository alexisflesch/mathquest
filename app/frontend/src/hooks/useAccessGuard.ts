'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, ComponentType, ReactNode, createElement } from 'react';

export interface AccessGuardOptions {
    redirectTo?: string;
    requireMinimum?: 'guest' | 'student' | 'teacher';
    allowStates?: Array<'anonymous' | 'guest' | 'student' | 'teacher'>;
    onUnauthorized?: () => void;
}

/**
 * Hook for controlling access based on authentication state
 * 
 * @param options Configuration for access control
 * @returns Object with access status and utility functions
 */
export function useAccessGuard(options: AccessGuardOptions = {}) {
    const { userState, requiresAuth, canCreateQuiz, canJoinGame } = useAuth();
    const router = useRouter();

    const {
        redirectTo = '/login',
        requireMinimum,
        allowStates,
        onUnauthorized
    } = options;

    // Determine if access is allowed
    const isAllowed = (() => {
        if (allowStates) {
            return allowStates.includes(userState);
        }

        if (requireMinimum) {
            const stateHierarchy = ['anonymous', 'guest', 'student', 'teacher'];
            const requiredIndex = stateHierarchy.indexOf(requireMinimum);
            const currentIndex = stateHierarchy.indexOf(userState);
            return currentIndex >= requiredIndex;
        }

        return true; // No restrictions by default
    })();

    // Redirect if access is denied
    useEffect(() => {
        if (!isAllowed) {
            if (onUnauthorized) {
                onUnauthorized();
            } else {
                router.push(redirectTo);
            }
        }
    }, [isAllowed, router, redirectTo, onUnauthorized]);

    return {
        isAllowed,
        userState,
        hasMinimumAccess: (minimum: 'guest' | 'student' | 'teacher') => {
            const stateHierarchy = ['anonymous', 'guest', 'student', 'teacher'];
            const requiredIndex = stateHierarchy.indexOf(minimum);
            const currentIndex = stateHierarchy.indexOf(userState);
            return currentIndex >= requiredIndex;
        },
        canCreateQuiz: canCreateQuiz(),
        canJoinGame: canJoinGame(),
        requiresAuth: requiresAuth(),
        // Convenience methods
        isAnonymous: userState === 'anonymous',
        isGuest: userState === 'guest',
        isStudent: userState === 'student',
        isTeacher: userState === 'teacher',
        isAuthenticated: userState !== 'anonymous'
    };
}

/**
 * Higher-order component for protecting routes
 */
export function withAccessGuard<P extends object>(
    Component: ComponentType<P>,
    guardOptions: AccessGuardOptions = {}
): ComponentType<P> {
    return function GuardedComponent(props: P) {
        const { isAllowed } = useAccessGuard(guardOptions);

        if (!isAllowed) {
            // Return loading or null while redirecting
            return null;
        }

        return createElement(Component, props);
    };
}

/**
 * Component for conditionally rendering content based on access level
 */
export function AccessControl({
    children,
    requireMinimum,
    allowStates,
    fallback = null
}: {
    children: ReactNode;
    requireMinimum?: 'guest' | 'student' | 'teacher';
    allowStates?: Array<'anonymous' | 'guest' | 'student' | 'teacher'>;
    fallback?: ReactNode;
}): ReactNode {
    const { isAllowed } = useAccessGuard({ requireMinimum, allowStates });

    return isAllowed ? children : fallback;
}
