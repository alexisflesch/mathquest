"use client";
import React from 'react';
import Link from 'next/link';

export default function UseQuizPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center p-4 pt-10">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full flex flex-col items-center gap-8">
                <Link href="/teacher/dashboard" className="self-start text-indigo-600 hover:text-indigo-800 font-semibold">
                    &larr; Retour au tableau de bord
                </Link>
                <h1 className="text-3xl font-extrabold text-sky-700 mb-4 text-center tracking-wide drop-shadow">Utiliser un Quiz Existant</h1>
                {/* TODO: Implement quiz selection and usage logic here */}
                <p className="text-gray-600">Fonctionnalité à venir : Sélectionnez un quiz créé précédemment pour le lancer.</p>
                {/* Example: Display QuizList component here */}
                {/* <QuizList quizzes={[]} onSelect={() => {}} /> */}
            </div>
        </div>
    );
}
