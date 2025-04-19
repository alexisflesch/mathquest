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
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full flex flex-col items-center gap-6">
                <h1 className="text-4xl font-extrabold text-indigo-700 mb-2 text-center tracking-wide drop-shadow">Espace Élève</h1>
                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
                    <div>
                        <label className="block text-lg font-bold text-sky-700 mb-2" htmlFor="pseudo">
                            Pseudo
                        </label>
                        <input
                            className="w-full py-3 px-4 rounded-full border-2 border-sky-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-200 text-lg font-semibold text-gray-700 bg-sky-50 placeholder:text-sky-300 transition"
                            id="pseudo"
                            type="text"
                            placeholder="Votre pseudo fun ici !"
                            value={pseudo}
                            onChange={e => setPseudo(e.target.value)}
                            autoComplete="off"
                        />
                    </div>
                    <div>
                        <label className="block text-lg font-bold text-violet-700 mb-2">
                            Choisis ton avatar !
                        </label>
                        <div className="flex justify-center">
                            <AvatarSelector onSelect={setSelectedAvatar} selected={selectedAvatar} />
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-center font-bold">{error}</p>}
                    <button
                        type="submit"
                        className="bg-gradient-to-r from-indigo-400 via-sky-400 to-violet-400 text-white font-extrabold py-3 px-8 rounded-full shadow-lg hover:scale-105 hover:shadow-xl focus:ring-4 focus:ring-indigo-200 focus:outline-none transition text-2xl tracking-wide mt-2"
                    >
                        OK
                    </button>
                </form>
            </div>
        </div>
    );
}
