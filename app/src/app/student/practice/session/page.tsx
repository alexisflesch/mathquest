/**
 * Student Practice Session Page
 * 
 * This page provides the interactive question interface for student practice sessions:
 * - Loads questions based on the filter parameters from the practice setup page
 * - Presents questions one at a time with multiple choice answers
 * - Tracks student score as they progress through questions
 * - Provides a summary and score report upon completion
 * 
 * The practice session allows students to work through a customized set of questions
 * matching their selected criteria, with immediate feedback on their answers.
 * It represents the core question-answering experience in the practice mode.
 */

"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
    const [practiceQuestions, setPracticeQuestions] = useState<CurrentQuestion[]>([]);
    const [practiceIndex, setPracticeIndex] = useState(0);
    const [practiceScore, setPracticeScore] = useState(0);
    const [practiceDone, setPracticeDone] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const discipline = searchParams.get("discipline") || "";
        const niveau = searchParams.get("niveau") || "";
        const theme = searchParams.get("theme") || "";
        const limit = searchParams.get("limit") || "10";

        const params = new URLSearchParams();
        if (discipline) params.append("discipline", discipline);
        if (niveau) params.append("niveau", niveau);
        if (theme) params.append("theme", theme);
        params.append("limit", limit);

        fetch(`/api/questions?${params.toString()}`)
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
                                <h3 className="card-title text-2xl mb-2">
                                    Question {practiceIndex + 1} / {practiceQuestions.length}
                                </h3>
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
