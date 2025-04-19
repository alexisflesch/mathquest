"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface CurrentQuestion {
    uid: string;
    question: string;
    reponses: { texte: string; correct: boolean }[];
    type: string;
    discipline: string;
    theme: string;
    difficulte: number;
    niveau: string;
    auteur?: string;
    explication?: string;
    tags?: string[];
    temps?: number;
}

export default function PracticeSessionPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [practiceQuestions, setPracticeQuestions] = useState<CurrentQuestion[]>([]);
    const [practiceIndex, setPracticeIndex] = useState(0);
    const [practiceScore, setPracticeScore] = useState(0);
    const [practiceDone, setPracticeDone] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get filters from query params
        const discipline = searchParams.get("discipline") || "";
        const niveau = searchParams.get("niveau") || "";
        const theme = searchParams.get("theme") || "";
        const params = new URLSearchParams();
        if (discipline) params.append("discipline", discipline);
        if (niveau) params.append("niveau", niveau);
        if (theme) params.append("theme", theme);
        params.append("limit", "10");
        fetch(`/api/questions?${params.toString()}`)
            .then((res) => res.json())
            .then((questions) => {
                setPracticeQuestions(questions);
                setLoading(false);
            });
    }, [searchParams]);

    const handlePracticeAnswer = (isCorrect: boolean) => {
        if (isCorrect) setPracticeScore((s) => s + 1);
        if (practiceIndex + 1 < practiceQuestions.length) {
            setPracticeIndex((i) => i + 1);
        } else {
            setPracticeDone(true);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl font-bold text-gray-600">Chargement…</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-xl w-full flex flex-col items-center gap-8">
                <h1 className="text-3xl font-extrabold text-indigo-700 mb-2 text-center tracking-wide drop-shadow">
                    Entraînement Libre
                </h1>
                {!practiceDone && practiceQuestions.length > 0 && (
                    <div className="w-full bg-sky-50 rounded-2xl shadow-lg p-6 flex flex-col gap-6 items-center">
                        <h3 className="text-2xl font-bold text-sky-700 mb-2">
                            Question {practiceIndex + 1} / {practiceQuestions.length}
                        </h3>
                        <div className="mb-4 text-xl font-semibold text-gray-800 text-center">
                            {practiceQuestions[practiceIndex].question}
                        </div>
                        <ul className="space-y-3 w-full">
                            {practiceQuestions[practiceIndex].reponses.map((rep, idx) => (
                                <li key={idx}>
                                    <button
                                        className="w-full text-left bg-gradient-to-r from-white to-sky-100 rounded-xl py-3 px-4 font-semibold text-lg border-2 border-transparent hover:bg-sky-100 hover:border-sky-400 focus:bg-sky-200 focus:border-sky-500 transition cursor-pointer shadow-md"
                                        onClick={() => handlePracticeAnswer(rep.correct)}
                                    >
                                        {rep.texte}
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="text-gray-600 font-bold">Score: {practiceScore}</div>
                    </div>
                )}
                {practiceDone && (
                    <div className="w-full bg-violet-50 rounded-2xl shadow-lg p-6 flex flex-col items-center gap-4 text-center">
                        <h3 className="text-2xl font-bold text-violet-700 mb-2">Entraînement terminé !</h3>
                        <div className="text-2xl mb-2 font-extrabold text-violet-800">
                            Score : {practiceScore} / {practiceQuestions.length}
                        </div>
                        <button
                            className="mt-4 bg-gradient-to-r from-indigo-400 via-sky-400 to-violet-400 text-white font-extrabold py-3 px-8 rounded-full shadow-lg hover:scale-105 hover:shadow-xl focus:ring-4 focus:ring-indigo-200 focus:outline-none transition text-xl tracking-wide"
                            onClick={() => router.push("/student/practice")}
                        >
                            Recommencer
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
