/**
 * Application Navigation Component
 * 
 * This component provides the main navigation interface for the MathQuest application,
 * handling both desktop sidebar and mobile drawer navigation patterns.
 * 
 * Key features:
 * - Responsive design with collapsible sidebar for desktop and drawer for mobile
 * - Dynamic menu items based on user authentication state (teacher/student/unauthenticated)
 * - User profile display with avatar and username
 * - Theme switching functionality (light/dark/system)
 * - Sub-menu support for nested navigation options
 * - Logout functionality
 * 
 * The component adapts its display and available options based on the user's
 * authentication status and role within the application.
 */

"use client";
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider'; // Corrected import path
import Image from 'next/image';
import {
    Home,
    Users,
    Dumbbell,
    PlusCircle,
    BookOpen,
    ListChecks,
    FilePlus,
    BarChart2,
    Monitor,
    GraduationCap,
    LogOut,
    Menu,
    Sun,
    Moon,
    ClipboardList, // Ajout de l'icône ClipboardList
} from 'lucide-react';

export default function AppNav({ sidebarCollapsed, setSidebarCollapsed }: { sidebarCollapsed: boolean, setSidebarCollapsed: (c: boolean) => void }) {
    const { /* refreshAuth, */ isAuthenticated, isStudent, isTeacher } = useAuth();
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [pseudo, setPseudo] = useState<string | null>(null);
    const [avatar, setAvatar] = useState<string | null>(null);

    // Theme toggle state
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
        }
        return 'system';
    });
    // Track system theme
    const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(
        typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    );

    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            const mq = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? 'dark' : 'light');
            mq.addEventListener('change', handler);
            return () => mq.removeEventListener('change', handler);
        }
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const appliedTheme = theme === 'system' ? systemTheme : theme;
        document.documentElement.setAttribute('data-theme', appliedTheme);
        localStorage.setItem('theme', theme);
    }, [theme, mounted, systemTheme]);

    const toggleTheme = () => {
        setTheme(t => t === 'light' ? 'dark' : t === 'dark' ? 'system' : 'light');
    };

    useEffect(() => {
        async function fetchTeacherProfile(teacherId: string) {
            try {
                const res = await fetch(`/api/teacher/profile?id=${teacherId}`);
                if (res.ok) {
                    const data = await res.json();
                    setPseudo(data.pseudo || null);
                    setAvatar(data.avatar || null);
                    localStorage.setItem('mathquest_pseudo', data.pseudo || '');
                    localStorage.setItem('mathquest_avatar', data.avatar || '');
                }
            } catch (e) {
                setPseudo(null);
                setAvatar(null);
                console.error('Error fetching teacher profile:', e);
            }
        }
        if (isTeacher && typeof window !== 'undefined') {
            // Try to get teacherId from cookie if not in localStorage
            let teacherId = localStorage.getItem('mathquest_teacher_id');
            if (!teacherId) {
                // Try to get from cookie
                const match = document.cookie.match(/mathquest_teacher=([^;]+)/);
                if (match) teacherId = match[1];
            }
            if (teacherId) {
                fetchTeacherProfile(teacherId);
            } else {
                setPseudo(null);
                setAvatar(null);
            }
        } else if (isStudent && typeof window !== 'undefined') {
            setPseudo(localStorage.getItem('mathquest_pseudo'));
            setAvatar(localStorage.getItem('mathquest_avatar'));
        } else {
            setPseudo(null);
            setAvatar(null);
        }
    }, [isStudent, isTeacher]); // Re-run when isStudent or isTeacher changes

    // Add handleDisconnect function for menu actions
    const handleDisconnect = async () => {
        // Remove localStorage/session data if needed
        localStorage.removeItem('mathquest_pseudo');
        localStorage.removeItem('mathquest_avatar');
        localStorage.removeItem('mathquest_teacher_id');
        localStorage.removeItem('mathquest_cookie_id');
        // Optionally call logout API
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/';
    };

    // Icon mapping for menu items
    const iconMap = {
        'Accueil': Home,
        'Espace élève': GraduationCap,
        'Rejoindre un tournoi': Users,
        'Entraînement libre': Dumbbell,
        'Créer un tournoi': PlusCircle,
        'Mes tournois': ClipboardList, // Utilise ClipboardList pour "Mes tournois"
        'Espace enseignant': BookOpen,
        'Utiliser un quiz existant': ListChecks,
        'Créer un quiz': FilePlus,
        'Consulter les résultats': BarChart2,
        'Vidéoprojecteur': Monitor,
        'Déconnexion': LogOut,
    };

    // Menu structure based on authentication state
    const menu = useMemo(() => {
        if (!isAuthenticated) {
            return [
                { label: 'Accueil', href: '/' },
                { label: 'Espace élève', href: '/student' },
                { label: 'Espace enseignant', href: '/teacher/login' },
            ];
        }
        if (isTeacher) {
            return [
                { label: 'Accueil', href: '/' },
                { label: 'Entraînement libre', href: '/student/practice' },
                { label: 'Rejoindre un tournoi', href: '/student/join' },
                { label: 'Créer un tournoi', href: '/student/create-tournament' },
                { label: 'Mes tournois', href: '/my-tournaments' },
                {
                    label: 'Espace enseignant',
                    href: '/teacher/home',
                    submenu: [
                        { label: 'Utiliser un quiz existant', href: '/teacher/quiz/use' },
                        { label: 'Créer un quiz', href: '/teacher/quiz/create' },
                        { label: 'Vidéoprojecteur', href: '/teacher/projection' },
                    ],
                },
                { label: 'Déconnexion', action: handleDisconnect },
            ];
        }
        if (isStudent) {
            return [
                { label: 'Accueil', href: '/' },
                { label: 'Entraînement libre', href: '/student/practice' },
                { label: 'Rejoindre un tournoi', href: '/student/join' },
                { label: 'Créer un tournoi', href: '/student/create-tournament' },
                { label: 'Mes tournois', href: '/my-tournaments' },
                { label: 'Espace enseignant', href: '/teacher/login' },
                { label: 'Déconnexion', action: handleDisconnect },
            ];
        }
        return [];
    }, [isAuthenticated, isStudent, isTeacher]);

    if (!mounted) return null;

    return (
        <>
            {/* Sidebar for large screens */}
            <aside className={`hidden md:flex md:flex-col md:h-screen md:fixed md:left-0 md:top-0 bg-[color:var(--navbar)] text-white z-40 overflow-y-auto transition-all duration-200 ${sidebarCollapsed ? 'md:w-16' : 'md:w-64'}`}>
                {/* Header with burger and avatar/pseudo side by side */}
                <div className="relative w-full h-20 flex items-center">
                    <button
                        className="ml-2 flex items-center justify-center h-12 w-12 border-b border-white/10 hover:bg-gray-800 focus:outline-none z-10"
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        aria-label={sidebarCollapsed ? 'Déplier le menu' : 'Réduire le menu'}
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
                {(!sidebarCollapsed && (isTeacher || isStudent)) && (
                    <div className={`flex flex-col items-center justify-center h-32 pt-4 -mt-10`}>
                        {avatar ? (
                            <Image src={`/avatars/${avatar}`} alt="avatar" width={80} height={80} className="w-20 h-20 rounded-full mb-2 avatar-ring-primary" />
                        ) : (
                            <div className="w-20 h-20 rounded-full mb-2 bg-gray-700" />
                        )}
                        {pseudo ? (
                            <span className="text-lg font-semibold text-white drop-shadow">{pseudo}</span>
                        ) : (
                            <span className="text-lg font-semibold text-gray-500">{isTeacher ? 'Enseignant' : 'Loading...'}</span>
                        )}
                    </div>
                )}
                <nav className={`flex-1 p-4 space-y-0.5`}>
                    {menu.map((item) => {
                        const Icon = (iconMap as Record<string, typeof Home>)[item.label] || Home;
                        return (
                            <div key={item.label} className="group relative">
                                {item.href && !item.submenu && (
                                    <Link href={item.href} className={`flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-700 transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
                                        title={sidebarCollapsed ? item.label : undefined}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {!sidebarCollapsed && <span>{item.label}</span>}
                                    </Link>
                                )}
                                {item.href && item.submenu && (
                                    <>
                                        <Link href={item.href} className={`flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-700 font-bold transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
                                            title={sidebarCollapsed ? item.label : undefined}
                                        >
                                            <Icon className="w-5 h-5" />
                                            {!sidebarCollapsed && <span>{item.label}</span>}
                                        </Link>
                                        {sidebarCollapsed ? (
                                            <div className="flex flex-col items-center mt-1">
                                                {item.submenu.map((sub) => {
                                                    const SubIcon = (iconMap as Record<string, typeof Home>)[sub.label] || Home;
                                                    return (
                                                        <Link key={sub.href} href={sub.href} className="flex items-center justify-center px-2 py-2 rounded hover:bg-gray-700 transition-colors" title={sub.label}>
                                                            <SubIcon className="w-5 h-5" />
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="ml-8 mt-1 space-y-1">
                                                {item.submenu.map((sub) => {
                                                    const SubIcon = (iconMap as Record<string, typeof Home>)[sub.label] || Home;
                                                    return (
                                                        <Link key={sub.href} href={sub.href} className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-800 text-sm">
                                                            <SubIcon className="w-4 h-4" />
                                                            <span>{sub.label}</span>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                )}
                                {item.action && (
                                    <button onClick={item.action} className={`flex items-center gap-3 w-full text-left px-2 py-2 rounded bg-gray-700 hover:bg-red-600 mt-8 transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
                                        title={sidebarCollapsed ? item.label : undefined}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {!sidebarCollapsed && <span>{item.label}</span>}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </nav>
                {/* Theme toggle at the bottom, desktop only */}
                <div className="p-4 mt-auto flex flex-col gap-2">
                    <button
                        onClick={toggleTheme}
                        className={`flex items-center gap-2 px-2 py-1 rounded transition-colors text-sm h-8 w-full ${theme === 'light' ? ' text-yellow-400' : theme === 'dark' ? ' text-blue-400' : ' text-green-400'}`}
                        aria-label={
                            theme === 'light' ? 'Passer en mode sombre' :
                                theme === 'dark' ? 'Passer en mode système' :
                                    'Passer en mode clair'
                        }
                    >
                        {theme === 'light' && <Sun className="w-4 h-4" />}
                        {theme === 'dark' && <Moon className="w-4 h-4" />}
                        {theme === 'system' && <Monitor className="w-4 h-4" />}
                        {!sidebarCollapsed && (
                            <span>
                                {theme === 'light' ? 'Clair' : theme === 'dark' ? 'Sombre' : 'Système'}
                            </span>
                        )}
                    </button>
                </div>
            </aside>
            {/* Top bar for mobile only */}
            <div className="md:hidden" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '56px', zIndex: 100, background: 'var(--navbar)' }}>
                <div className="flex items-center justify-between h-14 px-4 text-white">
                    {/* Burger menu button on the left */}
                    <button onClick={() => setOpen(o => !o)} aria-label="Ouvrir le menu" className="focus:outline-none">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    {/* Avatar/Pseudo on the right */}
                    <div className="flex items-center gap-2">
                        {isTeacher ? (
                            <>
                                {avatar && <Image src={`/avatars/${avatar}`} alt="avatar" width={32} height={32} className="w-8 h-8 rounded-full avatar-ring-primary" />}
                                {pseudo && <span className="font-bold text-base">{pseudo}</span>}
                            </>
                        ) : isStudent && (
                            <>
                                {avatar && <Image src={`/avatars/${avatar}`} alt="avatar" width={32} height={32} className="w-8 h-8 rounded-full avatar-ring-primary" />}
                                {pseudo && <span className="font-bold text-base">{pseudo}</span>}
                            </>
                        )}
                    </div>
                </div>
            </div>
            {/* Drawer menu for small screens */}
            {open && (
                <div className="fixed inset-0 z-[200] bg-black bg-opacity-40">
                    {/* Overlay click closes menu with animation */}
                    <div className="absolute inset-0" onClick={() => setOpen(false)} />
                    <nav
                        className={`absolute left-0 top-0 w-64 h-full bg-[color:var(--navbar)] text-white p-0 shadow-lg transition-transform duration-300 transform ${open ? 'translate-x-0' : '-translate-x-full'}`}
                        style={{ willChange: 'transform' }}
                    >
                        {/* Header row: close icon left, theme toggle right */}
                        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
                            <button onClick={() => setOpen(false)} aria-label="Fermer le menu">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <Link
                                href="#"
                                onClick={e => { e.preventDefault(); toggleTheme(); }}
                                aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
                                className="flex items-center justify-center rounded hover:bg-gray-700 transition-colors h-10 w-10"
                            >
                                {theme === 'dark' && <Moon className="w-5 text-blue-400" />}
                                {theme === 'light' && <Sun className="w-5 text-yellow-400" />}
                                {theme === 'system' && <Monitor className="w-5 text-green-400" />}
                            </Link>
                        </div>
                        <div className="p-6 space-y-1">
                            {menu.map((item) => {
                                const Icon = (iconMap as Record<string, typeof Home>)[item.label] || Home;
                                return (
                                    <div key={item.label}>
                                        {item.href && !item.submenu && (
                                            <Link href={item.href} className="flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-700" onClick={() => setOpen(false)}>
                                                <Icon className="w-5 h-5" />
                                                <span>{item.label}</span>
                                            </Link>
                                        )}
                                        {item.href && item.submenu && (
                                            <>
                                                <Link href={item.href} className="flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-700 font-bold" onClick={() => setOpen(false)}>
                                                    <Icon className="w-5 h-5" />
                                                    <span>{item.label}</span>
                                                </Link>
                                                <div className="ml-8 mt-1 space-y-1">
                                                    {item.submenu.map(sub => {
                                                        const SubIcon = (iconMap as Record<string, typeof Home>)[sub.label] || Home;
                                                        return (
                                                            <Link key={sub.href} href={sub.href} className="flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-800 text-sm" onClick={() => setOpen(false)}>
                                                                <SubIcon className="w-4 h-4" />
                                                                <span>{sub.label}</span>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        )}
                                        {item.action && (
                                            <button onClick={() => { setOpen(false); item.action(); }} className="flex items-center gap-3 w-full text-left px-4 py-2 rounded bg-gray-700 hover:bg-red-600 mt-8">
                                                <Icon className="w-5 h-5" />
                                                <span>{item.label}</span>
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </nav>
                </div>
            )}
        </>
    );
}