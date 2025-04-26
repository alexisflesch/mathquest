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
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AvatarSelector from '@/components/AvatarSelector';
import { useAuth } from '@/components/AuthProvider';

export default function StudentPage() {
    const [pseudo, setPseudo] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('');
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { refreshAuth } = useAuth() || {};

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedPseudo = localStorage.getItem('mathquest_pseudo');
            const storedAvatar = localStorage.getItem('mathquest_avatar');
            if (storedPseudo && storedAvatar) {
                router.replace('/student/menu');
            }
        }
    }, [router]);

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
        router.push('/student/menu');
    };

    return (
        <div className="h-[calc(100vh-56px)] flex items-center justify-center p-2 md:p-4 pt-4 md:h-screen md:pt-0">
            <div className="card w-full max-w-lg shadow-xl bg-base-100 h-full md:h-[calc(100vh-56px)] m-2 flex flex-col">
                <div className="card-body flex-1 flex flex-col items-center gap-6 min-h-0 overflow-y-auto w-full">
                    <h1 className="card-title text-4xl md:mb-2">Espace Élève</h1>
                    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 flex-1 min-h-0">
                        <div>
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
                        <div>
                            <label className="block text-lg font-bold mb-2">
                                Avatar
                            </label>
                            <div className="flex justify-center max-h-72 overflow-y-auto">
                                <AvatarSelector onSelect={setSelectedAvatar} selected={selectedAvatar} />
                            </div>
                        </div>
                        {error && <div className="alert alert-error justify-center">{error}</div>}
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg w-full"
                        >
                            OK
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
