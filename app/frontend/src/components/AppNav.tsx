/**
 * Application Navigation Component
 * 
 * Enhanced version that combines the beautiful styling of the original AppNav
 * with the new 4-state authentication system (anonymous, guest, student, teacher).
 * 
 * Key features:
 * - Responsive design with collapsible sidebar for desktop and drawer for mobile
 * - Dynamic menu items based on new 4-state authentication system
 * - User profile display with avatar and username
 * - Theme switching functionality (light/dark/system)
 * - Sub-menu support for nested navigation options
 * - Logout and guest upgrade functionality
 * 
 * The component adapts its display and available options based on the user's
 * authentication state: anonymous, guest, student, or teacher.
 */

"use client";
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { makeApiRequest } from '@/config/api';
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
    LogIn,
    UserPlus,
    AlertTriangle,
    Menu,
    Sun,
    Moon,
    ClipboardList,
    User,
} from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';

export default function AppNav({ sidebarCollapsed, setSidebarCollapsed }: {
    sidebarCollapsed: boolean,
    setSidebarCollapsed: (c: boolean) => void
}) {
    const { userState, userProfile, logout, isLoading } = useAuth();
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Use userProfile from AuthProvider instead of local state
    const username = userProfile?.username || null;
    const avatar = userProfile?.avatar || null;

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

    // Handle disconnect/logout for all user types
    const handleDisconnect = async () => {
        console.log('[AppNav] Logout initiated');

        try {
            // Check if we're already on the landing page
            const isOnLandingPage = typeof window !== 'undefined' &&
                (window.location.pathname === '/' || window.location.pathname === '');

            // Only redirect if not already on landing page
            const redirectUrl = isOnLandingPage ? undefined : '/?loggedOut=true';

            // Use the centralized logout function from AuthProvider
            await logout(redirectUrl);
            console.log('[AppNav] Logout completed via AuthProvider');
        } catch (error) {
            console.error('[AppNav] Logout error:', error);

            // Fallback - only force redirect if not already on landing page
            if (typeof window !== 'undefined' &&
                window.location.pathname !== '/' &&
                window.location.pathname !== '') {
                window.location.href = '/?loggedOut=true';
            }
        }
    };

    // Icon mapping for menu items
    const iconMap = {
        'Accueil': Home,
        'Espace élève': GraduationCap,
        'Rejoindre un tournoi': Users,
        'Entraînement libre': Dumbbell,
        'Créer un tournoi': PlusCircle,
        'Mes tournois': ClipboardList,
        'Espace enseignant': BookOpen,
        'Utiliser un quiz existant': ListChecks,
        'Créer un quiz': FilePlus,
        'Consulter les résultats': BarChart2,
        'Déconnexion': LogOut,
        'Profil': User,
        'Mon profil': User,
        // New icons for 4-state system
        'Se connecter': LogIn,
        'Enregistrer mon compte': UserPlus,
        'Profil requis': AlertTriangle,
    };

    // Menu structure based on the new 4-state authentication system
    const menu = useMemo(() => {
        switch (userState) {
            case 'anonymous':
                // State 1: Not connected, no profile set up
                return [
                    { label: 'Accueil', href: '/' },
                    { label: 'Se connecter', href: '/login' },
                ];

            case 'guest':
            case 'student':
                // State 2 & 3: Guest (profile set but no account) and Student (full account)
                // Same menu for consistent student experience
                return [
                    { label: 'Accueil', href: '/' },
                    { label: 'Entraînement libre', href: '/student/create-game?training=true' },
                    { label: 'Rejoindre un tournoi', href: '/student/join' },
                    { label: 'Créer un tournoi', href: '/student/create-game' },
                    { label: 'Mes tournois', href: '/my-tournaments' },
                    { label: 'Profil', href: '/profile' },
                ];

            case 'teacher':
                // State 4: Teacher account with admin features
                return [
                    { label: 'Accueil', href: '/' },
                    { label: 'Entraînement libre', href: '/student/create-game?training=true' },
                    { label: 'Rejoindre un tournoi', href: '/student/join' },
                    { label: 'Créer un tournoi', href: '/student/create-game' },
                    { label: 'Mes tournois', href: '/my-tournaments' },
                    { type: 'section', label: 'Enseignant' },
                    { label: 'Créer un quiz', href: '/teacher/quiz/create' },
                    { label: 'Utiliser un quiz existant', href: '/teacher/quiz/use' },
                    { type: 'section', label: 'Compte' },
                    { label: 'Mon profil', href: '/profile' },
                ];

            default:
                // Fallback to anonymous state
                console.warn('Unknown userState:', userState, 'falling back to anonymous');
                return [
                    { label: 'Accueil', href: '/' },
                    { label: 'Se connecter', href: '/login' },
                ];
        }
    }, [userState]);

    // Animation controls for sidebar
    const sidebarControls = useAnimation();
    const COLLAPSED_WIDTH = 48; // px - smaller width to hide text and center icons
    const EXPANDED_WIDTH = 256; // px
    const ANIMATION_DURATION = 0.22; // seconds

    // Animate collapse/expand sequence (just width)
    useEffect(() => {
        sidebarControls.start({
            width: sidebarCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
            transition: { duration: ANIMATION_DURATION, ease: 'easeInOut' }
        });
    }, [sidebarCollapsed]);

    // Factored: SidebarRow component for animated/cropped row
    function SidebarRow({
        icon: Icon,
        label,
        children,
        href,
        sidebarCollapsed,
        align = 'left', // 'left' or 'center'
        ...props
    }: {
        icon: React.ElementType,
        label?: string,
        children?: React.ReactNode,
        href?: string,
        sidebarCollapsed: boolean,
        align?: 'left' | 'center',
        [key: string]: any
    }) {
        // Always use left alignment to keep consistent animation
        const content = (
            <div className="flex items-center min-w-0 w-full">
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm ml-2 whitespace-nowrap overflow-hidden text-ellipsis min-w-0 flex-1">
                    {label}
                    {children}
                </span>
            </div>
        );
        if (href) {
            return (
                <Link
                    href={href}
                    className={`flex items-center justify-start px-2 py-1.5 rounded hover:bg-gray-700 transition-colors h-[36px] text-white ${props.className || ''}`}
                    title={sidebarCollapsed ? label : undefined}
                    {...props}
                >
                    {content}
                </Link>
            );
        }
        return (
            <button
                type="button"
                className={`flex items-center justify-start px-2 py-1.5 rounded transition-colors w-full text-left h-[36px] text-white hover:bg-gray-700 ${props.className || ''}`}
                style={props.style}
                title={sidebarCollapsed ? label : undefined}
                {...props}
            >
                {content}
            </button>
        );
    }

    if (!mounted) return null;

    return (
        <>
            {/* Sidebar for large screens */}
            <motion.aside
                animate={sidebarControls}
                initial={{ width: sidebarCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
                className={`hidden md:flex md:flex-col md:h-screen md:fixed md:left-0 md:top-0 bg-[color:var(--navbar)] text-white z-40 overflow-y-auto overflow-x-hidden`}
                style={{ width: sidebarCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
            >
                {/* Header with burger menu and username/avatar */}
                <div className="relative px-3 py-1.5 hover:bg-gray-800 focus:outline-none flex-shrink-0 h-[44px] overflow-hidden">
                    {/* Burger menu - always visible, positioned absolutely on left */}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        aria-label={sidebarCollapsed ? 'Déplier le menu' : 'Réduire le menu'}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center flex-shrink-0 z-20"
                    >
                        <Menu className="w-5 h-5 flex-shrink-0" />
                    </button>

                    {/* Username + Avatar - positioned like other sidebar rows */}
                    {(userState === 'guest' || userState === 'student' || userState === 'teacher') && (
                        <div className="flex items-center justify-start h-full pl-10 pr-2 overflow-hidden">
                            {/* Username - positioned on the left, will be naturally cropped by sidebar overflow */}
                            <span className="text-sm whitespace-nowrap overflow-hidden min-w-0 flex-1 mr-3 text-right">
                                {username || (isLoading ? 'Chargement...' : userState === 'teacher' ? 'Enseignant' : 'Étudiant')}
                            </span>

                            {/* Avatar - positioned on the far right, very close to username */}
                            {avatar && (userState === 'guest' || userState === 'student' || userState === 'teacher') && (
                                <span className="w-8 h-8 text-lg rounded-full flex items-center justify-center emoji-avatar bg-[color:var(--muted)] border border-[color:var(--primary)] flex-shrink-0">
                                    {avatar}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Warning section for anonymous users */}
                {!sidebarCollapsed && userState === 'anonymous' && (
                    <div className="px-4 py-3 border-b border-white/10">
                        <div className="flex items-start space-x-2 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <div className="font-semibold text-yellow-300">Profil requis</div>
                                <div className="text-yellow-200/80 mt-1">
                                    Connectez-vous pour accéder aux fonctionnalités
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <nav className={`flex-1 p-1 space-y-1`}>
                    {menu.map((item, index) => {
                        const Icon = (iconMap as Record<string, typeof Home>)[item.label] || Home;
                        if (item.type === 'section') {
                            return (
                                <div key={`section-${index}`} className="pt-4 pb-1 relative h-6 flex items-center">
                                    <div className="flex items-center w-full px-2 relative">
                                        {/* Animated section text */}
                                        <motion.span
                                            className="text-xs font-semibold text-white/70 uppercase tracking-wider whitespace-nowrap pr-2"
                                            animate={{
                                                x: sidebarCollapsed ? -120 : 0,
                                                opacity: sidebarCollapsed ? 0 : 1
                                            }}
                                            transition={{ duration: ANIMATION_DURATION, ease: 'easeInOut' }}
                                        >
                                            {item.label}
                                        </motion.span>

                                        {/* Horizontal line - positioned after text in expanded, centered in collapsed */}
                                        {!sidebarCollapsed ? (
                                            <div className="border-t border-white/30 flex-1" />
                                        ) : (
                                            <div className="absolute inset-x-1 border-t border-white/30" />
                                        )}
                                    </div>
                                </div>
                            );
                        }
                        if (!item.href) return null;
                        return (
                            <SidebarRow
                                key={item.label}
                                icon={Icon}
                                label={item.label}
                                href={item.href as string}
                                sidebarCollapsed={sidebarCollapsed}
                                title={sidebarCollapsed ? item.label : undefined}
                            />
                        );
                    })}
                </nav>

                {/* Bottom section: Theme toggle and logout */}
                <div className="p-1 mt-auto flex flex-col gap-1">
                    {/* Separator line */}
                    {!sidebarCollapsed && (
                        <div className="border-t border-white/20 mb-2"></div>
                    )}

                    {/* Theme toggle (animated like others) */}
                    <SidebarRow
                        icon={theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor}
                        label={theme === 'light' ? 'Thème clair' : theme === 'dark' ? 'Thème sombre' : 'Thème système'}
                        sidebarCollapsed={sidebarCollapsed}
                        onClick={toggleTheme}
                        aria-label={theme === 'light' ? 'Passer en mode sombre' : theme === 'dark' ? 'Passer en mode système' : 'Passer en mode clair'}
                        style={{
                            color: theme === 'light' ? '#fbbf24' : theme === 'dark' ? '#60a5fa' : '#34d399'
                        }}
                    />

                    {/* Logout button (animated like others) */}
                    {(userState === 'guest' || userState === 'student' || userState === 'teacher') && (
                        <SidebarRow
                            icon={LogOut}
                            label="Déconnexion"
                            sidebarCollapsed={sidebarCollapsed}
                            onClick={handleDisconnect}
                            aria-label="Déconnexion"
                            style={{
                                color: 'white'
                            }}
                            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                                e.currentTarget.style.backgroundColor = '#dc2626';
                            }}
                            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                                e.currentTarget.style.backgroundColor = '';
                            }}
                        />
                    )}
                </div>
            </motion.aside>

            {/* Top bar for mobile only */}
            <div className="md:hidden" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '56px', zIndex: 100, background: 'var(--navbar)' }}>
                <div className="appnav-header-row h-14">
                    {/* Burger menu button */}
                    <button onClick={() => setOpen(o => !o)} aria-label="Ouvrir le menu" className="focus:outline-none">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* User section */}
                    <div className="appnav-user-section">
                        {userState === 'guest' ? (
                            <span className="guest-label">Invité</span>
                        ) : (userState === 'student' || userState === 'teacher') ? (
                            <>
                                {avatar && (
                                    <div className="w-8 h-8 text-lg rounded-full flex items-center justify-center emoji-avatar bg-[color:var(--muted)] border border-[color:var(--primary)] flex-shrink-0">
                                        {avatar}
                                    </div>
                                )}
                                {username ? (
                                    <span className="appnav-username">{username}</span>
                                ) : (
                                    <span className="appnav-username text-gray-300">
                                        {isLoading ? 'Chargement...' :
                                            userState === 'teacher' ? 'Enseignant' :
                                                'Étudiant'}
                                    </span>
                                )}
                            </>
                        ) : userState === 'anonymous' ? (
                            <span className="text-sm text-yellow-300">Non connecté</span>
                        ) : null}
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
                            {menu.map((item, index) => {
                                const Icon = (iconMap as Record<string, typeof Home>)[item.label] || Home;

                                // Handle section headers
                                if (item.type === 'section') {
                                    return (
                                        <div key={`mobile-section-${index}`} className="pt-3 pb-1">
                                            <div className="flex items-center gap-2 px-2">
                                                <div className="flex-1 border-t border-white/30"></div>
                                                <span className="text-xs font-semibold text-white/70 uppercase tracking-wider px-2">
                                                    {item.label}
                                                </span>
                                                <div className="flex-1 border-t border-white/30"></div>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={item.label}>
                                        {item.href && (
                                            <Link href={item.href} className="flex items-center gap-3 px-4 py-1.5 rounded hover:bg-gray-700 text-sm" onClick={() => setOpen(false)}>
                                                <Icon className="w-5 h-5" />
                                                <span>{item.label}</span>
                                            </Link>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Theme toggle and logout for mobile */}
                            <div className="pt-4 mt-4 border-t border-white/20 space-y-1">
                                <button onClick={() => { toggleTheme(); }}
                                    className={`flex items-center gap-3 w-full text-left px-4 py-1.5 rounded transition-colors text-sm ${theme === 'light' ? 'text-yellow-400' : theme === 'dark' ? 'text-blue-400' : 'text-green-400'}`}>
                                    {theme === 'light' && <Sun className="w-5 h-5" />}
                                    {theme === 'dark' && <Moon className="w-5 h-5" />}
                                    {theme === 'system' && <Monitor className="w-5 h-5" />}
                                    <span>
                                        {theme === 'light' ? 'Thème clair' : theme === 'dark' ? 'Thème sombre' : 'Thème système'}
                                    </span>
                                </button>

                                {(userState === 'guest' || userState === 'student' || userState === 'teacher') && (
                                    <button onClick={() => { setOpen(false); handleDisconnect(); }}
                                        className="flex items-center gap-3 w-full text-left px-4 py-1.5 rounded bg-gray-700 hover:bg-red-600 text-sm">
                                        <LogOut className="w-5 h-5" />
                                        <span>Déconnexion</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </nav>
                </div>
            )}
        </>
    );
}