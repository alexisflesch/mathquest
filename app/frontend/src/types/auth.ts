/**
 * Authentication Types
 * 
 * Defines the type system for the 4-state authentication system:
 * - anonymous: No username/avatar set
 * - guest: Username/avatar set, no account
 * - student: Full student account with email/password
 * - teacher: Teacher account with admin privileges
 */

export type UserState =
    | 'anonymous'           // Non connecté, pas de pseudo/avatar
    | 'guest'              // Pseudo/avatar définis, pas de compte
    | 'student'            // Compte étudiant complet
    | 'teacher'            // Compte enseignant

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
    upgradeGuestToAccount: (email: string, password: string) => Promise<import('@/types/api').UpgradeResponse>;

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

export interface GuestProfileData {
    username: string;
    avatar: string;
    cookieId: string;
}
