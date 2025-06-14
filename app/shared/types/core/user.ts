/**
 * User-related shared types
 */

// User roles - should match Prisma schema enum
export type UserRole = 'STUDENT' | 'TEACHER'; // Use union type instead of enum for Prisma compatibility

// Base user interface
export interface User {
    id: string;
    username: string;
    email?: string;
    avatarEmoji?: string;
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
    avatarEmoji?: string;
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

// User profile update interface
export interface UserProfileUpdate {
    username?: string;
    avatarEmoji?: string;
    email?: string;
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
    avatar: string;
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
