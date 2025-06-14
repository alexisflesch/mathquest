/**
 * Authentication Types
 * 
 * Re-exports shared authentication types and defines frontend-specific
 * authentication context and profile interfaces.
 */

// Import shared auth types instead of defining duplicates
import type { UserState, GuestProfileData } from '@shared/types';

// Re-export shared types for convenience
export type { UserState, GuestProfileData } from '@shared/types';

export interface UserProfile {
    username?: string;
    avatar?: string;
    email?: string;
    role?: 'STUDENT' | 'TEACHER';
    userId?: string;
    cookieId?: string;    // Pour les invités
}

export interface AuthContextType {
    // État principal
    userState: UserState;
    userProfile: UserProfile;

    // États de compatibilité (backward compatibility)
    isAuthenticated: boolean;
    isStudent: boolean;
    isTeacher: boolean;
    isLoading: boolean;
    teacherId?: string;

    // Méthodes principales
    refreshAuth: (force?: boolean) => void;
    logout: (redirectUrl?: string) => Promise<boolean>;

    // Nouvelles méthodes pour la gestion des invités
    setGuestProfile: (username: string, avatar: string) => Promise<void>;
    clearGuestProfile: () => void;
    upgradeGuestToAccount: (email: string, password: string) => Promise<import('@shared/types/api/responses').UpgradeAccountResponse>;

    // Méthodes d'authentification
    universalLogin: (email: string, password: string) => Promise<void>;
    loginStudent: (email: string, password: string) => Promise<void>;
    registerStudent: (email: string, password: string, username: string, avatar: string) => Promise<void>;
    loginTeacher: (email: string, password: string) => Promise<void>;
    registerTeacher: (email: string, password: string, username: string, adminPassword: string, avatar: string) => Promise<void>;

    // Méthodes de profil
    updateProfile: (data: { username: string; avatar: string }) => Promise<void>;

    // Méthodes utilitaires
    canCreateQuiz: () => boolean;
    canJoinGame: () => boolean;
    requiresAuth: () => boolean;
}

// GuestProfileData is now imported from shared types above
