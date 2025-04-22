"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';

export default function StudentMenuPage() {
    const [pseudo, setPseudo] = useState('');
    const [avatar, setAvatar] = useState('');
    const router = useRouter();
    const { isTeacher } = useAuth();

    useEffect(() => {
        const localPseudo = localStorage.getItem('mathquest_pseudo');
        const localAvatar = localStorage.getItem('mathquest_avatar');
        // For teachers, try to get pseudo from teacher profile in localStorage
        let teacherPseudo = '';
        if (isTeacher) {
            teacherPseudo = localStorage.getItem('mathquest_teacher_pseudo') || '';
        }
        if (localPseudo) setPseudo(localPseudo);
        else if (isTeacher && teacherPseudo) setPseudo(teacherPseudo);
        else setPseudo('');
        if (localAvatar) setAvatar(localAvatar);
        else if (isTeacher) setAvatar(localStorage.getItem('mathquest_teacher_avatar') || '');
        else setAvatar('');
        if (!isTeacher && (!localPseudo || !localAvatar)) {
            router.replace('/student');
        }
    }, [router, isTeacher]);

    return (
        <div className="h-[calc(100vh-56px)] flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4 pt-14 md:h-screen md:pt-0">
            <div className="card w-full max-w-md shadow-xl bg-base-100">
                <div className="card-body items-center gap-6 text-center">
                    <h1 className="card-title text-3xl mb-2">Bienvenue, {pseudo} !</h1>
                    {avatar && (
                        <div className="flex justify-center items-center w-full mb-6">
                            <Image src={`/avatars/${avatar}`} alt="avatar" width={112} height={112} className="w-28 h-28 rounded-full ring-4 ring-primary shadow-lg" />
                        </div>
                    )}
                    <div className="flex flex-col gap-4 w-full mt-2">
                        <Link href="/student/join">
                            <button className="btn btn-primary btn-lg w-full">Rejoindre un tournoi</button>
                        </Link>
                        <Link href="/student/practice">
                            <button className="btn btn-secondary btn-lg w-full">Entraînement libre</button>
                        </Link>
                        <Link href="/student/create-tournament">
                            <button className="btn btn-accent btn-lg w-full">Créer un tournoi</button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
