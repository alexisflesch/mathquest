/**
 * Student User Navbar Component
 * 
 * Displayed when userState === 'student'
 * - Full navigation access for students
 * - Can create and join games
 * - Access to student home, practice mode, etc.
 * - User profile with full account features
 */

"use client";
import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../AuthProvider';
import {
    Home,
    Users,
    Dumbbell,
    PlusCircle,
    BookOpen,
    BarChart2,
    User,
    LogOut,
    Settings
} from 'lucide-react';

interface StudentNavbarProps {
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
}

export default function StudentNavbar({ sidebarCollapsed, setSidebarCollapsed }: StudentNavbarProps) {
    const { userProfile } = useAuth();

    const handleLogout = async () => {
        // TODO: Implement proper logout that clears JWT and redirects
        if (typeof window !== 'undefined') {
            localStorage.removeItem('mathquest_token');
            localStorage.removeItem('mathquest_username');
            localStorage.removeItem('mathquest_avatar');
            window.location.href = '/';
        }
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <div className={`fixed left-0 top-0 z-40 h-screen transition-transform bg-base-200 border-r border-base-300 ${sidebarCollapsed ? 'w-16' : 'w-64'} hidden lg:block`}>
                <div className="flex h-full flex-col overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4">
                        {!sidebarCollapsed && (
                            <h1 className="text-xl font-bold text-primary">MathQuest</h1>
                        )}
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="btn btn-ghost btn-sm"
                        >
                            ☰
                        </button>
                    </div>

                    {/* User Profile */}
                    <div className="px-4 py-2">
                        <div className="flex items-center space-x-3 p-3 bg-base-300 rounded-lg">
                            <div className="avatar">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl">
                                    {userProfile.avatar || '🐶'}
                                </div>
                            </div>
                            {!sidebarCollapsed && (
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-base-content truncate">
                                        {userProfile.username || 'Étudiant'}
                                    </div>
                                    <div className="text-xs text-base-content/60 flex items-center gap-1">
                                        <User size={12} />
                                        Compte étudiant
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 px-4 py-2 space-y-2">
                        <Link
                            href="/"
                            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-base-content hover:bg-base-300 transition-colors"
                        >
                            <Home size={20} />
                            {!sidebarCollapsed && <span>Accueil</span>}
                        </Link>

                        <Link
                            href="/student/join"
                            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-base-content hover:bg-base-300 transition-colors"
                        >
                            <Users size={20} />
                            {!sidebarCollapsed && <span>Rejoindre un jeu</span>}
                        </Link>

                        <Link
                            href="/student/create-game"
                            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-base-content hover:bg-base-300 transition-colors"
                        >
                            <PlusCircle size={20} />
                            {!sidebarCollapsed && <span>Créer un jeu</span>}
                        </Link>

                        <Link
                            href="/student/practice/session"
                            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-base-content hover:bg-base-300 transition-colors"
                        >
                            <Dumbbell size={20} />
                            {!sidebarCollapsed && <span>Mode pratique</span>}
                        </Link>

                        <div className="divider my-2"></div>

                        <Link
                            href="/my-tournaments"
                            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-base-content hover:bg-base-300 transition-colors"
                        >
                            <BarChart2 size={20} />
                            {!sidebarCollapsed && <span>Mes tournois</span>}
                        </Link>

                        <Link
                            href="/student/profile"
                            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-base-content hover:bg-base-300 transition-colors"
                        >
                            <User size={20} />
                            {!sidebarCollapsed && <span>Mon profil</span>}
                        </Link>
                    </nav>

                    {/* Footer */}
                    <div className="p-4">
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-error hover:bg-error/10 transition-colors w-full"
                        >
                            <LogOut size={20} />
                            {!sidebarCollapsed && <span>Se déconnecter</span>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Header */}
            <div className="lg:hidden">
                <div className="navbar bg-base-200 border-b border-base-300">
                    <div className="navbar-start">
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="btn btn-ghost"
                        >
                            ☰
                        </button>
                        <h1 className="text-lg font-bold text-primary ml-2">MathQuest</h1>
                    </div>
                    <div className="navbar-end space-x-2">
                        <div className="flex items-center space-x-2">
                            <div className="avatar">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-lg">
                                    {userProfile.avatar || '🐶'}
                                </div>
                            </div>
                            <span className="text-sm font-medium hidden sm:block">
                                {userProfile.username}
                            </span>
                        </div>
                        <div className="dropdown dropdown-end">
                            <label tabIndex={0} className="btn btn-ghost btn-sm">
                                <Settings size={16} />
                            </label>
                            <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                                <li>
                                    <Link href="/student/profile">
                                        <User size={16} />
                                        Mon profil
                                    </Link>
                                </li>
                                <li>
                                    <button onClick={handleLogout}>
                                        <LogOut size={16} />
                                        Se déconnecter
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
