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
    const { userState, isAuthenticated, isLoading } = useAuth();

    // Debug logging for development
    if (process.env.NODE_ENV === 'development') {
        console.log('NavbarStateManager - Current state:', {
            userState,
            isAuthenticated,
            isLoading,
            sidebarCollapsed
        });
    }

    // Show loading state during initial auth check to prevent hydration issues
    if (isLoading) {
        return (
            <div className="fixed left-0 top-0 z-40 h-screen w-64 bg-base-200 border-r border-base-300 hidden lg:block">
                <div className="flex h-full flex-col overflow-y-auto">
                    <div className="flex items-center justify-between p-4">
                        <h1 className="text-xl font-bold text-primary">MathQuest</h1>
                        <button className="btn btn-ghost btn-sm" disabled>
                            ☰
                        </button>
                    </div>
                    <div className="px-4 py-2">
                        <div className="flex items-center space-x-3 p-3 bg-base-300 rounded-lg">
                            <div className="skeleton w-10 h-10 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="skeleton h-4 w-20"></div>
                                <div className="skeleton h-3 w-16"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
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
