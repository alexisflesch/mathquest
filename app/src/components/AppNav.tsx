"use client";
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider'; // Corrected import path
import Image from 'next/image';

export default function AppNav() {
    const { refreshAuth, isAuthenticated, isStudent, isTeacher } = useAuth();
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [pseudo, setPseudo] = useState<string | null>(null);
    const [avatar, setAvatar] = useState<string | null>(null);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        async function fetchTeacherProfile(teacherId: string) {
            try {
                const res = await fetch(`/api/teacher/profile?id=${teacherId}`);
                if (res.ok) {
                    const data = await res.json();
                    setPseudo(data.pseudo || null);
                    setAvatar(data.avatar || null);
                    localStorage.setItem('mathquest_teacher_pseudo', data.pseudo || '');
                    localStorage.setItem('mathquest_teacher_avatar', data.avatar || '');
                }
            } catch (e) {
                setPseudo(null);
                setAvatar(null);
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

    // Disconnect handler using context refresh
    const handleDisconnect = async () => {
        // Clear student local storage
        localStorage.removeItem('mathquest_pseudo');
        localStorage.removeItem('mathquest_avatar');
        // Call API to clear teacher cookie
        await fetch('/api/auth/logout', { method: 'POST' });
        // Trigger context refresh to update isStudent, isTeacher, isAuthenticated
        refreshAuth();
        // Redirect after state updates and API call
        window.location.href = '/';
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
                {
                    label: 'Espace élève',
                    href: '/student/menu',
                    submenu: [
                        { label: 'Rejoindre un tournoi', href: '/student/join' },
                        { label: 'Entraînement libre', href: '/student/practice' },
                        { label: 'Créer un tournoi', href: '/student/create-tournament' },
                    ],
                },
                {
                    label: 'Espace enseignant',
                    href: '/teacher/dashboard',
                    submenu: [
                        { label: 'Utiliser un quiz existant', href: '/teacher/quiz/use' },
                        { label: 'Créer un quiz', href: '/teacher/quiz/create' },
                        { label: 'Consulter les résultats', href: '/teacher/results' },
                        { label: 'Vidéoprojecteur', href: '/projector' },
                    ],
                },
                { label: 'Déconnexion', action: handleDisconnect },
            ];
        }
        if (isStudent) {
            return [
                { label: 'Accueil', href: '/' },
                {
                    label: 'Espace élève',
                    href: '/student/menu',
                    submenu: [
                        { label: 'Rejoindre un tournoi', href: '/student/join' },
                        { label: 'Entraînement libre', href: '/student/practice' },
                        { label: 'Créer un tournoi', href: '/student/create-tournament' },
                    ],
                },
                { label: 'Espace enseignant', href: '/teacher/login' },
                { label: 'Déconnexion', action: handleDisconnect },
            ];
        }
        return [];
    }, [isAuthenticated, isStudent, isTeacher]);

    if (!mounted) return null;

    // Determine if disconnect button should be shown based on context
    const showDisconnect = isAuthenticated;

    return (
        <>
            {/* Sidebar for large screens */}
            <aside className={`hidden md:flex md:flex-col md:w-64 md:h-screen md:fixed md:left-0 md:top-0 bg-gray-900 text-white z-40`}>
                {/* Show teacher info if logged in as teacher, otherwise student info */}
                {isTeacher ? (
                    <div className="flex flex-col items-center justify-center h-32 border-b border-gray-700 pt-4">
                        {avatar ? (
                            <Image src={`/avatars/${avatar}`} alt="avatar" width={80} height={80} className="w-20 h-20 rounded-full mb-2 ring-4 ring-indigo-300 shadow-lg" />
                        ) : (
                            <div className="w-20 h-20 rounded-full mb-2 bg-gray-700" />
                        )}
                        {pseudo ? (
                            <span className="text-lg font-semibold text-white drop-shadow">{pseudo}</span>
                        ) : (
                            <span className="text-lg font-semibold text-gray-500">Enseignant</span>
                        )}
                    </div>
                ) : isStudent && (
                    <div className={`flex flex-col items-center justify-center h-32 border-b border-gray-700 pt-4`}>
                        {avatar ? (
                            <Image src={`/avatars/${avatar}`} alt="avatar" width={80} height={80} className="w-20 h-20 rounded-full mb-2 ring-4 ring-sky-300 shadow-lg" />
                        ) : (
                            <div className="w-20 h-20 rounded-full mb-2 bg-gray-700" />
                        )}
                        {pseudo ? (
                            <span className="text-lg font-semibold text-white drop-shadow">{pseudo}</span>
                        ) : (
                            <span className="text-lg font-semibold text-gray-500">Loading...</span>
                        )}
                    </div>
                )}
                {/* Adjust padding if student is not logged in */}
                <nav className={`flex-1 p-4 space-y-2 ${!isStudent ? 'pt-6' : ''}`}>
                    {menu.map((item, idx) => (
                        <div key={item.label}>
                            {item.href && !item.submenu && (
                                <Link href={item.href} className="block px-4 py-2 rounded hover:bg-gray-700">
                                    {item.label}
                                </Link>
                            )}
                            {item.href && item.submenu && (
                                <>
                                    <Link href={item.href} className="block px-4 py-2 rounded hover:bg-gray-700 font-bold">
                                        {item.label}
                                    </Link>
                                    <div className="ml-4 mt-1 space-y-1">
                                        {item.submenu.map(sub => (
                                            <Link key={sub.href} href={sub.href} className="block px-4 py-2 rounded hover:bg-gray-800 text-sm">
                                                {sub.label}
                                            </Link>
                                        ))}
                                    </div>
                                </>
                            )}
                            {item.action && (
                                <button onClick={item.action} className="block w-full text-left px-4 py-2 rounded bg-gray-700 hover:bg-red-600 mt-8">
                                    {item.label}
                                </button>
                            )}
                        </div>
                    ))}
                </nav>
            </aside>
            {/* Burger menu for small screens */}
            <div className="md:hidden flex items-center justify-between bg-gray-900 text-white h-14 px-4">
                {/* Show student info only if logged in as student (using context) */}
                <div className="flex items-center gap-2">
                    {isTeacher ? (
                        <>
                            {avatar && <Image src={`/avatars/${avatar}`} alt="avatar" width={32} height={32} className="w-8 h-8 rounded-full ring-2 ring-indigo-300" />}
                            {pseudo && <span className="font-bold text-base">{pseudo}</span>}
                        </>
                    ) : isStudent && (
                        <>
                            {avatar && <Image src={`/avatars/${avatar}`} alt="avatar" width={32} height={32} className="w-8 h-8 rounded-full ring-2 ring-sky-300" />}
                            {pseudo && <span className="font-bold text-base">{pseudo}</span>}
                        </>
                    )}
                </div>
                <button onClick={() => setOpen(o => !o)} aria-label="Ouvrir le menu" className="focus:outline-none">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>
            {/* Drawer menu for small screens */}
            {open && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-40" onClick={() => setOpen(false)}>
                    <nav className="absolute left-0 top-0 w-64 h-full bg-gray-900 text-white p-6 space-y-4 shadow-lg" onClick={e => e.stopPropagation()}>
                        <button className="mb-4" onClick={() => setOpen(false)} aria-label="Fermer le menu">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        {menu.map((item, idx) => (
                            <div key={item.label}>
                                {item.href && !item.submenu && (
                                    <Link href={item.href} className="block px-4 py-2 rounded hover:bg-gray-700" onClick={() => setOpen(false)}>
                                        {item.label}
                                    </Link>
                                )}
                                {item.href && item.submenu && (
                                    <>
                                        <Link href={item.href} className="block px-4 py-2 rounded hover:bg-gray-700 font-bold" onClick={() => setOpen(false)}>
                                            {item.label}
                                        </Link>
                                        <div className="ml-4 mt-1 space-y-1">
                                            {item.submenu.map(sub => (
                                                <Link key={sub.href} href={sub.href} className="block px-4 py-2 rounded hover:bg-gray-800 text-sm" onClick={() => setOpen(false)}>
                                                    {sub.label}
                                                </Link>
                                            ))}
                                        </div>
                                    </>
                                )}
                                {item.action && (
                                    <button onClick={() => { setOpen(false); item.action(); }} className="block w-full text-left px-4 py-2 rounded bg-gray-700 hover:bg-red-600 mt-8">
                                        {item.label}
                                    </button>
                                )}
                            </div>
                        ))}
                    </nav>
                </div>
            )}
            {/* Spacer for sidebar */}
            <div className="hidden md:block md:w-64" aria-hidden />
        </>
    );
}