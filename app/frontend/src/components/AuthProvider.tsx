/**
 * Authentication Provider Component
 * 
 * This component manages the authentication state for the entire application,
 * providing context for both teacher and student authentication flows:
 * 
 * - Teacher authentication: Validated via server API calls and session cookies
 * - Student authentication: Managed via localStorage for anonymous participation
 * 
 * Key features:
 * - Provides authentication state (isAuthenticated, isStudent, isTeacher)
 * - Tracks loading state during authentication checks
 * - Offers a refreshAuth method for forcing re-authentication
 * - Stores teacherId for API calls requiring teacher identity
 * 
 * All components requiring authentication information should consume this context
 * using the useAuth hook exported from this file.
 */

"use client";
import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { createLogger } from '@/clientLogger';

// Create a logger for this component
const logger = createLogger('Auth');

// Define the shape of the context value
interface AuthContextType {
    refreshAuth: () => void;
    isAuthenticated: boolean;
    isStudent: boolean;
    isTeacher: boolean;
    isLoading: boolean; // <-- add this
    teacherId?: string;
}

// Create the context with an initial undefined value
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isStudent, setIsStudent] = useState(false);
    const [isTeacher, setIsTeacher] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Add loading state
    const [teacherId, setTeacherId] = useState<string | undefined>(undefined);

    const refreshAuth = useCallback(async () => {
        setIsLoading(true);
        let studentLoggedIn = false;
        let teacherLoggedIn = false;
        let fetchedTeacherId: string | undefined = undefined;

        // Check student status from localStorage (client-side only)
        if (typeof window !== 'undefined') {
            studentLoggedIn = !!localStorage.getItem('mathquest_username'); // MODIFIED: mathquest_username -> mathquest_username
        }

        // Check teacher status by calling the API route
        try {
            const response = await fetch('/api/auth/status');
            if (response.ok) {
                const data = await response.json();
                teacherLoggedIn = data.isTeacher;
                if (teacherLoggedIn && data.teacherId) {
                    fetchedTeacherId = data.teacherId;
                }
            } else {
                logger.error('Failed to fetch auth status');
            }
        } catch (error) {
            logger.error('Error fetching auth status:', error);
        }

        // Update state based on checks
        setIsStudent(studentLoggedIn);
        setIsTeacher(teacherLoggedIn);
        setIsAuthenticated(studentLoggedIn || teacherLoggedIn);
        setTeacherId(fetchedTeacherId);
        setIsLoading(false); // Finished loading

        logger.info('Refreshed Auth State', {
            studentLoggedIn,
            teacherLoggedIn,
            isAuthenticated: studentLoggedIn || teacherLoggedIn
        });
    }, []);

    useEffect(() => {
        refreshAuth(); // Initial check on mount
    }, [refreshAuth]);

    // Log state changes for debugging
    useEffect(() => {
        logger.debug('Auth State Updated', {
            isAuthenticated,
            isStudent,
            isTeacher,
            isLoading
        });
    }, [isAuthenticated, isStudent, isTeacher, isLoading]);

    // Provide the state and refresh function through context
    // Optionally, don't render children until loading is complete
    // if (!isLoading) { // Or show a loading indicator
    return (
        <AuthContext.Provider value={{ refreshAuth, isAuthenticated, isStudent, isTeacher, isLoading, teacherId }}>
            {children}
        </AuthContext.Provider>
    );
    // }
    // return null; // Or a loading spinner
}
