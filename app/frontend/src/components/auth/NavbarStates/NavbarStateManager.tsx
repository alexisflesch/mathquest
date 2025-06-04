/**
 * Navbar State Manager Component
 * 
 * Central orchestrator for the 4-state authentication navbar system:
 * - anonymous: Show warning + minimal navigation
 * - guest: Show limited features + upgrade prompts  
 * - student: Full student navigation
 * - teacher: Full teacher navigation with admin features
 * 
 * This component replaces the legacy AppNav.tsx compatibility system
 */

"use client";
import React, { Dispatch, SetStateAction } from 'react';
import { useAuth } from '../../AuthProvider';
import AnonymousNavbar from './AnonymousNavbar';
import GuestNavbar from './GuestNavbar';
import StudentNavbar from './StudentNavbar';
import TeacherNavbar from './TeacherNavbar';

interface NavbarStateManagerProps {
    sidebarCollapsed: boolean;
    setSidebarCollapsed: Dispatch<SetStateAction<boolean>>;
}

export default function NavbarStateManager({ sidebarCollapsed, setSidebarCollapsed }: NavbarStateManagerProps) {
    const { userState, isAuthenticated } = useAuth();

    // Debug logging for development
    if (process.env.NODE_ENV === 'development') {
        console.log('NavbarStateManager - Current state:', {
            userState,
            isAuthenticated,
            sidebarCollapsed
        });
    }

    // Render appropriate navbar based on authentication state
    switch (userState) {
        case 'anonymous':
            return (
                <AnonymousNavbar
                    sidebarCollapsed={sidebarCollapsed}
                    setSidebarCollapsed={setSidebarCollapsed}
                />
            );

        case 'guest':
            return (
                <GuestNavbar
                    sidebarCollapsed={sidebarCollapsed}
                    setSidebarCollapsed={setSidebarCollapsed}
                />
            );

        case 'student':
            return (
                <StudentNavbar
                    sidebarCollapsed={sidebarCollapsed}
                    setSidebarCollapsed={setSidebarCollapsed}
                />
            );

        case 'teacher':
            return (
                <TeacherNavbar
                    sidebarCollapsed={sidebarCollapsed}
                    setSidebarCollapsed={setSidebarCollapsed}
                />
            );

        default:
            // Fallback to anonymous navbar for any unexpected states
            console.warn('NavbarStateManager - Unknown userState:', userState, 'falling back to anonymous');
            return (
                <AnonymousNavbar
                    sidebarCollapsed={sidebarCollapsed}
                    setSidebarCollapsed={setSidebarCollapsed}
                />
            );
    }
}
