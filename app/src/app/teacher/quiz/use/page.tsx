"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import QuizList from '@/components/QuizList';

interface Quiz {
    id: string;
    nom: string;
    questions_ids: string[];
    enseignant_id: string;
    date_creation: string;
    niveaux: string[];
    categories: string[];
    themes: string[];
    type: string;
}

export default function UseQuizPage() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [filters, setFilters] = useState({ niveaux: [], disciplines: [], themes: [] });
    const [selectedNiveau, setSelectedNiveau] = useState('');
    const [selectedDiscipline, setSelectedDiscipline] = useState('');
    const [selectedTheme, setSelectedTheme] = useState('');
    const [search, setSearch] = useState('');
    const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);

    useEffect(() => {
        fetch('/api/quiz')
            .then(res => res.json())
            .then(setQuizzes);
        fetch('/api/questions/filters')
            .then(res => res.json())
            .then(setFilters);
    }, []);

    useEffect(() => {
        console.log('Quizzes:', quizzes);
        console.log('Selected filters:', { selectedNiveau, selectedDiscipline, selectedTheme, search });
        const filtered = quizzes.filter(q =>
            (selectedNiveau ? (Array.isArray(q.niveaux) && q.niveaux.some(n => n.trim().toLowerCase() === selectedNiveau.trim().toLowerCase())) : true) &&
            (selectedDiscipline ? (Array.isArray(q.categories) && q.categories.some(c => c.trim().toLowerCase() === selectedDiscipline.trim().toLowerCase())) : true) &&
            (selectedTheme ? (Array.isArray(q.themes) && q.themes.some(t => t.trim().toLowerCase() === selectedTheme.trim().toLowerCase())) : true) &&
            (search ? q.nom.toLowerCase().includes(search.toLowerCase()) : true)
        );
        console.log('Filtered quizzes:', filtered);
        setFilteredQuizzes(filtered);
    }, [quizzes, selectedNiveau, selectedDiscipline, selectedTheme, search]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center p-4 pt-10">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full flex flex-col items-center gap-8">
                <Link href="/teacher/dashboard" className="self-start text-indigo-600 hover:text-indigo-800 font-semibold">
                    &larr; Retour au tableau de bord
                </Link>
                <h1 className="text-3xl font-extrabold text-sky-700 mb-4 text-center tracking-wide drop-shadow">Utiliser un Quiz Existant</h1>
                <div className="flex flex-col gap-4 w-full mb-4">
                    <select className="border-2 border-violet-200 bg-violet-50 rounded-full px-4 py-3 text-lg font-semibold text-violet-700 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition" value={selectedNiveau} onChange={e => setSelectedNiveau(e.target.value)}>
                        <option value="">Niveau</option>
                        {filters.niveaux.map((n: string) => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <select className="border-2 border-sky-200 bg-sky-50 rounded-full px-4 py-3 text-lg font-semibold text-sky-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-200 transition" value={selectedDiscipline} onChange={e => setSelectedDiscipline(e.target.value)}>
                        <option value="">Discipline</option>
                        {filters.disciplines.map((d: string) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select className="border-2 border-indigo-200 bg-indigo-50 rounded-full px-4 py-3 text-lg font-semibold text-indigo-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 transition" value={selectedTheme} onChange={e => setSelectedTheme(e.target.value)}>
                        <option value="">Thème</option>
                        {filters.themes.map((t: string) => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <input
                    className="border-2 border-sky-200 bg-sky-50 rounded-full px-4 py-3 text-lg font-semibold text-sky-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-200 transition mb-4"
                    type="text"
                    placeholder="Rechercher par nom de quiz..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <div className="max-h-96 overflow-y-auto border-2 border-indigo-200 rounded-2xl p-4 bg-indigo-50 shadow-inner w-full">
                    <QuizList quizzes={filteredQuizzes} onSelect={id => { }} />
                </div>
            </div>
        </div>
    );
}
