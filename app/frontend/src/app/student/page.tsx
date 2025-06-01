/**
 * Student Registration Page
 * 
 * This page provides the initial registration interface for students:
 * - Username (username) selection
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
import { makeApiRequest } from '@/config/api';

function StudentPageInner() {
    const [username, setusername] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('');
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refreshAuth } = useAuth() || {};

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedusername = localStorage.getItem('mathquest_username');
            const storedAvatar = localStorage.getItem('mathquest_avatar');
            if (storedusername && storedAvatar) {
                const redirect = searchParams?.get('redirect');
                if (redirect) {
                    router.replace(redirect);
                } else {
                    router.replace('/student/home');
                }
            }
        }
    }, [router, searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!username || !selectedAvatar) {
            setError('Veuillez choisir un username et un avatar.');
            return;
        }
        // Appel API pour valider le username côté serveur
        let cookie_id = localStorage.getItem('mathquest_cookie_id');
        if (!cookie_id) {
            cookie_id = Math.random().toString(36).substring(2) + Date.now();
            localStorage.setItem('mathquest_cookie_id', cookie_id);
        }
        try {
            const result = await makeApiRequest<{ message?: string }>('players/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email: undefined, password: undefined, cookie_id }),
            });
            localStorage.setItem('mathquest_username', username);
            localStorage.setItem('mathquest_avatar', selectedAvatar);
            if (refreshAuth) refreshAuth();
            const redirect = searchParams?.get('redirect');
            if (redirect) {
                router.push(redirect);
            } else {
                router.push('/student/home');
            }
        } catch (err) {
            setError('Erreur réseau ou serveur.');
        }
    };

    return (
        <div className="main-content">
            <div className="card w-full max-w-lg bg-base-100 rounded-lg shadow-xl my-6 flex flex-col max-h-[calc(100dvh-104px)] md:max-h-[calc(100dvh-48px)]">
                <h1 className="text-4xl font-bold text-center mb-6 shrink-0">Espace Élève</h1>
                <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1 min-h-0">
                    <div className="shrink-0">
                        <label className="block text-lg font-bold mb-2" htmlFor="username">
                            username
                        </label>
                        <input
                            className="input input-bordered input-lg w-full"
                            id="username"
                            type="text"
                            maxLength={15}
                            placeholder="Votre username"
                            value={username}
                            onChange={e => setusername(e.target.value)}
                            autoComplete="off"
                        />
                        {error && <div className="alert alert-error justify-center shrink-0 mt-2">{error}</div>}
                    </div>
                    <div className="flex flex-col flex-1 min-h-0">
                        <label className="block text-lg font-bold mb-2 shrink-0">
                            Avatar
                        </label>
                        <div className="flex-1 min-h-0 overflow-y-auto flex justify-center items-start">
                            <AvatarSelector onSelect={setSelectedAvatar} selected={selectedAvatar} />
                        </div>
                    </div>
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
