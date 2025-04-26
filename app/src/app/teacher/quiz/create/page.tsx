"use client";
import React, { useEffect, useState } from 'react';
import QuestionSelector from '@/components/QuestionSelector';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function CreateQuizPage() {
    const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
    const [quizMeta, setQuizMeta] = useState<{ niveaux: string[]; categories: string[]; themes: string[] }>({ niveaux: [], categories: [], themes: [] });
    const [quizName, setQuizName] = useState('');
    const [savingQuiz, setSavingQuiz] = useState(false);
    const [quizSaveSuccess, setQuizSaveSuccess] = useState<string | null>(null);
    const [quizSaveError, setQuizSaveError] = useState<string | null>(null);
    const { teacherId } = useAuth();
    const [filters, setFilters] = useState({ niveaux: [], disciplines: [], themes: [] });
    const [selectedNiveau, setSelectedNiveau] = useState('');
    const [selectedDiscipline, setSelectedDiscipline] = useState('');
    const [selectedTheme, setSelectedTheme] = useState('');

    useEffect(() => {
        fetch('/api/questions/filters')
            .then(res => res.json())
            .then(setFilters);
    }, []);

    const handleSaveQuiz = async () => {
        setSavingQuiz(true);
        setQuizSaveError(null);
        setQuizSaveSuccess(null);
        try {
            if (!teacherId) {
                setQuizSaveError('Impossible de trouver votre identifiant enseignant. Veuillez vous reconnecter.');
                setSavingQuiz(false);
                return;
            }
            if (!quizName.trim()) {
                setQuizSaveError('Le nom du quiz est obligatoire.');
                setSavingQuiz(false);
                return;
            }
            if (quizMeta.niveaux.length === 0 || quizMeta.categories.length === 0) {
                setQuizSaveError('Veuillez sélectionner au moins une question pour déterminer le niveau et la discipline.');
                setSavingQuiz(false);
                return;
            }
            const response = await fetch('/api/quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nom: quizName,
                    questions_ids: selectedQuestions,
                    enseignant_id: teacherId,
                    niveaux: quizMeta.niveaux,
                    categories: quizMeta.categories,
                    themes: quizMeta.themes,
                    type: 'direct',
                }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Erreur lors de la sauvegarde du quiz.');
            setQuizSaveSuccess('Quiz sauvegardé avec succès !');
            setQuizName('');
            setSelectedQuestions([]);
            setQuizMeta({ niveaux: [], categories: [], themes: [] });
        } catch (err: unknown) {
            setQuizSaveError((err as Error).message || 'Erreur inconnue.');
        } finally {
            setSavingQuiz(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 py-2 px-2 md:py-4">
            <div className="card w-full max-w-2xl shadow-xl bg-base-100">
                <div className="card-body items-center gap-8">
                    <div className="w-full">
                        <Link href="/teacher/dashboard" className="text-primary underline hover:text-primary/80 font-semibold">&larr; Retour au tableau de bord</Link>
                    </div>
                    <h1 className="card-title text-3xl mb-2 mt-4 text-center">Créer un Nouveau Quiz</h1>
                    <div className="flex flex-col gap-6 w-full">
                        {/* Consistent dropdowns for filters */}
                        <div className="flex flex-col gap-4 w-full mb-2">
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
                        <QuestionSelector
                            onSelect={(ids, meta) => {
                                // Prevent infinite loop by only updating if values have changed
                                if (
                                    JSON.stringify(ids) !== JSON.stringify(selectedQuestions) ||
                                    JSON.stringify(meta) !== JSON.stringify(quizMeta)
                                ) {
                                    setSelectedQuestions(ids);
                                    setQuizMeta(meta);
                                }
                            }}
                            selectedQuestionIds={selectedQuestions}
                            externalFilter={{
                                discipline: selectedDiscipline,
                                niveau: selectedNiveau,
                                theme: selectedTheme,
                            }}
                        />
                        <input
                            className="input input-bordered input-lg w-full mt-2"
                            type="text"
                            placeholder="Nom du nouveau quiz"
                            value={quizName}
                            onChange={e => setQuizName(e.target.value)}
                        />
                        {(quizMeta.niveaux.length > 0 || quizMeta.categories.length > 0 || quizMeta.themes.length > 0) && (
                            <div className="flex flex-row flex-wrap items-center gap-2 my-2">
                                {quizMeta.niveaux.map(n => (
                                    <span key={n} className="badge badge-primary rounded-lg px-4 py-2">{n}</span>
                                ))}
                                {quizMeta.categories.map(c => (
                                    <span key={c} className="badge badge-secondary rounded-lg px-4 py-2">{c}</span>
                                ))}
                                {quizMeta.themes.map(t => (
                                    <span key={t} className="badge badge-accent rounded-lg px-4 py-2">{t}</span>
                                ))}
                            </div>
                        )}
                        <button
                            className="btn-primary w-full"
                            onClick={handleSaveQuiz}
                            disabled={savingQuiz || selectedQuestions.length === 0 || !quizName.trim()}
                        >
                            {savingQuiz ? 'Sauvegarde...' : 'Sauvegarder le nouveau quiz'}
                        </button>
                        {quizSaveSuccess && <div className="alert alert-success justify-center mt-2">{quizSaveSuccess}</div>}
                        {quizSaveError && <div className="alert alert-error justify-center mt-2">{quizSaveError}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}
