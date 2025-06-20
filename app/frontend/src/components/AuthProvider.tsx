/**
 * Authentication Provider Component
 * 
 * This component manages the authentication state for the entire application,
 * supporting 4 distinct user states:
 * 
 * - anonymous: No username/avatar set, no account
 * - guest: Username/avatar set via localStorage, no account (cookieId)
 * - student: Full student account with email/password
 * - teacher: Teacher account with admin privileges
 * 
 * Key features:
 * - Provides comprehensive authentication state with userState enum
 * - Tracks user profile data (username, avatar, email, role, etc.)
 * - Supports guest profile management and upgrade to full accounts
 * - Maintains backward compatibility with existing isStudent/isTeacher flags
 * - Offers utility methods for access control (canCreateQuiz, canJoinGame, etc.)
 * 
 * All components requiring authentication information should consume this context
 * using the useAuth hook exported from this file.
 */

"use client";
import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { createLogger } from '@/clientLogger';
import { STORAGE_KEYS } from '@/constants/auth';
import { makeApiRequest } from '@/config/api';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import {
    AuthStatusResponseSchema,
    type AuthStatusResponse,
    RegisterResponseSchema,
    type RegisterResponse,
    UpgradeAccountResponseSchema,
    type UpgradeAccountResponse,
    type UpgradeRequest,
    LoginResponseSchema,
    type LoginResponse,
    UniversalLoginResponseSchema,
    type UniversalLoginResponse,
    ProfileUpdateResponseSchema,
    type ProfileUpdateResponse,
    TeacherUpgradeResponseSchema,
    type TeacherUpgradeResponse,
    LogoutResponseSchema,
    type LogoutResponse
} from '@shared/types/api/schemas';
import {
    UserState,
    UserProfile,
    AuthContextType as AuthContextTypeImport,
    GuestProfileData
} from '@/types/auth';

// Create a logger for this component
const logger = createLogger('Auth');

// Generate unique cookie ID for guests
function generateCookieId(): string {
    return 'guest_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Create the context with an initial undefined value
export const AuthContext = createContext<AuthContextTypeImport | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    // Nouveaux états pour le système 4-états
    const [userState, setUserState] = useState<UserState>('anonymous');
    const [userProfile, setUserProfile] = useState<UserProfile>({});

    // États de compatibilité (backward compatibility)
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isStudent, setIsStudent] = useState(false);
    const [isTeacher, setIsTeacher] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [teacherId, setTeacherId] = useState<string | undefined>(undefined);

    // Auth refresh caching to prevent excessive API calls
    const [lastAuthCheck, setLastAuthCheck] = useState<number>(0);
    const AUTH_CACHE_DURATION = 30000; // 30 seconds cache

    // Utility methods
    const canCreateQuiz = useCallback(() => {
        return userState === 'student' || userState === 'teacher';
    }, [userState]);

    const canJoinGame = useCallback(() => {
        return userState !== 'anonymous';
    }, [userState]);

    const requiresAuth = useCallback(() => {
        return userState === 'anonymous';
    }, [userState]);

    // Guest profile management
    const setGuestProfile = useCallback(async (username: string, avatar: string) => {
        if (typeof window === 'undefined') return;

        try {
            // Generate or get existing cookieId
            let cookieId = localStorage.getItem('mathquest_cookie_id');
            if (!cookieId) {
                cookieId = generateCookieId();
                localStorage.setItem('mathquest_cookie_id', cookieId);
            }

            // Register guest user in database so they can be found during upgrade
            try {
                const result = await makeApiRequest<RegisterResponse>(
                    '/api/auth/register',
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            username,
                            avatar,
                            cookieId,
                            role: 'STUDENT'
                            // No email/password for guest users
                        }),
                    },
                    undefined,
                    RegisterResponseSchema
                );

                if (result.success) {
                    logger.info('Guest user registered in database', { username, avatar, cookieId, userId: result.user.id });

                    // Store guest profile in localStorage
                    localStorage.setItem('mathquest_username', username);
                    localStorage.setItem('mathquest_avatar', avatar);

                    // Update state with userId from registration response
                    setUserState('guest');
                    setUserProfile({
                        username,
                        avatar,
                        cookieId,
                        userId: result.user.id // Include userId for guest users
                    });

                    logger.info('Guest profile set with userId', { username, avatar, cookieId, userId: result.user.id });
                    return; // Exit early since registration succeeded
                } else {
                    throw new Error('Registration failed: ' + (result.message || 'Unknown error'));
                }
            } catch (dbError) {
                // If user already exists in database, we need to look up their userId by cookieId
                logger.warn('Guest registration failed, attempting to lookup existing user', {
                    cookieId,
                    error: dbError instanceof Error ? dbError.message : 'Unknown error'
                });

                // Try to get the existing user by cookieId through the auth status endpoint
                try {
                    const statusResult = await makeApiRequest<AuthStatusResponse>(
                        '/api/auth/status',
                        {},
                        undefined,
                        AuthStatusResponseSchema
                    );
                    if (statusResult && statusResult.user && statusResult.user.id) {
                        // Found existing user - use their userId
                        setUserState('guest');
                        setUserProfile({
                            username,
                            avatar,
                            cookieId,
                            userId: statusResult.user.id
                        });

                        logger.info('Found existing guest user, profile updated with userId', {
                            username, avatar, cookieId, userId: statusResult.user.id
                        });
                        return;
                    }
                } catch (lookupError) {
                    logger.warn('Could not lookup existing user', { lookupError });
                }

                // If we can't find the user, create profile without userId
                // This will prevent game joining until the user re-registers
                logger.error('Could not establish userId for guest user - game joining will be blocked');
            }

            // Store guest profile in localStorage (fallback if registration failed)
            localStorage.setItem('mathquest_username', username);
            localStorage.setItem('mathquest_avatar', avatar);

            // Update state (fallback without userId if registration failed)
            setUserState('guest');
            setUserProfile({
                username,
                avatar,
                cookieId
                // Note: No userId if registration/lookup failed - this will require user to re-register
            });

            logger.info('Guest profile set', { username, avatar, cookieId });
        } catch (error) {
            logger.error('Error setting guest profile:', error);
            throw new Error('Impossible de sauvegarder le profil invité');
        }
    }, []);

    const clearGuestProfile = useCallback(() => {
        if (typeof window === 'undefined') return;

        try {
            // Explicitly log what we're clearing for debugging
            logger.info('Clearing guest profile from localStorage', {
                username: localStorage.getItem('mathquest_username'),
                avatar: localStorage.getItem('mathquest_avatar'),
                cookieId: localStorage.getItem('mathquest_cookie_id')
            });

            // Remove all guest-related items
            localStorage.removeItem('mathquest_username');
            localStorage.removeItem('mathquest_avatar');
            localStorage.removeItem('mathquest_cookie_id');

            // Update state to anonymous
            setUserState('anonymous');
            setUserProfile({});

            logger.info('Guest profile cleared successfully');
        } catch (error) {
            logger.error('Error clearing guest profile:', error);
        }
    }, []);

    const upgradeGuestToAccount = useCallback(async (email: string, password: string) => {
        if (userState !== 'guest') {
            throw new Error('Seuls les comptes invités peuvent être upgradés');
        }

        const cookieId = userProfile.cookieId;
        if (!cookieId) {
            throw new Error('Cookie ID manquant pour l\'upgrade');
        }

        try {
            const result = await makeApiRequest<UpgradeAccountResponse>(
                '/api/auth/upgrade',
                {
                    method: 'POST',
                    body: JSON.stringify({
                        cookieId,
                        email,
                        password,
                        targetRole: 'STUDENT'
                    } as UpgradeRequest),
                },
                undefined,
                UpgradeAccountResponseSchema
            );

            if (result.success && result.user && result.token) {
                // Clear guest data
                localStorage.removeItem('mathquest_cookie_id');

                // Update to student state
                setUserState('student');
                setUserProfile({
                    username: result.user.username,
                    avatar: result.user.avatar || '',
                    email: result.user.email,
                    role: result.user.role,
                    userId: result.user.id
                });

                logger.info('Guest account upgraded to student', {
                    userId: result.user.id,
                    email: result.user.email
                });

                return result;
            } else {
                throw new Error('Erreur lors de l\'upgrade du compte');
            }
        } catch (error) {
            logger.error('Error upgrading guest account:', error);
            throw error;
        }
    }, [userState, userProfile.cookieId]);

    const loginStudent = useCallback(async (email: string, password: string) => {
        try {
            const result = await makeApiRequest<UniversalLoginResponse>(
                '/api/auth/universal-login',
                {
                    method: 'POST',
                    body: JSON.stringify({ email, password }),
                },
                undefined,
                UniversalLoginResponseSchema
            );

            // Handle the union type - check if it's a student response
            if ('success' in result && result.success && 'user' in result && result.user && result.token) {
                // This is a student login response
                // Clear any guest data
                localStorage.removeItem('mathquest_cookie_id');

                // Update to student state
                setUserState('student');
                setUserProfile({
                    username: result.user.username,
                    avatar: result.user.avatar || '',
                    email: result.user.email,
                    role: result.user.role,
                    userId: result.user.id
                });

                logger.info('Student logged in', {
                    userId: result.user.id,
                    email: result.user.email
                });
            } else {
                throw new Error('Réponse de connexion inattendue ou échec de l\'authentification');
            }
        } catch (error) {
            logger.error('Error logging in student:', error);
            throw error;
        }
    }, []);

    const registerStudent = useCallback(async (email: string, password: string, username: string, avatar: string) => {
        try {
            const result = await makeApiRequest<RegisterResponse>(
                '/api/auth/register',
                {
                    method: 'POST',
                    body: JSON.stringify({ email, password, username, avatar, role: 'STUDENT' }),
                },
                undefined,
                RegisterResponseSchema
            );

            if (result.success && result.user && result.token) {
                // Clear any guest data
                localStorage.removeItem('mathquest_cookie_id');

                // Update to student state
                setUserState('student');
                setUserProfile({
                    username: result.user.username,
                    avatar: result.user.avatar || '',
                    email: result.user.email,
                    role: result.user.role,
                    userId: result.user.id
                });

                logger.info('Student registered', {
                    userId: result.user.id,
                    email: result.user.email
                });
            } else {
                throw new Error('Erreur lors de la création du compte');
            }
        } catch (error) {
            logger.error('Error registering student:', error);
            throw error;
        }
    }, []);

    const loginTeacher = useCallback(async (email: string, password: string) => {
        try {
            const result = await makeApiRequest<UniversalLoginResponse>(
                '/api/auth',
                {
                    method: 'POST',
                    body: JSON.stringify({ action: 'teacher_login', email, password }),
                },
                undefined,
                UniversalLoginResponseSchema
            );

            // Handle teacher login response (teacher format)
            if ('enseignantId' in result && result.enseignantId && result.token) {
                // Clear any guest data
                localStorage.removeItem('mathquest_cookie_id');

                // Update to teacher state
                setUserState('teacher');
                setUserProfile({
                    username: result.username || 'Teacher',
                    avatar: result.avatar || '👨‍🏫',
                    email: email,
                    role: 'TEACHER',
                    userId: result.enseignantId
                });

                logger.info('Teacher logged in', {
                    userId: result.enseignantId,
                    email: email
                });
            } else {
                throw new Error('Email ou mot de passe incorrect');
            }
        } catch (error) {
            logger.error('Error logging in teacher:', error);
            throw error;
        }
    }, []);

    const registerTeacher = useCallback(async (email: string, password: string, username: string, adminPassword: string, avatar: string) => {
        try {
            const result = await makeApiRequest<RegisterResponse>(
                '/api/auth',
                {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'teacher_register',
                        email,
                        password,
                        username,
                        adminPassword,
                        avatar
                    }),
                },
                undefined,
                RegisterResponseSchema
            );

            if (result.success && result.user && result.token) {
                // Clear any guest data
                localStorage.removeItem('mathquest_cookie_id');

                // Update to teacher state
                setUserState('teacher');
                setUserProfile({
                    username: result.user.username,
                    avatar: result.user.avatar || avatar,
                    email: result.user.email,
                    role: result.user.role,
                    userId: result.user.id
                });

                logger.info('Teacher registered', {
                    userId: result.user.id,
                    email: result.user.email
                });
            } else {
                throw new Error('Erreur lors de la création du compte enseignant');
            }
        } catch (error) {
            logger.error('Error registering teacher:', error);
            throw error;
        }
    }, []);

    const upgradeToTeacher = useCallback(async (adminPassword: string) => {
        try {
            const result = await makeApiRequest<TeacherUpgradeResponse>(
                '/api/auth/upgrade-to-teacher',
                {
                    method: 'POST',
                    body: JSON.stringify({ adminPassword }),
                },
                undefined,
                TeacherUpgradeResponseSchema
            );

            if (result.success && result.user && result.token) {
                // Update to teacher state
                setUserState('teacher');
                setUserProfile({
                    username: result.user.username,
                    avatar: result.user.avatar || '',
                    email: result.user.email,
                    role: result.user.role,
                    userId: result.user.id
                });

                logger.info('Student upgraded to teacher', {
                    userId: result.user.id,
                    email: result.user.email
                });
            } else {
                throw new Error('Erreur lors de l\'upgrade enseignant');
            }
        } catch (error) {
            logger.error('Error upgrading to teacher:', error);
            throw error;
        }
    }, []);

    const updateProfile = useCallback(async (data: { username: string; avatar: string }) => {
        try {
            if (userState === 'guest') {
                // For guests, update localStorage directly
                await setGuestProfile(data.username, data.avatar);
                return;
            }

            // For students and teachers, update via API
            const result = await makeApiRequest<ProfileUpdateResponse>(
                '/api/auth/profile',
                {
                    method: 'PUT',
                    body: JSON.stringify(data),
                },
                undefined,
                ProfileUpdateResponseSchema
            );

            if (result.success && result.user) {
                // Update local state
                setUserProfile(prev => ({
                    ...prev,
                    username: result.user!.username,
                    avatar: result.user!.avatar || ''
                }));

                logger.info('Profile updated', {
                    userId: result.user.id,
                    username: result.user.username
                });
            } else {
                throw new Error('Erreur lors de la mise à jour du profil');
            }
        } catch (error) {
            logger.error('Error updating profile:', error);
            throw error;
        }
    }, [userState, setGuestProfile]);

    // Use a stable callback for refreshAuth to avoid infinite loops
    const refreshAuth = useCallback(async (force = false) => {
        // Check if we should skip this refresh due to caching
        const now = Date.now();
        const timeSinceLastCheck = now - lastAuthCheck;

        if (!force && timeSinceLastCheck < AUTH_CACHE_DURATION) {
            logger.debug('Skipping auth refresh due to cache', {
                timeSinceLastCheck,
                cacheDuration: AUTH_CACHE_DURATION
            });
            return;
        }

        // Only show loading for forced refreshes or when cache is stale
        const shouldShowLoading = force || (timeSinceLastCheck > AUTH_CACHE_DURATION * 2);
        if (shouldShowLoading) {
            setIsLoading(true);
        }

        setLastAuthCheck(now);
        logger.info('Refreshing authentication state', { force, shouldShowLoading });

        let detectedState: UserState = 'anonymous';
        let profile: UserProfile = {};
        let studentLoggedIn = false;
        let teacherLoggedIn = false;
        let fetchedTeacherId: string | undefined = undefined;

        // Debug logging - what's in localStorage and cookies at refresh time?
        if (process.env.NODE_ENV !== 'production') {
            const allLocal: Record<string, string | null> = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) allLocal[key] = localStorage.getItem(key);
            }
            logger.debug('Current localStorage at refresh:', allLocal);
            logger.debug('Current cookies at refresh:', document.cookie);
        }

        // Check localStorage data (client-side only)
        if (typeof window !== 'undefined') {
            const username = localStorage.getItem('mathquest_username');
            const avatar = localStorage.getItem('mathquest_avatar');
            const cookieId = localStorage.getItem('mathquest_cookie_id');

            if (username && avatar) {
                // Has guest profile
                profile = { username, avatar, cookieId: cookieId || undefined };
                detectedState = 'guest';
            }
        }

        // Check teacher/student account status via API
        try {
            const response = await fetch('/api/auth/status', {
                method: 'GET',
                credentials: 'include' // Include cookies
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const rawData = await response.json();

            // Validate response with Zod schema
            let data: AuthStatusResponse;
            try {
                data = AuthStatusResponseSchema.parse(rawData);
                logger.debug('Auth status response validated successfully', { data });
            } catch (validationError) {
                logger.warn('Auth status response validation failed, using fallback', {
                    error: validationError,
                    receivedData: rawData
                });
                // Fallback to unvalidated data for backward compatibility
                data = rawData as AuthStatusResponse;
            }

            // Handle authentication state based on modern authState field
            if (data.authState === 'teacher') {
                // Teacher account
                detectedState = 'teacher';
                teacherLoggedIn = true;

                // Extract teacherId from cookie if needed
                if (typeof window !== 'undefined') {
                    // Try to get teacherId from the teacherToken cookie by decoding JWT
                    const match = document.cookie.match(/teacherToken=([^;]+)/);
                    if (match) {
                        try {
                            const token = match[1];
                            const payload = JSON.parse(atob(token.split('.')[1]));
                            fetchedTeacherId = payload.userId;
                            logger.debug('Extracted teacherId from JWT token', { teacherId: fetchedTeacherId });
                        } catch (e) {
                            logger.warn('Failed to decode teacherToken:', e);
                            // Fallback to localStorage
                            fetchedTeacherId = localStorage.getItem(STORAGE_KEYS.TEACHER_ID) || undefined;
                        }
                    } else {
                        // Fallback to localStorage
                        fetchedTeacherId = localStorage.getItem(STORAGE_KEYS.TEACHER_ID) || undefined;
                    }
                }

                if (data.user) {
                    profile = {
                        username: data.user.username,
                        avatar: data.user.avatar,
                        email: data.user.email,
                        role: data.user.role,
                        userId: data.user.id
                    };
                }
            } else if (data.authState === 'student') {
                // Student account 
                detectedState = 'student';
                studentLoggedIn = true;
                teacherLoggedIn = false;

                if (data.user) {
                    profile = {
                        username: data.user.username,
                        avatar: data.user.avatar,
                        email: data.user.email,
                        role: data.user.role,
                        userId: data.user.id
                    };
                }
            } else if (data.authState === 'guest') {
                // Guest user authenticated in database - preserve localStorage profile
                detectedState = 'guest';
                studentLoggedIn = false;
                teacherLoggedIn = false;

                // Keep existing localStorage profile, but add userId from database if available
                if (profile.username && profile.avatar && data.user?.id) {
                    profile.userId = data.user.id;
                    logger.debug('Guest user authenticated, preserving localStorage profile with database userId', {
                        localUsername: profile.username,
                        localAvatar: profile.avatar,
                        databaseUserId: data.user.id,
                        databaseUsername: data.user?.username,
                        databaseAvatar: data.user?.avatar
                    });
                } else {
                    // Fallback to database profile if localStorage is empty
                    if (data.user) {
                        profile = {
                            username: data.user.username,
                            avatar: data.user.avatar || '🐼',
                            cookieId: profile.cookieId,
                            userId: data.user.id
                        };
                        logger.debug('Guest user authenticated, using database profile as fallback', {
                            databaseUsername: data.user.username,
                            databaseAvatar: data.user.avatar
                        });
                    }
                }
            } else if (data.authState === 'anonymous') {
                // Check for fallback auth tokens (backward compatibility)
                if (data.hasTeacherToken) {
                    detectedState = 'teacher';
                    teacherLoggedIn = true;
                    fetchedTeacherId = localStorage.getItem(STORAGE_KEYS.TEACHER_ID) || undefined;
                } else if (data.hasAuthToken) {
                    detectedState = 'student';
                    studentLoggedIn = true;
                    teacherLoggedIn = false;
                }
            }

            logger.debug('Auth status response processed', {
                data,
                detectedState,
                teacherLoggedIn,
                studentLoggedIn,
                fetchedTeacherId
            });
        } catch (error) {
            logger.error('Error fetching auth status:', error);
        }

        // Update all states
        setUserState(detectedState);
        setUserProfile(profile);
        setIsStudent(studentLoggedIn);
        setIsTeacher(teacherLoggedIn);
        setIsAuthenticated(studentLoggedIn || teacherLoggedIn);
        setTeacherId(fetchedTeacherId);
        setIsLoading(false);

        logger.info('Refreshed Auth State', {
            userState: detectedState,
            studentLoggedIn,
            teacherLoggedIn,
            isAuthenticated: studentLoggedIn || teacherLoggedIn,
            profile: { ...profile, cookieId: profile.cookieId ? '[HIDDEN]' : undefined }
        });
    }, []);

    useEffect(() => {
        refreshAuth(true); // Initial check on mount - force refresh
    }, [refreshAuth]);

    // Log state changes for debugging
    useEffect(() => {
        // Debug: log localStorage and cookies on mount
        if (typeof window !== 'undefined') {
            const allLocal: Record<string, string | null> = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) allLocal[key] = localStorage.getItem(key);
            }
             
            console.log('[AuthProvider] localStorage:', allLocal);
             
            console.log('[AuthProvider] document.cookie:', document.cookie);
        }
    }, []);

    useEffect(() => {
        logger.debug('Auth State Updated', {
            userState,
            isAuthenticated,
            isStudent,
            isTeacher,
            isLoading,
            userProfile,
        });
    }, [userState, userProfile, isAuthenticated, isStudent, isTeacher, isLoading]);

    // Enhanced debug logging to help troubleshoot auth issues
    useEffect(() => {
        // Collect localStorage items
        const allLocal: Record<string, string | null> = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) allLocal[key] = localStorage.getItem(key);
        }

        // Log current state
        logger.debug('Auth State Snapshot:', {
            userState,
            isAuthenticated,
            isStudent,
            isTeacher,
            userProfile: {
                ...userProfile,
                // Don't log sensitive data
                cookieId: userProfile.cookieId ? '[HIDDEN]' : undefined,
            },
            localStorage: allLocal,
            clientCookies: document.cookie,
        });

        // Removed automatic auth refresh on window focus to prevent 
        // excessive loading states and interrupted login flows
        // Auth refresh now only happens on mount and manual triggers
    }, [userState, isAuthenticated, isStudent, isTeacher, userProfile, refreshAuth]);

    /**
     * Universal login that automatically detects whether user is a student or teacher
     * and sets the appropriate authentication state
     */
    const universalLogin = useCallback(async (email: string, password: string) => {
        try {
            const result = await makeApiRequest<UniversalLoginResponse>(
                '/api/auth/universal-login',
                {
                    method: 'POST',
                    body: JSON.stringify({ email, password }),
                },
                undefined,
                UniversalLoginResponseSchema
            );

            // Clear any guest data
            localStorage.removeItem('mathquest_cookie_id');

            // Handle teacher login response
            if ('enseignantId' in result && result.enseignantId && result.token) {
                setUserState('teacher');
                setUserProfile({
                    username: result.username || 'Teacher',
                    avatar: result.avatar || '👨‍🏫',
                    email: email,
                    role: 'TEACHER',
                    userId: result.enseignantId
                });

                // Update backward compatibility flags
                setIsAuthenticated(true);
                setIsTeacher(true);
                setIsStudent(false);
                setTeacherId(result.enseignantId);

                logger.info('Teacher logged in via universal login', {
                    userId: result.enseignantId,
                    email: email
                });
                return;
            }

            // Handle student login response
            if ('success' in result && result.success && 'user' in result && result.user && result.token) {
                setUserState('student');
                setUserProfile({
                    username: result.user.username,
                    avatar: result.user.avatar || '',
                    email: result.user.email,
                    role: result.user.role,
                    userId: result.user.id
                });

                // Update backward compatibility flags
                setIsAuthenticated(true);
                setIsStudent(true);
                setIsTeacher(false);
                setTeacherId(undefined);

                logger.info('Student logged in via universal login', {
                    userId: result.user.id,
                    email: result.user.email
                });
                return;
            }

            // If we get here, the response format wasn't recognized
            throw new Error('Format de réponse inattendu du serveur');

        } catch (error) {
            logger.error('Error in universal login:', error);
            throw error;
        }
    }, []);

    /**
     * Centralized logout function that handles all aspects of logging out:
     * - Clears localStorage
     * - Clears client-side cookies
     * - Calls the logout API to clear server-side cookies
     * - Updates auth state
     * 
     * Can be used from any component that needs to perform a logout
     */
    const logout = useCallback(async (redirectUrl?: string) => {
        logger.info('Performing logout');

        try {
            // Clear guest profile if applicable
            if (userState === 'guest') {
                clearGuestProfile();
            }

            // Clear localStorage items related to mathquest
            if (typeof window !== 'undefined') {
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('mathquest_')) {
                        logger.debug(`Removing localStorage item: ${key}`);
                        localStorage.removeItem(key);
                    }
                });
            }

            // Call frontend logout endpoint to clear HttpOnly cookies
            logger.debug('Calling frontend logout API at /api/auth/logout');
            try {
                const result = await makeApiRequest<LogoutResponse>(
                    '/api/auth/logout',
                    {
                        method: 'POST',
                    },
                    undefined,
                    LogoutResponseSchema
                );
                logger.debug('Server logout successful', { message: result.message });
            } catch (logoutError) {
                logger.warn('Logout API failed, continuing with client-side cleanup', { error: logoutError });
            }

            // Reset auth state
            setUserState('anonymous');
            setUserProfile({});
            setIsStudent(false);
            setIsTeacher(false);
            setIsAuthenticated(false);
            setTeacherId(undefined);

            logger.info('Logout completed successfully');

            // If a redirect URL was provided, navigate there
            if (redirectUrl && typeof window !== 'undefined') {
                logger.info(`Redirecting to ${redirectUrl}`);
                window.location.href = redirectUrl;
            }

            return true;
        } catch (error) {
            logger.error('Error during logout:', error);
            return false;
        }
    }, [userState, clearGuestProfile]);

    // Prepare context value
    const contextValue: AuthContextTypeImport = {
        // New 4-state system
        userState,
        userProfile,

        // Backward compatibility
        isAuthenticated,
        isStudent,
        isTeacher,
        isLoading,
        teacherId,

        // Methods
        refreshAuth,
        logout,
        setGuestProfile,
        clearGuestProfile,
        upgradeGuestToAccount,
        universalLogin,
        loginStudent,
        registerStudent,
        loginTeacher,
        registerTeacher,
        upgradeToTeacher,
        canCreateQuiz,
        canJoinGame,
        requiresAuth,
        updateProfile
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}
