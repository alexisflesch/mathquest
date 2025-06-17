"use client";
import React, { useEffect, useState, useRef, useCallback } from 'react';
import QuestionDisplay from '@/components/QuestionDisplay';
import type { Question } from '@shared/types/core/question'; // Use canonical shared type
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useAccessGuard } from '@/hooks/useAccessGuard';
import CustomDropdown from '@/components/CustomDropdown';
import MultiSelectDropdown from '@/components/MultiSelectDropdown';
import { makeApiRequest } from '@/config/api';
import { Search } from 'lucide-react';
import { QuestionsResponseSchema, GameCreationResponseSchema, type QuestionsResponse, type GameCreationResponse } from '@/types/api';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ShoppingCart, X, Clock } from 'lucide-react';
import Snackbar from '@/components/Snackbar';
import InfinitySpin from '@/components/InfinitySpin';
import { QUESTION_TYPES } from '@shared/types';
import { createLogger } from '@/clientLogger';

const logger = createLogger('CreateActivityPage');

// Use canonical shared Question type directly - no more local interfaces!

// Interface for selected questions in the cart  
interface CartQuestion extends Question {
    customTime?: number; // Custom timer for this specific question
}

// Sortable Cart Question Component
function SortableCartQuestion({ question, onRemove }: {
    question: CartQuestion;
    onRemove: () => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: question.uid });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg p-3 mb-2 shadow-sm w-full">
            <div className="flex items-start gap-2 w-full">
                <button
                    {...attributes}
                    {...listeners}
                    className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] cursor-grab active:cursor-grabbing mt-1 flex-shrink-0"
                >
                    <GripVertical size={16} />
                </button>

                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[color:var(--foreground)] truncate mb-1">
                        {question.title || question.text.substring(0, 40)}...
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Timer display (read-only) */}
                    <div className="flex items-center gap-1 text-xs text-[color:var(--muted-foreground)]">
                        <Clock size={12} />
                        {question.customTime || question.timeLimit || 30}s
                    </div>

                    <button
                        onClick={onRemove}
                        className="text-[color:var(--alert)] hover:text-red-600 flex-shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function CreateActivityPage() {
    // Access guard: Require teacher access for activity creation
    const { isAllowed } = useAccessGuard({
        allowStates: ['teacher'],
        redirectTo: '/teacher/login'
    });

    // If access is denied, the guard will handle redirection
    if (!isAllowed) {
        return null; // Component won't render while redirecting
    }

    const [selectedQuestions, setSelectedQuestions] = useState<CartQuestion[]>([]);
    const [activityMeta, setActivityMeta] = useState<{ levels: string[]; themes: string[] }>({ levels: [], themes: [] });
    const [activityName, setActivityName] = useState('');
    const [savingActivity, setSavingActivity] = useState(false);

    // Snackbar states
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

    const { teacherId, userState, userProfile, isTeacher } = useAuth();
    const [filters, setFilters] = useState<{ levels: string[]; disciplines: string[]; themes: string[]; authors: string[] }>({ levels: [], disciplines: [], themes: [], authors: [] });
    const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
    const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
    const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
    const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [openUid, setOpenUid] = useState<string | null>(null);
    const BATCH_SIZE = 20;
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);
    const [tagSearch, setTagSearch] = useState('');
    const [showMobileCart, setShowMobileCart] = useState(false);

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    // Fetch filters based on current selections
    const fetchFilters = useCallback(async () => {
        try {
            let url = 'questions/filters?';
            const params = [];

            // Add current selections as filter parameters to get compatible options
            if (selectedLevels.length > 0) {
                params.push(`gradeLevel=${selectedLevels.map(encodeURIComponent).join(',')}`);
            }
            if (selectedDisciplines.length > 0) {
                params.push(`discipline=${selectedDisciplines.map(encodeURIComponent).join(',')}`);
            }
            if (selectedThemes.length > 0) {
                params.push(`theme=${selectedThemes.map(encodeURIComponent).join(',')}`);
            }
            if (selectedAuthors.length > 0) {
                params.push(`author=${selectedAuthors.map(encodeURIComponent).join(',')}`);
            }

            if (params.length > 0) {
                url += params.join('&');
            }

            const data = await makeApiRequest<{
                gradeLevel?: string[];
                disciplines?: string[];
                themes?: string[];
                authors?: string[];
            }>(url);

            logger.debug('Dynamic filters API response:', data);

            const processedFilters = {
                levels: data.gradeLevel || [],
                disciplines: data.disciplines || [],
                themes: data.themes || [],
                authors: data.authors || []
            };

            logger.debug('Processed dynamic filters:', processedFilters);
            setFilters(processedFilters);
        } catch (error) {
            logger.error('Error fetching dynamic filters:', error);
        }
    }, [selectedLevels, selectedDisciplines, selectedThemes, selectedAuthors]);

    // Fetch filters whenever selections change
    useEffect(() => {
        fetchFilters();
    }, [selectedLevels, selectedDisciplines, selectedThemes, selectedAuthors]); // Direct dependencies instead of fetchFilters

    const fetchQuestions = useCallback(async (reset = false) => {
        if (loadingQuestions || loadingMore) return;
        setLoadingQuestions(true);
        if (reset) {
            setOffset(0); // Reset offset for new filter/initial load
        }

        try {
            let url = 'questions?';
            const params = [];
            if (selectedLevels.length > 0) params.push(`gradeLevel=${selectedLevels.map(encodeURIComponent).join(',')}`);
            if (selectedDisciplines.length > 0) params.push(`discipline=${selectedDisciplines.map(encodeURIComponent).join(',')}`);
            if (selectedThemes.length > 0) params.push(`theme=${selectedThemes.map(encodeURIComponent).join(',')}`);
            if (selectedAuthors.length > 0) params.push(`author=${selectedAuthors.map(encodeURIComponent).join(',')}`);
            params.push(`limit=${BATCH_SIZE}`);
            params.push(`offset=${reset ? 0 : offset}`);
            params.push('shuffle=false');
            if (params.length > 0) url += params.join('&');

            const data = await makeApiRequest<QuestionsResponse>(url, undefined, undefined, QuestionsResponseSchema);

            const newQuestionsFromApi = (Array.isArray(data) ? data : data.questions || []) as any[];

            const transformedQuestions: Question[] = newQuestionsFromApi
                .filter((q: any) =>
                    typeof q.text === 'string' && q.text.trim() !== '' &&
                    (Array.isArray(q.answers) || Array.isArray(q.answerOptions))
                )
                .map((q: any) => {
                    // Convert API format to canonical Question format
                    let answerOptions: string[] = [];
                    let correctAnswers: boolean[] = [];

                    if (Array.isArray(q.answers)) {
                        // Legacy format with {text, correct} objects
                        answerOptions = q.answers.map((a: any) => a.text || a.texte || '');
                        correctAnswers = q.answers.map((a: any) => Boolean(a.correct));
                    } else if (Array.isArray(q.answerOptions)) {
                        // Database format with separate arrays
                        answerOptions = q.answerOptions;
                        correctAnswers = Array.isArray(q.correctAnswers) ? q.correctAnswers : [];
                    }

                    return {
                        uid: q.uid,
                        title: q.title || q.titre,
                        text: q.text || q.question,
                        questionType: q.questionType || q.defaultMode || QUESTION_TYPES.SINGLE_CHOICE,
                        answerOptions,
                        correctAnswers,
                        gradeLevel: q.gradeLevel,
                        discipline: q.discipline || q.category || q.subject,
                        themes: q.themes,
                        explanation: q.explanation || q.justification,
                        timeLimit: q.timeLimit || q.timeLimit || q.temps,
                        tags: q.tags,
                        difficulty: q.difficulty || q.difficulte,
                        author: q.author || q.auteur,
                    } satisfies Question;
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
        } catch (error) {
            logger.error('Error fetching questions:', error);
            setLoadingQuestions(false);
            setLoadingMore(false);
        }
    }, [selectedLevels, selectedDisciplines, selectedThemes, selectedAuthors, offset, loadingQuestions, loadingMore]); // Added offset to dependencies

    // Helper functions for cart management
    const addToCart = (question: Question) => {
        setSelectedQuestions(prev => {
            if (prev.some(q => q.uid === question.uid)) return prev;
            const cartQuestion: CartQuestion = { ...question };
            return [...prev, cartQuestion];
        });
        updateActivityMeta([...selectedQuestions, { ...question }]);
    };

    const removeFromCart = (uid: string) => {
        setSelectedQuestions(prev => {
            const updated = prev.filter(q => q.uid !== uid);
            updateActivityMeta(updated);
            return updated;
        });
    };

    // updateQuestionTime function removed - timer editing disabled

    const updateActivityMeta = (questions: CartQuestion[]) => {
        const levels = Array.from(new Set(questions.map(q => q.gradeLevel).filter((v): v is string => Boolean(v))));
        const themes = Array.from(new Set(questions.flatMap(q => q.themes || []).filter((v): v is string => Boolean(v))));
        setActivityMeta({ levels, themes });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setSelectedQuestions((items) => {
                const oldIndex = items.findIndex(item => item.uid === active.id);
                const newIndex = items.findIndex(item => item.uid === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const isQuestionSelected = (uid: string) => {
        return selectedQuestions.some(q => q.uid === uid);
    };

    useEffect(() => {
        setOffset(0); // Reset offset
        setHasMore(true); // Assume there's more data
        fetchQuestions(true); // Fetch with reset
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedLevels, selectedDisciplines, selectedThemes, selectedAuthors]); // Dependencies that trigger a full reset

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

    const handleSaveActivity = async () => {
        setSavingActivity(true);
        try {
            // Check if user is authenticated as a teacher
            if (userState !== 'teacher' && !isTeacher) {
                setSnackbarMessage('Impossible de trouver votre identifiant enseignant. Veuillez vous reconnecter.');
                setSnackbarType('error');
                setSnackbarOpen(true);
                setSavingActivity(false);
                return;
            }
            if (!activityName.trim()) {
                setSnackbarMessage('Le nom de l\'activité est obligatoire.');
                setSnackbarType('error');
                setSnackbarOpen(true);
                setSavingActivity(false);
                return;
            }
            if (selectedQuestions.length === 0) {
                setSnackbarMessage('Veuillez sélectionner au moins une question.');
                setSnackbarType('error');
                setSnackbarOpen(true);
                setSavingActivity(false);
                return;
            }

            // Create a game template with the selected questions
            logger.info('Creating game template with data:', {
                name: activityName,
                questionUids: selectedQuestions.map(q => q.uid), // FIXED: use questionUids (plural)
                levels: activityMeta.levels,
                themes: activityMeta.themes,
                discipline: selectedDisciplines[0] || 'Mathématiques',
                gradeLevel: activityMeta.levels[0] || 'Niveau non spécifié'
            });

            const gameTemplateResponse = await makeApiRequest<{ gameTemplate: { id: string } }>('/api/game-templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: activityName,
                    questionUids: selectedQuestions.map(q => q.uid), // FIXED: use questionUids (plural)
                    themes: activityMeta.themes,
                    discipline: selectedDisciplines[0] || 'Mathématiques',
                    gradeLevel: activityMeta.levels[0] || 'Niveau non spécifié'
                }),
            });

            logger.info('Game template response:', gameTemplateResponse);

            if (!gameTemplateResponse?.gameTemplate?.id) {
                throw new Error('Failed to create game template - no ID returned');
            }

            setSnackbarMessage(`Activité "${activityName}" créée avec succès !`);
            setSnackbarType('success');
            setSnackbarOpen(true);
            setActivityName('');
            setSelectedQuestions([]);
            setActivityMeta({ levels: [], themes: [] });
        } catch (err: unknown) {
            setSnackbarMessage((err as Error).message || 'Erreur inconnue.');
            setSnackbarType('error');
            setSnackbarOpen(true);
        } finally {
            setSavingActivity(false);
        }
    };

    // Clean up selections when filters change to remove incompatible options
    // Disabled for now to prevent infinite loops - dynamic filtering should handle this
    // useEffect(() => {
    //     const timeoutId = setTimeout(() => {
    //         // Remove selected levels that are no longer available
    //         setSelectedLevels(prev => {
    //             const filtered = prev.filter(level => filters.levels.includes(level));
    //             return filtered.length !== prev.length ? filtered : prev;
    //         });
    //         
    //         // Remove selected disciplines that are no longer available
    //         setSelectedDisciplines(prev => {
    //             const filtered = prev.filter(discipline => filters.disciplines.includes(discipline));
    //             return filtered.length !== prev.length ? filtered : prev;
    //         });
    //         
    //         // Remove selected themes that are no longer available
    //         setSelectedThemes(prev => {
    //             const filtered = prev.filter(theme => filters.themes.includes(theme));
    //             return filtered.length !== prev.length ? filtered : prev;
    //         });
    //         
    //         // Remove selected authors that are no longer available
    //         setSelectedAuthors(prev => {
    //             const filtered = prev.filter(author => filters.authors.includes(author));
    //             return filtered.length !== prev.length ? filtered : prev;
    //         });
    //     }, 100); // Small delay to prevent immediate re-triggering

    //     return () => clearTimeout(timeoutId);
    // }, [filters.levels, filters.disciplines, filters.themes, filters.authors]); // Only depend on the actual filter arrays

    return (
        <div className="h-screen bg-background flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-background border-b border-[color:var(--border)] px-4 sm:px-6 lg:px-8 flex-shrink-0">
                <div className="max-w-7xl mx-auto py-4 sm:py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Créer une nouvelle activité</h1>
                        </div>
                        <div className="hidden sm:block">
                            <Link href="/teacher/games" className="btn-primary whitespace-nowrap min-w-[180px]">
                                Voir mes activités
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="mx-auto w-full px-2 sm:px-4 md:px-6 lg:px-8 py-6 flex-1 flex flex-col min-h-0 overflow-x-hidden">
                {/* Filters Row */}
                <div className="flex flex-col xl:flex-row gap-4 mb-6 flex-shrink-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:flex xl:flex-row gap-4 xl:flex-1">
                        <MultiSelectDropdown
                            options={filters.levels || []}
                            selected={selectedLevels}
                            onChange={setSelectedLevels}
                            placeholder="Niveaux"
                        />
                        <MultiSelectDropdown
                            options={filters.disciplines || []}
                            selected={selectedDisciplines}
                            onChange={setSelectedDisciplines}
                            placeholder="Disciplines"
                        />
                        <MultiSelectDropdown
                            options={filters.themes || []}
                            selected={selectedThemes ?? []}
                            onChange={setSelectedThemes}
                            placeholder="Thèmes"
                        />
                        <MultiSelectDropdown
                            options={filters.authors || []}
                            selected={selectedAuthors}
                            onChange={setSelectedAuthors}
                            placeholder="Auteurs"
                        />
                    </div>
                    <div className="relative flex-1 xl:max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-gray-500" />
                        </div>
                        <input
                            className="px-3 py-2 w-full pl-10 text-sm placeholder-gray-500 focus:outline-none focus:ring-0 transition-colors"
                            type="text"
                            placeholder="Rechercher par tag, thème, niveau, discipline..."
                            value={tagSearch}
                            onChange={e => setTagSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Desktop Two-Panel Layout */}
                <div className="hidden lg:flex gap-6 flex-1 min-h-0 w-full overflow-hidden">
                    {/* Left Panel - Available Questions (66%) */}
                    <div className="flex-[2] flex flex-col min-h-0 min-w-0">
                        <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                            <h2 className="text-xl font-semibold text-[color:var(--foreground)]">Liste des questions</h2>
                            {loadingQuestions && (
                                <InfinitySpin size={24} />
                            )}
                        </div>
                        <div className="question-list-simple flex-1 flex flex-col min-h-0 w-full overflow-x-hidden">
                            <div className="overflow-y-auto flex-1" ref={listRef}>
                                {loadingQuestions && questions.length === 0 ? (
                                    <div className="text-center text-[color:var(--muted-foreground)] text-lg py-8">
                                        Chargement des questions…
                                    </div>
                                ) : questions.length === 0 ? (
                                    <div className="text-center text-[color:var(--muted-foreground)] py-8">Aucune question trouvée pour ces filtres.</div>
                                ) : (
                                    <>
                                        {questions
                                            .filter((q) => {
                                                if (!tagSearch.trim()) return true;
                                                const search = tagSearch.trim().toLowerCase();
                                                const tags = [
                                                    ...(q.tags || []),
                                                    q.themes,
                                                    q.gradeLevel,
                                                    q.discipline,
                                                    q.title,
                                                    q.text
                                                ].filter(Boolean).map(String).map(s => s.toLowerCase());
                                                return tags.some(t => t.includes(search));
                                            })
                                            .map(q => (
                                                <QuestionDisplay
                                                    key={q.uid}
                                                    question={q}
                                                    isActive={isQuestionSelected(q.uid)}
                                                    isOpen={openUid === q.uid}
                                                    onToggleOpen={() => setOpenUid(openUid === q.uid ? null : q.uid)}
                                                    timerStatus="stop"
                                                    disabled={false}
                                                    showControls={false}
                                                    className=""
                                                    showMeta={true}
                                                    showCheckbox={true}
                                                    checked={isQuestionSelected(q.uid)}
                                                    onCheckboxChange={(checked) => {
                                                        if (checked) {
                                                            addToCart(q);
                                                        } else {
                                                            removeFromCart(q.uid);
                                                        }
                                                    }}
                                                />
                                            ))}
                                        {loadingMore && <div className="text-center text-[color:var(--muted-foreground)] py-2">Chargement…</div>}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Shopping Cart (34%) */}
                    <div className="flex-[1] flex flex-col min-h-0 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                            <ShoppingCart size={20} className="text-[color:var(--foreground)] flex-shrink-0" />
                            <h2 className="text-lg font-semibold text-[color:var(--foreground)] truncate min-w-0">Panier ({selectedQuestions.length} question{selectedQuestions.length <= 1 ? '' : 's'})</h2>
                        </div>

                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            {selectedQuestions.length === 0 ? (
                                <div className="text-center text-[color:var(--muted-foreground)] py-8">
                                    Sélectionnez des questions pour les ajouter au panier
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto min-h-0">
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <SortableContext
                                            items={selectedQuestions.map(q => q.uid)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            <div className="space-y-1">
                                                {selectedQuestions.map((question) => (
                                                    <SortableCartQuestion
                                                        key={question.uid}
                                                        question={question}
                                                        onRemove={() => removeFromCart(question.uid)}
                                                    />
                                                ))}
                                            </div>
                                        </SortableContext>
                                    </DndContext>
                                </div>
                            )}

                            {/* Activity Name and Metadata - Always visible at bottom */}
                            <div className="border-t pt-3 mt-3 flex-shrink-0 w-full">
                                <input
                                    className="w-full mb-2 text-sm focus:outline-none focus:ring-0 focus:ring-offset-0"
                                    style={{ boxShadow: 'none' }}
                                    type="text"
                                    placeholder="Nom de l'activité"
                                    value={activityName}
                                    onChange={e => setActivityName(e.target.value)}
                                />

                                <button
                                    className="w-full p-2 bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:bg-gray-400"
                                    style={{ borderRadius: 'var(--radius)' }}
                                    onClick={handleSaveActivity}
                                    disabled={savingActivity || selectedQuestions.length === 0 || !activityName.trim()}
                                >
                                    {savingActivity ? 'Sauvegarde...' : 'Sauvegarder l\'activité'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Layout */}
                <div className="lg:hidden flex flex-col flex-1 min-h-0 overflow-hidden" style={{ minHeight: 200 }}>
                    <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                        <h2 className="text-xl font-semibold text-[color:var(--foreground)]">Liste des questions</h2>
                        {loadingQuestions && (
                            <InfinitySpin size={24} />
                        )}
                    </div>
                    <div className="question-list-simple flex-1 flex flex-col min-h-0 overflow-hidden">
                        <div className="overflow-y-auto flex-1">
                            {loadingQuestions && questions.length === 0 ? (
                                <div className="text-center text-[color:var(--muted-foreground)] py-8">Chargement des questions…</div>
                            ) : questions.length === 0 ? (
                                <div className="text-center text-[color:var(--muted-foreground)] py-8">Aucune question trouvée pour ces filtres.</div>
                            ) : (
                                <>
                                    {questions
                                        .filter((q) => {
                                            if (!tagSearch.trim()) return true;
                                            const search = tagSearch.trim().toLowerCase();
                                            const tags = [
                                                ...(q.tags || []),
                                                q.themes,
                                                q.gradeLevel,
                                                q.discipline,
                                                q.title,
                                                q.text
                                            ].filter(Boolean).map(String).map(s => s.toLowerCase());
                                            return tags.some(t => t.includes(search));
                                        })
                                        .map(q => (
                                            <QuestionDisplay
                                                key={q.uid}
                                                question={q}
                                                isActive={isQuestionSelected(q.uid)}
                                                isOpen={openUid === q.uid}
                                                onToggleOpen={() => setOpenUid(openUid === q.uid ? null : q.uid)}
                                                timerStatus="stop"
                                                disabled={false}
                                                showControls={false}
                                                className=""
                                                showMeta={true}
                                                showCheckbox={true}
                                                checked={isQuestionSelected(q.uid)}
                                                onCheckboxChange={(checked) => {
                                                    if (checked) {
                                                        addToCart(q);
                                                    } else {
                                                        removeFromCart(q.uid);
                                                    }
                                                }}
                                            />
                                        ))}
                                    {loadingMore && <div className="text-center text-[color:var(--muted-foreground)] py-2">Chargement…</div>}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile FAB */}
                {selectedQuestions.length > 0 && (
                    <button
                        onClick={() => setShowMobileCart(true)}
                        className="lg:hidden fixed bottom-6 right-6 btn btn-primary btn-circle shadow-lg z-10 flex items-center justify-center"
                    >
                        <div className="relative">
                            <ShoppingCart size={20} />
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {selectedQuestions.length}
                            </span>
                        </div>
                    </button>
                )}

                {/* Mobile Cart Modal */}
                {showMobileCart && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
                        <div className="bg-[color:var(--card)] w-full rounded-t-xl p-4 max-h-[80vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <ShoppingCart size={20} className="text-[color:var(--foreground)]" />
                                    <h2 className="text-xl font-semibold text-[color:var(--foreground)]">Panier de l'activité</h2>
                                </div>
                                <button
                                    onClick={() => setShowMobileCart(false)}
                                    className="btn btn-ghost btn-sm"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <input
                                className="input input-bordered w-full mb-4"
                                type="text"
                                placeholder="Nom de l'activité"
                                value={activityName}
                                onChange={e => setActivityName(e.target.value)}
                            />

                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={selectedQuestions.map(q => q.uid)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-2 mb-4">
                                        {selectedQuestions.map((question) => (
                                            <SortableCartQuestion
                                                key={question.uid}
                                                question={question}
                                                onRemove={() => removeFromCart(question.uid)}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>

                            <button
                                className="btn btn-primary w-full"
                                onClick={() => {
                                    handleSaveActivity();
                                    setShowMobileCart(false);
                                }}
                                disabled={savingActivity || selectedQuestions.length === 0 || !activityName.trim()}
                            >
                                {savingActivity ? 'Sauvegarde...' : 'Sauvegarder l\'activité'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Success/Error Messages */}
            <Snackbar
                open={snackbarOpen}
                message={snackbarMessage}
                type={snackbarType}
                onClose={() => setSnackbarOpen(false)}
            />
        </div>
    );
}
