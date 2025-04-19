"use client";
import React from 'react';
import Link from 'next/link'; // Import Link for navigation

export default function TeacherDashboardPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full flex flex-col items-center gap-8">
                <h1 className="text-4xl font-extrabold text-indigo-700 mb-6 text-center tracking-wide drop-shadow">Espace Enseignant</h1>
                <div className="flex flex-col gap-6 w-full">
                    {/* Button 1: Use Existing Quiz */}
                    <Link href="/teacher/quiz/use" passHref>
                        <button className="w-full bg-gradient-to-r from-sky-400 to-blue-500 text-white font-bold py-4 px-8 rounded-full shadow-lg hover:scale-105 hover:shadow-xl focus:ring-4 focus:ring-sky-300 focus:outline-none transition text-xl tracking-wide">
                            Utiliser un quiz existant
                        </button>
                    </Link>

                    {/* Button 2: Create New Quiz */}
                    <Link href="/teacher/quiz/create" passHref>
                        <button className="w-full bg-gradient-to-r from-violet-400 to-purple-500 text-white font-bold py-4 px-8 rounded-full shadow-lg hover:scale-105 hover:shadow-xl focus:ring-4 focus:ring-violet-300 focus:outline-none transition text-xl tracking-wide">
                            Créer un nouveau quiz
                        </button>
                    </Link>

                    {/* Button 3: View Results */}
                    <Link href="/teacher/results" passHref>
                        <button className="w-full bg-gradient-to-r from-emerald-400 to-green-500 text-white font-bold py-4 px-8 rounded-full shadow-lg hover:scale-105 hover:shadow-xl focus:ring-4 focus:ring-emerald-300 focus:outline-none transition text-xl tracking-wide">
                            Consulter les résultats
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
