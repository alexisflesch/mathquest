import React, { useState, useEffect, useRef } from "react"; // Ajout de useEffect, useRef
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, X, GripVertical } from 'lucide-react';
import type { Question, QuizState } from "../types";
import { createLogger } from '@/clientLogger';
import { formatTime } from "@/utils";
import MathJaxWrapper from '@/components/MathJaxWrapper';
import QuestionDisplay from "@/components/QuestionDisplay"; // Import du nouveau composant
import { useTeacherQuizSocket } from '@/hooks/useTeacherQuizSocket';

const logger = createLogger('SortableQuestion');

// --- Types ---
export interface SortableQuestionProps {
    q: Question;
    quizId: string;
    currentTournamentCode: string;
    // idx: number;
    isActive?: boolean;
    // isRunning?: boolean; // Gardé pour la logique interne si besoin
    quizState?: QuizState | null; // Gardé pour la logique interne si besoin
    open: boolean;
    setOpen: () => void;
    onPlay: (uid: string, time: number) => void;
    onPause: () => void;
    onStop?: () => void;
    // onSelect: () => void; // Gardé pour la sélection via clic/touche
    onEditTimer: (newTime: number) => void; // Callback parent pour la validation de l'édition
    liveTimeLeft?: number;
    liveStatus?: 'play' | 'pause' | 'stop';
    onImmediateUpdateActiveTimer?: (newTime: number) => void; // Gardé pour la synchro active
    disabled?: boolean;
    onShowResults?: () => void;
    showResultsDisabled?: boolean;
    onStatsToggle?: (show: boolean) => void;
    stats?: number[]; // Pass answer stats to QuestionDisplay
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
export const SortableQuestion = React.memo(({ q, quizId, currentTournamentCode, /* idx, */ isActive, /* isRunning, */ open, setOpen, onPlay, onPause, onStop, onEditTimer, liveTimeLeft, liveStatus, onImmediateUpdateActiveTimer, disabled, onShowResults, showResultsDisabled, onStatsToggle, stats }: SortableQuestionProps) => {
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
    // SUPPRESSION de localTimeLeft pour l'affichage du timer (utilise liveTimeLeft)
    const [editingTimer, setEditingTimer] = useState(false);
    const [editTimerValue, setEditTimerValue] = useState<string>("");
    const timerInputRef = useRef<HTMLInputElement>(null);
    const inputWrapperRef = useRef<HTMLSpanElement>(null);

    // État local pour stocker la valeur modifiée en attente de synchronisation
    const [pendingTimeValue, setPendingTimeValue] = useState<number | null>(null);

    // --- Timer fallback logic ---
    // Store paused values per UID
    const [pausedTimeLeftByUid, setPausedTimeLeftByUid] = useState<Record<string, number>>({});

    // Track the last paused value for each question UID
    useEffect(() => {
        if (isActive && liveStatus === 'pause' && typeof liveTimeLeft === 'number') {
            setPausedTimeLeftByUid(prev => ({ ...prev, [q.uid]: liveTimeLeft }));
        }
    }, [isActive, liveStatus, liveTimeLeft, q.uid]);

    // Effect to clear paused timer values when stop action is detected
    useEffect(() => {
        if (isActive && liveStatus === 'stop') {
            // Clear any paused timer value for this question when stop is clicked
            setPausedTimeLeftByUid(prev => {
                const newValues = { ...prev };
                delete newValues[q.uid];
                logger.debug(`[Timer Display] Cleared paused timer value for ${q.uid} after stop action`);
                return newValues;
            });
        }
    }, [isActive, liveStatus, q.uid]);

    // Effect to store original time when stopping a question for later restoration
    useEffect(() => {
        // When a question gets stopped, store its original time for later restoration
        if (isActive && liveStatus === 'stop') {
            // When a question is stopped, remember its original time
            const originalTime = liveTimeLeft && liveTimeLeft > 0 ? liveTimeLeft : q.time;
            logger.debug(`[Timer Display] Question ${q.uid} was stopped. Original time ${originalTime}s is preserved for future restoration`);
            // The initialTime storage is handled in useTeacherQuizSocket.ts
        }
    }, [isActive, liveStatus, liveTimeLeft, q.time, q.uid]);

    // Optimize displayedTimeLeft logic
    let displayedTimeLeft: number;
    if (pendingTimeValue !== null && liveTimeLeft === pendingTimeValue) {
        // Clear pendingTimeValue once backend confirms the update
        setPendingTimeValue(null);
    }
    if (isActive) {
        if (liveStatus === 'stop') {
            displayedTimeLeft = liveTimeLeft ?? q.time ?? 0;
        } else if (liveStatus === 'pause' || liveStatus === 'play') {
            displayedTimeLeft = liveTimeLeft ?? q.time ?? 0;
        } else {
            displayedTimeLeft = q.time ?? 0;
        }
    } else {
        displayedTimeLeft = q.time ?? 0;
    }

    // --- Effets (conservés ici pour la synchro et l'édition) ---
    // Effet pour synchroniser localTimeLeft avec liveTimeLeft (si active) ou q.time
    useEffect(() => {
        // Ne pas synchroniser pendant l'édition du timer pour éviter de réinitialiser
        // la valeur que l'utilisateur est en train de modifier
        if (editingTimer) {
            return;
        }

        if (isActive && typeof liveTimeLeft === 'number') {
            logger.debug(`Syncing active question timer ${q.uid}: localTimeLeft <- liveTimeLeft (${liveTimeLeft})`);
            setEditTimerValue(String(liveTimeLeft));
        } else if (!isActive && q.time !== undefined && editTimerValue !== String(q.time)) {
            logger.debug(`Syncing inactive question timer ${q.uid}: localTimeLeft <- q.time (${q.time})`);
            setEditTimerValue(String(q.time));
        }
        // Assurons-nous que toutes les dépendances sont explicitement listées
        // et que chaque valeur est de type stable (convertir les nombres en string si nécessaire)
    }, [isActive, liveTimeLeft, q.time, editTimerValue, q.uid, editingTimer]);

    // Ajouter un logging explicite pour déboguer le problème de sélection
    useEffect(() => {
        if (isActive) {
            logger.debug(`Question ${q.uid} is ACTIVE, liveStatus=${liveStatus}, liveTimeLeft=${liveTimeLeft}`);
        }
    }, [isActive, liveStatus, liveTimeLeft, q.uid]);

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
            // Utilise la valeur du timer serveur pour initialiser l'édition
            setEditTimerValue(liveTimeLeft !== undefined && liveTimeLeft !== null ? String(liveTimeLeft) : String(q.time ?? 0));
            setTimeout(() => timerInputRef.current?.focus(), 0);
        }
    }, [editingTimer, liveTimeLeft, q.time]); // Added q.time as fallback

    // Effet pour réinitialiser la valeur en attente une fois que liveTimeLeft correspond
    useEffect(() => {
        // Si une valeur est en attente et que la valeur du serveur correspond maintenant à cette valeur,
        // on peut réinitialiser l'état pendingTimeValue
        if (pendingTimeValue !== null && liveTimeLeft === pendingTimeValue) {
            logger.debug(`Server value now matches pending value (${pendingTimeValue}), clearing pending state`);
            setPendingTimeValue(null);
        }
    }, [pendingTimeValue, liveTimeLeft]);

    // Reduce logging for syncing timers
    useEffect(() => {
        if (isActive && liveStatus === 'pause' && typeof liveTimeLeft === 'number') {
            setPausedTimeLeftByUid(prev => ({ ...prev, [q.uid]: liveTimeLeft }));
        }
    }, [isActive, liveStatus, liveTimeLeft, q.uid]);

    // Refine logging for timer updates
    useEffect(() => {
        if (isActive && Math.abs((liveTimeLeft ?? 0) - (displayedTimeLeft ?? 0)) >= 1) {
            logger.info(`Question ${q.uid}: Timer updated to ${liveTimeLeft}s`);
        }
    }, [isActive, liveTimeLeft, displayedTimeLeft, q.uid]);

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

    // Removed destructuring of subscribeToTimerUpdate as it no longer exists
    const { quizSocket, quizState, timerStatus, ...rest } = useTeacherQuizSocket(quizId, currentTournamentCode);

    // Simplified validateEditHandler to remove subscribeToTimerUpdate logic
    const validateEditHandler = (e: React.MouseEvent | React.KeyboardEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const newTime = parseInt(editTimerValue, 10);

        logger.debug(`validateEditHandler triggered for question ${q.uid}`);
        logger.debug(`Current editTimerValue: ${editTimerValue}`);

        if (!isNaN(newTime) && newTime >= 0) {
            logger.info(`Validating timer edit for question ${q.uid}: ${newTime}s`);

            // Emit the new timer value to the backend
            onEditTimer(newTime);

            // Wait for backend confirmation before clearing pendingTimeValue
            setPendingTimeValue(newTime);

            logger.debug(`Pending time value set to ${newTime} for question ${q.uid}`);

            // Close the edit mode
            setEditingTimer(false);
            logger.debug(`Editing mode closed for question ${q.uid}`);

            // Do NOT trigger play/resume here. Timer should remain paused or stopped.
        } else {
            logger.error(`Invalid timer value entered for question ${q.uid}: ${editTimerValue}`);
        }
    };

    // Handler for PLAY (now passes the displayed timer value)
    const handlePlayWithCurrentTime = () => {
        const currentTimer = displayedTimeLeft;
        logger.info(`Playing question ${q.uid} with current timer value: ${currentTimer}s`);
        onPlay(q.uid, currentTimer); // Pass the value directly
    };

    // --- Rendu ---

    // JSX pour l'input d'édition (rendu conditionnellement)
    const timerEditInput = editingTimer ? (
        <div className="relative"> {/* Make this container relative for absolute overlay */}
            <QuestionDisplay
                className="question-dashboard opacity-40 pointer-events-none select-none"
                question={q}
                isOpen={open}
                onToggleOpen={setOpen}
                timerStatus={(isActive ? liveStatus : 'stop') ?? 'stop'}
                timeLeft={displayedTimeLeft}
                onPlay={handlePlayWithCurrentTime}
                onPause={pauseHandler}
                onStop={onStop}
                isActive={isActive}
                disabled={true}
                onEditTimerRequest={() => { }}
                onShowResults={onShowResults}
                showResultsDisabled={showResultsDisabled}
                onStatsToggle={onStatsToggle}
                stats={stats}
            />
            <div className="absolute left-0 top-0 w-full h-full flex items-center justify-center z-20">
                <span ref={inputWrapperRef} className="flex items-center gap-1 bg-background p-2 rounded shadow-lg border border-gray-200">
                    <input
                        ref={timerInputRef}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="w-20 px-1 py-0.5 rounded border border-gray-300 text-lg font-mono text-center bg-input text-foreground"
                        value={formatTime(parseInt(editTimerValue, 10) || 0)}
                        onChange={e => {
                            const val = e.target.value.replace(/[^0-9:]/g, '');
                            if (val.includes(':')) {
                                const [mm, ss] = val.split(':');
                                const total = (parseInt(mm, 10) || 0) * 60 + (parseInt(ss, 10) || 0);
                                setEditTimerValue(String(total));
                            } else {
                                setEditTimerValue(val.replace(/[^0-9]/g, ''));
                            }
                        }}
                        onClick={e => e.stopPropagation()}
                        onKeyDown={e => {
                            if (e.key === 'Enter') validateEditHandler(e as React.KeyboardEvent<HTMLInputElement>);
                            if (e.key === 'Escape') cancelEditHandler(e as React.KeyboardEvent<HTMLInputElement>);
                            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                e.preventDefault();
                                const val = parseInt(editTimerValue, 10) || 0;
                                if (e.key === 'ArrowUp') setEditTimerValue(String(val + 1));
                                if (e.key === 'ArrowDown') setEditTimerValue(String(Math.max(0, val - 1)));
                            }
                        }}
                    />
                    <button onClick={validateEditHandler} className="p-1 text-foreground hover:text-primary" title="Valider"><Check size={18} /></button>
                    <button onClick={cancelEditHandler} className="p-1 text-foreground hover:text-destructive" title="Annuler"><X size={18} /></button>
                </span>
            </div>
        </div>
    ) : null;

    // JSX pour afficher les réponses pendant l'édition
    const answersWhileEditing = editingTimer && open ? (
        <div className="transition-all duration-300 ease-in-out overflow-hidden max-h-[500px] opacity-100">
            <ul className={`ml-0 mt-0 flex flex-col gap-2 answers-list p-3 rounded-b-xl rounded-t-none no-top-border ${isActive ? "answers-selected" : ""}`} style={{ borderTop: '1px solid var(--border-color)' }}>
                <li className="mb-2 font-medium text-base text-couleur-global-neutral-700">
                    <MathJaxWrapper>{q.question}</MathJaxWrapper>
                </li>
                {Array.isArray(q.answers) && q.answers.length > 0
                    ? q.answers.map((r, idx) => (
                        <li key={idx} className="flex gap-2 ml-4 mb-1" style={{ listStyle: 'none', alignItems: 'flex-start' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'flex-start', height: '18px', minWidth: '18px' }}>
                                {r.correct ? <Check size={18} strokeWidth={3} className="text-primary mt-1" style={{ display: 'block' }} /> : <X size={18} strokeWidth={3} className="text-secondary mt-1" style={{ display: 'block' }} />}
                            </span>
                            <MathJaxWrapper><span style={{ lineHeight: '1.5' }}>{r.text}</span></MathJaxWrapper>
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
            {/* --- Drag Handle (extérieur à QuestionDisplay) --- */}
            <button
                {...listeners} // Listeners pour dnd-kit
                data-drag-handle
                className={`cursor-grab p-1 rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground mt-4 mr-2 flex-shrink-0 ${disabled ? 'cursor-not-allowed' : ''}`} // Ajustement style/marge
                aria-label="Drag to reorder"
                style={{ touchAction: 'none' }} // Important pour dnd-kit
                disabled={disabled}
                onClick={e => e.stopPropagation()} // Empêche le clic d'ouvrir/fermer
            >
                <GripVertical size={18} className="shrink-0" />
            </button>

            {/* --- Contenu Principal (QuestionDisplay ou Input d'édition + Réponses si édition) --- */}
            <div className="flex-1 min-w-0"> {/* Assure que le contenu peut rétrécir */}
                {editingTimer ? (
                    // Affiche l'input d'édition à la place du header normal
                    timerEditInput
                ) : (
                    // Affiche le composant QuestionDisplay normal
                    <QuestionDisplay
                        className="question-dashboard"
                        question={q}
                        isOpen={open}
                        onToggleOpen={setOpen}
                        timerStatus={(isActive ? liveStatus : 'stop') ?? 'stop'}
                        timeLeft={displayedTimeLeft}
                        onPlay={handlePlayWithCurrentTime}
                        onPause={pauseHandler}
                        onStop={onStop}
                        isActive={isActive}
                        disabled={disabled}
                        onEditTimerRequest={editTimerRequestHandler}
                        onShowResults={onShowResults}
                        showResultsDisabled={showResultsDisabled}
                        onStatsToggle={onStatsToggle}
                        stats={stats}
                    />
                )}
                {/* Affiche les réponses si en mode édition ET si elles sont ouvertes */}
                {answersWhileEditing}
            </div>
        </li>
    );
}, arePropsEqual);

SortableQuestion.displayName = 'SortableQuestion'; // Pour le débogage
