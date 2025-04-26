"use client";
import React, { useEffect, useState } from 'react';
import QuizList from '@/components/QuizList';
import QuestionSelector from '@/components/QuestionSelector';

export default function TeacherDashboard({ teacherId }: { teacherId: string }) {
    const [quizzes, setQuizzes] = useState<{ id: string; nom: string }[]>([]);
    const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
    const [quizName, setQuizName] = useState('');
    const [savingQuiz, setSavingQuiz] = useState(false);
    const [quizSaveSuccess, setQuizSaveSuccess] = useState<string | null>(null);
    const [quizSaveError, setQuizSaveError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/quiz')
            .then(res => res.json())
            .then((data) => setQuizzes(Array.isArray(data) ? data.filter(q => q && typeof q.id === 'string' && typeof q.nom === 'string') : []));
    }, []);
    useEffect(() => {
        fetch('/api/quiz')
            .then(res => res.json())
            .then((data) => setQuizzes(Array.isArray(data) ? data.filter(q => q && typeof q.id === 'string' && typeof q.nom === 'string') : []));
    }, [quizSaveSuccess]);

    const handleSaveQuiz = async () => {
        setSavingQuiz(true);
        setQuizSaveError(null);
        setQuizSaveSuccess(null);
        try {
            const response = await fetch('/api/quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nom: quizName || 'Quiz ' + new Date().toLocaleString(),
                    questions_ids: selectedQuestions,
                    enseignant_id: teacherId,
                    niveau: '',
                    categorie: '',
                    themes: [],
                    type: 'direct',
                }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Erreur lors de la sauvegarde du quiz.');
            setQuizSaveSuccess('Quiz sauvegardé !');
            setQuizName('');
            setSelectedQuestions([]);
        } catch (err: unknown) {
            setQuizSaveError((err as Error).message || 'Erreur inconnue.');
        } finally {
            setSavingQuiz(false);
        }
    };

    return (
        <div className="min-h-screen  flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full flex flex-col items-center gap-8">
                <h1 className="text-4xl font-extrabold text-indigo-700 mb-4 text-center tracking-wide drop-shadow">Espace Enseignant</h1>
                <div className="flex flex-col gap-6 w-full">
                    {/* Pass a dummy function or handle selection if needed */}
                    <QuizList quizzes={quizzes} onSelect={() => { /* TODO: Handle quiz selection */ }} />
                    <QuestionSelector onSelect={setSelectedQuestions} selectedQuestionIds={selectedQuestions} />
                    <input
                        className="w-full py-2 px-4 rounded border border-gray-300 mt-2"
                        type="text"
                        placeholder="Nom du quiz (optionnel)"
                        value={quizName}
                        onChange={e => setQuizName(e.target.value)}
                    />
                    <button className="w-full bg-gradient-to-r from-violet-400 to-sky-400 text-white font-extrabold py-3 px-8 rounded-full shadow-lg hover:scale-105 hover:shadow-xl focus:ring-4 focus:ring-violet-300 focus:outline-none transition text-xl tracking-wide" onClick={handleSaveQuiz} disabled={savingQuiz}>
                        {savingQuiz ? 'Sauvegarde...' : 'Sauvegarder le quiz'}
                    </button>
                    {quizSaveSuccess && <div className="text-green-600 font-bold">{quizSaveSuccess}</div>}
                    {quizSaveError && <div className="text-red-600 font-bold">{quizSaveError}</div>}
                </div>
            </div>
        </div>
    );
}
