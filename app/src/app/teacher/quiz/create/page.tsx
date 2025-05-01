"use client";
import React, { useEffect, useState, useRef, useCallback } from 'react';
import QuestionDisplay from '@/app/components/QuestionDisplay';
import type { Question } from '@/types';
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
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [openUid, setOpenUid] = useState<string | null>(null);
    const BATCH_SIZE = 20;
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);
    const [tagSearch, setTagSearch] = useState(''); // New state for tag search

    useEffect(() => {
        fetch('/api/questions/filters')
            .then(res => res.json())
            .then(setFilters);
    }, []);

    // Fetch questions with pagination
    const fetchQuestions = useCallback(async (reset = false) => {
        if (loadingQuestions || loadingMore) return; // Prevent double fetch
        setLoadingQuestions(true);
        let url = '/api/questions?';
        const params = [];
        if (selectedNiveau) params.push(`niveau=${encodeURIComponent(selectedNiveau)}`);
        if (selectedDiscipline) params.push(`discipline=${encodeURIComponent(selectedDiscipline)}`);
        if (selectedThemes.length > 0) params.push(`theme=${selectedThemes.map(encodeURIComponent).join(',')}`);
        params.push(`limit=${BATCH_SIZE}`);
        params.push(`offset=${reset ? 0 : offset}`);
        params.push('shuffle=false'); // Always disable shuffling for quiz creation
        if (params.length > 0) url += params.join('&');
        const res = await fetch(url);
        const data = await res.json();
        const newQuestions = Array.isArray(data) ? data : data.questions || [];
        if (reset) {
            setQuestions(newQuestions);
            setOffset(BATCH_SIZE);
        } else {
            setQuestions((prev: Question[]) => {
                const existingUids = new Set(prev.map((q: Question) => q.uid));
                const filtered = newQuestions.filter((q: Question) => !existingUids.has(q.uid));
                return [...prev, ...filtered];
            });
            setOffset(prev => prev + BATCH_SIZE);
        }
        setHasMore(newQuestions.length === BATCH_SIZE);
        setLoadingQuestions(false);
        setLoadingMore(false);
    }, [selectedNiveau, selectedDiscipline, selectedThemes, offset, loadingQuestions, loadingMore]);

    // Initial and filter change fetch
    useEffect(() => {
        setOffset(0);
        setHasMore(true);
        fetchQuestions(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedNiveau, selectedDiscipline, selectedThemes]);

    // Infinite scroll handler
    useEffect(() => {
        const handleScroll = () => {
            const el = listRef.current;
            if (!el || loadingQuestions || loadingMore || !hasMore) return;
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
                setLoadingMore(true);
                fetchQuestions();
            }
        };
        const el = listRef.current;
        if (el) el.addEventListener('scroll', handleScroll);
        return () => { if (el) el.removeEventListener('scroll', handleScroll); };
    }, [fetchQuestions, loadingQuestions, loadingMore, hasMore]);

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
                                options={filters.niveaux || []}
                                value={selectedNiveau}
                                onChange={setSelectedNiveau}
                                placeholder="Niveau"
                            />
                            <CustomDropdown
                                options={filters.disciplines || []}
                                value={selectedDiscipline}
                                onChange={setSelectedDiscipline}
                                placeholder="Discipline"
                            />
                            <MultiSelectDropdown
                                options={filters.themes || []}
                                selected={selectedThemes ?? []}
                                onChange={setSelectedThemes}
                                placeholder="Thèmes"
                            />
                        </div>
                        {/* Tag search input */}
                        <input
                            className="input input-bordered w-full mb-2"
                            type="text"
                            placeholder="Rechercher par tag, thème, niveau, discipline..."
                            value={tagSearch}
                            onChange={e => setTagSearch(e.target.value)}
                        />
                        {/* Questions list using QuestionDisplay */}
                        <div className="quiz-create-question-list flex flex-col w-full" ref={listRef} style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            {loadingQuestions && questions.length === 0 ? (
                                <div className="text-center text-muted">Chargement des questions…</div>
                            ) : questions.length === 0 ? (
                                <div className="text-center text-muted">Aucune question trouvée pour ces filtres.</div>
                            ) : (
                                <>
                                    {questions
                                        .filter((q: Question) => {
                                            if (!tagSearch.trim()) return true;
                                            const search = tagSearch.trim().toLowerCase();
                                            // Check for tags, theme, niveau, discipline, titre, question
                                            const tags = [
                                                ...(q.tags || []),
                                                q.theme,
                                                q.niveau,
                                                q.discipline,
                                                q.titre,
                                                q.question
                                            ].filter(Boolean).map(String).map(s => s.toLowerCase());
                                            return tags.some(t => t.includes(search));
                                        })
                                        .map(q => (
                                            <div key={q.uid} className="flex flex-row items-start gap-2"> {/* Changed items-center to items-start */}
                                                <input
                                                    type="checkbox"
                                                    checked={selectedQuestions.includes(q.uid)}
                                                    onChange={e => {
                                                        setSelectedQuestions(prev => {
                                                            let next;
                                                            if (e.target.checked) {
                                                                next = [...prev, q.uid];
                                                            } else {
                                                                next = prev.filter(id => id !== q.uid);
                                                            }
                                                            // Update quizMeta in real time
                                                            setQuizMeta(meta => {
                                                                // Gather all selected questions
                                                                const selectedQs = questions.filter((qq: Question) => next.includes(qq.uid));
                                                                // Unique niveaux, categories, themes from selected questions
                                                                const niveaux = Array.from(new Set(selectedQs.map(qq => qq.niveau).filter((v): v is string => Boolean(v))));
                                                                const categories = Array.from(new Set(selectedQs.map(qq => qq.discipline).filter((v): v is string => Boolean(v))));
                                                                const themes = Array.from(new Set(selectedQs.map(qq => qq.theme).filter((v): v is string => Boolean(v))));
                                                                return { niveaux, categories, themes };
                                                            });
                                                            return next;
                                                        });
                                                    }}
                                                    className="align-top mt-3" // Added mt-2 to move checkbox down
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <QuestionDisplay
                                                        question={q}
                                                        isActive={selectedQuestions.includes(q.uid)}
                                                        isOpen={openUid === q.uid}
                                                        onToggleOpen={() => setOpenUid(openUid === q.uid ? null : q.uid)}
                                                        timerStatus="stop"
                                                        disabled={false}
                                                        showControls={false}
                                                        className="question-compact"
                                                        showMeta={true}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    {loadingMore && <div className="text-center text-muted py-2">Chargement…</div>}
                                    {!hasMore && questions.length > 0 && <div className="text-center text-muted py-2">Toutes les questions sont chargées.</div>}
                                </>
                            )}
                        </div>
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
