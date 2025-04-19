"use client";
import React from 'react';
import Link from 'next/link';

export default function ViewResultsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center p-4 pt-10">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full flex flex-col items-center gap-8">
                <Link href="/teacher/dashboard" className="self-start text-indigo-600 hover:text-indigo-800 font-semibold">
                    &larr; Retour au tableau de bord
                </Link>
                <h1 className="text-3xl font-extrabold text-emerald-700 mb-4 text-center tracking-wide drop-shadow">Consulter les Résultats</h1>
                {/* TODO: Implement logic to view quiz results here */}
                <p className="text-gray-600">Fonctionnalité à venir : Visualisez les scores et les réponses des élèves aux quiz passés.</p>
            </div>
        </div>
    );
}
