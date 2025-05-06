import React, { useRef, useEffect, useState } from "react";
import { Play, Pause, Square, Check, X, Pencil, Trophy, ChartBarBig } from "lucide-react";
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
    zoomFactor?: number; // Add zoomFactor prop
    onShowResults?: () => void; // Ajouté pour le bouton Trophy
    showResultsDisabled?: boolean; // Désactive le bouton Trophy
    correctAnswers?: number[]; // NEW: indices des réponses correctes à afficher (ex: [1,2])
    onStatsToggle?: (isDisplayed: boolean) => void; // NEW: callback for stats toggle
    stats?: number[]; // NEW: answer stats (count per answer)
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
    zoomFactor = 1, // Destructure zoomFactor with default
    onShowResults, // Ajouté
    showResultsDisabled = false, // Ajouté
    correctAnswers,
    onStatsToggle, // NEW: destructure onStatsToggle
    stats, // NEW: destructure stats
}) => {

    // Détermine l'état effectif des boutons play/pause
    const effectiveIsRunning = timerStatus === 'play';
    const effectiveIsPaused = timerStatus === 'pause';

    // Helper: is this answer correct (from prop)?
    const isAnswerCorrect = (idx: number) => {
        if (Array.isArray(correctAnswers)) return correctAnswers.includes(idx);
        return false;
    };

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

    // For smooth expand/collapse
    const contentRef = useRef<HTMLDivElement>(null);
    const [maxHeight, setMaxHeight] = useState('0px');

    useEffect(() => {
        if (isOpen && contentRef.current) {
            requestAnimationFrame(() => {
                if (contentRef.current) {
                    setMaxHeight(contentRef.current.scrollHeight + 'px');
                }
            });
        } else if (!isOpen && contentRef.current) {
            setMaxHeight(contentRef.current.scrollHeight + 'px');
            requestAnimationFrame(() => {
                setMaxHeight('0px');
            });
        }
    }, [isOpen, question]);

    // Base font sizes (adjust based on actual Tailwind classes used)
    const baseTitleFontSize = '1rem'; // Assuming default size for title/cropped question
    const baseQuestionFontSize = '1rem'; // Assuming default size for full question body
    const baseAnswerFontSize = '1rem'; // Assuming default size for answer text
    const baseJustificationFontSize = '0.875rem'; // Assuming text-sm for justification
    const baseMetaFontSize = '0.75rem'; // Assuming text-xs for metadata

    // Affichage du timer (non éditable dans ce composant)
    const timerDisplay = (
        <span className="flex items-center gap-1">
            <span
                className="font-mono text-lg pl-2 pr-0 py-1 rounded bg-muted text-muted-foreground min-w-[60px] text-center select-none"
                title="Temps de la question"
            >
                {formatTime(timeLeft)}
            </span>
            {/* Bouton pour demander l'édition (si callback fourni) */}
            {onEditTimerRequest && (
                <button
                    className="ml-1 pl-0 pr-3 icon-control-hover"
                    title="Modifier le timer"
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

    // --- Stats display toggle state (for ChartBarBig) ---
    const [isStatsDisplayed, setIsStatsDisplayed] = useState(false);

    // Compute stats bar widths
    // The server already sends stats as percentages (0-100)
    const getBarWidth = (idx: number) => {
        if (!stats || typeof stats[idx] !== 'number') return 0;
        return stats[idx]; // Already a percentage
    };

    // Handler for ChartBarBig click
    const handleStatsToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsStatsDisplayed((prev) => {
            const newState = !prev;
            if (onStatsToggle) onStatsToggle(newState);
            return newState;
        });
    };

    return (
        <div
            className={`question-display flex flex-col select-none transition-all duration-150 ease-in-out ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
            onClick={handleToggle}
            tabIndex={0}
            role="button"
            aria-expanded={isOpen}
        >
            <div
                className={`card w-full flex flex-col ${isActive ? 'active-question-border' : ''} ${className}`}
            >
                <div className="flex flex-col">
                    <div className={`flex items-center justify-between gap-3 question-header ${isOpen ? 'no-bottom-border no-bottom-radius' : ''}`} style={{ paddingTop: 0, paddingBottom: 0 }}>
                        <div className="font-medium fade-right-bottom-crop relative" style={{ minHeight: '1.8em', marginLeft: 0, flexGrow: 0, paddingLeft: 0 }}>
                            {/* Animated cropped question for no-title case */}
                            {question.titre ? (
                                <div style={{ fontSize: `calc(${baseTitleFontSize} * ${zoomFactor})` }}>
                                    <MathJaxWrapper>{question.titre}</MathJaxWrapper>
                                </div>
                            ) : (
                                <span
                                    style={{
                                        display: 'block',
                                        position: 'absolute',
                                        left: 0,
                                        right: 0,
                                        top: 0,
                                        zIndex: 2,
                                        transition: `transform ${isOpen ? '.5s' : '1s'} cubic-bezier(0.4,0,0.2,1)`,
                                        transform: isOpen ? 'translateY(120px)' : 'translateY(0)',
                                        fontSize: `calc(${baseTitleFontSize} * ${zoomFactor})`,
                                    }}
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
                                    className={`p-1 icon-control-hover rounded-full transition-colors duration-150 ${isActive ? '' : 'text-muted-foreground'}`}
                                    onClick={handlePlayPause}
                                    aria-label={effectiveIsRunning ? "Mettre en pause" : "Démarrer le chronomètre"}
                                    title={effectiveIsRunning ? "Mettre en pause" : "Démarrer le chronomètre"}
                                    disabled={disabled}
                                >
                                    {effectiveIsRunning ? <Pause size={20} /> : <Play size={20} />}
                                </button>
                                <button
                                    data-stop-btn
                                    className="p-1 icon-control-hover rounded-full transition-colors duration-150"
                                    onClick={(e) => { e.stopPropagation(); if (onStop) onStop(); }}
                                    aria-label="Arrêter le chronomètre"
                                    title="Arrêter le chronomètre"
                                    disabled={disabled || (!effectiveIsRunning && timerStatus !== 'pause')}
                                >
                                    <Square size={20} />
                                </button>
                                {/* Trophy button for closing and showing results */}
                                <button
                                    type="button"
                                    className="p-1 icon-control-hover rounded-full transition-colors duration-150 ml-1"
                                    title="Clôturer la question et afficher les résultats"
                                    aria-label="Clôturer la question et afficher les résultats"
                                    onClick={e => { e.stopPropagation(); if (onShowResults) onShowResults(); }}
                                    disabled={disabled || showResultsDisabled}
                                >
                                    <Trophy size={20} />
                                </button>
                                {/* ChartBarBig button for statistics */}
                                <button
                                    type="button"
                                    className={`p-1 icon-control-hover rounded-full transition-colors duration-150 ml-1 ${isStatsDisplayed ? 'text-primary' : ''}`}
                                    title={isStatsDisplayed ? "Masquer les statistiques" : "Afficher les statistiques"}
                                    aria-label={isStatsDisplayed ? "Masquer les statistiques" : "Afficher les statistiques"}
                                    onClick={handleStatsToggle}
                                    disabled={disabled}
                                >
                                    <ChartBarBig size={20} />
                                </button>
                            </div>
                        ) : showMeta && metaString ? (
                            <span
                                className="text-xs text-muted-foreground whitespace-nowrap ml-2"
                                style={{ fontSize: `calc(${baseMetaFontSize} * ${zoomFactor})` }}
                            >
                                {metaString}
                            </span>
                        ) : null}
                    </div>
                    {/* Move the gap to the expanded content only */}
                    <div className="mt-1 transition-all duration-500 ease-in-out" style={{ transitionProperty: 'margin-top', willChange: 'margin-top' }}>
                        {/* Animated full question + answers for both cases */}
                        <div
                            ref={contentRef}
                            className="collapsible-content"
                            style={{ maxHeight, zIndex: 1, position: 'relative' }}
                            aria-hidden={!isOpen && 'true'}
                        >
                            {question.titre ? (
                                <ul
                                    className={[
                                        "ml-0 mt-0 flex flex-col gap-2 answers-list p-3 rounded-b-xl rounded-t-none",
                                        isActive ? "answers-selected" : "",
                                        isOpen ? "no-top-border" : ""
                                    ].join(" ")}
                                >
                                    <li
                                        className="mb-2 font-medium text-base text-couleur-global-neutral-700"
                                        style={{ fontSize: `calc(${baseQuestionFontSize} * ${zoomFactor})` }}
                                    >
                                        <MathJaxWrapper>{question.question}</MathJaxWrapper>
                                    </li>
                                    {Array.isArray(question.reponses) && question.reponses.length > 0
                                        ? question.reponses.map((r, idx) => (
                                            <li key={idx} className="flex items-center ml-4 relative" style={{ minHeight: '2.25rem' }}>
                                                <div className="flex gap-2 items-center relative z-10 w-full">
                                                    {/* Percentage before icon, rounded to nearest integer */}
                                                    {typeof stats !== 'undefined' && (
                                                        <span className="font-semibold text-xs text-couleur-global-neutral-700" style={{ minWidth: 32, textAlign: 'right' }}>
                                                            {Math.round(getBarWidth(idx))}%
                                                        </span>
                                                    )}
                                                    <span className="answer-icon flex items-center">
                                                        {r.correct ? (
                                                            <Check size={18} strokeWidth={3} className="text-primary" />
                                                        ) : (
                                                            <X size={18} strokeWidth={3} className="text-secondary" />
                                                        )}
                                                    </span>
                                                    {/* Histogram bar as background, but starting after the icon */}
                                                    {typeof stats !== 'undefined' && (
                                                        <div
                                                            className="absolute left-0 top-1/2 -translate-y-1/2 rounded z-0"
                                                            style={{
                                                                left: 64, // 32px for percent + 32px for icon (adjust if needed)
                                                                width: `calc(${getBarWidth(idx)}% - 64px)`,
                                                                height: 'calc(100%)', // a few pixels taller than the row
                                                                background: 'var(--bar-stat, #888)',
                                                                opacity: 0.25,
                                                                transition: 'width 0.3s',
                                                                pointerEvents: 'none',
                                                            }}
                                                        />
                                                    )}
                                                    <div style={{ fontSize: `calc(${baseAnswerFontSize} * ${zoomFactor})` }}>
                                                        <MathJaxWrapper>
                                                            <span className="answer-text">{r.texte}</span>
                                                        </MathJaxWrapper>
                                                    </div>
                                                </div>
                                            </li>
                                        ))
                                        : <li className="italic text-muted-foreground">Aucune réponse définie</li>}
                                    {question.justification && (
                                        <div
                                            className="mt-4 pt-2 border-t border-base-300 text-sm text-base-content/70"
                                            style={{ fontSize: `calc(${baseJustificationFontSize} * ${zoomFactor})` }}
                                        >
                                            <span className="font-semibold">Justification :</span> {question.justification}
                                        </div>
                                    )}
                                </ul>
                            ) : (
                                <>
                                    <div
                                        className="mb-2 font-medium text-base text-couleur-global-neutral-700 pt-2"
                                        style={{ fontSize: `calc(${baseQuestionFontSize} * ${zoomFactor})` }}
                                    >
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
                                                <li key={idx} className="flex items-center ml-4 relative" style={{ minHeight: '2.25rem' }}>
                                                    <div className="flex gap-2 items-center relative z-10 w-full">
                                                        {/* Percentage before icon, rounded to nearest integer */}
                                                        {typeof stats !== 'undefined' && (
                                                            <span className="font-semibold text-xs text-couleur-global-neutral-700" style={{ minWidth: 32, textAlign: 'right' }}>
                                                                {Math.round(getBarWidth(idx))}%
                                                            </span>
                                                        )}
                                                        <span className="answer-icon flex items-center">
                                                            {r.correct ? (
                                                                <Check size={18} strokeWidth={3} className="text-primary" />
                                                            ) : (
                                                                <X size={18} strokeWidth={3} className="text-secondary" />
                                                            )}
                                                        </span>
                                                        {/* Histogram bar as background, but starting after the icon */}
                                                        {typeof stats !== 'undefined' && (
                                                            <div
                                                                className="absolute left-0 top-1/2 -translate-y-1/2 rounded z-0"
                                                                style={{
                                                                    left: 64, // 32px for percent + 32px for icon (adjust if needed)
                                                                    width: `calc(${getBarWidth(idx)}% - 64px)`,
                                                                    height: 'calc(100% + 6px)', // a few pixels taller than the row
                                                                    background: 'var(--bar-stat, #888)',
                                                                    opacity: 0.25,
                                                                    transition: 'width 0.3s',
                                                                    pointerEvents: 'none',
                                                                }}
                                                            />
                                                        )}
                                                        <div style={{ fontSize: `calc(${baseAnswerFontSize} * ${zoomFactor})` }}>
                                                            <MathJaxWrapper>
                                                                <span className="answer-text">{r.texte}</span>
                                                            </MathJaxWrapper>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))
                                            : <li className="italic text-muted-foreground">Aucune réponse définie</li>}
                                        {question.justification && (
                                            <div
                                                className="mt-4 pt-2 border-t border-base-300 text-sm text-base-content/70"
                                                style={{ fontSize: `calc(${baseJustificationFontSize} * ${zoomFactor})` }}
                                            >
                                                <span className="font-semibold">Justification :</span> {question.justification}
                                            </div>
                                        )}
                                    </ul>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestionDisplay;
