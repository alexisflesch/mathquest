/**
 * User-related shared types
 */
export type UserRole = 'STUDENT' | 'TEACHER' | 'GUEST';
export interface User {
    id: string;
    username: string;
    email?: string;
    emailVerified?: boolean;
    avatarEmoji: string;
    role: UserRole;
    cookieId?: string;
    passwordHash?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface PublicUser {
    id: string;
    username: string;
    email?: string;
    emailVerified?: boolean;
    avatarEmoji: string;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
}
export interface UserRegistrationData {
    username: string;
    email?: string;
    password?: string;
    role: UserRole;
    avatarEmoji?: string;
    cookieId?: string;
}
export interface UserLoginData {
    email: string;
    password: string;
}
export interface UserUpgradeData {
    email: string;
    password: string;
    targetRole: UserRole;
}
export type UserState = 'anonymous' | 'guest' | 'student' | 'teacher';
export interface GuestProfileData {
    username: string;
    avatar: string;
    cookieId?: string;
}
export interface AuthResponse {
    success: boolean;
    user?: User;
    userState: UserState;
    token?: string;
    error?: string;
    message?: string;
}
