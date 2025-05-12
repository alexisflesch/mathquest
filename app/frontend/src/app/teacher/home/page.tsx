/**
 * Teacher Dashboard Page
 * 
 * This page welcomes teachers and explains how to use MathQuest as an enseignant.
 */

"use client";
import Image from 'next/image';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { createLogger } from '@/clientLogger';

import MathJaxWrapper from '@/components/MathJaxWrapper';

const logger = createLogger('TeacherDashboard');

export default function TeacherDashboard() {
    const [pseudo, setPseudo] = useState<string>('');

    useEffect(() => {
        try {
            const storedPseudo = localStorage.getItem('mathquest_pseudo') || '';
            setPseudo(storedPseudo);
            logger.info('Pseudo loaded from localStorage', storedPseudo);
        } catch (e) {
            logger.warn('Could not access localStorage for pseudo', e);
        }
    }, []);

    return (
        <MathJaxWrapper>
            <div className="main-content">
                <div className="card w-full max-w-lg bg-base-100 rounded-lg shadow-xl my-6">
                    <div className="flex flex-col gap-8">
                        <div className="flex items-center justify-center gap-4 mb-5">
                            <Image src="/favicon.svg" alt="MathQuest logo" width={64} height={64} priority />
                            <h1 className="text-2xl text-center font-bold text-base-content">Bienvenue{pseudo ? `, ${pseudo}` : ''} !</h1>
                        </div>
                        <ul className="list-disc list-inside text-base text-base-content mb-2 max-w-md">
                            <li>Créez des quiz personnalisés pour vos élèves selon la discipline, le niveau et les thèmes souhaités.</li>
                            <li>Organisez des quiz en direct en classe avec une interface dédiée&nbsp;:
                                <ul className="list-[square] list-inside ml-6 mt-1 mb-2">
                                    <li>Générez un code unique pour chaque quiz.</li>
                                    <li>Partagez le code avec vos élèves pour qu&apos;ils puissent rejoindre le quiz.</li>
                                    <li>Contrôlez le déroulé du quiz en temps réel (choix de la question, chronomètre, etc...)</li>
                                </ul>
                            </li>
                            <li>Affichez le quiz en direct sur grand écran.</li>
                        </ul>
                        <div className="w-full flex flex-col mb-4 mt-6">
                            Utilisez le menu pour naviguer entre les différentes fonctionnalités. Préférez l&apos;utilisation d&apos;un ordinateur pour une meilleure expérience.
                        </div>
                    </div>
                </div>
            </div>
        </MathJaxWrapper>
    );
}
