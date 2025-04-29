/**
 * Student Registration Page
 * 
 * This page provides the initial registration interface for students:
 * - Username (pseudo) selection
 * - Avatar selection from a visual grid
 * - Local storage persistence of student identity
 * - Automatic redirection for returning students
 * 
 * The component implements anonymous student authentication using browser
 * localStorage, requiring no passwords while still maintaining a consistent
 * identity across sessions. A unique cookie_id is generated to track the
 * student's participation in tournaments and their score history.
 */

"use client";
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AvatarSelector from '@/components/AvatarSelector';
import { useAuth } from '@/components/AuthProvider';

function StudentPageInner() {
    const [pseudo, setPseudo] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('');
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refreshAuth } = useAuth() || {};

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedPseudo = localStorage.getItem('mathquest_pseudo');
            const storedAvatar = localStorage.getItem('mathquest_avatar');
            if (storedPseudo && storedAvatar) {
                const redirect = searchParams?.get('redirect');
                if (redirect) {
                    router.replace(redirect);
                } else {
                    router.replace('/student/menu');
                }
            }
        }
    }, [router, searchParams]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!pseudo || !selectedAvatar) {
            setError('Veuillez choisir un pseudo et un avatar.');
            return;
        }
        localStorage.setItem('mathquest_pseudo', pseudo);
        localStorage.setItem('mathquest_avatar', selectedAvatar);
        // Ensure mathquest_cookie_id is set for this student
        let cookie_id = localStorage.getItem('mathquest_cookie_id');
        if (!cookie_id) {
            cookie_id = Math.random().toString(36).substring(2) + Date.now();
            localStorage.setItem('mathquest_cookie_id', cookie_id);
        }
        if (refreshAuth) refreshAuth();
        const redirect = searchParams?.get('redirect');
        if (redirect) {
            router.push(redirect);
        } else {
            router.push('/student/menu');
        }
    };

    return (
        <div className="main-content">
            <div className="card w-full max-w-lg bg-base-100 rounded-lg shadow-xl my-6 flex flex-col max-h-[calc(100dvh-104px)] md:max-h-[calc(100dvh-48px)]">
                <h1 className="text-4xl font-bold text-center mb-6 shrink-0">Espace Élève</h1>
                <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1 min-h-0">
                    <div className="shrink-0">
                        <label className="block text-lg font-bold mb-2" htmlFor="pseudo">
                            Pseudo
                        </label>
                        <input
                            className="input input-bordered input-lg w-full"
                            id="pseudo"
                            type="text"
                            placeholder="Votre pseudo"
                            value={pseudo}
                            onChange={e => setPseudo(e.target.value)}
                            autoComplete="off"
                        />
                    </div>
                    <div className="flex flex-col flex-1 min-h-0">
                        <label className="block text-lg font-bold mb-2 shrink-0">
                            Avatar
                        </label>
                        <div className="flex-1 min-h-0 overflow-y-auto flex justify-center items-start">
                            <AvatarSelector onSelect={setSelectedAvatar} selected={selectedAvatar} />
                        </div>
                    </div>
                    {error && <div className="alert alert-error justify-center shrink-0">{error}</div>}
                    <button
                        type="submit"
                        className="btn btn-primary btn-lg w-full shrink-0"
                    >
                        OK
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function StudentPage() {
    return (
        <Suspense>
            <StudentPageInner />
        </Suspense>
    );
}
