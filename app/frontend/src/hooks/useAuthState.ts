'use client';

import { useAuth } from '@/components/AuthProvider';
import { useMemo } from 'react';

/**
 * Enhanced hook for accessing authentication state with additional utilities
 * 
 * This hook provides a more convenient interface for components that need
 * to make decisions based on the current authentication state.
 */
export function useAuthState() {
    const authContext = useAuth();

    const utilities = useMemo(() => ({
        // State checks
        isAnonymous: authContext.userState === 'anonymous',
        isGuest: authContext.userState === 'guest',
        isStudent: authContext.userState === 'student',
        isTeacher: authContext.userState === 'teacher',
        isAuthenticated: authContext.userState !== 'anonymous',
        hasAccount: ['student', 'teacher'].includes(authContext.userState),

        // Permission checks
        canCreateQuiz: authContext.canCreateQuiz(),
        canJoinGame: authContext.canJoinGame(),
        requiresAuth: authContext.requiresAuth(),

        // Profile utilities
        hasProfile: !!(authContext.userProfile.username && authContext.userProfile.avatar),
        hasEmail: !!authContext.userProfile.email,
        isProfileComplete: !!(
            authContext.userProfile.username &&
            authContext.userProfile.avatar &&
            authContext.userProfile.email
        ),

        // Navigation helpers
        getHomeRoute: () => {
            // All users use the main landing page now
            return '/';
        },

        getLoginRoute: () => {
            return authContext.userState === 'anonymous' ? '/login' : '/';
        },

        // Quick access helpers
        needsUpgrade: authContext.userState === 'guest',
        canUpgrade: authContext.userState === 'guest' && !!authContext.userProfile.cookieId,

        // Display helpers
        getDisplayName: () => {
            return authContext.userProfile.username || 'Utilisateur';
        },

        getDisplayAvatar: () => {
            return authContext.userProfile.avatar || '👤';
        },

        getUserRole: () => {
            return authContext.userProfile.role || null;
        },

        // Feature availability
        features: {
            canCreateTournament: ['student', 'teacher'].includes(authContext.userState),
            canJoinTournament: ['guest', 'student', 'teacher'].includes(authContext.userState),
            canAccessDashboard: authContext.userState === 'teacher',
            canSaveProgress: ['student', 'teacher'].includes(authContext.userState),
            canViewHistory: ['student', 'teacher'].includes(authContext.userState),
            canManageAccount: ['student', 'teacher'].includes(authContext.userState),
        }
    }), [authContext]);

    return {
        ...authContext,
        ...utilities
    };
}

/**
 * Hook for getting state-specific navigation items
 */
export function useNavigationItems() {
    const { userState } = useAuthState();

    return useMemo(() => {
        const baseItems = [
            { label: 'Accueil', href: '/', icon: 'Home' }
        ];

        switch (userState) {
            case 'anonymous':
                return [
                    ...baseItems,
                    { label: 'Se connecter', href: '/login', icon: 'LogIn' },
                ];

            case 'guest':
                return [
                    ...baseItems,
                    { label: 'Rejoindre un tournoi', href: '/student/join', icon: 'Users' },
                    { label: 'Entraînement libre', href: '/student/practice/session', icon: 'Dumbbell' },
                    { label: 'Créer un compte', href: '/login?mode=student', icon: 'UserPlus', highlight: true },
                ];

            case 'student':
                return [
                    ...baseItems,
                    { label: 'Entraînement libre', href: '/student/practice/session', icon: 'Dumbbell' },
                    { label: 'Rejoindre un tournoi', href: '/student/join', icon: 'Users' },
                    { label: 'Créer un tournoi', href: '/student/create-game', icon: 'PlusCircle' },
                    { label: 'Mes tournois', href: '/my-tournaments', icon: 'ClipboardList' },
                    { label: 'Espace enseignant', href: '/login?mode=teacher', icon: 'BookOpen' },
                ];

            case 'teacher':
                return [
                    ...baseItems,
                    { label: 'Tableau de bord', href: '/', icon: 'BarChart2' },
                    { label: 'Créer un quiz', href: '/teacher/quiz/create', icon: 'FilePlus' },
                    { label: 'Quiz existants', href: '/teacher/quiz/use', icon: 'ListChecks' },
                    { label: 'Résultats', href: '/teacher/results', icon: 'Monitor' },
                ];

            default:
                return baseItems;
        }
    }, [userState]);
}
