"use client";
import React, { useEffect, useState } from 'react';
import QuizList from '@/components/QuizList'; // Keep QuizList for potential display, or remove if not needed here
import QuestionSelector from '@/components/QuestionSelector';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function CreateQuizPage() {
    // TODO: Get teacherId, perhaps from context or server-side
    const [quizzes, setQuizzes] = useState<{ id: string; nom: string }[]>([]); // State to hold existing quizzes, might be useful
    const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
    const [quizMeta, setQuizMeta] = useState<{ niveaux: string[]; categories: string[]; themes: string[] }>({ niveaux: [], categories: [], themes: [] });
    const [quizName, setQuizName] = useState('');
    const [savingQuiz, setSavingQuiz] = useState(false);
    const [quizSaveSuccess, setQuizSaveSuccess] = useState<string | null>(null);
    const [quizSaveError, setQuizSaveError] = useState<string | null>(null);
    const { teacherId } = useAuth();

    const [availableNiveaux, setAvailableNiveaux] = useState<string[]>([]);
    const [availableCategories, setAvailableCategories] = useState<string[]>([]);
    const [availableThemes, setAvailableThemes] = useState<string[]>([]);

    useEffect(() => {
        fetch('/api/questions/filters')
            .then(res => res.json())
            .then(data => {
                setAvailableNiveaux(data.niveaux || []);
                setAvailableCategories(data.disciplines || []);
                setAvailableThemes(data.themes || []);
            });
    }, []);

    useEffect(() => {
        fetch('/api/quiz')
            .then(res => res.json())
            .then((data) => setQuizzes(Array.isArray(data) ? data.filter(q => q && typeof q.id === 'string' && typeof q.nom === 'string') : []));
    }, [quizSaveSuccess]); // Refetch if a quiz was just saved

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
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center p-4 pt-10">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full flex flex-col items-center gap-8">
                <Link href="/teacher/dashboard" className="self-start text-indigo-600 hover:text-indigo-800 font-semibold">
                    &larr; Retour au tableau de bord
                </Link>
                <h1 className="text-3xl font-extrabold text-indigo-700 mb-4 text-center tracking-wide drop-shadow">Créer un Nouveau Quiz</h1>
                <div className="flex flex-col gap-6 w-full">
                    {/* Question Selector is the main component here */}
                    <QuestionSelector
                        onSelect={(ids, meta) => {
                            setSelectedQuestions(ids);
                            setQuizMeta(meta);
                        }}
                        selectedQuestionIds={selectedQuestions}
                    />
                    <input
                        className="w-full py-2 px-4 rounded border border-gray-300 mt-2"
                        type="text"
                        placeholder="Nom du nouveau quiz"
                        value={quizName}
                        onChange={e => setQuizName(e.target.value)}
                    />
                    {/* Add a summary of selected niveaux, categories, and themes as blue buttons above the save button */}
                    {(quizMeta.niveaux.length > 0 || quizMeta.categories.length > 0 || quizMeta.themes.length > 0) && (
                        <div className="flex flex-wrap gap-2 my-2">
                            {quizMeta.niveaux.map(n => (
                                <span key={n} className="px-3 py-1 rounded-full bg-blue-700 font-bold text-white border">{n}</span>
                            ))}
                            {quizMeta.categories.map(c => (
                                <span key={c} className="px-3 py-1 rounded-full bg-blue-700 font-bold text-white border">{c}</span>
                            ))}
                            {quizMeta.themes.map(t => (
                                <span key={t} className="px-3 py-1 rounded-full bg-blue-700 font-bold text-white border">{t}</span>
                            ))}
                        </div>
                    )}
                    <button
                        className="w-full bg-gradient-to-r from-violet-400 to-purple-500 text-white font-extrabold py-3 px-8 rounded-full shadow-lg hover:scale-105 hover:shadow-xl focus:ring-4 focus:ring-violet-300 focus:outline-none transition text-xl tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleSaveQuiz}
                        disabled={savingQuiz || selectedQuestions.length === 0 || !quizName.trim()}
                    >
                        {savingQuiz ? 'Sauvegarde...' : 'Sauvegarder le nouveau quiz'}
                    </button>
                    {quizSaveSuccess && <div className="text-center text-green-600 font-bold mt-2">{quizSaveSuccess}</div>}
                    {quizSaveError && <div className="text-center text-red-600 font-bold mt-2">{quizSaveError}</div>}
                </div>
            </div>
        </div>
    );
}
