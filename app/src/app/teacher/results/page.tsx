"use client";
import React from 'react';
import Link from 'next/link';

export default function ViewResultsPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-base-200">
            <div className="card w-full max-w-2xl shadow-xl bg-base-100">
                <div className="card-body items-center gap-8">
                    <div className="w-full">
                        <Link href="/teacher/dashboard" className="text-primary underline hover:text-primary/80 font-semibold">&larr; Retour au tableau de bord</Link>
                    </div>
                    <div className="mb-6" />
                    <h1 className="card-title text-3xl mb-4 text-center">Consulter les Résultats</h1>
                    {/* TODO: Implement logic to view quiz results here */}
                    <div className="alert alert-info w-full justify-center">Fonctionnalité à venir : Visualisez les scores et les réponses des élèves aux quiz passés.</div>
                </div>
            </div>
        </div>
    );
}
