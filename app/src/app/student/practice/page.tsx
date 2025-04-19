"use client";
import React, { useEffect, useState } from 'react';

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

    useEffect(() => {
        fetch('/api/questions/filters')
            .then(res => res.json())
            .then(setPracticeFilters);
    }, []);

    const handleStartPractice = async () => {
        setPracticeStarted(true);
        setPracticeDone(false);
        setPracticeIndex(0);
        setPracticeScore(0);
        const params = new URLSearchParams();
        if (practiceDiscipline) params.append('discipline', practiceDiscipline);
        if (practiceNiveau) params.append('niveau', practiceNiveau);
        if (practiceTheme) params.append('theme', practiceTheme);
        params.append('limit', '10');
        const res = await fetch(`/api/questions?${params.toString()}`);
        const questions = await res.json();
        setPracticeQuestions(questions);
    };

    const handlePracticeAnswer = (isCorrect: boolean) => {
        if (isCorrect) setPracticeScore(s => s + 1);
        if (practiceIndex + 1 < practiceQuestions.length) {
            setPracticeIndex(i => i + 1);
        } else {
            setPracticeDone(true);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-xl w-full flex flex-col items-center gap-8">
                <h1 className="text-3xl font-extrabold text-indigo-700 mb-2 text-center tracking-wide drop-shadow">Entra&icirc;nement Libre</h1>
                {!practiceStarted && (
                    <div className="flex flex-col gap-6 w-full">
                        <select className="border-2 border-sky-200 bg-sky-50 rounded-full px-4 py-3 text-lg font-semibold text-sky-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-200 transition" value={practiceDiscipline} onChange={e => setPracticeDiscipline(e.target.value)}>
                            <option value="">Discipline</option>
                            {practiceFilters.disciplines.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <select className="border-2 border-violet-200 bg-violet-50 rounded-full px-4 py-3 text-lg font-semibold text-violet-700 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition" value={practiceNiveau} onChange={e => setPracticeNiveau(e.target.value)}>
                            <option value="">Niveau</option>
                            {practiceFilters.niveaux.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <select className="border-2 border-indigo-200 bg-indigo-50 rounded-full px-4 py-3 text-lg font-semibold text-indigo-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 transition" value={practiceTheme} onChange={e => setPracticeTheme(e.target.value)}>
                            <option value="">Th&egrave;me</option>
                            {practiceFilters.themes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button className="bg-gradient-to-r from-indigo-400 via-sky-400 to-violet-400 text-white font-extrabold py-3 px-8 rounded-full shadow-lg hover:scale-105 hover:shadow-xl focus:ring-4 focus:ring-indigo-200 focus:outline-none transition text-2xl tracking-wide mt-2" onClick={handleStartPractice}>
                            Commencer l&apos;entra&icirc;nement
                        </button>
                    </div>
                )}
                {practiceStarted && !practiceDone && practiceQuestions.length > 0 && (
                    <div className="w-full bg-sky-50 rounded-2xl shadow-lg p-6 flex flex-col gap-6 items-center">
                        <h3 className="text-2xl font-bold text-sky-700 mb-2">Question {practiceIndex + 1} / {practiceQuestions.length}</h3>
                        <div className="mb-4 text-xl font-semibold text-gray-800 text-center">{practiceQuestions[practiceIndex].question}</div>
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
                        <h3 className="text-2xl font-bold text-violet-700 mb-2">Entra&icirc;nement termin&eacute; !</h3>
                        <div className="text-2xl mb-2 font-extrabold text-violet-800">Score : {practiceScore} / {practiceQuestions.length}</div>
                        <button className="mt-4 bg-gradient-to-r from-indigo-400 via-sky-400 to-violet-400 text-white font-extrabold py-3 px-8 rounded-full shadow-lg hover:scale-105 hover:shadow-xl focus:ring-4 focus:ring-indigo-200 focus:outline-none transition text-xl tracking-wide" onClick={() => { setPracticeStarted(false); setPracticeQuestions([]); setPracticeDone(false); }}>
                            Recommencer
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
