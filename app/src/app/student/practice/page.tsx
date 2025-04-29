/**
 * Student Practice Page
 * 
 * This page provides a self-paced practice environment for students:
 * - Filter selection by discipline, grade level, and theme
 * - Configurable number of practice questions
 * - Timed questions with automatic progression
 * - Score tracking and completion summary
 * 
 * The practice mode allows students to improve their skills independently,
 * focusing on specific subject areas without the competitive pressure of
 * tournaments. It implements a local timer for each question and tracks
 * the student's progress through the selected question set.
 */

"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CustomDropdown from "@/components/CustomDropdown";

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

export default function PracticePage() {
    const [practiceDiscipline, setPracticeDiscipline] = useState('');
    const [practiceNiveau, setPracticeNiveau] = useState('');
    const [practiceTheme, setPracticeTheme] = useState('');
    const [practiceFilters, setPracticeFilters] = useState<{ disciplines: string[], niveaux: string[], themes: string[] }>({ disciplines: [], niveaux: [], themes: [] });
    const [practiceQuestions, setPracticeQuestions] = useState<CurrentQuestion[]>([]);
    const [practiceStarted, setPracticeStarted] = useState(false);
    const [practiceIndex, setPracticeIndex] = useState(0);
    const [practiceScore, setPracticeScore] = useState(0);
    const [practiceDone, setPracticeDone] = useState(false);
    const [practiceLimit, setPracticeLimit] = useState(10); // NEW: number of questions
    const [practiceTimer, setPracticeTimer] = useState<number | null>(null); // seconds left for current question
    const timerRef = React.useRef<NodeJS.Timeout | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/questions/filters')
            .then(res => res.json())
            .then(setPracticeFilters);
    }, []);

    const handlePracticeAnswer = useCallback((isCorrect: boolean) => {
        if (isCorrect) setPracticeScore(s => s + 1);
        if (practiceIndex + 1 < practiceQuestions.length) {
            setPracticeIndex(i => i + 1);
        } else {
            setPracticeDone(true);
        }
    }, [practiceIndex, practiceQuestions.length]);

    useEffect(() => {
        if (practiceStarted && !practiceDone && practiceQuestions.length > 0) {
            // Set timer for current question
            const current = practiceQuestions[practiceIndex];
            if (current && typeof current.temps === 'number') {
                setPracticeTimer(current.temps);
            } else {
                setPracticeTimer(20); // fallback default
            }
        }
    }, [practiceStarted, practiceIndex, practiceQuestions, practiceDone]);

    useEffect(() => {
        if (practiceTimer === null || practiceDone || !practiceStarted) return;
        if (practiceTimer <= 0) {
            // Time's up: go to next question (count as incorrect)
            handlePracticeAnswer(false);
            return;
        }
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setPracticeTimer(t => (t !== null ? t - 1 : null)), 1000);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [practiceTimer, practiceDone, practiceStarted, handlePracticeAnswer]);

    return (
        <div className="main-content">
            <div className="card w-full max-w-xl shadow-xl bg-base-100 m-4 my-6">
                <div className="card-body items-center gap-8">
                    <h1 className="card-title text-3xl">Entraînement Libre</h1>
                    {/* Add spacing after the title using a div with a fixed height */}
                    <div style={{ height: 32 }} />
                    {!practiceStarted && (
                        <div className="flex flex-col gap-6 w-full">
                            <CustomDropdown
                                options={practiceFilters.disciplines}
                                value={practiceDiscipline}
                                onChange={setPracticeDiscipline}
                                placeholder="Discipline"
                                className="mb-2"
                            />
                            <CustomDropdown
                                options={practiceFilters.niveaux}
                                value={practiceNiveau}
                                onChange={setPracticeNiveau}
                                placeholder="Niveau"
                                className="mb-2"
                            />
                            <CustomDropdown
                                options={practiceFilters.themes}
                                value={practiceTheme}
                                onChange={setPracticeTheme}
                                placeholder="Thème"
                                className="mb-2"
                            />
                            <CustomDropdown
                                options={["10", "20", "30"]}
                                value={String(practiceLimit)}
                                onChange={v => setPracticeLimit(Number(v))}
                                placeholder="Nombre de questions"
                                className="mb-2"
                            />
                            <button
                                className="btn btn-primary btn-lg w-full mt-4"
                                onClick={() => {
                                    const params = new URLSearchParams();
                                    if (practiceDiscipline) params.append('discipline', practiceDiscipline);
                                    if (practiceNiveau) params.append('niveau', practiceNiveau);
                                    if (practiceTheme) params.append('theme', practiceTheme);
                                    params.append('limit', String(practiceLimit));
                                    router.push(`/student/practice/session?${params.toString()}`);
                                }}
                            >
                                Commencer l&apos;entraînement
                            </button>
                        </div>
                    )}
                    {practiceStarted && !practiceDone && practiceQuestions.length > 0 && (
                        <div className="card w-full bg-base-200 shadow-inner">
                            <div className="card-body items-center gap-4">
                                <h3 className="card-title text-2xl mb-2">Question {practiceIndex + 1} / {practiceQuestions.length}</h3>
                                <div className="mb-2 text-lg font-bold text-primary">Temps restant : {practiceTimer !== null ? practiceTimer : '-'} s</div>
                                <div className="mb-4 text-xl font-semibold text-center">{practiceQuestions[practiceIndex].question}</div>
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
                            <div className="card-body items-center gap-4 text-center">
                                <h3 className="card-title text-2xl mb-2">Entraînement terminé !</h3>
                                <div className="text-2xl mb-2 font-extrabold">Score : {practiceScore} / {practiceQuestions.length}</div>
                                <button className="btn btn-primary btn-lg" onClick={() => { setPracticeStarted(false); setPracticeQuestions([]); setPracticeDone(false); }}>
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
