"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from "next/navigation";
import CustomDropdown from "@/components/CustomDropdown";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";

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
    const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
    const [selectedQuizId, setSelectedQuizId] = useState<string>("");
    const router = useRouter();

    useEffect(() => {
        const teacherId = typeof window !== 'undefined' ? localStorage.getItem('mathquest_teacher_id') : null;
        if (teacherId) {
            fetch(`/api/quiz?enseignant_id=${teacherId}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setQuizzes(data);
                    } else {
                        setQuizzes([]);
                    }
                });
        } else {
            setQuizzes([]);
        }
        fetch('/api/questions/filters')
            .then(res => res.json())
            .then(setFilters);
    }, []);

    useEffect(() => {
        const filtered = quizzes.filter(q =>
            (selectedNiveau ? (Array.isArray(q.niveaux) && q.niveaux.some(n => n.trim().toLowerCase() === selectedNiveau.trim().toLowerCase())) : true) &&
            (selectedDiscipline ? (Array.isArray(q.categories) && q.categories.some(c => c.trim().toLowerCase() === selectedDiscipline.trim().toLowerCase())) : true) &&
            (selectedThemes.length > 0 ? (Array.isArray(q.themes) && selectedThemes.every(selTheme => q.themes.some(t => t.trim().toLowerCase() === selTheme.trim().toLowerCase()))) : true) &&
            (search ? q.nom.toLowerCase().includes(search.toLowerCase()) : true)
        );
        setFilteredQuizzes(filtered);
    }, [quizzes, selectedNiveau, selectedDiscipline, selectedThemes, search]);

    return (
        <div className="main-content">
            <div className="card w-full max-w-4xl shadow-xl bg-base-100 m-4 my-6">
                <div className="flex flex-col gap-8">
                    <div className="card-body flex-1 flex flex-col items-center gap-8 min-h-0 overflow-y-auto w-full p-0">
                        <h1 className="card-title text-3xl mb-4 text-center">Utiliser un Quiz Existant</h1>
                        <div className="w-full flex flex-col gap-4 mb-4">
                            <CustomDropdown
                                options={filters.niveaux}
                                value={selectedNiveau}
                                onChange={setSelectedNiveau}
                                placeholder="Niveau"
                            />
                            <CustomDropdown
                                options={filters.disciplines}
                                value={selectedDiscipline}
                                onChange={setSelectedDiscipline}
                                placeholder="Discipline"
                            />
                            <MultiSelectDropdown
                                options={filters.themes}
                                selected={selectedThemes}
                                onChange={setSelectedThemes}
                                placeholder="Thème(s)"
                            />
                        </div>
                        <input
                            className="input input-bordered input-lg w-full"
                            type="text"
                            placeholder="Rechercher par nom de quiz..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <div className="flex flex-wrap gap-2 w-full mt-4 justify-center">
                            {filteredQuizzes.length === 0 && (
                                <span className="text-gray-500">Aucun quiz disponible.</span>
                            )}
                            {filteredQuizzes.map((quiz) => (
                                <span
                                    key={quiz.id}
                                    className={`badge text-base cursor-pointer transition-colors duration-100 px-4 py-2 mb-2 
                    ${selectedQuizId === quiz.id
                                            ? "badge-accent font-bold flex items-center justify-center"
                                            : "badge-ghost rounded-lg"}`}
                                    style={selectedQuizId === quiz.id ? { minHeight: '2.5rem' } : {}}
                                    onClick={() => setSelectedQuizId(quiz.id)}
                                >
                                    {quiz.nom}
                                </span>
                            ))}
                        </div>
                        <div className="flex justify-center w-full mt-4">
                            <button
                                className="btn btn-primary btn-lg w-full"
                                disabled={!selectedQuizId}
                                onClick={() => {
                                    if (selectedQuizId) router.push(`/teacher/dashboard/${selectedQuizId}`);
                                }}
                            >
                                Utiliser ce quiz
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
