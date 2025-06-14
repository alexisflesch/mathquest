/**
 * User-related shared types
 */
export type UserRole = 'STUDENT' | 'TEACHER';
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
export interface PublicUser {
    id: string;
    username: string;
    email?: string;
    avatarEmoji?: string;
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
export interface UserProfileUpdate {
    username?: string;
    avatarEmoji?: string;
    email?: string;
}
export interface UserUpgradeData {
    email: string;
    password: string;
    targetRole: UserRole;
}
