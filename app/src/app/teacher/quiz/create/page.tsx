"use client";
import React, { useEffect, useState } from 'react';
import QuizList from '@/components/QuizList'; // Keep QuizList for potential display, or remove if not needed here
import QuestionSelector from '@/components/QuestionSelector';
import Link from 'next/link';

export default function CreateQuizPage() {
    // TODO: Get teacherId, perhaps from context or server-side
    const [quizzes, setQuizzes] = useState<{ id: string; nom: string }[]>([]); // State to hold existing quizzes, might be useful
    const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
    const [quizName, setQuizName] = useState('');
    const [savingQuiz, setSavingQuiz] = useState(false);
    const [quizSaveSuccess, setQuizSaveSuccess] = useState<string | null>(null);
    const [quizSaveError, setQuizSaveError] = useState<string | null>(null);

    // Fetch existing quizzes (optional for this page, but kept for now)
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
            // TODO: Get the actual teacherId here
            const teacherId = 'TODO_GET_TEACHER_ID'; // Placeholder

            const response = await fetch('/api/quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nom: quizName || 'Quiz ' + new Date().toLocaleString(),
                    questions_ids: selectedQuestions,
                    enseignant_id: teacherId, // Use the placeholder
                    niveau: '', // Consider adding fields for these
                    categorie: '',
                    themes: [],
                    type: 'direct', // Or allow selection
                }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Erreur lors de la sauvegarde du quiz.');
            setQuizSaveSuccess('Quiz sauvegardé avec succès !');
            setQuizName('');
            setSelectedQuestions([]); // Clear selected questions after save
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
                    <QuestionSelector onSelect={setSelectedQuestions} selectedQuestionIds={selectedQuestions} />
                    <input
                        className="w-full py-2 px-4 rounded border border-gray-300 mt-2"
                        type="text"
                        placeholder="Nom du nouveau quiz (optionnel)"
                        value={quizName}
                        onChange={e => setQuizName(e.target.value)}
                    />
                    <button
                        className="w-full bg-gradient-to-r from-violet-400 to-purple-500 text-white font-extrabold py-3 px-8 rounded-full shadow-lg hover:scale-105 hover:shadow-xl focus:ring-4 focus:ring-violet-300 focus:outline-none transition text-xl tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleSaveQuiz}
                        disabled={savingQuiz || selectedQuestions.length === 0}
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
