import React, { useState } from "react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, X, Pencil, Play, GripVertical, Pause, Square } from 'lucide-react';
import type { Question, QuizState } from "../types"; // Adjust path if necessary
import { createLogger } from '@/clientLogger';
import { formatTime } from "@/utils"; // Import from utils
import MathJaxWrapper from '@/components/MathJaxWrapper';

const logger = createLogger('SortableQuestion');

// --- Types ---
export interface SortableQuestionProps {
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
    onImmediateUpdateActiveTimer?: (newTime: number) => void;
    disabled?: boolean;
}

// Custom comparison function for React.memo to prevent unnecessary re-renders
const arePropsEqual = (prevProps: SortableQuestionProps, nextProps: SortableQuestionProps) => {
    // Only track changes without detailed logging
    if (prevProps.isActive !== nextProps.isActive) return false;
    if (prevProps.open !== nextProps.open) return false;
    if (prevProps.disabled !== nextProps.disabled) return false;
    if (prevProps.idx !== nextProps.idx) return false;

    // For live timer props
    if (prevProps.isActive || nextProps.isActive) {
        if (prevProps.liveTimeLeft !== nextProps.liveTimeLeft) return false;
        if (prevProps.liveStatus !== nextProps.liveStatus) return false;
    }

    // For question object
    if (prevProps.q.uid !== nextProps.q.uid) return false;
    if (prevProps.q.question !== nextProps.q.question) return false;
    if (prevProps.q.temps !== nextProps.q.temps) return false;

    // For function references
    if (prevProps.setOpen !== nextProps.setOpen) return false;
    if (prevProps.onPlay !== nextProps.onPlay) return false;
    if (prevProps.onPause !== nextProps.onPause) return false;
    if (prevProps.onStop !== nextProps.onStop) return false;
    if (prevProps.onSelect !== nextProps.onSelect) return false;
    if (prevProps.onEditTimer !== nextProps.onEditTimer) return false;
    if (prevProps.onImmediateUpdateActiveTimer !== nextProps.onImmediateUpdateActiveTimer) return false;

    return true;
};

// --- Component ---
// Use React.memo without all the fancy optimizations
export const SortableQuestion = React.memo(({ q, isActive, isRunning, open, setOpen, onPlay, onPause, onStop, onSelect, onEditTimer, liveTimeLeft, liveStatus, onImmediateUpdateActiveTimer, disabled }: SortableQuestionProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: String(q.uid)
    });

    // Regular style object, no useMemo
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
        opacity: isDragging ? 0.7 : 1,
        touchAction: 'none',
    };

    const [localTimeLeft, setLocalTimeLeft] = useState<number | null>(q.temps ?? null);
    const [editingTimer, setEditingTimer] = useState(false);
    const [editTimerValue, setEditTimerValue] = useState<string>("");
    const timerInputRef = React.useRef<HTMLInputElement>(null);
    const inputWrapperRef = React.useRef<HTMLSpanElement>(null);

    // Replace the two competing effects with a single, clearer synchronization effect
    React.useEffect(() => {
        if (isActive && typeof liveTimeLeft === 'number') {
            // For active questions, always use the live timer value from the parent
            setLocalTimeLeft(liveTimeLeft);
            // Log this synchronization
            logger.debug(`Syncing active question timer: localTimeLeft <- liveTimeLeft (${liveTimeLeft})`);
        } else if (q.temps !== undefined) {
            // For inactive questions, always use q.temps (which reflects edits)
            setLocalTimeLeft(q.temps);
            // Only log this when q.temps changes to avoid spam
            logger.debug(`Syncing inactive question timer: localTimeLeft <- q.temps (${q.temps})`);
        }
    }, [isActive, liveTimeLeft, q.temps]);

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

    const iconColor = isActive ? 'var(--primary-foreground)' : '';

    // Determine the effective running state: prioritize liveStatus if active, otherwise use isRunning from quizState
    const effectiveIsRunning = isActive && liveStatus ? liveStatus === 'play' : (isRunning ?? false);

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

            // Update internal state immediately
            setLocalTimeLeft(newTime);

            // Call the parent's edit handler
            onEditTimer(newTime);
            logger.info(`Timer for question ${q.uid} updated to ${newTime}s`);

            // Immediately update parent state if this is the active question
            if (isActive && onImmediateUpdateActiveTimer) {
                logger.debug(`Immediately updating parent localTimeLeft for active question ${q.uid} to ${newTime}s`);
                onImmediateUpdateActiveTimer(newTime);
            }
        }
        setEditingTimer(false);
    };

    // Custom play handler that sends the most current timer value
    const handlePlayWithCurrentTime = () => {
        // Always use the most current value from our local state
        const currentTimer = localTimeLeft !== null ? localTimeLeft : q.temps;

        logger.info(`Playing question ${q.uid} with current timer value: ${currentTimer}s`);

        // Create a custom event with the timer value attached
        // This is a cleaner way to communicate between components than DOM attributes
        window.localStorage.setItem(`question_timer_${q.uid}`, String(currentTimer));

        // Then call the onPlay handler from props
        if (onPlay) onPlay();
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
        // Plain timer display without useMemo
        let timerText = '-';

        if (isActive && typeof liveTimeLeft === 'number') {
            timerText = formatTime(liveTimeLeft);

            // Reduce logging frequency for performance
            if (liveTimeLeft % 1 === 0) {
                logger.debug(`Showing liveTimeLeft for active question: ${liveTimeLeft}s`);
            }
        } else if (localTimeLeft !== null) {
            timerText = formatTime(localTimeLeft);
        } else if (typeof q.temps === 'number') {
            timerText = formatTime(q.temps);
        }

        timerDisplay = (
            <span className="flex items-center gap-1">
                <span
                    className="font-mono text-lg px-2 py-1 rounded bg-muted text-muted-foreground min-w-[60px] text-center select-none"
                    title="Temps de la question"
                >
                    {timerText}
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
            style={style}
            className={`flex flex-col gap-0 select-none transition-all duration-150 ease-in-out ${isDragging ? 'opacity-70' : ''} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
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
            <div
                className={`card flex items-center justify-between gap-3${isActive ? ' question-selected' : ''}${open ? ' no-bottom-border no-bottom-radius' : ''}`}
                style={{ color: 'var(--foreground)' }}
            >
                <div className="flex items-center gap-3 flex-grow min-w-0">
                    <button
                        {...listeners}
                        data-drag-handle
                        className={`cursor-grab p-1 rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground ${disabled ? 'cursor-not-allowed' : ''}`}
                        aria-label="Drag to reorder"
                        style={{ touchAction: 'none' }}
                        disabled={disabled}
                    >
                        <GripVertical size={18} className="shrink-0" />
                    </button>
                    {timerDisplay}
                    <div className="ml-4 font-medium flex-grow fade-right-bottom-crop">
                        <MathJaxWrapper>
                            {q.titre ? q.titre : q.question}
                        </MathJaxWrapper>
                    </div>
                </div>
                <div className="flex items-center gap-0">
                    <button
                        data-play-pause-btn
                        className={`p-1 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors duration-150 ${isActive ? '' : 'text-muted-foreground'}`}
                        onClick={effectiveIsRunning ? handlePauseClick : handlePlayWithCurrentTime}
                        aria-label={effectiveIsRunning ? "Pause Question" : "Play Question"}
                        disabled={disabled}
                    >
                        {effectiveIsRunning ? (
                            <Pause size={20} />
                        ) : (
                            <Play size={20} />
                        )}
                    </button>
                    <button
                        data-stop-btn
                        className="p-1 rounded-full hover:bg-alert hover:text-alert-foreground transition-colors duration-150"
                        onClick={onStop}
                        aria-label="Stop Question"
                        disabled={disabled || (!effectiveIsRunning && (!isActive || liveStatus !== 'pause'))}
                    >
                        <Square size={20} />
                    </button>
                </div>
            </div>
            {open && (
                <ul
                    className={[
                        "ml-0 mt-0 flex flex-col gap-2 answers-list p-3 rounded-b-xl rounded-t-none",
                        isActive ? "answers-selected" : "",
                        open ? "no-top-border" : ""
                    ].join(" ")}
                >
                    <li className="mb-2 font-medium text-base text-couleur-global-neutral-700">
                        <MathJaxWrapper>{q.question}</MathJaxWrapper>
                    </li>
                    {Array.isArray(q.reponses) && q.reponses.length > 0
                        ? q.reponses.map((r, idx) => (
                            <li key={idx} className="flex gap-2 ml-4 mb-1" style={{ listStyle: 'none', alignItems: 'flex-start' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'flex-start', height: '18px', minWidth: '18px' }}>
                                    {r.correct ? (
                                        <Check size={18} strokeWidth={3} className="text-primary mt-1" style={{ display: 'block' }} />
                                    ) : (
                                        <X size={18} strokeWidth={3} className="text-secondary mt-1" style={{ display: 'block' }} />
                                    )}
                                </span>
                                <MathJaxWrapper>
                                    <span style={{ lineHeight: '1.5' }}>{r.texte}</span>
                                </MathJaxWrapper>
                            </li>
                        ))
                        : <li className="italic text-muted-foreground">Aucune réponse définie</li>}
                </ul>
            )}
        </li>
    );
}, arePropsEqual);

// Add a display name for better debugging
SortableQuestion.displayName = 'SortableQuestion';
