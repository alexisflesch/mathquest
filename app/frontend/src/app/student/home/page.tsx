/**
 * Student Dashboard/Menu Page
 * 
 * This page serves as the central hub for student navigation within the MathQuest application.
 * It provides:
 * - A personalized welcome based on the student's registered username
 * - Main navigation options for student activities
 * - Authentication verification with redirection for non-authenticated users
 * - Special handling for teachers who are accessing the student area
 * 
 * The page dynamically adapts to the user's authentication status, supporting
 * both regular student users and teachers who may want to test the student experience.
 * It serves as the main entry point after student authentication.
 */

"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import MathJaxWrapper from '@/components/MathJaxWrapper';
import { createLogger } from '@/clientLogger';

const logger = createLogger('StudentDashboard');

export default function StudentDashboard() {
    const [username, setusername] = useState<string>('');
    const { isStudent, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;
        if (!isStudent) {
            router.replace('/');
            return;
        }
        try {
            const storedusername = localStorage.getItem('mathquest_username') || '';
            setusername(storedusername);
            logger.info('username loaded from localStorage', storedusername);
        } catch (e) {
            logger.warn('Could not access localStorage for username', e);
        }
    }, [isStudent, isLoading, router]);

    if (isLoading || !isStudent) {
        return null;
    }

    return (
        <MathJaxWrapper>
            <div className="main-content">
                <div className="card w-full max-w-lg bg-base-100 rounded-lg shadow-xl my-6">
                    <div className="flex flex-col gap-8">
                        <div className="flex items-center justify-center gap-4 mb-5">
                            <Image src="/favicon.svg" alt="MathQuest logo" width={64} height={64} priority />
                            <h1 className="text-2xl text-center font-bold text-base-content">Bienvenue{username ? `, ${username}` : ''} !</h1>
                        </div>
                        <ul className="list-disc list-inside text-base text-base-content mb-2 max-w-md">
                            <li>Rejoignez un tournoi en direct ou en différé grâce à un code fourni par votre enseignant ou vos amis.</li>
                            <li>Répondez aux questions pour marquer des points et grimper dans le classement.</li>
                            <li>Consultez vos résultats à la fin du tournoi et comparez-vous aux autres participants.</li>
                        </ul>
                        <div className="w-full flex flex-col mb-4 mt-6">
                            Utilisez le menu pour accéder aux différentes activités. Bonne chance et amusez-vous bien !
                        </div>
                    </div>
                </div>
            </div>
        </MathJaxWrapper>
    );
}
