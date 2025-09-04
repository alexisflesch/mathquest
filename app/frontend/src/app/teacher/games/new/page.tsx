"use client";
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import QuestionDisplay from '@/components/QuestionDisplay';
import type { Question } from '@shared/types/core/question'; // Use canonical shared type
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import CustomDropdown from '@/components/CustomDropdown';
import MultiSelectDropdown from '@/components/MultiSelectDropdown';
import EnhancedMultiSelectDropdown from '@/components/EnhancedMultiSelectDropdown';
import { makeApiRequest } from '@/config/api';
import { Search } from 'lucide-react';
import { QuestionsResponseSchema, GameCreationResponseSchema, type QuestionsResponse, type GameCreationResponse } from '@/types/api';
import { type FilterOption, type EnhancedFilters, type EnhancedFiltersResponse } from '@/types/enhancedFilters';
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
import { GripVertical, ShoppingCart, X, Clock, Check } from 'lucide-react';
import Snackbar from '@/components/Snackbar';
import InfoModal from '@/components/SharedModal';
import InfinitySpin from '@/components/InfinitySpin';
import { QUESTION_TYPES } from '@shared/types';
import { createLogger } from '@/clientLogger';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import { sortGradeLevels } from '@/utils/gradeLevelSort';

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
                        {(question.customTime ?? (typeof question.durationMs === 'number' ? Math.round(question.durationMs / 1000) : 30))}s
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
    // Access is now enforced by middleware; no need for useAccessGuard

    const [selectedQuestions, setSelectedQuestions] = useState<CartQuestion[]>([]);
    const [activityMeta, setActivityMeta] = useState<{ levels: string[]; themes: string[] }>({ levels: [], themes: [] });
    const [activityName, setActivityName] = useState('');
    const [savingActivity, setSavingActivity] = useState(false);

    // Snackbar states (only for errors now)
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('error');

    // Success modal states
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [createdActivityName, setCreatedActivityName] = useState('');

    const { teacherId, userState, userProfile, isTeacher } = useAuth();
    const router = useRouter();

    // Enhanced filter state with compatibility information
    const [filters, setFilters] = useState<EnhancedFilters>({
        levels: [],
        disciplines: [],
        themes: [],
        authors: []
    });
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
            // Build URL with proper multiple parameter format for OR logic
            const params = new URLSearchParams();

            // Add current selections - multiple values as separate parameters for OR logic
            selectedLevels.forEach(level => params.append('gradeLevel', level));
            selectedDisciplines.forEach(discipline => params.append('discipline', discipline));
            selectedThemes.forEach(theme => params.append('theme', theme));
            selectedAuthors.forEach(author => params.append('author', author));

            const url = `questions/filters?${params.toString()}`;

            const data = await makeApiRequest<EnhancedFiltersResponse>(url);

            logger.debug('Enhanced filters API response:', data);

            // Helper function to process filter arrays with selection-based compatibility
            const processFilterOptions = (
                apiResponse: (string | FilterOption)[],
                currentSelected: string[]
            ): FilterOption[] => {
                const result: FilterOption[] = [];

                // Extract compatible options from API response (normalize to strings first)
                const compatibleOptions = apiResponse.map(item =>
                    typeof item === 'string' ? item : item.value
                );

                // Add all compatible options from API (these are always compatible)
                compatibleOptions.forEach(option => {
                    result.push({ value: option, isCompatible: true });
                });

                // Add any selected options that are NOT in the API response (these are incompatible)
                currentSelected.forEach(selected => {
                    if (!compatibleOptions.includes(selected)) {
                        result.push({ value: selected, isCompatible: false });
                    }
                });

                return result;
            };

            // Special handling for grade levels to apply educational ordering
            const processGradeLevelOptions = (
                apiResponse: FilterOption[] | string[],
                currentSelected: string[]
            ): FilterOption[] => {
                // Debug: Log the original API response
                logger.info('GRADE_DEBUG - Original API response:', apiResponse);
                
                const result: FilterOption[] = [];
                const addedValues = new Set<string>();

                // Handle both string arrays and FilterOption arrays
                const compatibleGradeLevels = apiResponse.map(item => 
                    typeof item === 'string' ? item : item.value
                ).filter(value => value != null);
                
                logger.info('GRADE_DEBUG - Compatible grade levels:', compatibleGradeLevels);
                
                const sortedGradeLevels = sortGradeLevels(compatibleGradeLevels);
                logger.info('GRADE_DEBUG - Sorted grade levels:', sortedGradeLevels);

                // Add sorted compatible options maintaining their compatibility status
                sortedGradeLevels.forEach(gradeLevel => {
                    if (!addedValues.has(gradeLevel) && gradeLevel) {
                        // For string arrays, all items are compatible by default
                        const originalItem = typeof apiResponse[0] === 'string' 
                            ? { value: gradeLevel, isCompatible: true }
                            : (apiResponse as FilterOption[]).find(item => item.value === gradeLevel);
                            
                        const newItem = {
                            value: gradeLevel,
                            isCompatible: originalItem?.isCompatible ?? true
                        };
                        logger.info('GRADE_DEBUG - Adding grade level:', newItem);
                        result.push(newItem);
                        addedValues.add(gradeLevel);
                    }
                });

                // Add any selected options that are NOT in the API response (these are incompatible)
                currentSelected.forEach(selected => {
                    if (!compatibleGradeLevels.includes(selected) && !addedValues.has(selected) && selected) {
                        const newItem = { value: selected, isCompatible: false };
                        logger.info('GRADE_DEBUG - Adding incompatible selected:', newItem);
                        result.push(newItem);
                        addedValues.add(selected);
                    }
                });

                return result;
            };

            const processedFilters: EnhancedFilters = {
                levels: processGradeLevelOptions(data.gradeLevel || [], selectedLevels),
                disciplines: processFilterOptions(data.disciplines || [], selectedDisciplines),
                themes: processFilterOptions(data.themes || [], selectedThemes),
                authors: processFilterOptions(data.authors || [], selectedAuthors)
            };

            // Debug: Log the processed levels to check for duplicates
            logger.info('GRADE_DEBUG - Processed grade levels:', processedFilters.levels);
            logger.info('GRADE_DEBUG - Grade level values:', processedFilters.levels.map(l => l.value));
            const uniqueValues = new Set(processedFilters.levels.map(l => l.value));
            logger.info('GRADE_DEBUG - Unique count:', uniqueValues.size, 'Total count:', processedFilters.levels.length);

            logger.debug('Processed dynamic filters:', processedFilters);
            setFilters(processedFilters);
        } catch (error) {
            logger.error('Error fetching dynamic filters:', error);
        }
    }, [selectedLevels, selectedDisciplines, selectedThemes, selectedAuthors]);

    // Fetch filters whenever selections change
    useEffect(() => {
        fetchFilters();
    }, [selectedLevels, selectedDisciplines, selectedThemes, selectedAuthors]);

    const fetchQuestions = useCallback(async (reset = false) => {
        if (loadingQuestions || loadingMore) return;
        setLoadingQuestions(true);
        if (reset) {
            setOffset(0); // Reset offset for new filter/initial load
        }

        try {
            // Build URL with consistent multiple parameter format (same as filters)
            const params = new URLSearchParams();

            // Add selections - multiple values as separate parameters (consistent format)
            selectedLevels.forEach(level => params.append('gradeLevel', level));
            selectedDisciplines.forEach(discipline => params.append('discipline', discipline));
            selectedThemes.forEach(theme => params.append('theme', theme));
            selectedAuthors.forEach(author => params.append('author', author));

            // Add pagination and other parameters
            params.append('limit', BATCH_SIZE.toString());
            params.append('offset', (reset ? 0 : offset).toString());
            params.append('shuffle', 'false');

            const url = `questions?${params.toString()}`;

            const data = await makeApiRequest<QuestionsResponse>(url, undefined, undefined, QuestionsResponseSchema);

            const newQuestionsFromApi = (Array.isArray(data) ? data : data.questions || []) as any[];

            const transformedQuestions: Question[] = newQuestionsFromApi
                .filter((q: any) => {
                    // Updated filter to handle polymorphic questions
                    const hasText = typeof q.text === 'string' && q.text.trim() !== '';
                    const hasQuestionData =
                        // Multiple choice: has answerOptions (legacy) or multipleChoiceQuestion
                        (Array.isArray(q.answerOptions) || q.multipleChoiceQuestion?.answerOptions) ||
                        // Numeric: has correctAnswer (legacy) or numericQuestion
                        (typeof q.correctAnswer === 'number' || q.numericQuestion?.correctAnswer) ||
                        // Legacy format with answers array
                        Array.isArray(q.answers);

                    return hasText && hasQuestionData;
                })
                .map((q: any) => {
                    // Convert API format to canonical Question format
                    let answerOptions: string[] = [];
                    let correctAnswers: boolean[] = [];

                    if (q.multipleChoiceQuestion) {
                        // Polymorphic format - multiple choice question
                        answerOptions = q.multipleChoiceQuestion.answerOptions || [];
                        correctAnswers = q.multipleChoiceQuestion.correctAnswers || [];
                    }

                    const transformedQuestion = {
                        uid: q.uid,
                        title: q.title || q.titre,
                        text: q.text || q.question,
                        questionType: q.questionType || q.defaultMode || QUESTION_TYPES.SINGLE_CHOICE,
                        answerOptions,
                        correctAnswers,
                        // Add polymorphic fields for new format
                        multipleChoiceQuestion: q.multipleChoiceQuestion,
                        numericQuestion: q.numericQuestion,
                        gradeLevel: q.gradeLevel,
                        discipline: q.discipline || q.category || q.subject,
                        themes: q.themes,
                        explanation: q.explanation || q.justification,
                        // Modernization: Only use canonical durationMs, no legacy fallback
                        durationMs: typeof q.durationMs === 'number' ? q.durationMs : 30000,
                        tags: q.tags,
                        difficulty: q.difficulty || q.difficulte,
                        author: q.author || q.auteur,
                    } satisfies Question;

                    // Debug logging for numeric questions
                    if (q.questionType === 'numeric') {
                        console.log('[CreateActivityPage] Transformed numeric question:', {
                            uid: q.uid,
                            original: q,
                            transformed: transformedQuestion
                        });
                    }

                    return transformedQuestion;
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

            // Modernization: Use canonical Next.js API route
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

            // Show success modal instead of snackbar
            setCreatedActivityName(activityName);
            setShowSuccessModal(true);
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
        <div className="teacher-content-flex">
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
                        <EnhancedMultiSelectDropdown
                            options={filters.levels || []}
                            selected={selectedLevels}
                            onChange={setSelectedLevels}
                            placeholder="Niveaux"
                        />
                        <EnhancedMultiSelectDropdown
                            options={filters.disciplines || []}
                            selected={selectedDisciplines}
                            onChange={setSelectedDisciplines}
                            placeholder="Disciplines"
                        />
                        <EnhancedMultiSelectDropdown
                            options={filters.themes || []}
                            selected={selectedThemes ?? []}
                            onChange={setSelectedThemes}
                            placeholder="Thèmes"
                        />
                        <EnhancedMultiSelectDropdown
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

                        {/* Cart Content - Flexible height */}
                        <div className="flex-1 min-h-0 overflow-hidden">
                            {selectedQuestions.length === 0 ? (
                                <div className="text-center text-[color:var(--muted-foreground)] py-8">
                                    Sélectionnez des questions pour les ajouter au panier
                                </div>
                            ) : (
                                <div className="h-full overflow-y-auto pb-2">
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
                        </div>

                        {/* Activity Name and Save Button - Fixed at bottom */}
                        <div className="border-t pt-3 mt-3 flex-shrink-0 w-full bg-background">
                            <input
                                className="w-full mb-2 text-sm focus:outline-none focus:ring-0 focus:ring-offset-0"
                                style={{ boxShadow: 'none' }}
                                type="text"
                                placeholder="Nom de l'activité"
                                value={activityName}
                                onChange={e => setActivityName(e.target.value)}
                            />

                            <button
                                className="btn btn-primary w-full"
                                style={{ borderRadius: 'var(--radius)' }}
                                onClick={handleSaveActivity}
                                disabled={savingActivity || selectedQuestions.length === 0 || !activityName.trim()}
                            >
                                {savingActivity ? 'Sauvegarde...' : 'Sauvegarder'}
                            </button>
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

            {/* Success Modal */}
            <InfoModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title={
                    <div className="flex items-center gap-3 justify-center">
                        <Check size={24} />
                        <span>Activité créée</span>
                    </div>
                }
                size="sm"
            >
                <div className="dialog-modal-content">
                    <p className="text-[color:var(--foreground)] mb-4">
                        L'activité <strong>"{createdActivityName}"</strong> a été créée avec succès.
                    </p>
                    <div className="dialog-modal-actions">
                        <button
                            className="dialog-modal-btn"
                            onClick={() => setShowSuccessModal(false)}
                        >
                            Fermer
                        </button>
                        <button
                            className="dialog-modal-btn"
                            onClick={() => router.push('/teacher/games')}
                        >
                            Voir
                        </button>
                    </div>
                </div>
            </InfoModal>

            {/* Error Messages Only */}
            <Snackbar
                open={snackbarOpen}
                message={snackbarMessage}
                type={snackbarType}
                onClose={() => setSnackbarOpen(false)}
            />
        </div>
    );
}
