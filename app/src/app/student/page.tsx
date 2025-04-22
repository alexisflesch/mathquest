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
        if (refreshAuth) refreshAuth();
        router.push('/student/menu');
    };

    return (
        <div className="h-[calc(100vh-56px)] flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4 pt-14 md:h-screen md:pt-0">
            <div className="card w-full max-w-lg shadow-xl bg-base-100">
                <div className="card-body items-center gap-6 max-h-[80vh] overflow-y-auto w-full">
                    <h1 className="card-title text-4xl mb-2">Espace Élève</h1>
                    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
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
