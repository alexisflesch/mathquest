import { timerConversions } from "@/utils";
import React, { useState, useEffect, useRef, useMemo } from "react"; // Ajout de useEffect, useRef, useMemo
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, X } from 'lucide-react';
import type { Question } from "@/types/api";
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
    liveStatus?: 'play' | 'pause' | 'stop';
    onImmediateUpdateActiveTimer?: (newTime: number) => void; // Gardé pour la synchro active
    disabled?: boolean;
    stats?: number[]; // Accepts number[] for per-question stats bar
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
export const SortableQuestion = React.memo(({ q, quizId, currentTournamentCode, isActive, open, setOpen, onPlay, onPause, onStop, onEditTimer, liveTimeLeft, liveStatus, onImmediateUpdateActiveTimer, disabled, stats }: SortableQuestionProps) => {
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
                // Only update if the value actually changed
                if (prev[q.uid] !== liveTimeLeft) {
                    return { ...prev, [q.uid]: liveTimeLeft };
                }
                return prev;
            });
        } else if (isActive && liveStatus === 'stop') {
            // Clear any paused timer value for this question when stop is clicked
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
    }, [isActive, liveStatus, liveTimeLeft, q.uid]); // Combine related effects

    // Effect to store original time when stopping a question for later restoration
    useEffect(() => {
        // When a question gets stopped, store its original time for later restoration
        if (isActive && liveStatus === 'stop') {
            // When a question is stopped, remember its original time
            const originalTime = liveTimeLeft && liveTimeLeft > 0 ? liveTimeLeft : q.timeLimit;
            logger.debug(`[Timer Display] Question ${q.uid} was stopped. Original time ${originalTime}s is preserved for future restoration`);
            // The initialTime storage is handled in useTeacherQuizSocket.ts
        }
    }, [isActive, liveStatus, liveTimeLeft, q.timeLimit, q.uid]);

    // Optimize displayedTimeLeft logic - use useMemo to prevent recalculation
    const displayedTimeLeft = React.useMemo(() => {
        if (isActive) {
            if (liveStatus === 'stop') {
                // When stopped, always show the original question time (already in ms from backend)
                return q.timeLimit ?? 0;
            } else if (liveStatus === 'pause' || liveStatus === 'play') {
                // For pause/play, use liveTimeLeft from backend, fallback to original time
                return liveTimeLeft ?? (q.timeLimit ?? 0);
            } else {
                return q.timeLimit ?? 0;
            }
        } else {
            return q.timeLimit ?? 0;
        }
    }, [isActive, liveStatus, liveTimeLeft, q.timeLimit]);

    // Clear pendingTimeValue when backend confirms the update - moved to useEffect
    useEffect(() => {
        if (pendingTimeValue !== null && liveTimeLeft === pendingTimeValue) {
            setPendingTimeValue(null);
        }
    }, [pendingTimeValue, liveTimeLeft]);

    // --- Effets (conservés ici pour la synchro et l'édition) ---
    // Effet pour synchroniser localTimeLeftMs avec liveTimeLeft (si active) ou q.time
    useEffect(() => {
        // Ne pas synchroniser pendant l'édition du timer pour éviter de réinitialiser
        // la valeur que l'utilisateur est en train de modifier
        if (editingTimer) {
            return;
        }

        if (isActive && typeof liveTimeLeft === 'number') {
            // Removed excessive debug logging - only log critical changes
            const newValue = String(Math.ceil(liveTimeLeft / 1000));
            if (editTimerValue !== newValue) {
                setEditTimerValue(newValue);
            }
        } else if (!isActive && q.timeLimit !== undefined) {
            // Removed excessive debug logging - only log critical changes
            if (editTimerValue !== String(q.timeLimit)) {
                setEditTimerValue(String(q.timeLimit));
            }
        }
    }, [isActive, liveTimeLeft, q.timeLimit, q.uid, editingTimer]); // Remove editTimerValue from deps

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
                : Math.ceil((q.timeLimit ?? 0) / 1000); // q.timeLimit is already in ms from backend
            setEditTimerValue(String(initialValue));
            setTimeout(() => timerInputRef.current?.focus(), 0);
        }
    }, [editingTimer, liveTimeLeft, q.timeLimit]); // Using q.timeLimit for consistency

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

            // onEditTimer expects seconds (user input), not milliseconds
            onEditTimer(newTime);

            // Wait for backend confirmation before clearing pendingTimeValue
            // Convert to milliseconds for internal tracking since liveTimeLeft is in ms
            setPendingTimeValue(newTime * 1000);

            logger.debug(`Pending time value set to ${newTime * 1000}ms for question ${q.uid}`);

            // Close the edit mode
            setEditingTimer(false);
            logger.debug(`Editing mode closed for question ${q.uid}`);

            // Do NOT trigger play/resume here. Timer should remain paused or stopped.
        } else {
            logger.error(`Invalid timer value entered for question ${q.uid}: ${editTimerValue}`);
        }
    };

    // Handler for PLAY (keep in milliseconds as per documentation)
    const handlePlayWithCurrentTime = () => {
        logger.debug('SortableQuestion handlePlayWithCurrentTime - Question UID:', q.uid);
        logger.debug('SortableQuestion handlePlayWithCurrentTime - isActive:', isActive);
        logger.debug('SortableQuestion handlePlayWithCurrentTime - liveStatus:', liveStatus);

        // Always use full duration for non-active questions to ensure proper "new question" detection
        // Only use remaining time if this is the currently active question and it's paused
        const timeToUse = (isActive && liveStatus === 'pause')
            ? displayedTimeLeft  // Use remaining time for paused current question
            : (q.timeLimit ?? 0);  // Use full duration for new questions (already in ms from backend)

        logger.debug('SortableQuestion handlePlayWithCurrentTime - timeToUse (ms):', timeToUse);

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
            timeLimitSeconds: q.timeLimit || questionData.timeLimit, // Use explicit unit suffix from BaseQuestion
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
                className="question-dashboard opacity-40 pointer-events-none select-none"
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
                    value={formatTime((parseInt(editTimerValue, 10) || 0) * 1000)}
                    onChange={(formatted) => {
                        // formatted is mm:ss, convert to seconds
                        const [mm, ss] = formatted.split(":");
                        const newTime = parseInt(mm, 10) * 60 + parseInt(ss, 10);
                        if (!isNaN(newTime) && newTime >= 0) {
                            onEditTimer(newTime); // propagate up, triggers backend
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
                        className="question-dashboard"
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
                        showSet44sButton={true} // Only set true in teacher dashboard context
                        stats={stats}
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
