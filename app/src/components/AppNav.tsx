"use client";
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider'; // Corrected import path
import Image from 'next/image';

export default function AppNav() {
    const [open, setOpen] = useState(false);
    // Use the context values
    const { refreshAuth, isAuthenticated, isStudent, isTeacher } = useAuth();

    // Local state specifically for display elements like pseudo and avatar
    const [pseudo, setPseudo] = useState<string | null>(null);
    const [avatar, setAvatar] = useState<string | null>(null);

    // Effect to get pseudo and avatar from localStorage when isStudent is true
    useEffect(() => {
        if (isStudent && typeof window !== 'undefined') {
            setPseudo(localStorage.getItem('mathquest_pseudo'));
            setAvatar(localStorage.getItem('mathquest_avatar'));
        } else {
            // Clear if not a student
            setPseudo(null);
            setAvatar(null);
        }
    }, [isStudent]); // Re-run only when isStudent changes

    // Define navLinks based on the context state
    const navLinks = useMemo(() => [
        { href: '/', label: 'Accueil' },
        { href: isStudent ? '/student/menu' : '/student', label: 'Espace Élève' },
        { href: '/student/practice', label: 'Entraînement Libre' },
        { href: isTeacher ? '/teacher/dashboard' : '/teacher/login', label: 'Espace Enseignant' },
        { href: '/projector', label: 'Vidéoprojection' },
    ], [isStudent, isTeacher]); // Dependencies: context values

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

    // Determine if disconnect button should be shown based on context
    const showDisconnect = isAuthenticated;

    return (
        <>
            {/* Sidebar for large screens */}
            <aside className={`hidden md:flex md:flex-col md:w-64 md:h-screen md:fixed md:left-0 md:top-0 bg-gray-900 text-white z-40 ${isStudent ? 'pt-6' : ''}`}>
                {/* Conditional rendering of student info based on isStudent context */}
                {isStudent && (
                    <div className={`flex flex-col items-center justify-center h-32 ${pseudo || avatar ? 'border-b border-gray-700' : ''}`}>
                        {avatar ? (
                            <Image src={`/avatars/${avatar}`} alt="avatar" width={80} height={80} className="w-20 h-20 rounded-full mb-2 ring-4 ring-sky-300 shadow-lg" />
                        ) : (
                            <div className="w-20 h-20 rounded-full mb-2 bg-gray-700" /> /* Placeholder */
                        )}
                        {pseudo ? (
                            <span className="text-lg font-semibold text-white drop-shadow">{pseudo}</span>
                        ) : (
                            <span className="text-lg font-semibold text-gray-500">Loading...</span> /* Placeholder */
                        )}
                    </div>
                )}
                {/* Adjust padding if student is not logged in */}
                <nav className={`flex-1 p-4 space-y-2 ${!isStudent ? 'pt-6' : ''}`}>
                    {navLinks.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="block px-4 py-2 rounded hover:bg-gray-700"
                        >
                            {link.label}
                        </Link>
                    ))}
                    {showDisconnect && (
                        <button
                            className="block w-full text-left px-4 py-2 rounded bg-gray-700 hover:bg-red-600 mt-8"
                            onClick={handleDisconnect}
                        >
                            Se déconnecter
                        </button>
                    )}
                </nav>
            </aside>
            {/* Burger menu for small screens */}
            <div className="md:hidden flex items-center justify-between bg-gray-900 text-white h-14 px-4">
                {/* Show student info only if logged in as student (using context) */}
                <div className="flex items-center gap-2">
                    {isStudent && avatar && (
                        <Image src={`/avatars/${avatar}`} alt="avatar" width={32} height={32} className="w-8 h-8 rounded-full ring-2 ring-sky-300" />
                    )}
                    {isStudent && pseudo && <span className="font-bold text-base">{pseudo}</span>}
                    {/* Show teacher indicator if teacher is logged in but not student */}
                    {isTeacher && !isStudent && <span className="font-bold text-base">Enseignant</span>}
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
                        {navLinks.map(link => (
                            <Link key={link.href} href={link.href} className="block px-4 py-2 rounded hover:bg-gray-700" onClick={() => setOpen(false)}>
                                {link.label}
                            </Link>
                        ))}
                        {showDisconnect && (
                            <button
                                className="block w-full text-left px-4 py-2 rounded bg-gray-700 hover:bg-red-600 mt-8"
                                onClick={() => { setOpen(false); handleDisconnect(); }}
                            >
                                Se déconnecter
                            </button>
                        )}
                    </nav>
                </div>
            )}
            {/* Spacer for sidebar */}
            <div className="hidden md:block md:w-64" aria-hidden />
        </>
    );
}