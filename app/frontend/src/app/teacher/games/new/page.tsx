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

// Interface for selected questions in the cart
interface CartQuestion extends QuestionForCreatePage {
    customTime?: number; // Custom timer for this specific question
}

// Sortable Cart Question Component
function SortableCartQuestion({ question, onRemove, onTimeChange }: {
    question: CartQuestion;
    onRemove: () => void;
    onTimeChange: (time: number) => void;
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

    const [editingTime, setEditingTime] = useState(false);
    const [timeValue, setTimeValue] = useState(question.customTime || question.time || 30);

    return (
        <div ref={setNodeRef} style={style} className="bg-white border border-gray-200 rounded-lg p-3 mb-2 shadow-sm">
            <div className="flex items-start gap-3">
                <button
                    {...attributes}
                    {...listeners}
                    className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing mt-1"
                >
                    <GripVertical size={16} />
                </button>

                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate mb-1">
                        {question.title || question.text.substring(0, 50)}...
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {editingTime ? (
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                value={timeValue}
                                onChange={(e) => setTimeValue(parseInt(e.target.value) || 30)}
                                className="input input-xs w-16 text-center"
                                min="5"
                                max="300"
                            />
                            <button
                                onClick={() => {
                                    onTimeChange(timeValue);
                                    setEditingTime(false);
                                }}
                                className="btn btn-xs btn-primary"
                            >
                                ✓
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setEditingTime(true)}
                            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800"
                        >
                            <Clock size={12} />
                            {question.customTime || question.time || 30}s
                        </button>
                    )}

                    <button
                        onClick={onRemove}
                        className="text-red-400 hover:text-red-600"
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
    const [questions, setQuestions] = useState<QuestionForCreatePage[]>([]);
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

    useEffect(() => {
        makeApiRequest<{
            levels?: string[];
            niveaux?: string[];
            disciplines?: string[];
            themes?: string[];
            authors?: string[];
        }>('questions/filters')
            .then(data => {
                setFilters({
                    levels: data.levels || data.niveaux || [], // Prefer 'levels', fallback to 'niveaux'
                    disciplines: data.disciplines || [],
                    themes: data.themes || [],
                    authors: data.authors || []
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
        if (selectedLevels.length > 0) params.push(`level=${selectedLevels.map(encodeURIComponent).join(',')}`);
        if (selectedDisciplines.length > 0) params.push(`discipline=${selectedDisciplines.map(encodeURIComponent).join(',')}`);
        if (selectedThemes.length > 0) params.push(`theme=${selectedThemes.map(encodeURIComponent).join(',')}`);
        if (selectedAuthors.length > 0) params.push(`author=${selectedAuthors.map(encodeURIComponent).join(',')}`);
        params.push(`limit=${BATCH_SIZE}`);
        params.push(`offset=${reset ? 0 : offset}`);
        params.push('shuffle=false');
        if (params.length > 0) url += params.join('&');

        const data = await makeApiRequest<QuestionsResponse>(url, undefined, undefined, QuestionsResponseSchema);

        const newQuestionsFromApi = (Array.isArray(data) ? data : data.questions || []) as SharedQuestion[];

        const transformedQuestions: QuestionForCreatePage[] = newQuestionsFromApi
            .filter((q: SharedQuestion) => {
                const apiQuestion = q as any;
                return typeof q.text === 'string' && q.text.trim() !== '' &&
                    (Array.isArray(q.answers) || Array.isArray(apiQuestion.answerOptions));
            })
            .map((q: SharedQuestion) => {
                const apiQuestion = q as any;

                // Create answers array from database fields or legacy format
                let answers: { text: string; correct: boolean }[] = [];
                if (Array.isArray(q.answers)) {
                    // Legacy format
                    answers = q.answers.map((a: SharedAnswer) => ({
                        text: a.text || '',
                        correct: a.correct || false
                    }));
                } else if (Array.isArray(apiQuestion.answerOptions)) {
                    // Database format
                    answers = apiQuestion.answerOptions.map((text: string, index: number) => ({
                        text: text || '',
                        correct: apiQuestion.correctAnswers?.[index] || false
                    }));
                }

                return {
                    uid: q.uid,
                    title: apiQuestion.title || apiQuestion.titre,
                    text: q.text as string,
                    answers,
                    level: apiQuestion.gradeLevel || apiQuestion.level || apiQuestion.niveaux,
                    discipline: apiQuestion.discipline || apiQuestion.category || apiQuestion.subject,
                    themes: apiQuestion.themes,
                    explanation: q.explanation,
                    time: q.time || apiQuestion.timeLimit,
                    tags: q.tags,
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
    }, [selectedLevels, selectedDisciplines, selectedThemes, selectedAuthors, offset, loadingQuestions, loadingMore]); // Added offset to dependencies

    // Helper functions for cart management
    const addToCart = (question: QuestionForCreatePage) => {
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

    const updateQuestionTime = (uid: string, time: number) => {
        setSelectedQuestions(prev =>
            prev.map(q => q.uid === uid ? { ...q, customTime: time } : q)
        );
    };

    const updateActivityMeta = (questions: CartQuestion[]) => {
        const levels = Array.from(new Set(questions.map(q => q.level).filter((v): v is string => Boolean(v))));
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
            console.log('Creating game template with data:', {
                name: activityName,
                questionIds: selectedQuestions.map(q => q.uid),
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
                    questionIds: selectedQuestions.map(q => q.uid),
                    themes: activityMeta.themes,
                    discipline: selectedDisciplines[0] || 'Mathématiques',
                    gradeLevel: activityMeta.levels[0] || 'Niveau non spécifié'
                }),
            });

            console.log('Game template response:', gameTemplateResponse);

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

    return (
        <div className="main-content">
            <div className="w-full max-w-7xl mx-auto p-4">
                <h1 className="text-3xl font-bold text-center mb-6">Créer une Nouvelle Activité</h1>

                {/* Filters Row */}
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
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
                    <input
                        className="input input-bordered flex-1"
                        type="text"
                        placeholder="🔍 Rechercher par tag, thème, niveau, discipline..."
                        value={tagSearch}
                        onChange={e => setTagSearch(e.target.value)}
                    />
                </div>

                {/* Desktop Two-Panel Layout */}
                <div className="hidden lg:flex gap-6">
                    {/* Left Panel - Available Questions */}
                    <div className="flex-1 bg-white rounded-lg shadow-sm border p-4">
                        <h2 className="text-xl font-semibold mb-4">Questions disponibles</h2>
                        <div
                            className="space-y-3 overflow-y-auto"
                            ref={listRef}
                            style={{ maxHeight: '60vh' }}
                        >
                            {loadingQuestions && questions.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">Chargement des questions…</div>
                            ) : questions.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">Aucune question trouvée pour ces filtres.</div>
                            ) : (
                                <>
                                    {questions
                                        .filter((q) => {
                                            if (!tagSearch.trim()) return true;
                                            const search = tagSearch.trim().toLowerCase();
                                            const tags = [
                                                ...(q.tags || []),
                                                q.themes,
                                                q.level,
                                                q.discipline,
                                                q.title,
                                                q.text
                                            ].filter(Boolean).map(String).map(s => s.toLowerCase());
                                            return tags.some(t => t.includes(search));
                                        })
                                        .map(q => (
                                            <div key={q.uid} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
                                                <input
                                                    type="checkbox"
                                                    checked={isQuestionSelected(q.uid)}
                                                    onChange={e => {
                                                        if (e.target.checked) {
                                                            addToCart(q);
                                                        } else {
                                                            removeFromCart(q.uid);
                                                        }
                                                    }}
                                                    className="mt-3"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <QuestionDisplay
                                                        question={q}
                                                        isActive={isQuestionSelected(q.uid)}
                                                        isOpen={openUid === q.uid}
                                                        onToggleOpen={() => setOpenUid(openUid === q.uid ? null : q.uid)}
                                                        timerStatus="stop"
                                                        disabled={false}
                                                        showControls={false}
                                                        className="question-compact"
                                                        showMeta={true}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-600 mt-2">
                                                    <Clock size={12} />
                                                    <span>{q.time || 30}s</span>
                                                </div>
                                            </div>
                                        ))}
                                    {loadingMore && <div className="text-center text-gray-500 py-2">Chargement…</div>}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Shopping Cart */}
                    <div className="w-80 bg-white rounded-lg shadow-sm border p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <ShoppingCart size={20} />
                            <h2 className="text-xl font-semibold">Panier ({selectedQuestions.length} questions)</h2>
                        </div>

                        {selectedQuestions.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                Sélectionnez des questions pour les ajouter au panier
                            </div>
                        ) : (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={selectedQuestions.map(q => q.uid)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                                        {selectedQuestions.map((question) => (
                                            <SortableCartQuestion
                                                key={question.uid}
                                                question={question}
                                                onRemove={() => removeFromCart(question.uid)}
                                                onTimeChange={(time) => updateQuestionTime(question.uid, time)}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )}

                        {/* Activity Name and Metadata */}
                        <div className="border-t pt-4 mt-4">
                            <input
                                className="input input-bordered w-full mb-3"
                                type="text"
                                placeholder="Nom de l'activité"
                                value={activityName}
                                onChange={e => setActivityName(e.target.value)}
                            />

                            <button
                                className="btn btn-primary w-full"
                                onClick={handleSaveActivity}
                                disabled={savingActivity || selectedQuestions.length === 0 || !activityName.trim()}
                            >
                                {savingActivity ? 'Sauvegarde...' : 'Sauvegarder l\'activité'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Layout */}
                <div className="lg:hidden">
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                        <div
                            className="space-y-3 overflow-y-auto mb-4"
                            style={{ maxHeight: '50vh' }}
                        >
                            {loadingQuestions && questions.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">Chargement des questions…</div>
                            ) : questions.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">Aucune question trouvée pour ces filtres.</div>
                            ) : (
                                <>
                                    {questions
                                        .filter((q) => {
                                            if (!tagSearch.trim()) return true;
                                            const search = tagSearch.trim().toLowerCase();
                                            const tags = [
                                                ...(q.tags || []),
                                                q.themes,
                                                q.level,
                                                q.discipline,
                                                q.title,
                                                q.text
                                            ].filter(Boolean).map(String).map(s => s.toLowerCase());
                                            return tags.some(t => t.includes(search));
                                        })
                                        .map(q => (
                                            <div key={q.uid} className="flex items-start gap-3 p-3 border rounded-lg">
                                                <input
                                                    type="checkbox"
                                                    checked={isQuestionSelected(q.uid)}
                                                    onChange={e => {
                                                        if (e.target.checked) {
                                                            addToCart(q);
                                                        } else {
                                                            removeFromCart(q.uid);
                                                        }
                                                    }}
                                                    className="mt-3"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <QuestionDisplay
                                                        question={q}
                                                        isActive={isQuestionSelected(q.uid)}
                                                        isOpen={openUid === q.uid}
                                                        onToggleOpen={() => setOpenUid(openUid === q.uid ? null : q.uid)}
                                                        timerStatus="stop"
                                                        disabled={false}
                                                        showControls={false}
                                                        className="question-compact"
                                                        showMeta={true}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-600 mt-2">
                                                    <Clock size={12} />
                                                    <span>{q.time || 30}s</span>
                                                </div>
                                            </div>
                                        ))}
                                    {loadingMore && <div className="text-center text-gray-500 py-2">Chargement…</div>}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile FAB */}
                    {selectedQuestions.length > 0 && (
                        <button
                            onClick={() => setShowMobileCart(true)}
                            className="fixed bottom-6 right-6 btn btn-primary btn-circle shadow-lg z-10 flex items-center justify-center"
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
                            <div className="bg-white w-full rounded-t-xl p-4 max-h-[80vh] overflow-y-auto">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <ShoppingCart size={20} />
                                        <h2 className="text-xl font-semibold">Panier de l'activité</h2>
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
                                            {selectedQuestions.map((question, index) => (
                                                <div key={question.uid} className="flex items-center gap-2 p-3 border rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <button className="text-gray-400">
                                                            <GripVertical size={16} />
                                                        </button>
                                                        <span className="text-sm font-medium">Q{index + 1}.</span>
                                                    </div>
                                                    <div className="flex-1 text-sm truncate">
                                                        {question.title || question.text.substring(0, 40)}...
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-xs text-gray-500">
                                                            {question.customTime || question.time || 30}s
                                                        </span>
                                                        <button
                                                            onClick={() => removeFromCart(question.uid)}
                                                            className="text-red-400 hover:text-red-600"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                </div>
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
        </div>
    );
}
