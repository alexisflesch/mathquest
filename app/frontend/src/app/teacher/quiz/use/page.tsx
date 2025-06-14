"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from "next/navigation";
import CustomDropdown from "@/components/CustomDropdown";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";
import { makeApiRequest } from '@/config/api';
import { QuizListResponseSchema, QuestionsFiltersResponseSchema, type QuizListResponse, type QuestionsFiltersResponse } from '@/types/api';
import { useAuth } from '@/components/AuthProvider';
import { useAccessGuard } from '@/hooks/useAccessGuard';
import { Search } from 'lucide-react';
import type { GameTemplate } from '@shared/types/core/game';

export default function UseQuizPage() {
    // Access guard: Require teacher access for quiz usage
    const { isAllowed } = useAccessGuard({
        allowStates: ['teacher'],
        redirectTo: '/teacher/login'
    });

    // If access is denied, the guard will handle redirection
    if (!isAllowed) {
        return null; // Component won't render while redirecting
    }

    const { teacherId } = useAuth();
    const [quizzes, setQuizzes] = useState<GameTemplate[]>([]);
    const [filters, setFilters] = useState<{ gradeLevel: string[]; disciplines: string[]; themes: string[] }>({ gradeLevel: [], disciplines: [], themes: [] });
    const [selectedNiveau, setSelectedNiveau] = useState('');
    const [selectedDiscipline, setSelectedDiscipline] = useState('');
    const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [filteredQuizzes, setFilteredQuizzes] = useState<GameTemplate[]>([]);
    const [selectedQuizId, setSelectedQuizId] = useState<string>("");
    const router = useRouter();

    useEffect(() => {
        if (teacherId) {
            // Use the shared QuizTemplatesResponse API
            makeApiRequest<QuizListResponse>(`/api/quiz?creatorId=${teacherId}`, undefined, undefined, QuizListResponseSchema)
                .then(data => {
                    if (Array.isArray(data)) {
                        // Use GameTemplate directly - no mapping needed
                        setQuizzes(data);
                    } else if (data && 'gameTemplates' in data) {
                        // Handle QuizTemplatesResponse format
                        setQuizzes(data.gameTemplates);
                    } else {
                        setQuizzes([]);
                    }
                })
                .catch(error => {
                    console.error('Error fetching quizzes:', error);
                    setQuizzes([]);
                });
        } else {
            setQuizzes([]);
        }
        makeApiRequest<QuestionsFiltersResponse>('questions/filters', undefined, undefined, QuestionsFiltersResponseSchema)
            .then(data => {
                // Filter out null values from niveaux array
                setFilters({
                    gradeLevel: data.gradeLevel.filter((n): n is string => n !== null),
                    disciplines: data.disciplines,
                    themes: data.themes
                });
            })
            .catch(error => {
                console.error('Error fetching filters:', error);
            });
    }, [teacherId]);

    useEffect(() => {
        const filtered = quizzes.filter(q =>
            (selectedNiveau ? (q.gradeLevel && q.gradeLevel.trim().toLowerCase() === selectedNiveau.trim().toLowerCase()) : true) &&
            (selectedDiscipline ? (q.discipline && q.discipline.trim().toLowerCase() === selectedDiscipline.trim().toLowerCase()) : true) &&
            (selectedThemes.length > 0 ? (Array.isArray(q.themes) && selectedThemes.every(selTheme => q.themes.some(t => t.trim().toLowerCase() === selTheme.trim().toLowerCase()))) : true) &&
            (search ? q.name.toLowerCase().includes(search.toLowerCase()) : true)
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
                                options={filters.gradeLevel}
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
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={20} className="text-gray-400" />
                            </div>
                            <input
                                className="input input-bordered input-lg w-full pl-10"
                                type="text"
                                placeholder="Rechercher par nom de quiz..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
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
                                    {quiz.name}
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
