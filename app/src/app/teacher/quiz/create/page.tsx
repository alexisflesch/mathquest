"use client";
import React, { useEffect, useState } from 'react';
import QuestionSelector from '@/components/QuestionSelector';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import CustomDropdown from '@/components/CustomDropdown';
import MultiSelectDropdown from '@/components/MultiSelectDropdown';

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
    const [selectedThemes, setSelectedThemes] = useState<string[]>([]); // Pour MultiSelectDropdown

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
        <div className="main-content">
            <div className="card w-full max-w-5xl shadow-xl bg-base-100 my-6">
                <div className="card-body items-center gap-8">
                    <h1 className="card-title text-3xl mb-4 mt-4 text-center">Créer un Nouveau Quiz</h1>
                    <div className="text-base text-muted mb-6">
                        Sélectionnez des questions pour créer un quiz. Aidez-vous des filtres ci-dessous au besoin, puis nommez votre quiz et sauvegardez-le.
                    </div>
                    <div className="flex flex-col gap-6 w-full mb-0">
                        {/* Filtres groupés avec composants custom */}
                        <div className="flex flex-col gap-4 w-full -mb-1">
                            <CustomDropdown
                                // label="Niveau"
                                options={filters.niveaux || []}
                                value={selectedNiveau}
                                onChange={setSelectedNiveau}
                                placeholder="Niveau"
                            />
                            <CustomDropdown
                                // label="Discipline"
                                options={filters.disciplines || []}
                                value={selectedDiscipline}
                                onChange={setSelectedDiscipline}
                                placeholder="Discipline"
                            />
                            <MultiSelectDropdown
                                // label="Thèmes"
                                options={filters.themes || []}
                                selected={selectedThemes ?? []}
                                onChange={setSelectedThemes}
                                placeholder="Thèmes"
                            />
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
                                theme: selectedThemes || [], // Passer le tableau directement sans conversion
                            }}
                            timerStatus="stop"
                            timerQuestionId={null}
                            timeLeft={0}
                            onTimerAction={() => { }}
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
