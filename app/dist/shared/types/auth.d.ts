/**
 * Auth Types
 * Authentication and authorization types
 */
export interface AuthUser {
    id: string;
    username: string;
    email?: string;
    avatar: string;
    role: 'STUDENT' | 'TEACHER' | 'ADMIN';
}
export interface AuthState {
    isAuthenticated: boolean;
    user: AuthUser | null;
    token: string | null;
    loading: boolean;
}
export interface LoginCredentials {
    email: string;
    password: string;
}
export interface RegisterData {
    username: string;
    email: string;
    password: string;
    role?: 'STUDENT' | 'TEACHER';
}
export interface UserState {
    user: AuthUser | null;
    isAuthenticated: boolean;
    loading: boolean;
}
export interface UserProfile extends AuthUser {
    createdAt?: string;
    updatedAt?: string;
    preferences?: any;
}
export interface AuthContextType {
    user: AuthUser | null;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => void;
    register: (data: RegisterData) => Promise<void>;
    isAuthenticated: boolean;
    loading: boolean;
}
export interface GuestProfileData {
    username: string;
    avatar?: string;
    cookieId?: string;
}
