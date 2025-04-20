"use client";
import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';

// Define the shape of the context value
interface AuthContextType {
    refreshAuth: () => void;
    isAuthenticated: boolean;
    isStudent: boolean;
    isTeacher: boolean;
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
            studentLoggedIn = !!localStorage.getItem('mathquest_pseudo');
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
                console.error('Failed to fetch auth status');
            }
        } catch (error) {
            console.error('Error fetching auth status:', error);
        }

        // Update state based on checks
        setIsStudent(studentLoggedIn);
        setIsTeacher(teacherLoggedIn);
        setIsAuthenticated(studentLoggedIn || teacherLoggedIn);
        setTeacherId(fetchedTeacherId);
        setIsLoading(false); // Finished loading

        console.log('AuthProvider: Refreshed Auth State:', { studentLoggedIn, teacherLoggedIn, isAuthenticated: studentLoggedIn || teacherLoggedIn });
    }, []);

    useEffect(() => {
        refreshAuth(); // Initial check on mount
    }, [refreshAuth]);

    // Log state changes for debugging
    useEffect(() => {
        console.log('AuthProvider: State Updated:', { isAuthenticated, isStudent, isTeacher, isLoading });
    }, [isAuthenticated, isStudent, isTeacher, isLoading]);

    // Provide the state and refresh function through context
    // Optionally, don't render children until loading is complete
    // if (!isLoading) { // Or show a loading indicator
    return (
        <AuthContext.Provider value={{ refreshAuth, isAuthenticated, isStudent, isTeacher, teacherId }}>
            {children}
        </AuthContext.Provider>
    );
    // }
    // return null; // Or a loading spinner
}
