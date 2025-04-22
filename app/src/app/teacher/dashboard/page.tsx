"use client";
import React from 'react';
import Link from 'next/link'; // Import Link for navigation

export default function TeacherDashboardPage() {
    return (
        <div className="h-[calc(100vh-56px)] flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4 pt-14 md:h-screen md:pt-0">
            <div className="card w-full max-w-md shadow-xl bg-base-100">
                <div className="card-body items-center gap-8">
                    <h1 className="card-title text-4xl mb-6 text-center">Espace Enseignant</h1>
                    <div className="flex flex-col gap-6 w-full">
                        <Link href="/teacher/quiz/use">
                            <button className="btn btn-primary btn-lg w-full">Utiliser un quiz existant</button>
                        </Link>
                        <Link href="/teacher/quiz/create">
                            <button className="btn btn-secondary btn-lg w-full">Créer un nouveau quiz</button>
                        </Link>
                        <Link href="/teacher/results">
                            <button className="btn btn-accent btn-lg w-full">Consulter les résultats</button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
