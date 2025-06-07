"use client";
import React, { useEffect, useState, useRef, useCallback } from 'react';
import QuestionDisplay from '@/components/QuestionDisplay';
import type { BaseQuestion as SharedQuestion, Answer as SharedAnswer } from '@shared/types/question'; // Import shared types
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useAccessGuard } from '@/hooks/useAccessGuard';
import CustomDropdown from '@/components/CustomDropdown';
import MultiSelectDropdown from '@/components/MultiSelectDropdown';
import { makeApiRequest } from '@/config/api';
import { QuestionsResponseSchema, QuizCreationResponseSchema, type QuestionsResponse, type QuizCreationResponse } from '@/types/api';

// Local interface for questions on this page, compatible with QuestionDisplayProps
interface QuestionForCreatePage {
    uid: string;
    title?: string;
    text: string; // Changed from question: string to text: string
    answers: Array<{ text: string; correct: boolean }>; // Must match QuestionDisplay
    level?: string | string[]; // This will be populated from shared type's gradeLevel or API's level/niveaux
    discipline?: string;
    themes?: string[]; // Plural, to align with shared type
    explanation?: string;
    time?: number;
    tags?: string[];
}

export default function CreateQuizPage() {
    // Access guard: Require teacher access for quiz creation
    const { isAllowed } = useAccessGuard({
        allowStates: ['teacher'],
        redirectTo: '/teacher/login'
    });

    // If access is denied, the guard will handle redirection
    if (!isAllowed) {
        return null; // Component won't render while redirecting
    }

    const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
    const [quizMeta, setQuizMeta] = useState<{ levels: string[]; themes: string[] }>({ levels: [], themes: [] }); // Removed categories
    const [quizName, setQuizName] = useState('');
    const [savingQuiz, setSavingQuiz] = useState(false);
    const [quizSaveSuccess, setQuizSaveSuccess] = useState<string | null>(null);
    const [quizSaveError, setQuizSaveError] = useState<string | null>(null);
    const { teacherId } = useAuth();
    const [filters, setFilters] = useState<{ levels: string[]; disciplines: string[]; themes: string[] }>({ levels: [], disciplines: [], themes: [] }); // Renamed niveaux to levels
    const [selectedLevel, setSelectedLevel] = useState(''); // Renamed selectedNiveau to selectedLevel
    const [selectedDiscipline, setSelectedDiscipline] = useState('');
    const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
    const [questions, setQuestions] = useState<QuestionForCreatePage[]>([]); // Use new local type
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [openUid, setOpenUid] = useState<string | null>(null);
    const BATCH_SIZE = 20;
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);
    const [tagSearch, setTagSearch] = useState('');

    useEffect(() => {
        makeApiRequest<{
            levels?: string[];
            niveaux?: string[];
            disciplines?: string[];
            themes?: string[];
        }>('questions/filters')
            .then(data => {
                setFilters({
                    levels: data.levels || data.niveaux || [], // Prefer 'levels', fallback to 'niveaux'
                    disciplines: data.disciplines || [],
                    themes: data.themes || []
                });
            })
            .catch(error => {
                console.error('Error fetching filters:', error);
            });
    }, []);

    const fetchQuestions = useCallback(async (reset = false) => {
        if (loadingQuestions || loadingMore) return;
        setLoadingQuestions(true);
        if (reset) {
            setOffset(0); // Reset offset for new filter/initial load
        }

        let url = 'questions?';
        const params = [];
        if (selectedLevel) params.push(`level=${encodeURIComponent(selectedLevel)}`); // Use selectedLevel
        if (selectedDiscipline) params.push(`discipline=${encodeURIComponent(selectedDiscipline)}`);
        if (selectedThemes.length > 0) params.push(`theme=${selectedThemes.map(encodeURIComponent).join(',')}`);
        params.push(`limit=${BATCH_SIZE}`);
        params.push(`offset=${reset ? 0 : offset}`);
        params.push('shuffle=false');
        if (params.length > 0) url += params.join('&');

        const data = await makeApiRequest<QuestionsResponse>(url, undefined, undefined, QuestionsResponseSchema);

        const newQuestionsFromApi = (Array.isArray(data) ? data : data.questions || []) as SharedQuestion[];

        const transformedQuestions: QuestionForCreatePage[] = newQuestionsFromApi
            .filter((q: SharedQuestion) => // q is BaseQuestion
                typeof q.text === 'string' && q.text.trim() !== '' && // Use q.text from BaseQuestion
                Array.isArray(q.answers) // Use q.answers from BaseQuestion
            )
            .map((q: SharedQuestion) => { // q is BaseQuestion
                const apiQuestion = q as any; // Cast to any to access fields potentially not in BaseQuestion but from API
                return {
                    uid: q.uid, // From BaseQuestion
                    title: apiQuestion.title || apiQuestion.titre, // From API, fallback to French
                    text: q.text as string, // Changed from question: q.text to text: q.text
                    answers: q.answers!.map((a: SharedAnswer) => ({ // a is Answer from BaseQuestion
                        text: a.text || '',
                        correct: a.correct || false // Use a.correct from Answer
                    })),
                    level: apiQuestion.gradeLevel || apiQuestion.level || apiQuestion.niveaux, // Prioritize gradeLevel from shared, then API's level/niveaux
                    discipline: apiQuestion.discipline || apiQuestion.category || apiQuestion.subject, // From API, with fallbacks
                    themes: apiQuestion.themes, // From API (should be plural)
                    explanation: q.explanation, // From BaseQuestion
                    time: q.time, // From BaseQuestion
                    tags: q.tags, // From BaseQuestion
                };
            });

        if (reset) {
            setQuestions(transformedQuestions);
            setOffset(transformedQuestions.length); // Next offset starts after these questions
        } else {
            setQuestions(prev => {
                const existingUids = new Set(prev.map(pq => pq.uid));
                const filteredNew = transformedQuestions.filter(nq => !existingUids.has(nq.uid));
                return [...prev, ...filteredNew];
            });
            setOffset(prevOffset => prevOffset + transformedQuestions.length); // Increment offset by number of new questions fetched
        }
        setHasMore(transformedQuestions.length === BATCH_SIZE);
        setLoadingQuestions(false);
        setLoadingMore(false);
    }, [selectedLevel, selectedDiscipline, selectedThemes, offset, loadingQuestions, loadingMore]); // Added offset to dependencies

    useEffect(() => {
        setOffset(0); // Reset offset
        setHasMore(true); // Assume there's more data
        fetchQuestions(true); // Fetch with reset
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedLevel, selectedDiscipline, selectedThemes]); // Dependencies that trigger a full reset

    useEffect(() => {
        const handleScroll = () => {
            const el = listRef.current;
            if (!el || loadingQuestions || loadingMore || !hasMore) return;
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
                setLoadingMore(true);
                fetchQuestions(false); // Fetch more, don't reset
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
            if (quizMeta.levels.length === 0) { // Removed categories from validation
                setQuizSaveError('Veuillez sélectionner au moins une question pour déterminer le niveau.'); // Adjusted error message
                setSavingQuiz(false);
                return;
            }
            const result = await makeApiRequest<QuizCreationResponse>('quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nom: quizName,
                    questions_ids: selectedQuestions,
                    enseignant_id: teacherId,
                    levels: quizMeta.levels, // Use levels
                    themes: quizMeta.themes,
                    type: 'direct',
                }),
            }, undefined, QuizCreationResponseSchema);
            setQuizSaveSuccess('Quiz sauvegardé avec succès !');
            setQuizName('');
            setSelectedQuestions([]);
            setQuizMeta({ levels: [], themes: [] }); // Removed categories
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
                        <div className="flex flex-col gap-4 w-full -mb-1">
                            <CustomDropdown
                                options={filters.levels || []} // Use levels
                                value={selectedLevel} // Use selectedLevel
                                onChange={setSelectedLevel} // Use setSelectedLevel
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
                        <input
                            className="input input-bordered w-full mb-2"
                            type="text"
                            placeholder="Rechercher par tag, thème, niveau, discipline..."
                            value={tagSearch}
                            onChange={e => setTagSearch(e.target.value)}
                        />
                        <div className="quiz-create-question-list flex flex-col w-full" ref={listRef} style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            {loadingQuestions && questions.length === 0 ? (
                                <div className="text-center text-muted">Chargement des questions…</div>
                            ) : questions.length === 0 ? (
                                <div className="text-center text-muted">Aucune question trouvée pour ces filtres.</div>
                            ) : (
                                <>
                                    {questions // Type is QuestionForCreatePage[]
                                        .filter((q) => { // q is QuestionForCreatePage
                                            if (!tagSearch.trim()) return true;
                                            const search = tagSearch.trim().toLowerCase();
                                            const tags = [
                                                ...(q.tags || []),
                                                q.themes,
                                                q.level, // Use level
                                                q.discipline,
                                                q.title, // Use title
                                                q.text // Changed from q.question to q.text
                                            ].filter(Boolean).map(String).map(s => s.toLowerCase());
                                            return tags.some(t => t.includes(search));
                                        })
                                        .map(q => ( // q is QuestionForCreatePage
                                            <div key={q.uid} className="flex flex-row items-start gap-2">
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
                                                            setQuizMeta(() => { // Removed 'meta' param to avoid shadowing
                                                                const selectedQs = questions.filter(qq => next.includes(qq.uid));
                                                                const levels = Array.from(new Set(selectedQs.map(qq => qq.level).filter((v): v is string => Boolean(v)))); // Use levels and qq.level
                                                                // Updated to use only qq.themes as qq.theme is removed
                                                                const themes = Array.from(new Set(selectedQs.flatMap(qq => qq.themes || []).filter((v): v is string => Boolean(v))));
                                                                return { levels, themes }; // Removed categories
                                                            });
                                                            return next;
                                                        });
                                                    }}
                                                    className="align-top mt-3"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <QuestionDisplay
                                                        question={q} // q is QuestionForCreatePage, compatible with QuestionDisplayProps.question
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
                        {(quizMeta.levels.length > 0 || quizMeta.themes.length > 0) && ( // Removed categories check
                            <div className="flex flex-row flex-wrap items-center gap-2 my-2">
                                {quizMeta.levels.map(n => ( // Use levels
                                    <span key={n} className="badge badge-primary rounded-lg px-4 py-2">{n}</span>
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
