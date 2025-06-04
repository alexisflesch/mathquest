/**
 * Teacher User Navbar Component
 * 
 * Displayed when userState === 'teacher'
 * - Full navigation access for teachers
 * - Can create and manage games
 * - Access to teacher dashboard, analytics, student management
 * - Teacher-specific features like class management
 */

"use client";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
    Settings,
    GraduationCap,
    UserCheck,
    Calendar,
    TrendingUp
} from 'lucide-react';

interface TeacherNavbarProps {
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
}

export default function TeacherNavbar({ sidebarCollapsed, setSidebarCollapsed }: TeacherNavbarProps) {
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
                    <div className="flex h-16 items-center justify-between px-4 border-b border-base-300">
                        {!sidebarCollapsed && (
                            <Link href="/teacher" className="flex items-center space-x-2">
                                <Image
                                    src="/mathquest-logo.png"
                                    alt="MathQuest"
                                    width={32}
                                    height={32}
                                    className="rounded"
                                />
                                <span className="text-xl font-bold text-primary">MathQuest</span>
                            </Link>
                        )}
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="btn btn-ghost btn-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-4 space-y-1">
                        {/* Teacher Dashboard */}
                        <Link
                            href="/teacher"
                            className="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-base-300 transition-colors"
                        >
                            <Home className="w-5 h-5 mr-3" />
                            {!sidebarCollapsed && 'Dashboard'}
                        </Link>

                        {/* My Classes */}
                        <Link
                            href="/teacher/classes"
                            className="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-base-300 transition-colors"
                        >
                            <GraduationCap className="w-5 h-5 mr-3" />
                            {!sidebarCollapsed && 'My Classes'}
                        </Link>

                        {/* Student Management */}
                        <Link
                            href="/teacher/students"
                            className="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-base-300 transition-colors"
                        >
                            <UserCheck className="w-5 h-5 mr-3" />
                            {!sidebarCollapsed && 'Students'}
                        </Link>

                        {/* Create Game */}
                        <Link
                            href="/create"
                            className="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-base-300 transition-colors"
                        >
                            <PlusCircle className="w-5 h-5 mr-3" />
                            {!sidebarCollapsed && 'Create Game'}
                        </Link>

                        {/* Game Library */}
                        <Link
                            href="/teacher/games"
                            className="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-base-300 transition-colors"
                        >
                            <BookOpen className="w-5 h-5 mr-3" />
                            {!sidebarCollapsed && 'Game Library'}
                        </Link>

                        {/* Analytics */}
                        <Link
                            href="/teacher/analytics"
                            className="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-base-300 transition-colors"
                        >
                            <TrendingUp className="w-5 h-5 mr-3" />
                            {!sidebarCollapsed && 'Analytics'}
                        </Link>

                        {/* Reports */}
                        <Link
                            href="/teacher/reports"
                            className="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-base-300 transition-colors"
                        >
                            <BarChart2 className="w-5 h-5 mr-3" />
                            {!sidebarCollapsed && 'Reports'}
                        </Link>

                        {/* Practice Mode */}
                        <Link
                            href="/practice"
                            className="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-base-300 transition-colors"
                        >
                            <Dumbbell className="w-5 h-5 mr-3" />
                            {!sidebarCollapsed && 'Practice Mode'}
                        </Link>
                    </nav>

                    {/* User Profile Section */}
                    <div className="border-t border-base-300 p-3">
                        {!sidebarCollapsed ? (
                            <div className="space-y-2">
                                {/* User Info */}
                                <div className="flex items-center space-x-3 p-2 rounded-lg bg-base-300">
                                    <div className="avatar">
                                        <div className="w-8 h-8 rounded-full">
                                            <Image
                                                src={userProfile?.avatar || '/default-avatar.png'}
                                                alt="Teacher Avatar"
                                                width={32}
                                                height={32}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">
                                            {userProfile?.username || 'Teacher'}
                                        </div>
                                        <div className="text-xs text-base-content/60">
                                            Teacher Account
                                        </div>
                                    </div>
                                </div>

                                {/* Profile Actions */}
                                <Link
                                    href="/teacher/profile"
                                    className="flex items-center w-full px-3 py-2 text-sm text-left rounded-lg hover:bg-base-300 transition-colors"
                                >
                                    <User className="w-4 h-4 mr-3" />
                                    Profile Settings
                                </Link>

                                <Link
                                    href="/teacher/settings"
                                    className="flex items-center w-full px-3 py-2 text-sm text-left rounded-lg hover:bg-base-300 transition-colors"
                                >
                                    <Settings className="w-4 h-4 mr-3" />
                                    Account Settings
                                </Link>

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center w-full px-3 py-2 text-sm text-left rounded-lg hover:bg-base-300 transition-colors text-error"
                                >
                                    <LogOut className="w-4 h-4 mr-3" />
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="dropdown dropdown-right dropdown-end">
                                    <div tabIndex={0} role="button" className="btn btn-ghost btn-sm w-full p-1">
                                        <div className="avatar">
                                            <div className="w-6 h-6 rounded-full">
                                                <Image
                                                    src={userProfile?.avatar || '/default-avatar.png'}
                                                    alt="Teacher Avatar"
                                                    width={24}
                                                    height={24}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow border border-base-300">
                                        <li className="menu-title">
                                            <span>{userProfile?.username || 'Teacher'}</span>
                                        </li>
                                        <li><Link href="/teacher/profile">Profile Settings</Link></li>
                                        <li><Link href="/teacher/settings">Account Settings</Link></li>
                                        <li><button onClick={handleLogout} className="text-error">Logout</button></li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Header */}
            <div className="lg:hidden">
                <div className="flex items-center justify-between h-16 px-4 bg-base-200 border-b border-base-300">
                    {/* Menu Button */}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="btn btn-ghost btn-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Logo */}
                    <Link href="/teacher" className="flex items-center space-x-2">
                        <Image
                            src="/mathquest-logo.png"
                            alt="MathQuest"
                            width={28}
                            height={28}
                            className="rounded"
                        />
                        <span className="text-lg font-bold text-primary">MathQuest</span>
                    </Link>

                    {/* User Menu */}
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
                            <div className="avatar">
                                <div className="w-7 h-7 rounded-full">
                                    <Image
                                        src={userProfile?.avatar || '/default-avatar.png'}
                                        alt="Teacher Avatar"
                                        width={28}
                                        height={28}
                                    />
                                </div>
                            </div>
                        </div>
                        <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow border border-base-300">
                            <li className="menu-title">
                                <span>{userProfile?.username || 'Teacher'}</span>
                            </li>
                            <li><Link href="/teacher/profile">Profile Settings</Link></li>
                            <li><Link href="/teacher/settings">Account Settings</Link></li>
                            <li><button onClick={handleLogout} className="text-error">Logout</button></li>
                        </ul>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                {!sidebarCollapsed && (
                    <>
                        <div
                            className="fixed inset-0 z-30 bg-black bg-opacity-50"
                            onClick={() => setSidebarCollapsed(true)}
                        />
                        <div className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 bg-base-200 border-r border-base-300 overflow-y-auto">
                            <nav className="px-3 py-4 space-y-1">
                                <Link
                                    href="/teacher"
                                    className="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-base-300 transition-colors"
                                    onClick={() => setSidebarCollapsed(true)}
                                >
                                    <Home className="w-5 h-5 mr-3" />
                                    Dashboard
                                </Link>

                                <Link
                                    href="/teacher/classes"
                                    className="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-base-300 transition-colors"
                                    onClick={() => setSidebarCollapsed(true)}
                                >
                                    <GraduationCap className="w-5 h-5 mr-3" />
                                    My Classes
                                </Link>

                                <Link
                                    href="/teacher/students"
                                    className="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-base-300 transition-colors"
                                    onClick={() => setSidebarCollapsed(true)}
                                >
                                    <UserCheck className="w-5 h-5 mr-3" />
                                    Students
                                </Link>

                                <Link
                                    href="/create"
                                    className="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-base-300 transition-colors"
                                    onClick={() => setSidebarCollapsed(true)}
                                >
                                    <PlusCircle className="w-5 h-5 mr-3" />
                                    Create Game
                                </Link>

                                <Link
                                    href="/teacher/games"
                                    className="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-base-300 transition-colors"
                                    onClick={() => setSidebarCollapsed(true)}
                                >
                                    <BookOpen className="w-5 h-5 mr-3" />
                                    Game Library
                                </Link>

                                <Link
                                    href="/teacher/analytics"
                                    className="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-base-300 transition-colors"
                                    onClick={() => setSidebarCollapsed(true)}
                                >
                                    <TrendingUp className="w-5 h-5 mr-3" />
                                    Analytics
                                </Link>

                                <Link
                                    href="/teacher/reports"
                                    className="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-base-300 transition-colors"
                                    onClick={() => setSidebarCollapsed(true)}
                                >
                                    <BarChart2 className="w-5 h-5 mr-3" />
                                    Reports
                                </Link>

                                <Link
                                    href="/practice"
                                    className="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-base-300 transition-colors"
                                    onClick={() => setSidebarCollapsed(true)}
                                >
                                    <Dumbbell className="w-5 h-5 mr-3" />
                                    Practice Mode
                                </Link>
                            </nav>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
