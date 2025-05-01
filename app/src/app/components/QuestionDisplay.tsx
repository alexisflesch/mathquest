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
        niveau?: string;
        categories?: string[]; // Ajouté pour correspondre
        discipline?: string;
        themes?: string[]; // Ajouté pour correspondre
        theme?: string;
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
    showControls?: boolean; // hide timer/play/stop if false
    className?: string; // allow passing custom className
    showMeta?: boolean; // show metadata if true
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
    showControls = true,
    className = "",
    showMeta = false,
}) => {

    // Détermine l'état effectif des boutons play/pause
    const effectiveIsRunning = timerStatus === 'play';
    const effectiveIsPaused = timerStatus === 'pause';

    // Handler robuste pour le bouton play/pause
    const handlePlayPause = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (effectiveIsRunning) {
            if (onPause) onPause();
        } else if (effectiveIsPaused) {
            if (onPlay) onPlay();
        } else {
            if (onPlay) onPlay();
        }
    };

    // Handler for toggling open/close by clicking anywhere except on a control button
    const handleToggle = (event: React.MouseEvent) => {
        const target = event.target as HTMLElement;
        const isControlBtn = target.closest('[data-play-pause-btn], [data-stop-btn], button[title="Éditer le temps"]');
        if (isControlBtn) return;
        if (onToggleOpen) onToggleOpen();
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

    const metaString = [
        question.niveau || (question.niveaux && question.niveaux.join(', ')),
        question.discipline || (question.categories && question.categories.join(', ')),
        question.theme || (question.themes && question.themes.join(', '))
    ].filter(Boolean).join(' · ');

    return (
        <div
            className={`question-display flex flex-col select-none transition-all duration-150 ease-in-out ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
            onClick={handleToggle}
            tabIndex={0}
            role="button"
            aria-expanded={isOpen}
        >
            <div
                className={`card w-full flex flex-col ${isActive ? 'question-selected' : ''} ${className}`}
            >
                <div className="flex flex-col">
                    <div className={`flex items-center justify-between gap-3 question-header ${isOpen ? 'no-bottom-border no-bottom-radius' : ''}`} style={{ paddingTop: 0, paddingBottom: 0 }}>
                        <div className="font-medium fade-right-bottom-crop relative" style={{ minHeight: '1.8em', marginLeft: 0, flexGrow: 0, paddingLeft: 0 }}>
                            {/* Animated cropped question for no-title case */}
                            {question.titre ? (
                                <MathJaxWrapper>{question.titre}</MathJaxWrapper>
                            ) : (
                                <span
                                    className={`transition-all duration-400 ease-in-out block absolute left-0 right-0 ${isOpen ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}`}
                                    style={{
                                        transitionProperty: 'opacity, transform',
                                        willChange: 'opacity, transform',
                                    }}
                                    aria-hidden={isOpen}
                                >
                                    <MathJaxWrapper>{question.question}</MathJaxWrapper>
                                </span>
                            )}
                        </div>
                        {/* Only one of these will render, always right-aligned */}
                        {showControls ? (
                            <div className="flex items-center gap-0 ml-2">
                                {timerDisplay}
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
                                    onClick={(e) => { e.stopPropagation(); if (onStop) onStop(); }}
                                    aria-label="Stop Question"
                                    disabled={disabled || (!effectiveIsRunning && timerStatus !== 'pause')}
                                >
                                    <Square size={20} />
                                </button>
                            </div>
                        ) : showMeta && metaString ? (
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{metaString}</span>
                        ) : null}
                    </div>
                    {/* Move the gap to the expanded content only */}
                    {isOpen && (
                        <div className="mt-1">
                            {/* Animated full question + answers for no-title case */}
                            {!question.titre ? (
                                <div
                                    className={`transition-all duration-400 ease-in-out ${isOpen ? 'max-h-[800px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2'} overflow-hidden`}
                                    style={{ transitionProperty: 'max-height, opacity, transform', willChange: 'max-height, opacity, transform' }}
                                    aria-hidden={!isOpen && 'true'}
                                >
                                    <div className="mb-2 font-medium text-base text-couleur-global-neutral-700 pt-2">
                                        <MathJaxWrapper>{question.question}</MathJaxWrapper>
                                    </div>
                                    <ul
                                        className={[
                                            "ml-0 mt-0 flex flex-col gap-2 answers-list p-3 rounded-b-xl rounded-t-none",
                                            isActive ? "answers-selected" : "",
                                            isOpen ? "no-top-border" : ""
                                        ].join(" ")}
                                    >
                                        {Array.isArray(question.reponses) && question.reponses.length > 0
                                            ? question.reponses.map((r, idx) => (
                                                <li key={idx} className="flex gap-2 ml-4 mb-1">
                                                    <span className="answer-icon">
                                                        {r.correct ? (
                                                            <Check size={18} strokeWidth={3} className="text-primary mt-1" />
                                                        ) : (
                                                            <X size={18} strokeWidth={3} className="text-secondary mt-1" />
                                                        )}
                                                    </span>
                                                    <MathJaxWrapper>
                                                        <span className="answer-text">{r.texte}</span>
                                                    </MathJaxWrapper>
                                                </li>
                                            ))
                                            : <li className="italic text-muted-foreground">Aucune réponse définie</li>}
                                        {question.justification && (
                                            <div className="mt-4 pt-2 border-t border-base-300 text-sm text-base-content/70">
                                                <span className="font-semibold">Justification :</span> {question.justification}
                                            </div>
                                        )}
                                    </ul>
                                </div>
                            ) : (
                                <div
                                    className={`answers-transition${isOpen ? " open" : ""}`}
                                    aria-hidden={!isOpen}
                                >
                                    <ul
                                        className={[
                                            "ml-0 mt-0 flex flex-col gap-2 answers-list p-3 rounded-b-xl rounded-t-none",
                                            isActive ? "answers-selected" : "",
                                            isOpen ? "no-top-border" : ""
                                        ].join(" ")}
                                    >
                                        <li className="mb-2 font-medium text-base text-couleur-global-neutral-700">
                                            <MathJaxWrapper>{question.question}</MathJaxWrapper>
                                        </li>
                                        {Array.isArray(question.reponses) && question.reponses.length > 0
                                            ? question.reponses.map((r, idx) => (
                                                <li key={idx} className="flex gap-2 ml-4 mb-1">
                                                    <span className="answer-icon">
                                                        {r.correct ? (
                                                            <Check size={18} strokeWidth={3} className="text-primary mt-1" />
                                                        ) : (
                                                            <X size={18} strokeWidth={3} className="text-secondary mt-1" />
                                                        )}
                                                    </span>
                                                    <MathJaxWrapper>
                                                        <span className="answer-text">{r.texte}</span>
                                                    </MathJaxWrapper>
                                                </li>
                                            ))
                                            : <li className="italic text-muted-foreground">Aucune réponse définie</li>}
                                        {question.justification && (
                                            <div className="mt-4 pt-2 border-t border-base-300 text-sm text-base-content/70">
                                                <span className="font-semibold">Justification :</span> {question.justification}
                                            </div>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuestionDisplay;
