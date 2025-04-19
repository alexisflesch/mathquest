"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function StudentMenuPage() {
    const [pseudo, setPseudo] = useState('');
    const [avatar, setAvatar] = useState('');
    const router = useRouter();

    useEffect(() => {
        setPseudo(localStorage.getItem('mathquest_pseudo') || '');
        setAvatar(localStorage.getItem('mathquest_avatar') || '');
        if (!localStorage.getItem('mathquest_pseudo') || !localStorage.getItem('mathquest_avatar')) {
            router.replace('/student');
        }
    }, [router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center gap-6">
                <h1 className="text-3xl font-extrabold text-indigo-700 mb-2 text-center tracking-wide drop-shadow">Bienvenue, {pseudo} !</h1>
                {avatar && (
                    <Image src={`/avatars/${avatar}`} alt="avatar" width={112} height={112} className="w-28 h-28 rounded-full mb-4 ring-4 ring-sky-300 shadow-lg" />
                )}
                <div className="flex flex-col gap-4 w-full mt-2">
                    <Link href="/student/join">
                        <button className="bg-gradient-to-r from-sky-400 to-indigo-400 text-white font-bold py-3 px-4 rounded-full shadow-md hover:scale-105 hover:shadow-lg focus:ring-4 focus:ring-sky-300 focus:outline-none transition w-full text-xl">
                            Rejoindre un tournoi
                        </button>
                    </Link>
                    <Link href="/student/practice">
                        <button className="bg-gradient-to-r from-violet-400 to-sky-400 text-white font-bold py-3 px-4 rounded-full shadow-md hover:scale-105 hover:shadow-lg focus:ring-4 focus:ring-violet-300 focus:outline-none transition w-full text-xl">
                            Entraînement libre
                        </button>
                    </Link>
                    <Link href="/student/create-tournament">
                        <button className="bg-gradient-to-r from-indigo-400 to-violet-400 text-white font-bold py-3 px-4 rounded-full shadow-md hover:scale-105 hover:shadow-lg focus:ring-4 focus:ring-indigo-300 focus:outline-none transition w-full text-xl">
                            Créer un tournoi
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
