import React, { useState, useEffect, useRef } from "react"; // Ajout de useEffect, useRef
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, X, Pencil, Play, GripVertical, Pause, Square } from 'lucide-react';
import type { Question, QuizState } from "../types";
import { createLogger } from '@/clientLogger';
import { formatTime } from "@/utils";
import MathJaxWrapper from '@/components/MathJaxWrapper';
import QuestionDisplay from "@/app/components/QuestionDisplay"; // Import du nouveau composant

const logger = createLogger('SortableQuestion');

// --- Types ---
export interface SortableQuestionProps {
    q: Question;
    idx: number;
    isActive?: boolean;
    isRunning?: boolean; // Gardé pour la logique interne si besoin
    quizState?: QuizState | null; // Gardé pour la logique interne si besoin
    open: boolean;
    setOpen: () => void;
    onPlay: () => void;
    onPause: () => void;
    onStop?: () => void;
    onSelect: () => void; // Gardé pour la sélection via clic/touche
    onEditTimer: (newTime: number) => void; // Callback parent pour la validation de l'édition
    liveTimeLeft?: number;
    liveStatus?: 'play' | 'pause' | 'stop';
    onImmediateUpdateActiveTimer?: (newTime: number) => void; // Gardé pour la synchro active
    disabled?: boolean;
}

// --- arePropsEqual reste inchangé ---
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
    // Comparaison plus précise pour l'objet question si nécessaire
    if (JSON.stringify(prevProps.q) !== JSON.stringify(nextProps.q)) return false;

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
export const SortableQuestion = React.memo(({ q, idx, isActive, isRunning, open, setOpen, onPlay, onPause, onStop, onSelect, onEditTimer, liveTimeLeft, liveStatus, onImmediateUpdateActiveTimer, disabled }: SortableQuestionProps) => {
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

    // Déterminer quelle valeur de timer afficher dans le composant QuestionDisplay
    // Priorité : 1. Valeur en attente  2. Valeur du serveur  3. Valeur par défaut de la question
    const displayedTimeLeft = pendingTimeValue !== null
        ? pendingTimeValue
        : (liveTimeLeft ?? q.temps ?? 0);

    // --- Effets (conservés ici pour la synchro et l'édition) ---
    // Effet pour synchroniser localTimeLeft avec liveTimeLeft (si active) ou q.temps
    useEffect(() => {
        // Ne pas synchroniser pendant l'édition du timer pour éviter de réinitialiser
        // la valeur que l'utilisateur est en train de modifier
        if (editingTimer) {
            return;
        }

        if (isActive && typeof liveTimeLeft === 'number') {
            // logger.debug(`Syncing active question timer ${q.uid}: localTimeLeft <- liveTimeLeft (${liveTimeLeft})`);
            setEditTimerValue(String(liveTimeLeft));
        } else if (!isActive && q.temps !== undefined && editTimerValue !== String(q.temps)) {
            // logger.debug(`Syncing inactive question timer ${q.uid}: localTimeLeft <- q.temps (${q.temps})`);
            setEditTimerValue(String(q.temps));
        }
        // Assurons-nous que toutes les dépendances sont explicitement listées
        // et que chaque valeur est de type stable (convertir les nombres en string si nécessaire)
    }, [isActive, liveTimeLeft, q.temps, editTimerValue, q.uid, editingTimer]);

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
            setEditTimerValue(liveTimeLeft !== undefined && liveTimeLeft !== null ? String(liveTimeLeft) : String(q.temps ?? 0));
            setTimeout(() => timerInputRef.current?.focus(), 0);
        }
    }, [editingTimer, liveTimeLeft, q.temps]); // Added q.temps as fallback

    // Effet pour réinitialiser la valeur en attente une fois que liveTimeLeft correspond
    useEffect(() => {
        // Si une valeur est en attente et que la valeur du serveur correspond maintenant à cette valeur,
        // on peut réinitialiser l'état pendingTimeValue
        if (pendingTimeValue !== null && liveTimeLeft === pendingTimeValue) {
            logger.debug(`Server value now matches pending value (${pendingTimeValue}), clearing pending state`);
            setPendingTimeValue(null);
        }
    }, [pendingTimeValue, liveTimeLeft]);

    // --- Handlers (conservés ici) ---
    const handlePauseClick = () => { onPause(); }; // Simple wrapper

    // Handler pour DEMANDER l'édition (appelé par QuestionDisplay)
    const handleEditTimerRequest = () => {
        logger.debug(`Edit timer requested for ${q.uid}`);
        setEditingTimer(true); // Active le mode édition dans SortableQuestion
    };

    // Handlers pour VALIDER ou ANNULER l'édition
    const handleCancelEdit = (e: React.MouseEvent | React.KeyboardEvent<HTMLInputElement>) => {
        e.stopPropagation();
        setEditingTimer(false);
    };
    const handleValidateEdit = (e: React.MouseEvent | React.KeyboardEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const newTime = parseInt(editTimerValue, 10);
        if (!isNaN(newTime) && newTime >= 0) {
            logger.info(`Validating timer edit for question ${q.uid}: ${newTime}s`);

            // Stocker la nouvelle valeur comme "en attente de synchronisation"
            setPendingTimeValue(newTime);

            // Appeler le callback parent pour persister/synchroniser
            onEditTimer(newTime);

            // Pour les questions actives, effectuer une mise à jour immédiate par le callback spécial
            if (isActive && onImmediateUpdateActiveTimer) {
                onImmediateUpdateActiveTimer(newTime);
            }

            // Fermer le mode édition
            setEditingTimer(false);
        } else {
            // En cas de valeur invalide, on reste en mode édition
            logger.warn(`Invalid timer value: ${editTimerValue}`);
        }
    };

    // Handler pour PLAY (utilise la valeur serveur la plus à jour)
    const handlePlayWithCurrentTime = () => {
        const currentTimer = liveTimeLeft !== undefined && liveTimeLeft !== null ? liveTimeLeft : q.temps ?? 0;
        logger.info(`Playing question ${q.uid} with current timer value: ${currentTimer}s`);
        // Stocke temporairement pour que le hook puisse le récupérer si besoin (alternative à l'event)
        window.localStorage.setItem(`question_timer_${q.uid}`, String(currentTimer));
        onPlay(); // Appelle le onPlay parent
    };

    // --- Rendu ---

    // JSX pour l'input d'édition (rendu conditionnellement)
    const timerEditInput = editingTimer ? (
        <div className={`card flex items-center justify-between gap-3 question-selected no-bottom-border no-bottom-radius p-4 ${isActive ? ' question-selected' : ''}`}> {/* Mimic header style */}
            <div className="flex items-center gap-3 flex-grow min-w-0">
                <span ref={inputWrapperRef} className="flex items-center gap-1">
                    <input
                        ref={timerInputRef}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="w-20 px-1 py-0.5 rounded border border-gray-300 text-lg font-mono text-center bg-input text-foreground" // Style adapté
                        value={formatTime(parseInt(editTimerValue, 10) || 0)} // Affiche formaté
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
                            if (e.key === 'Enter') handleValidateEdit(e as React.KeyboardEvent<HTMLInputElement>);
                            if (e.key === 'Escape') handleCancelEdit(e as React.KeyboardEvent<HTMLInputElement>);
                            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                e.preventDefault();
                                const val = parseInt(editTimerValue, 10) || 0;
                                if (e.key === 'ArrowUp') setEditTimerValue(String(val + 1));
                                if (e.key === 'ArrowDown') setEditTimerValue(String(Math.max(0, val - 1)));
                            }
                        }}
                    />
                    <button onClick={handleValidateEdit} className="p-1 text-foreground hover:text-primary" title="Valider"><Check size={18} /></button>
                    <button onClick={handleCancelEdit} className="p-1 text-foreground hover:text-destructive" title="Annuler"><X size={18} /></button>
                </span>
                <div className="ml-4 font-medium flex-grow fade-right-bottom-crop">
                    <MathJaxWrapper>{q.titre ? q.titre : q.question}</MathJaxWrapper>
                </div>
            </div>
            {/* Pas de boutons play/pause/stop pendant l'édition */}
        </div>
    ) : null;

    // JSX pour afficher les réponses pendant l'édition
    const answersWhileEditing = editingTimer && open ? (
        <div className="transition-all duration-300 ease-in-out overflow-hidden max-h-[500px] opacity-100">
            <ul className={`ml-0 mt-0 flex flex-col gap-2 answers-list p-3 rounded-b-xl rounded-t-none no-top-border ${isActive ? "answers-selected" : ""}`} style={{ borderTop: '1px solid var(--border-color)' }}>
                <li className="mb-2 font-medium text-base text-couleur-global-neutral-700">
                    <MathJaxWrapper>{q.question}</MathJaxWrapper>
                </li>
                {Array.isArray(q.reponses) && q.reponses.length > 0
                    ? q.reponses.map((r, idx) => (
                        <li key={idx} className="flex gap-2 ml-4 mb-1" style={{ listStyle: 'none', alignItems: 'flex-start' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'flex-start', height: '18px', minWidth: '18px' }}>
                                {r.correct ? <Check size={18} strokeWidth={3} className="text-primary mt-1" style={{ display: 'block' }} /> : <X size={18} strokeWidth={3} className="text-secondary mt-1" style={{ display: 'block' }} />}
                            </span>
                            <MathJaxWrapper><span style={{ lineHeight: '1.5' }}>{r.texte}</span></MathJaxWrapper>
                        </li>
                    ))
                    : <li className="italic text-muted-foreground">Aucune réponse définie</li>}
                {q.explication && (
                    <div className="mt-4 pt-2 border-t border-base-300 text-sm text-base-content/70">
                        <span className="font-semibold">Explication :</span> {q.explication}
                    </div>
                )}
            </ul>
        </div>
    ) : null;


    return (
        <li
            ref={setNodeRef}
            style={style}
            className={`flex flex-row items-start select-none transition-all duration-150 ease-in-out ${isDragging ? 'opacity-70' : ''} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
            {...attributes} // Attributs pour dnd-kit
        // onClick et onKeyDown sont gérés DANS QuestionDisplay maintenant (ou pas du tout si drag handle)
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
                        question={q}
                        isOpen={open}
                        onToggleOpen={setOpen} // Passe la fonction pour ouvrir/fermer
                        // Détermine le statut à passer à QuestionDisplay
                        timerStatus={(isActive ? liveStatus : 'stop') ?? 'stop'}
                        // Utilise la valeur en attente ou la valeur synchronisée pour l'affichage
                        timeLeft={displayedTimeLeft}
                        onPlay={handlePlayWithCurrentTime} // Passe le handler custom
                        onPause={handlePauseClick} // Passe le handler simple
                        onStop={onStop} // Passe directement le prop
                        isActive={isActive}
                        disabled={disabled}
                        onEditTimerRequest={handleEditTimerRequest} // Passe le handler pour demander l'édition
                    />
                )}
                {/* Affiche les réponses si en mode édition ET si elles sont ouvertes */}
                {answersWhileEditing}
            </div>
        </li>
    );
}, arePropsEqual);

SortableQuestion.displayName = 'SortableQuestion'; // Pour le débogage
