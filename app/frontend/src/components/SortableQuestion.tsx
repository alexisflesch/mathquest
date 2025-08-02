// import { timerConversions } from "@/utils"; // Removed: use only canonical ms-based timer utilities
import React, { useState, useEffect, useRef, useMemo } from "react"; // Ajout de useEffect, useRef, useMemo
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, X } from 'lucide-react';
import type { Question } from '@shared/types/core/question';
import type { AnswerStats } from '@shared/types/core/answer';
import { createLogger } from '@/clientLogger';
import { formatTime } from "@/utils";
import MathJaxWrapper from '@/components/MathJaxWrapper';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import QuestionDisplay from "@/components/QuestionDisplay"; // Import du nouveau composant
import { TimerField } from './TimerDisplayAndEdit';

const logger = createLogger('SortableQuestion');

// --- Types ---
export interface SortableQuestionProps {
    q: Question;
    quizId: string;
    currentTournamentCode: string;
    isActive?: boolean;
    open: boolean;
    setOpen: () => void;
    onPlay: (uid: string, timeMs: number) => void; // timeMs in milliseconds per documentation
    onPause: () => void;
    onStop?: () => void;
    onEditTimer: (newTime: number) => void; // Callback parent pour la validation de l'édition
    liveTimeLeft?: number;
    liveStatus?: 'run' | 'pause' | 'stop';
    onImmediateUpdateActiveTimer?: (newTime: number) => void; // Gardé pour la synchro active
    disabled?: boolean;
    stats?: { type: 'multipleChoice'; data: number[] } | { type: 'numeric'; data: number[] }; // Accepts stats for per-question display
    durationMs: number; // Canonical duration from parent
    onResume?: (uid: string) => void;
    // Modernization: allow extra className for question state
    className?: string;
    // NEW: Control behavior props
    hideExplanation?: boolean; // Hide explanation/justification section
    keepTitleWhenExpanded?: boolean; // Keep title visible when expanded (only hide fake titles)
}

// --- arePropsEqual reste inchangé ---
const arePropsEqual = (prevProps: SortableQuestionProps, nextProps: SortableQuestionProps) => {
    // Only track changes without detailed logging
    if (prevProps.isActive !== nextProps.isActive) return false;
    if (prevProps.open !== nextProps.open) return false;
    if (prevProps.disabled !== nextProps.disabled) return false;
    // if (prevProps.idx !== nextProps.idx) return false;

    // For live timer props
    if (prevProps.isActive || nextProps.isActive) {
        if (prevProps.liveTimeLeft !== nextProps.liveTimeLeft) return false;
        if (prevProps.liveStatus !== nextProps.liveStatus) return false;
    }

    // For question object
    if (prevProps.q.uid !== nextProps.q.uid) return false;
    // Comparaison plus précise pour l'objet question si nécessaire
    if (JSON.stringify(prevProps.q) !== JSON.stringify(nextProps.q)) return false;

    // For function references
    if (prevProps.setOpen !== nextProps.setOpen) return false;
    if (prevProps.onPlay !== nextProps.onPlay) return false;
    if (prevProps.onPause !== nextProps.onPause) return false;
    if (prevProps.onStop !== nextProps.onStop) return false;
    // if (prevProps.onSelect !== nextProps.onSelect) return false;
    if (prevProps.onEditTimer !== nextProps.onEditTimer) return false;
    if (prevProps.onImmediateUpdateActiveTimer !== nextProps.onImmediateUpdateActiveTimer) return false;

    return true;
};


// --- Component ---
export const SortableQuestion = React.memo(({ q, quizId, currentTournamentCode, isActive, open, setOpen, onPlay, onPause, onStop, onEditTimer, liveTimeLeft, liveStatus, onImmediateUpdateActiveTimer, disabled, stats, durationMs, className, hideExplanation, keepTitleWhenExpanded }: SortableQuestionProps) => {
    // ...existing code...

    // ...existing code...
    // Place debug logging effect after all timer-related state/vars are declared and initialized
    // This must be after all useState/useMemo declarations
    // (Move this block to after all timer-related state/vars, e.g. after displayedTimeLeft is declared)
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: String(q.uid)
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
        opacity: isDragging ? 0.7 : 1,
        touchAction: 'none', // Important pour dnd-kit
    };

    // --- États et Refs pour l'édition du timer (conservés ici) ---
    // SUPPRESSION de localTimeLeftMs pour l'affichage du timer (utilise liveTimeLeft)
    const [editingTimer, setEditingTimer] = useState(false);
    const [editTimerValue, setEditTimerValue] = useState<string>("");
    const timerInputRef = useRef<HTMLInputElement>(null);
    const inputWrapperRef = useRef<HTMLSpanElement>(null);

    // État local pour stocker la valeur modifiée en attente de synchronisation
    const [pendingTimeValue, setPendingTimeValue] = useState<number | null>(null);

    // --- Timer fallback logic ---
    // Store paused values per UID
    const [pausedTimeLeftByUid, setPausedTimeLeftByUid] = useState<Record<string, number>>({});

    // Optimize timer state tracking to reduce excessive effects
    useEffect(() => {
        if (isActive && liveStatus === 'pause' && typeof liveTimeLeft === 'number') {
            setPausedTimeLeftByUid(prev => {
                if (prev[q.uid] !== liveTimeLeft) {
                    return { ...prev, [q.uid]: liveTimeLeft };
                }
                return prev;
            });
        } else if (isActive && liveStatus === 'stop') {
            setPausedTimeLeftByUid(prev => {
                if (q.uid in prev) {
                    const newValues = { ...prev };
                    delete newValues[q.uid];
                    logger.debug(`[Timer Display] Cleared paused timer value for ${q.uid} after stop action`);
                    return newValues;
                }
                return prev;
            });
        }
    }, [isActive, liveStatus, liveTimeLeft, q.uid]);

    // Effect to store original time when stopping a question for later restoration
    useEffect(() => {
        if (isActive && liveStatus === 'stop') {
            logger.debug(`[Timer Display] Question ${q.uid} was stopped. Original durationMs ${durationMs}ms is preserved for future restoration`, {
                q_uid: q.uid,
                durationMs
            });
        }
    }, [isActive, liveStatus, durationMs, q.uid]);

    // Always provide a valid ms value for TimerField
    // For active questions, use liveTimeLeft if available, else durationMs
    // For inactive questions, always use durationMs (canonical from question)
    const displayedTimeLeft = React.useMemo(() => {
        if (isActive) {
            // If stopped and liveTimeLeft is 0, show durationMs instead
            if (liveStatus === 'stop' && (typeof liveTimeLeft !== 'number' || liveTimeLeft === 0)) {
                logger.info('[Timer Display] Using durationMs for stopped active question', { q_uid: q.uid, durationMs, liveTimeLeft, liveStatus });
                return durationMs ?? 0;
            }
            if (typeof liveTimeLeft === 'number') {
                logger.info('[Timer Display] Using liveTimeLeft for active question', { q_uid: q.uid, liveTimeLeft, durationMs, liveStatus });
                return liveTimeLeft;
            }
            logger.info('[Timer Display] Fallback to durationMs for active question', { q_uid: q.uid, durationMs, liveTimeLeft, liveStatus });
            return durationMs ?? 0;
        }
        // Inactive: always use canonical durationMs
        logger.info('[Timer Display] Inactive question, using durationMs', { q_uid: q.uid, durationMs });
        return durationMs ?? 0;
    }, [isActive, liveTimeLeft, durationMs, liveStatus, q.uid]);

    // Debug log for timer state after stop
    React.useEffect(() => {
        if (isActive && liveStatus === 'stop') {
            // eslint-disable-next-line no-console
            console.log('[DEBUG][SortableQuestion] After stop:', {
                q_uid: q.uid,
                durationMs,
                liveTimeLeft,
                liveStatus,
                displayedTimeLeft
            });
        }
    }, [isActive, liveStatus, liveTimeLeft, durationMs, displayedTimeLeft, q.uid]);

    // Clear pendingTimeValue when backend confirms the update - moved to useEffect
    useEffect(() => {
        if (pendingTimeValue !== null && liveTimeLeft === pendingTimeValue) {
            setPendingTimeValue(null);
        }
    }, [pendingTimeValue, liveTimeLeft]);

    // --- Effets (conservés ici pour la synchro et l'édition) ---
    // Effet pour synchroniser localTimeLeftMs avec liveTimeLeft (si active) ou durationMs
    useEffect(() => {
        if (editingTimer) {
            return;
        }

        if (isActive && typeof liveTimeLeft === 'number') {
            const newValue = String(Math.ceil(liveTimeLeft / 1000));
            if (editTimerValue !== newValue) {
                setEditTimerValue(newValue);
            }
        } else if (!isActive && typeof durationMs === 'number') {
            const newValue = String(Math.ceil(durationMs / 1000));
            if (editTimerValue !== newValue) {
                setEditTimerValue(newValue);
            }
        }
    }, [isActive, liveTimeLeft, durationMs, q.uid, editingTimer]);

    // Effet pour la molette sur l'input d'édition
    useEffect(() => {
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

    // Effet pour focus et initialiser l'input d'édition
    useEffect(() => {
        if (editingTimer) {
            // Convert milliseconds to seconds for display in edit input
            const initialValue = liveTimeLeft !== undefined && liveTimeLeft !== null
                ? Math.ceil(liveTimeLeft / 1000)
                : Math.ceil((durationMs ?? 0) / 1000);
            setEditTimerValue(String(initialValue));
            setTimeout(() => timerInputRef.current?.focus(), 0);
        }
    }, [editingTimer, liveTimeLeft, durationMs]); // Using canonical durationMs for consistency

    // Remove duplicate useEffect that was already handled above

    // Refine logging for timer updates - remove displayedTimeLeft from dependencies
    // useEffect(() => {
    //     if (isActive && liveTimeLeft !== undefined && liveTimeLeft !== null) {
    //         logger.info(`Question ${q.uid}: Timer updated to ${liveTimeLeft}ms`);
    //     }
    // }, [isActive, liveTimeLeft, q.uid]); // Removed displayedTimeLeft dependency

    // --- Handlers (conservés ici) ---
    const pauseHandler = () => { onPause(); }; // Simple wrapper

    // Define the missing handleEditTimerRequest function
    const editTimerRequestHandler = () => {
        logger.debug(`Edit timer requested for question ${q.uid}`);
        setEditingTimer(true);
    };

    // Handlers pour VALIDER ou ANNULER l'édition
    const cancelEditHandler = (e: React.MouseEvent | React.KeyboardEvent<HTMLInputElement>) => {
        e.stopPropagation();
        setEditingTimer(false);
    };

    // Timer state and socket connection should be managed by parent component
    // This component now only handles local UI state for editing, etc.

    // Simplified validateEditHandler to remove subscribeToTimerUpdate logic
    const validateEditHandler = (e: React.MouseEvent | React.KeyboardEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const newTime = parseInt(editTimerValue, 10);

        logger.debug(`validateEditHandler triggered for question ${q.uid}`);
        logger.debug(`Current editTimerValue: ${editTimerValue}`);

        if (!isNaN(newTime) && newTime >= 0) {
            logger.info(`Validating timer edit for question ${q.uid}: ${newTime}s`);
            const ms = newTime * 1000;
            console.debug('[SortableQuestion] validateEditHandler: onEditTimer called with', ms, 'ms');
            onEditTimer(ms);
            setPendingTimeValue(ms);
            logger.debug(`Pending time value set to ${ms}ms for question ${q.uid}`);
            setEditingTimer(false);
            logger.debug(`Editing mode closed for question ${q.uid}`);
        } else {
            logger.error(`Invalid timer value entered for question ${q.uid}: ${editTimerValue}`);
        }
    };

    // Handler for PLAY (keep in milliseconds as per documentation)
    const handlePlayWithCurrentTime = () => {
        logger.debug('SortableQuestion handlePlayWithCurrentTime - Question UID:', q.uid);
        logger.debug('SortableQuestion handlePlayWithCurrentTime - isActive:', isActive);
        logger.debug('SortableQuestion handlePlayWithCurrentTime - liveStatus:', liveStatus);

        // Canonical: Always use the latest durationMs after an edit (teacher's intent)
        // If the timer is paused, but durationMs has changed since pause, use durationMs
        let timeToUse: number;
        if (isActive && liveStatus === 'pause') {
            // If the canonical durationMs differs from the paused value, use durationMs (edit happened while paused)
            const pausedValue = pausedTimeLeftByUid[q.uid];
            if (typeof pausedValue === 'number' && durationMs !== pausedValue) {
                logger.info('[SortableQuestion] Timer was edited while paused. Using new durationMs.', { q_uid: q.uid, durationMs, pausedValue });
                timeToUse = durationMs ?? 0;
            } else {
                timeToUse = pausedValue ?? durationMs ?? 0;
            }
        } else {
            timeToUse = durationMs ?? 0;
        }
        console.debug('[SortableQuestion] handlePlayWithCurrentTime: onPlay called with', timeToUse, 'ms');
        onPlay(q.uid, timeToUse);
    };

    // --- Rendu ---

    // Helper to map canonical Question to legacy shape for QuestionDisplay
    function toLegacyQuestionShape(q: any) {
        // Handle nested question structure from API
        const questionData = q.question || q;

        // Use answerOptions and correctAnswers from the nested question or the root
        const answerOptions = questionData.answerOptions || q.answerOptions || [];
        const correctAnswers = questionData.correctAnswers || q.correctAnswers || [];

        const result = {
            ...q,
            uid: questionData.uid || q.uid,
            text: questionData.text || q.text,
            answers: Array.isArray(answerOptions) ? answerOptions.map((text: string, i: number) => ({
                text,
                correct: correctAnswers?.[i] || false
            })) : [],
            timeLimitSeconds: Math.ceil((durationMs ?? 0) / 1000), // Use canonical durationMs in seconds
        };

        return result;
    }

    // Helper to format seconds as mm:ss
    function formatTime(ms: number) {
        const totalSeconds = Math.max(0, Math.floor(ms / 1000));
        const mm = Math.floor(totalSeconds / 60);
        const ss = totalSeconds % 60;
        return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
    }

    // JSX pour l'input d'édition (rendu conditionnellement)
    const timerEditInput = editingTimer ? (
        <div className="relative">
            <QuestionDisplay
                className={`question-dashboard opacity-40 pointer-events-none select-none ${className ?? ''}`}
                question={toLegacyQuestionShape(q)}
                isOpen={open}
                onToggleOpen={setOpen}
                timerStatus={(isActive ? liveStatus : 'stop') ?? 'stop'}
                timeLeftMs={displayedTimeLeft}
                onPlay={handlePlayWithCurrentTime}
                onPause={pauseHandler}
                onStop={onStop}
                isActive={isActive}
                disabled={true}
            />
            <div className="absolute left-0 top-0 w-full h-full flex items-center justify-center z-20">
                <TimerField
                    valueMs={(parseInt(editTimerValue, 10) || 0) * 1000}
                    onChange={(newValueMs) => {
                        console.debug('[SortableQuestion] TimerField onChange called with', newValueMs, 'ms');
                        if (!isNaN(newValueMs) && newValueMs >= 0) {
                            onEditTimer(newValueMs); // propagate up in ms, triggers backend
                            setEditingTimer(false); // close edit mode, just like play/pause
                        }
                    }}
                />
            </div>
        </div>
    ) : null;

    // JSX pour afficher les réponses pendant l'édition
    const answersWhileEditing = editingTimer && open ? (
        <div className="transition-all duration-300 ease-in-out overflow-hidden max-h-[500px] opacity-100">
            <ul className={`ml-0 mt-0 flex flex-col gap-2 answers-list p-3 rounded-b-xl rounded-t-none no-top-border ${isActive ? "answers-selected" : ""}`} style={{ borderTop: '1px solid var(--border-color)' }}>
                <li className="mb-2 font-medium text-base text-couleur-global-neutral-700">
                    <MathJaxWrapper>{q.text}</MathJaxWrapper>
                </li>
                {Array.isArray(q.answerOptions) && q.answerOptions.length > 0
                    ? q.answerOptions.map((text, idx) => (
                        <li key={idx} className="flex gap-2 ml-4 mb-1" style={{ listStyle: 'none', alignItems: 'flex-start' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'flex-start', height: '18px', minWidth: '18px' }}>
                                {q.correctAnswers && q.correctAnswers[idx] ? <Check size={18} strokeWidth={3} className="text-primary mt-1" style={{ display: 'block' }} /> : <X size={18} strokeWidth={3} className="text-secondary mt-1" style={{ display: 'block' }} />}
                            </span>
                            <MathJaxWrapper><span style={{ lineHeight: '1.5' }}>{text}</span></MathJaxWrapper>
                        </li>
                    ))
                    : <li className="italic text-muted-foreground">Aucune réponse définie</li>}
                {q.explanation && (
                    <div className="mt-4 pt-2 border-t border-base-300 text-sm text-base-content/70">
                        <span className="font-semibold">Explication :</span> {q.explanation}
                    </div>
                )}
            </ul>
        </div>
    ) : null;


    return (
        <li
            ref={setNodeRef}
            style={style}
            className={`flex flex-row items-start select-none transition-all duration-150 ease-in-out${isDragging ? ' opacity-70' : ''}${disabled ? ' opacity-50 pointer-events-none' : ''}`}
            {...attributes} // Attributs pour dnd-kit
        >
            < div className="flex-1 min-w-0"> {/* Assure que le contenu peut rétrécir */}
                {editingTimer ? (
                    // Affiche l'input d'édition à la place du header normal
                    timerEditInput
                ) : (
                    // Affiche le composant QuestionDisplay normal
                    <QuestionDisplay
                        className={className}
                        question={toLegacyQuestionShape(q)}
                        isOpen={open}
                        onToggleOpen={setOpen}
                        timerStatus={(isActive ? liveStatus : 'stop') ?? 'stop'}
                        timeLeftMs={displayedTimeLeft}
                        onPlay={handlePlayWithCurrentTime}
                        onPause={pauseHandler}
                        onStop={onStop}
                        isActive={isActive}
                        disabled={disabled}
                        onEditTimer={onEditTimer} // Pass down for test button
                        showSet44sButton={false} // Only set true in teacher dashboard context
                        stats={stats}
                        hideExplanation={hideExplanation}
                        keepTitleWhenExpanded={keepTitleWhenExpanded}
                    />
                )}
                {/* Affiche les réponses si en mode édition ET si elles sont ouvertes */}
                {answersWhileEditing}
            </div>
        </li >
    );
}, arePropsEqual);

SortableQuestion.displayName = 'SortableQuestion'; // Pour le débogage

// Export the memoized component to prevent unnecessary re-renders
export default SortableQuestion;
