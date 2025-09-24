/**
 * User-related shared types
 */

// User roles - should match Prisma schema enum
export type UserRole = 'STUDENT' | 'TEACHER' | 'GUEST'; // Use union type instead of enum for Prisma compatibility

// Base user interface
export interface User {
    id: string;
    username: string;
    email?: string;
    emailVerified?: boolean;
    avatarEmoji: string; // Mandatory - defaults to 🐼 panda emoji
    role: UserRole;
    cookieId?: string;
    passwordHash?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Public user interface (without sensitive data)
export interface PublicUser {
    id: string;
    username: string;
    email?: string;
    emailVerified?: boolean;
    avatarEmoji: string; // Mandatory - consistent with User interface
    role: UserRole;
    createdAt: string;
    updatedAt: string;
}

// User creation/registration interface
export interface UserRegistrationData {
    username: string;
    email?: string;
    password?: string;
    role: UserRole;
    avatarEmoji?: string;
    cookieId?: string;
}

// User login data interface
export interface UserLoginData {
    email: string;
    password: string;
}

// User upgrade data interface
export interface UserUpgradeData {
    email: string;
    password: string;
    targetRole: UserRole;
}

// Authentication state types for frontend
export type UserState = 'anonymous' | 'guest' | 'student' | 'teacher';

// Guest profile data for temporary users
export interface GuestProfileData {
    username: string;
    avatar: string; // Mandatory - guests must have an avatar for display
    cookieId?: string;
}

// Authentication response interface
export interface AuthResponse {
    success: boolean;
    user?: User;
    userState: UserState;
    token?: string;
    error?: string;
    message?: string;
}
