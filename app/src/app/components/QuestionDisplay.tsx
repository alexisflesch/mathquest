import React from "react";
import { ChevronDown, ChevronUp, Play, Pause, Square, Check, X, Pencil } from "lucide-react";
import { formatTime } from "@/utils"; // Assure-toi que ce chemin est correct
import MathJaxWrapper from '@/components/MathJaxWrapper'; // Assure-toi que ce chemin est correct

// Types (simplifiés pour l'affichage)
export interface QuestionDisplayProps {
    question: {
        uid: string;
        titre?: string;
        question: string; // Renommé depuis 'enonce' pour correspondre à SortableQuestion
        reponses: { texte: string; correct: boolean }[];
        niveaux?: string[]; // Ajouté pour correspondre
        categories?: string[]; // Ajouté pour correspondre
        themes?: string[]; // Ajouté pour correspondre
        justification?: string; // Ajouté pour correspondre
        temps?: number;
    };
    // Props pour le contrôle externe
    isOpen?: boolean;
    onToggleOpen?: () => void;
    timerStatus?: "play" | "pause" | "stop";
    timeLeft?: number;
    onPlay?: () => void;
    onPause?: () => void;
    onStop?: () => void;
    // Props pour l'apparence/état
    isActive?: boolean; // Pour le style 'question-selected'
    disabled?: boolean;
    // Props pour l'édition (simplifié pour l'instant)
    onEditTimerRequest?: () => void; // Callback pour demander l'édition
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
    question,
    isOpen = false,
    onToggleOpen,
    timerStatus = "stop",
    timeLeft = question.temps ?? 0,
    onPlay,
    onPause,
    onStop,
    isActive = false,
    disabled = false,
    onEditTimerRequest, // Ajouté
}) => {

    // Détermine l'état effectif des boutons play/pause
    const effectiveIsRunning = timerStatus === 'play';
    const effectiveIsPaused = timerStatus === 'pause';

    // Handler robuste pour le bouton play/pause
    const handlePlayPause = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (effectiveIsRunning) {
            onPause && onPause();
        } else if (effectiveIsPaused) {
            onPlay && onPlay();
        } else {
            onPlay && onPlay();
        }
    };

    // Affichage du timer (non éditable dans ce composant)
    const timerDisplay = (
        <span className="flex items-center gap-1">
            <span
                className="font-mono text-lg px-2 py-1 rounded bg-muted text-muted-foreground min-w-[60px] text-center select-none"
                title="Temps de la question"
            >
                {formatTime(timeLeft)}
            </span>
            {/* Bouton pour demander l'édition (si callback fourni) */}
            {onEditTimerRequest && (
                <button
                    className="ml-1 p-1 rounded hover:bg-accent hover:text-accent-foreground"
                    title="Éditer le temps"
                    onClick={(e) => { e.stopPropagation(); onEditTimerRequest(); }}
                    tabIndex={-1}
                    type="button"
                    disabled={disabled}
                >
                    <Pencil size={16} />
                </button>
            )}
        </span>
    );

    return (
        // Structure li enlevée, remplacée par div. Pas de ref/style/attributes de dnd-kit
        <div className={`flex flex-col gap-0 select-none transition-all duration-150 ease-in-out ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Header de la question (anciennement .card) */}
            <div
                className={`card flex items-center justify-between gap-3 ${isActive ? ' question-selected' : ''} ${isOpen ? ' no-bottom-border no-bottom-radius' : ''}`}
                style={{ color: 'var(--foreground)' }}
                // Clic sur le header (sauf boutons) pour ouvrir/fermer
                onClick={(event) => {
                    const target = event.target as HTMLElement;
                    const isPlayPauseBtn = target.closest('[data-play-pause-btn]');
                    const isStopBtn = target.closest('[data-stop-btn]');
                    const isEditBtn = target.closest('button[title="Éditer le temps"]'); // Cible le bouton crayon
                    if (isPlayPauseBtn || isStopBtn || isEditBtn) return; // Ne pas ouvrir si on clique sur un bouton
                    onToggleOpen && onToggleOpen();
                }}
            >
                {/* Contenu gauche: Timer + Titre/Question */}
                <div className="flex items-center gap-3 flex-grow min-w-0">
                    {/* PAS de drag handle ici */}
                    {timerDisplay}
                    <div className="ml-4 font-medium flex-grow fade-right-bottom-crop">
                        <MathJaxWrapper>
                            {question.titre ? question.titre : question.question}
                        </MathJaxWrapper>
                    </div>
                </div>

                {/* Contenu droit: Boutons Play/Pause/Stop */}
                <div className="flex items-center gap-0">
                    <button
                        data-play-pause-btn
                        className={`p-1 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors duration-150 ${isActive ? '' : 'text-muted-foreground'}`}
                        onClick={handlePlayPause}
                        aria-label={effectiveIsRunning ? "Pause Question" : "Play Question"}
                        disabled={disabled}
                    >
                        {effectiveIsRunning ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <button
                        data-stop-btn
                        className="p-1 rounded-full hover:bg-alert hover:text-alert-foreground transition-colors duration-150"
                        onClick={(e) => { e.stopPropagation(); onStop && onStop(); }}
                        aria-label="Stop Question"
                        // Logique de désactivation reprise de SortableQuestion
                        disabled={disabled || (!effectiveIsRunning && timerStatus !== 'pause')}
                    >
                        <Square size={20} />
                    </button>
                    {/* Pas de chevron ici, l'ouverture se fait sur le header */}
                </div>
            </div>

            {/* Section Réponses (conditionnelle + transition) */}
            {/* Utilise la classe de transition de QuestionDisplay mais la structure interne de SortableQuestion */}
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`} // Ajuste max-h si besoin
                aria-hidden={!isOpen}
            >
                {/* Structure ul/li reprise de SortableQuestion */}
                <ul
                    className={[
                        "ml-0 mt-0 flex flex-col gap-2 answers-list p-3 rounded-b-xl rounded-t-none",
                        isActive ? "answers-selected" : "",
                        isOpen ? "no-top-border" : "" // Applique le style si ouvert
                    ].join(" ")}
                    style={{ borderTop: isOpen ? '1px solid var(--border-color)' : 'none' }} // Assure la bordure
                >
                    {/* Affichage de l'énoncé complet */}
                    <li className="mb-2 font-medium text-base text-couleur-global-neutral-700">
                        <MathJaxWrapper>{question.question}</MathJaxWrapper>
                    </li>
                    {/* Affichage des réponses */}
                    {Array.isArray(question.reponses) && question.reponses.length > 0
                        ? question.reponses.map((r, idx) => (
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
                    {/* Affichage de la justification (si showJustification est vrai et justification existe) */}
                    {question.justification && (
                        <div className="mt-4 pt-2 border-t border-base-300 text-sm text-base-content/70">
                            <span className="font-semibold">Justification :</span> {question.justification}
                        </div>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default QuestionDisplay;
