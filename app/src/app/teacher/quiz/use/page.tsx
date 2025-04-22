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
        const filtered = quizzes.filter(q =>
            (selectedNiveau ? (Array.isArray(q.niveaux) && q.niveaux.some(n => n.trim().toLowerCase() === selectedNiveau.trim().toLowerCase())) : true) &&
            (selectedDiscipline ? (Array.isArray(q.categories) && q.categories.some(c => c.trim().toLowerCase() === selectedDiscipline.trim().toLowerCase())) : true) &&
            (selectedTheme ? (Array.isArray(q.themes) && q.themes.some(t => t.trim().toLowerCase() === selectedTheme.trim().toLowerCase())) : true) &&
            (search ? q.nom.toLowerCase().includes(search.toLowerCase()) : true)
        );
        setFilteredQuizzes(filtered);
    }, [quizzes, selectedNiveau, selectedDiscipline, selectedTheme, search]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 p-4 pt-10">
            <div className="card w-full max-w-2xl shadow-xl bg-base-100">
                <div className="card-body items-center gap-8">
                    <div className="w-full">
                        <Link href="/teacher/dashboard" className="text-primary underline hover:text-primary/80 font-semibold">&larr; Retour au tableau de bord</Link>
                    </div>
                    <div className="mb-6" />
                    <h1 className="card-title text-3xl mb-4 text-center">Utiliser un Quiz Existant</h1>
                    <div className="flex flex-col gap-4 w-full mb-4">
                        <select className="select select-bordered select-lg w-full" value={selectedNiveau} onChange={e => setSelectedNiveau(e.target.value)}>
                            <option value="">Niveau</option>
                            {filters.niveaux.map((n: string) => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <select className="select select-bordered select-lg w-full" value={selectedDiscipline} onChange={e => setSelectedDiscipline(e.target.value)}>
                            <option value="">Discipline</option>
                            {filters.disciplines.map((d: string) => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <select className="select select-bordered select-lg w-full" value={selectedTheme} onChange={e => setSelectedTheme(e.target.value)}>
                            <option value="">Thème</option>
                            {filters.themes.map((t: string) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <input
                        className="input input-bordered input-lg w-full"
                        type="text"
                        placeholder="Rechercher par nom de quiz..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <div className="max-h-96 overflow-y-auto w-full mt-4">
                        <QuizList quizzes={filteredQuizzes} onSelect={id => { }} />
                    </div>
                </div>
            </div>
        </div>
    );
}
