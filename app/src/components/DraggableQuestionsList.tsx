/**
 * Draggable Questions List Component
 * 
 * This component displays an interactive, drag-and-drop enabled list of quiz questions
 * for the teacher dashboard interface. It supports:
 * 
 * - Question reordering via drag and drop
 * - Play/pause/stop controls for each question
 * - Editing question timers (duration)
 * - Detailed question preview with correct/incorrect answers
 * - Real-time synchronization with quiz state
 * - Visual indicators for the currently active question
 * 
 * The component manages both local timers and synchronizes with the server-side
 * quiz state to ensure consistent behavior when controlling live quizzes.
 * 
 * This is a central component of the teacher's quiz management interface.
 */

import React, { useState } from "react";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, X, Pencil, Play, GripVertical, Pause, Square } from 'lucide-react';
import type { Response, Question, QuizState } from "../types";
import { createLogger } from '@/clientLogger';

// Create a logger for this component
const logger = createLogger('DraggableQuestions');

// --- Types ---
interface DraggableQuestionsListProps {
    questions: Question[];
    quizState: QuizState | null;
    questionActiveUid: string | null;
    onSelect: (uid: string) => void;
    onPlay: (idx: number, chrono?: number) => void;
    onPause: (idx: number) => void;
    onStop: (idx: number) => void;
    onEditTimer: (idx: number, newTime: number) => void;
    onReorder?: (newQuestions: Question[]) => void;
    // Timer props for robust timer logic
    timerStatus?: 'play' | 'pause' | 'stop';
    timerQuestionId?: string | null;
    timeLeft?: number;
    onTimerAction?: (info: { status: 'play' | 'pause' | 'stop'; questionId: string; timeLeft: number }) => void;
    // *** ADDED: Callback for immediate UI update ***
    onImmediateUpdateActiveTimer?: (newTime: number) => void;
}

export default function DraggableQuestionsList({
    questions,
    quizState,
    questionActiveUid,
    onSelect,
    onPlay,
    onPause,
    onStop,
    onEditTimer,
    onReorder,
    timerStatus,
    timerQuestionId,
    timeLeft,
    onTimerAction,
}: DraggableQuestionsListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );
    // Local open state for expanded cards
    const [openIdx, setOpenIdx] = useState<number | null>(null);
    // Timer state for robust timer logic
    const [localStatus, setLocalStatus] = React.useState<'play' | 'pause' | 'stop'>(timerStatus || 'stop');
    const [localQuestionId, setLocalQuestionId] = React.useState<string | null>(timerQuestionId || null);
    const [localTimeLeft, setLocalTimeLeft] = React.useState<number>(timeLeft || 0);
    const timerRef = React.useRef<NodeJS.Timeout | null>(null);

    // Log timer prop changes for debugging
    React.useEffect(() => {
        logger.debug('Timer state updated', { timerStatus, timerQuestionId, timeLeft });
    }, [timerStatus, timerQuestionId, timeLeft]);

    // Sync local timer with props and always restart interval if needed
    React.useEffect(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setLocalStatus(timerStatus || 'stop');
        setLocalQuestionId(timerQuestionId || null);
        setLocalTimeLeft(typeof timeLeft === 'number' ? timeLeft : 0);
        if (
            timerStatus === 'play' &&
            timerQuestionId &&
            typeof timeLeft === 'number' &&
            timeLeft > 0
        ) {
            logger.debug('Starting timer interval', { timerStatus, timerQuestionId, timeLeft });
            timerRef.current = setInterval(() => {
                setLocalTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        setLocalStatus('stop');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            logger.debug('Not starting timer interval', { timerStatus, timerQuestionId, timeLeft });
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [timerStatus, timerQuestionId, timeLeft]);

    // *** ADDED: Define the handler to immediately update the parent's localTimeLeft ***
    const handleImmediateUpdate = (newTime: number) => {
        logger.debug(`DraggableQuestionsList: Immediately setting localTimeLeft to ${newTime}`);
        setLocalTimeLeft(newTime);
    };

    // Handlers for play/pause/stop
    const handlePlay = (questionId: string, startTime: number) => {
        const idx = questions.findIndex(q => q.uid === questionId);
        const currentQuestion = questions[idx]; // Get the question object from the props
        if (!currentQuestion) return;

        const isPaused = isQuestionPaused(questionId);

        if (isPaused) {
            logger.info(`Resuming paused timer for question ${questionId}`);
            setLocalStatus('play');
            setLocalQuestionId(questionId);

            if (onTimerAction) {
                // *** FIX: Always use localTimeLeft when resuming ***
                // This state holds the remaining time when paused or the immediately updated edited value.
                const resumeTime = localTimeLeft;
                logger.debug(`Resuming with timeLeft: ${resumeTime} (from component's localTimeLeft state)`);
                onTimerAction({ status: 'play', questionId, timeLeft: resumeTime });
            } else {
                if (onPlay && idx !== -1) onPlay(idx); // Fallback might need adjustment if it relies on total time
            }
        } else {
            // Start new timer
            const effectiveStartTime = currentQuestion.temps ?? startTime;
            logger.info(`Starting new timer for question ${questionId} with time ${effectiveStartTime}s`);
            setLocalStatus('play');
            setLocalQuestionId(questionId);
            setLocalTimeLeft(effectiveStartTime); // Set local time to full duration

            if (onTimerAction) {
                onTimerAction({ status: 'play', questionId, timeLeft: effectiveStartTime });
            } else {
                if (onPlay && idx !== -1) onPlay(idx, effectiveStartTime);
            }
        }
    };

    // Helper function to determine if a question is paused
    const isQuestionPaused = (questionId: string): boolean => {
        return (
            localQuestionId === questionId &&
            localStatus === 'pause' &&
            localTimeLeft > 0
        );
    };

    const handlePause = () => {
        setLocalStatus('pause');
        onTimerAction && onTimerAction({ status: 'pause', questionId: localQuestionId!, timeLeft: localTimeLeft });
    };
    const handleStop = () => {
        setLocalStatus('stop');
        setLocalTimeLeft(0);
        onTimerAction && onTimerAction({ status: 'stop', questionId: localQuestionId!, timeLeft: 0 });
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={event => {
                const { active, over } = event;
                if (!over || active.id === over.id) return;
                const oldIndex = questions.findIndex(q => String(q.uid) === active.id);
                const newIndex = questions.findIndex(q => String(q.uid) === over.id);
                if (oldIndex === -1 || newIndex === -1) return;
                const newQuestions = arrayMove(questions, oldIndex, newIndex);
                if (onReorder) onReorder(newQuestions);
            }}
        >
            <SortableContext items={questions.map(q => String(q.uid))} strategy={verticalListSortingStrategy}>
                <ul className="space-y-4">
                    {questions.length === 0 && <li>Aucune question pour ce quiz.</li>}
                    {questions.map((q, idx) => {
                        const isActive = q.uid === questionActiveUid;
                        return (
                            <SortableQuestion
                                key={q.uid}
                                q={q}
                                idx={idx}
                                isActive={isActive}
                                isRunning={quizState && quizState.currentQuestionIdx === idx ? quizState.chrono.running : false}
                                quizState={quizState}
                                open={openIdx === idx}
                                setOpen={() => setOpenIdx(openIdx === idx ? null : idx)}
                                onPlay={() => handlePlay(q.uid, q.temps ?? 20)}
                                onPause={handlePause}
                                onStop={handleStop}
                                onSelect={() => onSelect(q.uid)}
                                onEditTimer={(newTime) => onEditTimer(idx, newTime)}
                                // Pass live timer only to the active question
                                liveTimeLeft={isActive ? localTimeLeft : undefined}
                                liveStatus={isActive ? localStatus : undefined}
                                // *** ADDED: Pass the handler down ***
                                onImmediateUpdateActiveTimer={handleImmediateUpdate}
                            />
                        );
                    })}
                </ul>
            </SortableContext>
        </DndContext>
    );
}

// Helper function to format seconds into MM:SS
function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${paddedMinutes}:${paddedSeconds}`;
}

interface SortableQuestionProps {
    q: Question;
    idx: number;
    isActive?: boolean;
    isRunning?: boolean;
    quizState?: QuizState | null;
    open: boolean;
    setOpen: () => void;
    onPlay: () => void;
    onPause: () => void;
    onStop?: () => void;
    onSelect: () => void;
    onEditTimer: (newTime: number) => void;
    liveTimeLeft?: number;
    liveStatus?: 'play' | 'pause' | 'stop';
    // *** ADDED: Callback prop type ***
    onImmediateUpdateActiveTimer?: (newTime: number) => void;
}

function SortableQuestion({ q, idx, isActive, isRunning, quizState, open, setOpen, onPlay, onPause, onStop, onSelect, onEditTimer, liveTimeLeft, liveStatus, onImmediateUpdateActiveTimer }: SortableQuestionProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(q.uid) });
    const [localTimeLeft, setLocalTimeLeft] = useState<number | null>(q.temps ?? null);
    const [editingTimer, setEditingTimer] = useState(false);
    const [editTimerValue, setEditTimerValue] = useState<string>("");
    const timerInputRef = React.useRef<HTMLInputElement>(null);
    const inputWrapperRef = React.useRef<HTMLSpanElement>(null);

    // Synchronize localTimeLeft with liveTimeLeft for active questions
    React.useEffect(() => {
        if (isActive && typeof liveTimeLeft === 'number') {
            setLocalTimeLeft(liveTimeLeft);
        }
    }, [isActive, liveTimeLeft]);

    // When we receive new question props (if the timer was modified outside)
    React.useEffect(() => {
        // Only update if we're not active or there's no live timer
        if (!isActive || typeof liveTimeLeft !== 'number') {
            setLocalTimeLeft(q.temps ?? null);
        }
    }, [q.temps, isActive, liveTimeLeft]);

    // Log for debugging
    React.useEffect(() => {
        if (isActive) {
            logger.debug(`Active question timer state: localTimeLeft=${localTimeLeft}, liveTimeLeft=${liveTimeLeft}, q.temps=${q.temps}`);
        }
    }, [isActive, localTimeLeft, liveTimeLeft, q.temps]);

    React.useEffect(() => {
        if (!editingTimer) return;
        const wrapper = inputWrapperRef.current;
        if (!wrapper) return;
        const input = wrapper.querySelector('input');
        if (!input) return;
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            e.stopPropagation();
            const val = parseInt(editTimerValue, 10) || 0;
            if (e.deltaY < 0) setEditTimerValue(String(val + 1));
            else if (e.deltaY > 0 && val > 0) setEditTimerValue(String(Math.max(0, val - 1)));
        };
        input.addEventListener('wheel', handleWheel, { passive: false });
        return () => { input.removeEventListener('wheel', handleWheel); };
    }, [editingTimer, editTimerValue]);

    React.useEffect(() => {
        if (editingTimer) {
            setEditTimerValue(localTimeLeft !== null ? String(localTimeLeft) : "");
            setTimeout(() => timerInputRef.current?.focus(), 0);
        }
    }, [editingTimer, localTimeLeft]);

    function formatEditValue(val: string) {
        const seconds = parseInt(val, 10);
        if (isNaN(seconds)) return "00:00";
        return formatTime(seconds);
    }

    const formattedLocalTime = localTimeLeft !== null ? formatTime(localTimeLeft) : '';
    const iconColor = isActive ? 'var(--primary-foreground)' : '';

    // Determine the effective running state: prioritize liveStatus if active, otherwise use isRunning from quizState
    const effectiveIsRunning = isActive && liveStatus ? liveStatus === 'play' : (isRunning ?? false);
    // Consider paused if active, status is 'pause', or if not running but time > 0 (might need refinement based on exact desired pause state)
    // const effectiveIsPaused = isActive && liveStatus ? liveStatus === 'pause' : (!isRunning && typeof liveTimeLeft === 'number' && liveTimeLeft > 0);

    const handlePauseClick = () => { onPause(); };
    const handleEditTimer = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!editingTimer) {
            if (localTimeLeft !== null && localTimeLeft !== undefined) setEditTimerValue(String(localTimeLeft));
            else if (typeof q.temps === 'number') setEditTimerValue(String(q.temps));
            else setEditTimerValue("0");
        }
        setEditingTimer(true);
    };
    React.useEffect(() => {
        if (localTimeLeft === null && typeof q.temps === 'number') setLocalTimeLeft(q.temps);
    }, [q.temps, localTimeLeft]);
    const handleCancelEdit = (e: React.MouseEvent | React.KeyboardEvent<HTMLInputElement>) => {
        e.stopPropagation();
        setEditingTimer(false);
    };
    const handleValidateEdit = (e: React.MouseEvent | React.KeyboardEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const newTime = parseInt(editTimerValue, 10);
        if (!isNaN(newTime) && newTime >= 0) {
            logger.info(`Validating timer edit for question ${q.uid}: ${editTimerValue}s (active: ${isActive})`);

            // Update internal state (useful for inactive display)
            setLocalTimeLeft(newTime);

            // Call the parent's edit handler to update server/global state
            onEditTimer(newTime);

            // *** NEW: Immediately update parent state if this is the active question ***
            if (isActive && onImmediateUpdateActiveTimer) {
                logger.debug(`Immediately updating parent localTimeLeft for active question ${q.uid} to ${newTime}s`);
                onImmediateUpdateActiveTimer(newTime);
            }
        }
        setEditingTimer(false);
    };
    let timerDisplay;
    if (editingTimer) {
        timerDisplay = (
            <span ref={inputWrapperRef} className="flex items-center gap-1">
                <input
                    ref={timerInputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-20 px-1 py-0.5 rounded border border-gray-300 text-lg font-mono text-center"
                    value={formatEditValue(editTimerValue)}
                    onChange={e => {
                        // Accept only numbers and colon (for MM:SS input, but store as seconds)
                        const val = e.target.value.replace(/[^0-9:]/g, '');
                        // Support direct MM:SS input (optional)
                        if (val.includes(':')) {
                            const [mm, ss] = val.split(':');
                            const minutes = parseInt(mm, 10) || 0;
                            const seconds = parseInt(ss, 10) || 0;
                            const total = minutes * 60 + seconds;
                            setEditTimerValue(String(total));
                        } else {
                            setEditTimerValue(val.replace(/[^0-9]/g, ''));
                        }
                    }}
                    onClick={e => e.stopPropagation()}
                    onKeyDown={e => {
                        if (e.key === 'Enter') handleValidateEdit(e as React.KeyboardEvent<HTMLInputElement>);
                        if (e.key === 'Escape') handleCancelEdit(e as React.KeyboardEvent<HTMLInputElement>);
                        // Up/down arrow support - increment/decrement by 1 second
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                            e.preventDefault();
                            const val = parseInt(editTimerValue, 10) || 0;
                            if (e.key === 'ArrowUp') setEditTimerValue(String(val + 1));
                            if (e.key === 'ArrowDown') setEditTimerValue(String(Math.max(0, val - 1)));
                        }
                    }}
                />
                <button onClick={handleValidateEdit} style={{ color: 'var(--foreground)' }} title="Valider"><Check size={18} /></button>
                <button onClick={handleCancelEdit} style={{ color: 'var(--foreground)' }} title="Annuler"><X size={18} /></button>
            </span>
        );
    } else {
        let timerText = '-';

        // Display logic for timer:
        // 1. For active questions, show liveTimeLeft (current countdown)
        // 2. For inactive questions or questions with no live timer, show localTimeLeft

        if (isActive && typeof liveTimeLeft === 'number') {
            // Active question with running timer - show live time
            timerText = formatTime(liveTimeLeft);

            // Debug this value only for active questions
            logger.debug(`Showing liveTimeLeft for active question: ${liveTimeLeft}s`);
        } else if (localTimeLeft !== null) {
            // Inactive question or active but no live timer - show stored time
            timerText = formatTime(localTimeLeft);

            // We're not logging inactive questions anymore to keep console clean
        } else if (typeof q.temps === 'number') {
            // Fallback to question's default time
            timerText = formatTime(q.temps);
        }

        timerDisplay = (
            <span className="flex items-center gap-1">
                <span
                    className="font-mono text-lg px-2 py-1 rounded bg-muted text-muted-foreground min-w-[60px] text-center select-none"
                    title="Temps de la question"
                >
                    {timerText} {/* Display the calculated timerText */}
                </span>
                <button
                    className="ml-1 p-1 rounded hover:bg-accent hover:text-accent-foreground"
                    title="Éditer le temps"
                    onClick={handleEditTimer}
                    tabIndex={-1}
                    type="button"
                >
                    <Pencil size={16} />
                </button>
            </span>
        );
    }
    return (
        <li
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                zIndex: isDragging ? 10 : undefined,
                opacity: isDragging ? 0.7 : 1,
                touchAction: 'none',
            }}
            className={`card flex flex-col gap-3 select-none transition-all duration-150 ease-in-out ${isActive ? 'card-active' : ''} ${isDragging ? 'opacity-70' : ''}`}
            onClick={event => {
                const target = event.target as HTMLElement;
                const isDragHandle = target.closest('[data-drag-handle]');
                const isPlayPauseBtn = target.closest('[data-play-pause-btn]');
                const isStopBtn = target.closest('[data-stop-btn]');
                if (isDragHandle || isPlayPauseBtn || isStopBtn) return;
                if (!isDragging) setOpen();
            }}
            onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && onSelect) onSelect(); }}
            {...attributes}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-grow min-w-0">
                    <button
                        {...listeners}
                        data-drag-handle
                        className={`cursor-grab p-1 rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground`}
                        aria-label="Drag to reorder"
                        style={{ touchAction: 'none', color: isActive ? iconColor : undefined }}
                    >
                        <GripVertical size={18} className="shrink-0" />
                    </button>
                    {timerDisplay}
                    <span className="ml-4 font-medium truncate flex-grow">
                        {q.question}
                    </span>
                </div>
                <div className="flex items-center gap-0">
                    <button
                        data-play-pause-btn
                        className={`p-1 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors duration-150 ${isActive ? '' : 'text-muted-foreground'}`}
                        onClick={effectiveIsRunning ? handlePauseClick : onPlay} // Use effectiveIsRunning
                        aria-label={effectiveIsRunning ? "Pause Question" : "Play Question"}
                    >
                        {effectiveIsRunning ? ( // Use effectiveIsRunning
                            <Pause size={20} style={{ color: iconColor }} /> // Adjusted size to match Play
                        ) : (
                            <Play size={20} style={{ color: iconColor }} />
                        )}
                    </button>
                    <button
                        data-stop-btn
                        className="p-1 rounded-full hover:bg-alert hover:text-alert-foreground transition-colors duration-150"
                        onClick={onStop}
                        aria-label="Stop Question"
                    >
                        <Square size={20} style={{ color: iconColor }} />
                    </button>
                </div>
            </div>
            {open && (
                <ul className="ml-8 mt-2 list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    {Array.isArray(q.reponses) && q.reponses.length > 0
                        ? q.reponses.map((r, i) => (
                            <li key={i} className={r.correct ? "text-green-600 dark:text-green-500 font-medium" : ""}>
                                {r.texte} {r.correct && <span className="ml-2 text-xs font-normal text-green-700 dark:text-green-600">(bonne réponse)</span>}
                            </li>
                        ))
                        : <li className="italic">Aucune réponse définie</li>}
                </ul>
            )}
        </li>
    );
}
