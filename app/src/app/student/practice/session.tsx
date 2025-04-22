"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

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
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PracticeSessionContent />
        </Suspense>
    );
}

function PracticeSessionContent() {
    "use client";

    const router = useRouter();
    const [practiceQuestions, setPracticeQuestions] = useState<CurrentQuestion[]>([]);
    const [practiceIndex, setPracticeIndex] = useState(0);
    const [practiceScore, setPracticeScore] = useState(0);
    const [practiceDone, setPracticeDone] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get filters from query params using window.location
        let discipline = "";
        let niveau = "";
        let theme = "";
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            discipline = params.get("discipline") || "";
            niveau = params.get("niveau") || "";
            theme = params.get("theme") || "";
        }
        const urlParams = new URLSearchParams();
        if (discipline) urlParams.append("discipline", discipline);
        if (niveau) urlParams.append("niveau", niveau);
        if (theme) urlParams.append("theme", theme);
        urlParams.append("limit", "10");
        fetch(`/api/questions?${urlParams.toString()}`)
            .then((res) => res.json())
            .then((questions) => {
                setPracticeQuestions(questions);
                setLoading(false);
            });
    }, []);

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
            <div className="min-h-screen flex items-center justify-center bg-base-200">
                <div className="card bg-base-100 shadow-xl p-8">
                    <div className="card-body items-center">
                        <div className="text-xl font-bold">Chargement…</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200">
            <div className="card w-full max-w-xl shadow-xl bg-base-100">
                <div className="card-body items-center gap-8">
                    <h1 className="card-title text-3xl mb-2 text-center">Entraînement Libre</h1>
                    {!practiceDone && practiceQuestions.length > 0 && (
                        <div className="card w-full bg-base-200 shadow-inner">
                            <div className="card-body flex flex-col gap-6 items-center">
                                <h3 className="card-title text-2xl mb-2">Question {practiceIndex + 1} / {practiceQuestions.length}</h3>
                                <div className="mb-4 text-xl font-semibold text-center">
                                    {practiceQuestions[practiceIndex].question}
                                </div>
                                <ul className="flex flex-col gap-3 w-full">
                                    {practiceQuestions[practiceIndex].reponses.map((rep, idx) => (
                                        <li key={idx} className="card-answer">
                                            <button
                                                className="btn-answer w-full text-left"
                                                onClick={() => handlePracticeAnswer(rep.correct)}
                                            >
                                                {rep.texte}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                <div className="font-bold">Score: {practiceScore}</div>
                            </div>
                        </div>
                    )}
                    {practiceDone && (
                        <div className="card w-full bg-base-200 shadow-inner">
                            <div className="card-body flex flex-col items-center gap-4 text-center">
                                <h3 className="card-title text-2xl mb-2">Entraînement terminé !</h3>
                                <div className="text-2xl mb-2 font-extrabold">
                                    Score : {practiceScore} / {practiceQuestions.length}
                                </div>
                                <button
                                    className="btn btn-primary btn-lg"
                                    onClick={() => router.push("/student/practice")}
                                >
                                    Recommencer
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
