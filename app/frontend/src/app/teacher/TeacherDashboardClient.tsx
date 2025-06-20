"use client";
import React, { useEffect, useState } from 'react';
import QuizList from '@/components/QuizList';
import QuestionSelector from '@/components/QuestionSelector';
import { makeApiRequest } from '@/config/api';
import { QuizListResponseSchema, QuizCreationResponseSchema, type QuizListResponse, type QuizCreationResponse } from '@/types/api';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

export default function TeacherDashboard({ teacherId }: { teacherId: string }) {
    const [quizzes, setQuizzes] = useState<{ id: string; name: string }[]>([]);
    const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
    const [quizName, setQuizName] = useState('');
    const [savingQuiz, setSavingQuiz] = useState(false);
    const [quizSaveSuccess, setQuizSaveSuccess] = useState<string | null>(null);
    const [quizSaveError, setQuizSaveError] = useState<string | null>(null);

    useEffect(() => {
        makeApiRequest<QuizListResponse>('/api/quiz', undefined, undefined, QuizListResponseSchema)
            .then((data) => setQuizzes(data?.gameTemplates?.filter(q => q && typeof q.id === 'string' && typeof q.name === 'string') || []))
            .catch((err) => console.error('Error loading quizzes:', err));
    }, []);
    useEffect(() => {
        makeApiRequest<QuizListResponse>('/api/quiz', undefined, undefined, QuizListResponseSchema)
            .then((data) => setQuizzes(data?.gameTemplates?.filter(q => q && typeof q.id === 'string' && typeof q.name === 'string') || []))
            .catch((err) => console.error('Error loading quizzes:', err));
    }, [quizSaveSuccess]);

    const handleSaveQuiz = async () => {
        setSavingQuiz(true);
        setQuizSaveError(null);
        setQuizSaveSuccess(null);
        try {
            const result = await makeApiRequest<QuizCreationResponse>('/api/quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: quizName || 'Quiz ' + new Date().toLocaleString(),
                    questionUids: selectedQuestions,
                    description: '',
                    settings: {}
                }),
            });
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
                    <QuestionSelector
                        onSelect={setSelectedQuestions}
                        selectedQuestionIds={selectedQuestions}
                        timerStatus="stop"
                        timerQuestionUid={null}
                        timeLeftMs={0}
                        onTimerAction={() => { }}
                    />
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
