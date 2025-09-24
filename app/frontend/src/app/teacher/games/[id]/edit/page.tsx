"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { makeApiRequest } from '@/config/api';
import InfinitySpin from '@/components/InfinitySpin';
import { Search } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import {
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import MultiSelectDropdown from '@/components/MultiSelectDropdown';
import { Clock, GripVertical, X, ShoppingCart, Plus } from 'lucide-react';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import type { Question } from '@shared/types/core/question'; // Use canonical shared type
import { GameInstance } from '@shared/types/core/game';

// Filter request interface
interface FilterQuestionRequest {
    levels?: string[];
    disciplines?: string[];
    themes?: string[];
    authors?: string[];
    search?: string;
}

// Cart question interface extending the canonical shared Question type
interface CartQuestion extends Question {
    cartId: string;
}

// Interface for the activity metadata
interface ActivityMeta {
    discipline: string;
    gradeLevel: string;
    themes: string[];
    levels: string[];
    name: string;
    playMode: 'quiz' | 'tournament' | 'practice';
    settings: {
        timeMultiplier?: number;
        showLeaderboard?: boolean;
    };
}

// Using shared GameInstance type instead

// Sortable cart question component
function SortableCartQuestion({
    question,
    onRemove,
    onUpdateTime
}: {
    question: CartQuestion;
    onRemove: (id: string) => void;
    onUpdateTime: (id: string, time: number) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: question.cartId });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-base-100 rounded-lg border border-base-300 p-3 group hover:shadow-md transition-shadow"
        >
            <div className="flex items-start gap-3">
                {/* Drag handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="mt-1 cursor-grab active:cursor-grabbing text-base-content/40 hover:text-base-content/60"
                >
                    <GripVertical size={16} />
                </div>

                {/* Question content */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2 text-base-content">
                        {question.text}
                    </p>

                    {/* Timer controls */}
                    <div className="flex items-center gap-2 mt-2">
                        <Clock size={14} className="text-base-content/60" />
                        <input
                            type="number"
                            min="10"
                            max="300"
                            value={typeof question.durationMs === 'number' ? Math.round(question.durationMs / 1000) : 30}
                            onChange={(e) => onUpdateTime(question.cartId, parseInt(e.target.value) || 30)}
                            className="input input-xs input-bordered w-20 text-xs"
                        />
                        <span className="text-xs text-base-content/60">sec</span>
                    </div>
                </div>

                {/* Remove button */}
                <button
                    onClick={() => onRemove(question.cartId)}
                    className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                    title="Retirer la question"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}

export default function EditActivityPage() {
    // Access is now enforced by middleware; no need for useAccessGuard

    const params = useParams();
    const router = useRouter();
    const gameId = params.id as string;
    const { teacherId } = useAuth();

    // State for the activity metadata
    const [activityMeta, setActivityMeta] = useState<ActivityMeta>({
        discipline: '',
        gradeLevel: '',
        themes: [],
        levels: [],
        name: '',
        playMode: 'quiz',
        settings: {
            timeMultiplier: 1,
            showLeaderboard: true
        }
    });

    // State for questions and filters
    const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
    const [selectedQuestions, setSelectedQuestions] = useState<CartQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [gameData, setGameData] = useState<GameInstance | null>(null);

    // Filter states
    const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
    const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
    const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
    const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Available filter options
    const [availableLevels, setAvailableLevels] = useState<string[]>([]);
    const [availableDisciplines, setAvailableDisciplines] = useState<string[]>([]);
    const [availableThemes, setAvailableThemes] = useState<string[]>([]);
    const [availableAuthors, setAvailableAuthors] = useState<string[]>([]);

    // Mobile state
    const [showMobileCart, setShowMobileCart] = useState(false);

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Fetch existing game data on component mount
    useEffect(() => {
        fetchGameData();
    }, [gameId]);

    // Fetch questions when filters change
    useEffect(() => {
        fetchQuestions();
    }, [selectedLevels, selectedDisciplines, selectedThemes, selectedAuthors, searchTerm]);

    const fetchGameData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await makeApiRequest(`games/instance/${gameId}/edit`) as { gameInstance: GameInstance };
            const { gameInstance } = response;
            setGameData(gameInstance);

            // Pre-fill the form with existing data
            if (gameInstance.gameTemplate) {
                setActivityMeta({
                    discipline: gameInstance.gameTemplate.discipline || '',
                    gradeLevel: gameInstance.gameTemplate.gradeLevel || '',
                    themes: gameInstance.gameTemplate.themes,
                    levels: [gameInstance.gameTemplate.gradeLevel || ''].filter(Boolean), // Convert to array
                    name: gameInstance.name,
                    playMode: gameInstance.playMode as 'quiz' | 'tournament' | 'practice', // Type assertion for compatibility
                    settings: gameInstance.settings || {
                        timeMultiplier: 1,
                        showLeaderboard: true
                    }
                });

                // Convert existing questions to cart format
                const existingQuestions: CartQuestion[] = (gameInstance.gameTemplate.questions || [])
                    .sort((a: any, b: any) => a.sequence - b.sequence)
                    .map((item: any, index: number) => ({
                        ...item.question,
                        cartId: `existing-${index}`
                    }));
                setSelectedQuestions(existingQuestions);
            }

            // Fetch available filters
            await fetchFilters();

        } catch (err: any) {
            console.error('Error fetching game data:', err);
            setError(err.message || 'Erreur lors du chargement de l\'activité');
        } finally {
            setLoading(false);
        }
    };

    const fetchFilters = async () => {
        try {
            const response = await makeApiRequest('questions/filters') as {
                levels: string[];
                disciplines: string[];
                themes: string[];
                authors: string[];
            };

            setAvailableLevels(response.levels || []);
            setAvailableDisciplines(response.disciplines || []);
            setAvailableThemes(response.themes || []);
            setAvailableAuthors(response.authors || []);
        } catch (err) {
            console.error('Error fetching filters:', err);
        }
    };

    const fetchQuestions = async () => {
        try {
            const filters: FilterQuestionRequest = {
                levels: selectedLevels,
                disciplines: selectedDisciplines,
                themes: selectedThemes,
                authors: selectedAuthors,
                search: searchTerm
            };

            const response = await makeApiRequest('questions/filter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(filters)
            }) as { questions: Question[] };

            setAvailableQuestions(response.questions || []);
        } catch (err) {
            console.error('Error fetching questions:', err);
            setAvailableQuestions([]);
        }
    };

    const handleAddQuestion = (question: Question) => {
        const cartQuestion: CartQuestion = {
            ...question,
            cartId: `cart-${Date.now()}-${Math.random()}`
        };
        setSelectedQuestions(prev => [...prev, cartQuestion]);
    };

    const handleRemoveQuestion = (cartId: string) => {
        setSelectedQuestions(prev => prev.filter(q => q.cartId !== cartId));
    };

    const handleUpdateQuestionTime = (cartId: string, newTime: number) => {
        setSelectedQuestions(prev =>
            prev.map(q =>
                q.cartId === cartId
                    ? { ...q, durationMs: newTime * 1000 } // Always store as ms
                    : q
            )
        );
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setSelectedQuestions((items) => {
                const activeIndex = items.findIndex(item => item.cartId === active.id);
                const overIndex = items.findIndex(item => item.cartId === over.id);
                return arrayMove(items, activeIndex, overIndex);
            });
        }
    };

    const handleSaveActivity = async () => {
        try {
            setSaving(true);
            setError(null);

            if (!teacherId) {
                throw new Error('Teacher ID is required');
            }

            if (!activityMeta.name.trim()) {
                throw new Error('Le nom de l\'activité est requis');
            }

            if (selectedQuestions.length === 0) {
                throw new Error('Au moins une question est requise');
            }

            // Step 1: Update the game template with new questions and metadata
            if (!gameData?.gameTemplate?.id) {
                throw new Error('Game template ID is missing');
            }
            await makeApiRequest(`game-templates/${gameData.gameTemplate.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: activityMeta.name,
                    discipline: selectedDisciplines[0] || 'Mathématiques',
                    gradeLevel: activityMeta.levels[0] || 'Niveau non spécifié',
                    themes: selectedThemes,
                    defaultMode: activityMeta.playMode,
                    questions: selectedQuestions.map((question, index) => ({
                        questionUid: question.uid,
                        sequence: index + 1,
                        durationMs: typeof question.durationMs === 'number' ? question.durationMs : 30000 // fallback to 30s if missing
                    }))
                })
            });

            // Step 2: Update the game instance with new settings and name
            await makeApiRequest(`games/instance/${gameId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: activityMeta.name,
                    playMode: activityMeta.playMode,
                    settings: activityMeta.settings
                })
            });

            // Success message and redirect
            alert(`Activité "${activityMeta.name}" modifiée avec succès !`);
            router.push('/teacher/games');

        } catch (err: any) {
            console.error('Error updating activity:', err);
            setError(err.message || 'Erreur lors de la modification de l\'activité');
        } finally {
            setSaving(false);
        }
    };

    // Filtered questions (exclude already selected ones)
    const filteredQuestions = availableQuestions.filter(q =>
        !selectedQuestions.some(selected => selected.uid === q.uid)
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-base-100 p-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center h-64">
                        <InfinitySpin size={48} />
                        <span className="ml-4 text-lg">Chargement de l&apos;activité...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !gameData) {
        return (
            <div className="min-h-screen bg-base-100 p-4">
                <div className="max-w-7xl mx-auto">
                    <div className="alert alert-error">
                        <span>{error}</span>
                    </div>
                    <div className="mt-4">
                        <Link href="/teacher/games" className="btn btn-outline">
                            Retour aux activités
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-100">
            {/* Header */}
            <div className="bg-base-200 border-b border-base-300 px-4 py-6">
                <div className="max-w-7xl mx-auto">
                    <div className="breadcrumbs text-sm mb-2">
                        <ul>
                            <li><Link href="/teacher/games">Mes activités</Link></li>
                            <li>Éditer une activité</li>
                        </ul>
                    </div>
                    <h1 className="text-3xl font-bold text-base-content">
                        Éditer une activité
                    </h1>
                    <p className="text-base-content/70 mt-2">
                        Modifiez les questions et les paramètres de votre activité.
                    </p>
                </div>
            </div>

            {/* Error display */}
            {error && (
                <div className="max-w-7xl mx-auto px-4 pt-4">
                    <div className="alert alert-error">
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Desktop Layout */}
            <div className="hidden lg:block max-w-7xl mx-auto p-4">
                <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
                    {/* Left Panel - Available Questions */}
                    <div className="col-span-7 bg-base-200 rounded-lg p-4 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">Questions disponibles</h2>
                            <span className="badge badge-outline">{filteredQuestions.length} questions</span>
                        </div>

                        {/* Filters */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <MultiSelectDropdown
                                options={availableLevels}
                                selected={selectedLevels}
                                onChange={setSelectedLevels}
                                placeholder="Niveau"
                                className="w-full"
                            />
                            <MultiSelectDropdown
                                options={availableDisciplines}
                                selected={selectedDisciplines}
                                onChange={setSelectedDisciplines}
                                placeholder="Discipline"
                                className="w-full"
                            />
                            <MultiSelectDropdown
                                options={availableThemes}
                                selected={selectedThemes}
                                onChange={setSelectedThemes}
                                placeholder="Thèmes"
                                className="w-full"
                            />
                            <MultiSelectDropdown
                                options={availableAuthors}
                                selected={selectedAuthors}
                                onChange={setSelectedAuthors}
                                placeholder="Auteur"
                                className="w-full"
                            />
                        </div>

                        {/* Search */}
                        <div className="mb-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search size={20} className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Rechercher une question..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="input input-bordered w-full pl-10"
                                />
                            </div>
                        </div>

                        {/* Questions List */}
                        <div className="flex-1 overflow-y-auto space-y-3">
                            {filteredQuestions.map((question) => (
                                <div key={question.uid} className="bg-base-100 rounded-lg border border-base-300 p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Clock size={14} className="text-base-content/60" />
                                                <span className="text-xs text-base-content/60">{typeof question.durationMs === 'number' ? Math.round(question.durationMs / 1000) : 30}s</span>
                                                <span className="badge badge-outline badge-sm">{question.gradeLevel}</span>
                                                <span className="badge badge-outline badge-sm">{question.discipline}</span>
                                            </div>
                                            <p className="font-medium text-sm mb-2 line-clamp-2">{question.text}</p>
                                            <div className="flex flex-wrap gap-1">
                                                {(question.themes || []).map((theme: string, index: number) => (
                                                    <span key={index} className="badge badge-ghost badge-xs">{theme}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleAddQuestion(question)}
                                            className="btn btn-primary btn-sm"
                                            title="Ajouter au panier"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {filteredQuestions.length === 0 && (
                                <div className="text-center py-8 text-base-content/60">
                                    <p>Aucune question trouvée avec ces filtres.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Shopping Cart */}
                    <div className="col-span-5 bg-base-200 rounded-lg p-4 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">Questions sélectionnées</h2>
                            <span className="badge badge-primary">{selectedQuestions.length}</span>
                        </div>

                        {/* Activity metadata form */}
                        <div className="space-y-3 mb-4 p-3 bg-base-100 rounded-lg">
                            <div className="form-control">
                                <label className="label label-text font-medium">Nom de l&apos;activité</label>
                                <input
                                    type="text"
                                    value={activityMeta.name}
                                    onChange={(e) => setActivityMeta(prev => ({ ...prev, name: e.target.value }))}
                                    className="input input-bordered input-sm"
                                    placeholder="Nom de l'activité"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label label-text font-medium">Type d&apos;activité</label>
                                <select
                                    value={activityMeta.playMode}
                                    onChange={(e) => setActivityMeta(prev => ({
                                        ...prev,
                                        playMode: e.target.value as 'quiz' | 'tournament' | 'practice'
                                    }))}
                                    className="select select-bordered select-sm"
                                >
                                    <option value="quiz">Quiz</option>
                                    <option value="tournament">Tournoi</option>
                                    <option value="practice">Pratique</option>
                                </select>
                            </div>
                        </div>

                        {/* Selected Questions with Drag and Drop */}
                        <div className="flex-1 overflow-y-auto">
                            {selectedQuestions.length === 0 ? (
                                <div className="text-center py-8 text-base-content/60">
                                    <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>Aucune question sélectionnée</p>
                                    <p className="text-sm mt-2">Ajoutez des questions depuis le panneau de gauche</p>
                                </div>
                            ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={selectedQuestions.map(q => q.cartId)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="space-y-3">
                                            {selectedQuestions.map((question) => (
                                                <SortableCartQuestion
                                                    key={question.cartId}
                                                    question={question}
                                                    onRemove={handleRemoveQuestion}
                                                    onUpdateTime={handleUpdateQuestionTime}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4 pt-4 border-t border-base-300">
                            <Link href="/teacher/games" className="btn btn-outline btn-sm flex-1">
                                Annuler
                            </Link>
                            <button
                                onClick={handleSaveActivity}
                                disabled={saving || !activityMeta.name.trim() || selectedQuestions.length === 0}
                                className="btn btn-primary btn-sm flex-1"
                            >
                                {saving ? (
                                    <>
                                        <InfinitySpin size={16} trailColor="var(--primary-foreground)" />
                                        <span className="ml-2">Modification...</span>
                                    </>
                                ) : (
                                    'Modifier'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden p-4">
                {/* Activity Form */}
                <div className="bg-base-200 rounded-lg p-4 mb-4">
                    <h2 className="text-lg font-semibold mb-3">Informations de l&apos;activité</h2>
                    <div className="space-y-3">
                        <div className="form-control">
                            <label className="label label-text font-medium">Nom de l&apos;activité</label>
                            <input
                                type="text"
                                value={activityMeta.name}
                                onChange={(e) => setActivityMeta(prev => ({ ...prev, name: e.target.value }))}
                                className="input input-bordered"
                                placeholder="Nom de l'activité"
                            />
                        </div>
                        <div className="form-control">
                            <label className="label label-text font-medium">Type d&apos;activité</label>
                            <select
                                value={activityMeta.playMode}
                                onChange={(e) => setActivityMeta(prev => ({
                                    ...prev,
                                    playMode: e.target.value as 'quiz' | 'tournament' | 'practice'
                                }))}
                                className="select select-bordered"
                            >
                                <option value="quiz">Quiz</option>
                                <option value="tournament">Tournoi</option>
                                <option value="practice">Pratique</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-base-200 rounded-lg p-4 mb-4">
                    <h2 className="text-lg font-semibold mb-3">Filtres</h2>
                    <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <MultiSelectDropdown
                                options={availableLevels}
                                selected={selectedLevels}
                                onChange={setSelectedLevels}
                                placeholder="Niveau"
                            />
                            <MultiSelectDropdown
                                options={availableDisciplines}
                                selected={selectedDisciplines}
                                onChange={setSelectedDisciplines}
                                placeholder="Discipline"
                            />
                            <MultiSelectDropdown
                                options={availableThemes}
                                selected={selectedThemes}
                                onChange={setSelectedThemes}
                                placeholder="Thèmes"
                            />
                            <MultiSelectDropdown
                                options={availableAuthors}
                                selected={selectedAuthors}
                                onChange={setSelectedAuthors}
                                placeholder="Auteur"
                            />
                        </div>
                        <div className="relative max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={20} className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Rechercher une question..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input input-bordered w-full pl-10"
                            />
                        </div>
                    </div>
                </div>

                {/* Available Questions */}
                <div className="bg-base-200 rounded-lg p-4 mb-20">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold">Questions disponibles</h2>
                        <span className="badge badge-outline">{filteredQuestions.length}</span>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {filteredQuestions.map((question) => (
                            <div key={question.uid} className="bg-base-100 rounded-lg border border-base-300 p-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock size={14} className="text-base-content/60" />
                                            <span className="text-xs text-base-content/60">{typeof question.durationMs === 'number' ? Math.round(question.durationMs / 1000) : 30}s</span>
                                            <span className="badge badge-outline badge-sm">{question.gradeLevel}</span>
                                        </div>
                                        <p className="font-medium text-sm mb-2 line-clamp-2">{question.text}</p>
                                        <div className="flex flex-wrap gap-1">
                                            {(question.themes || []).slice(0, 2).map((theme: string, index: number) => (
                                                <span key={index} className="badge badge-ghost badge-xs">{theme}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAddQuestion(question)}
                                        className="btn btn-primary btn-sm"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {filteredQuestions.length === 0 && (
                            <div className="text-center py-8 text-base-content/60">
                                <p>Aucune question trouvée.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile FAB */}
            <div className="lg:hidden">
                <button
                    onClick={() => setShowMobileCart(true)}
                    className="fixed bottom-6 right-6 btn btn-primary btn-circle btn-lg shadow-lg z-10"
                >
                    <div className="relative">
                        <ShoppingCart size={24} />
                        {selectedQuestions.length > 0 && (
                            <span className="absolute -top-2 -right-2 badge badge-secondary badge-sm">
                                {selectedQuestions.length}
                            </span>
                        )}
                    </div>
                </button>
            </div>

            {/* Mobile Cart Modal */}
            {showMobileCart && (
                <div className="lg:hidden fixed inset-0 bg-black/50 z-20 flex items-end">
                    <div className="bg-base-100 w-full max-h-[80vh] rounded-t-2xl p-4 overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Questions sélectionnées ({selectedQuestions.length})</h3>
                            <button
                                onClick={() => setShowMobileCart(false)}
                                className="btn btn-ghost btn-sm btn-circle"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {selectedQuestions.length === 0 ? (
                                <div className="text-center py-8 text-base-content/60">
                                    <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>Aucune question sélectionnée</p>
                                </div>
                            ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={selectedQuestions.map(q => q.cartId)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="space-y-3">
                                            {selectedQuestions.map((question) => (
                                                <SortableCartQuestion
                                                    key={question.cartId}
                                                    question={question}
                                                    onRemove={handleRemoveQuestion}
                                                    onUpdateTime={handleUpdateQuestionTime}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            )}
                        </div>

                        <div className="flex gap-2 mt-4 pt-4">
                            <button
                                onClick={() => setShowMobileCart(false)}
                                className="btn btn-outline flex-1"
                            >
                                Continuer
                            </button>
                            <button
                                onClick={handleSaveActivity}
                                disabled={saving || !activityMeta.name.trim() || selectedQuestions.length === 0}
                                className="btn btn-primary flex-1"
                            >
                                {saving ? (
                                    <>
                                        <InfinitySpin size={16} trailColor="var(--primary-foreground)" />
                                        <span className="ml-2">Modification...</span>
                                    </>
                                ) : (
                                    'Modifier'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Info about current game status */}
            {gameData && (
                <div className="max-w-7xl mx-auto px-4 pb-4">
                    <div className="p-4 bg-info/10 rounded-lg border border-info/20">
                        <h3 className="font-medium text-info mb-2">Informations sur l&apos;activité</h3>
                        <div className="text-sm space-y-1">
                            <p><span className="font-medium">Code d&apos;accès:</span> {gameData.accessCode}</p>
                            <p><span className="font-medium">Statut:</span> {gameData.status}</p>
                            <p className="text-base-content/60 mt-2">
                                Note: Seules les activités en statut &quot;pending&quot; peuvent être modifiées.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
