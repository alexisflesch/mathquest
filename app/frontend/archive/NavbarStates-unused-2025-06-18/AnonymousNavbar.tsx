/**
 * Anonymous User Navbar Component
 * 
 * Displayed when userState === 'anonymous'
 * - Shows warning message that user needs to set up profile
 * - Provides links to quick-access and login
 * - Minimal functionality - encourages authentication
 */

"use client";
import React from 'react';
import Link from 'next/link';
import { AlertTriangle, LogIn, UserPlus } from 'lucide-react';

interface AnonymousNavbarProps {
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
}

export default function AnonymousNavbar({ sidebarCollapsed, setSidebarCollapsed }: AnonymousNavbarProps) {
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

                    {/* Warning Section */}
                    <div className="px-4 py-2">
                        <div className="alert alert-warning">
                            <AlertTriangle size={16} />
                            {!sidebarCollapsed && (
                                <div className="text-sm">
                                    <div className="font-semibold">Profil requis</div>
                                    <div className="text-xs">Connectez-vous pour accéder aux fonctionnalités</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 px-4 py-2 space-y-2">
                        <Link
                            href="/login"
                            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-base-content hover:bg-base-300 transition-colors"
                        >
                            <LogIn size={20} />
                            {!sidebarCollapsed && <span>Se connecter</span>}
                        </Link>
                    </nav>

                    {/* Footer */}
                    {!sidebarCollapsed && (
                        <div className="p-4 text-center text-xs text-base-content/60">
                            MathQuest v1.0
                        </div>
                    )}
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
                    <div className="navbar-end">
                        <Link href="/login" className="btn btn-primary btn-sm">
                            <LogIn size={16} />
                            Connexion
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
