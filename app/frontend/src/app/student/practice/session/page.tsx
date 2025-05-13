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
import MathJaxWrapper from '@/components/MathJaxWrapper';
import QuestionCard from '@/components/QuestionCard';

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
    // Timer state for visual coherence (simulate timer if temps existe)
    const [timer, setTimer] = useState<number | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsMobile(window.innerWidth < 768);
        }
    }, []);
    useEffect(() => {
        if (!practiceDone && practiceQuestions.length > 0) {
            const t = practiceQuestions[practiceIndex]?.temps;
            if (typeof t === 'number') setTimer(t);
            else setTimer(null);
        }
    }, [practiceIndex, practiceQuestions, practiceDone]);

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const discipline = searchParams.get("discipline") || "";
        const niveau = searchParams.get("niveau") || "";
        const themesParam = searchParams.get("themes") || "";
        const limit = searchParams.get("limit") || "10";

        const params = new URLSearchParams();
        if (discipline) params.append("discipline", discipline);
        if (niveau) params.append("niveau", niveau);
        if (themesParam) params.append("themes", themesParam);
        params.append("limit", limit);

        fetch(`/api/questions?${params.toString()}`)
            .then((res) => res.json())
            .then((questions) => {
                setPracticeQuestions(questions);
                setLoading(false);
            });
    }, []);

    // Handlers for QuestionCard
    const isMultipleChoice = practiceQuestions[practiceIndex]?.type === 'choix_multiple';
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
    useEffect(() => {
        setSelectedAnswer(null);
        setSelectedAnswers([]);
    }, [practiceIndex]);
    const handleSingleChoice = (idx: number) => {
        setSelectedAnswer(idx === selectedAnswer ? null : idx);
        const rep = practiceQuestions[practiceIndex].reponses[idx];
        handlePracticeAnswer(rep.correct);
    };
    const handleSubmitMultiple = () => {
        // At least one answer selected
        if (selectedAnswers.length === 0) return;
        // All selected must be correct, and all correct must be selected
        const reps = practiceQuestions[practiceIndex].reponses;
        const correctIndexes = reps.map((r, i) => r.correct ? i : null).filter(i => i !== null);
        const isCorrect =
            selectedAnswers.length === correctIndexes.length &&
            selectedAnswers.every(idx => reps[idx].correct);
        handlePracticeAnswer(isCorrect);
    };

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
            <div className="main-content">
                <div className="card w-full max-w-2xl bg-base-100 rounded-lg shadow-xl my-6">
                    <div className="card-body items-center justify-center min-h-[300px]">
                        <div className="text-xl font-bold">Chargement…</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="main-content">
            <div className="card w-full max-w-2xl bg-base-100 rounded-lg shadow-xl my-6">
                {/* Timer visuel supprimé */}
                <MathJaxWrapper>
                    {!practiceDone && practiceQuestions.length > 0 && (
                        <QuestionCard
                            currentQuestion={{
                                uid: practiceQuestions[practiceIndex].uid,
                                question: practiceQuestions[practiceIndex].question,
                                type: practiceQuestions[practiceIndex].type,
                                answers: Array.isArray(practiceQuestions[practiceIndex].reponses) ? practiceQuestions[practiceIndex].reponses.map(r => r.texte) : []
                            }}
                            questionIndex={practiceIndex}
                            totalQuestions={practiceQuestions.length}
                            isMultipleChoice={isMultipleChoice}
                            selectedAnswer={selectedAnswer}
                            setSelectedAnswer={setSelectedAnswer}
                            selectedAnswers={selectedAnswers}
                            setSelectedAnswers={setSelectedAnswers}
                            handleSingleChoice={handleSingleChoice}
                            handleSubmitMultiple={handleSubmitMultiple}
                            answered={false}
                            isQuizMode={false}
                        />
                    )}
                </MathJaxWrapper>
                {practiceDone && (
                    <div className="w-full flex flex-col items-center gap-4 text-center">
                        <h3 className="card-title text-2xl mb-2">Entraînement terminé !</h3>
                        <div className="text-2xl mb-2 font-extrabold">
                            Score : {practiceScore} / {practiceQuestions.length}
                        </div>
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={() => router.push("/student/create-tournament/?training=true")}
                        >
                            Recommencer
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
