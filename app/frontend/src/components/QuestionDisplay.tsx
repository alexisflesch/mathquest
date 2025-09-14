import React, { useRef, useEffect, useState } from "react";
import { Play, Pause, Square, Check, X, Pencil, Trophy, ChartBarBig } from "lucide-react";
import { formatTime } from "@/utils"; // Assure-toi que ce chemin est correct
import MathJaxWrapper from '@/components/MathJaxWrapper'; // Assure-toi que ce chemin est correct
import { createLogger } from '@/clientLogger';
import { TimerField } from './TimerDisplayAndEdit';
import StatisticsChart from '@/components/StatisticsChart';

// Create a logger for this component
const logger = createLogger('QuestionDisplay');

// Helper function to convert modern question format to display format
function getAnswersForDisplay(question: any): any[] {
    console.log('[getAnswersForDisplay] Input question:', question);
    console.log('[getAnswersForDisplay] question.numericQuestion:', question.numericQuestion);
    console.log('[getAnswersForDisplay] question.numericQuestion type:', typeof question.numericQuestion);
    console.log('[getAnswersForDisplay] question.numericQuestion truthiness:', !!question.numericQuestion);

    // Handle polymorphic questions
    if (question.numericQuestion) {
        console.log('[getAnswersForDisplay] Processing numeric question:', question.numericQuestion);
        const correctAnswer = question.numericQuestion.correctAnswer;
        const unit = question.numericQuestion.unit;
        const answerText = unit ? `${correctAnswer} ${unit}` : String(correctAnswer);
        return [{ text: answerText, correct: true }];
    } else if (question.multipleChoiceQuestion) {
        console.log('[getAnswersForDisplay] Processing multiple choice question:', question.multipleChoiceQuestion);
        const answerOptions = question.multipleChoiceQuestion.answerOptions || [];
        const correctAnswers = question.multipleChoiceQuestion.correctAnswers || [];
        return answerOptions.map((option: string, index: number) => ({
            text: option,
            correct: correctAnswers[index] === true
        }));
    } else {
        console.log('[getAnswersForDisplay] No polymorphic question data found');
        return [];
    }
}// Helper function to get answer options from polymorphic question
function getAnswerOptions(question: QuestionDisplayProps['question']): string[] {
    if (question.multipleChoiceQuestion) {
        return question.multipleChoiceQuestion.answerOptions;
    }
    return [];
}

// Helper function to get correct answers from polymorphic question
function getCorrectAnswers(question: QuestionDisplayProps['question']): boolean[] {
    if (question.multipleChoiceQuestion) {
        return question.multipleChoiceQuestion.correctAnswers;
    }
    return [];
}

// Helper function to check if question has multiple choice data
function hasMultipleChoiceData(question: QuestionDisplayProps['question']): boolean {
    return !!(question.multipleChoiceQuestion);
}

import type { Question } from '@shared/types/core/question';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

// Types (modernized to use shared question format)
export interface QuestionDisplayProps {
    question: Question;
    // Props pour le contrôle externe
    isOpen?: boolean;
    onToggleOpen?: () => void;
    timerStatus?: "run" | "pause" | "stop";
    timeLeftMs?: number;
    onPlay?: () => void;
    onPause?: () => void;
    onStop?: () => void;
    // Props pour l'apparence/état
    isActive?: boolean; // Pour le style 'question-selected'
    disabled?: boolean;
    // Props pour l'édition (modern only, legacy edit UI is fully removed)
    onEditTimer?: (newTime: number) => void; // Canonical direct timer edit handler (used for test button and explicit timer edits)
    showSet44sButton?: boolean; // Show test button for teacher dashboard
    showControls?: boolean; // hide timer/play/stop if false
    className?: string; // allow passing custom className
    showMeta?: boolean; // show metadata if true
    zoomFactor?: number; // Add zoomFactor prop
    onShowResults?: () => void; // Ajouté pour le bouton Trophy
    onRevealLeaderboard?: () => void; // Canonical leaderboard reveal
    showResultsDisabled?: boolean; // Désactive le bouton Trophy
    correctAnswers?: number[]; // NEW: indices des réponses correctes à afficher (ex: [1,2])
    onStatsToggle?: (isDisplayed: boolean) => void; // NEW: callback for stats toggle
    stats?: { type: 'multipleChoice'; data: number[] } | { type: 'numeric'; data: number[] }; // NEW: answer stats with type discrimination
    // Checkbox props for selection
    showCheckbox?: boolean; // Show checkbox for selection
    checked?: boolean; // Checkbox state
    onCheckboxChange?: (checked: boolean) => void; // Checkbox change handler
    // NEW: Control behavior props
    hideExplanation?: boolean; // Hide explanation/justification section
    keepTitleWhenExpanded?: boolean; // Keep title visible when expanded (only hide fake titles)
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
    question,
    isOpen = false,
    onToggleOpen,
    timerStatus = "stop",
    timeLeftMs = (question.durationMs ?? 0), // Use canonical durationMs in milliseconds
    onPlay,
    onPause,
    onStop,
    isActive = false,
    disabled = false,
    onEditTimer, // Canonical
    showSet44sButton = false, // Canonical
    showControls = true,
    className = "",
    showMeta = false,
    zoomFactor = 1, // Destructure zoomFactor with default
    onShowResults, // Ajouté
    showResultsDisabled = false, // Ajouté
    correctAnswers,
    onStatsToggle, // NEW: destructure onStatsToggle
    stats, // NEW: destructure stats
    showCheckbox = false, // NEW: destructure showCheckbox
    checked = false, // NEW: destructure checked
    onCheckboxChange, // NEW: destructure onCheckboxChange
    onRevealLeaderboard, // Canonical leaderboard reveal
    hideExplanation = false, // NEW: destructure hideExplanation
    keepTitleWhenExpanded = false, // NEW: destructure keepTitleWhenExpanded
}) => {
    // Determine what content to show in collapsed vs expanded states to avoid redundancy
    const collapsedContent = question.title || question.text;
    const shouldShowTextInExpanded = !question.title || question.title !== question.text;

    // Get answers for display
    const answersForDisplay = getAnswersForDisplay(question);

    // Debug logging for numeric questions
    if (question.questionType === 'numeric') {
        console.log('[QuestionDisplay] Numeric question detected:', {
            uid: question.uid,
            questionType: question.questionType,
            numericQuestion: question.numericQuestion,
            answersForDisplay: answersForDisplay,
            answersLength: answersForDisplay.length
        });
    }

    // Détermine l'état effectif des boutons play/pause
    const effectiveIsRunning = timerStatus === 'run';
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
            setMaxHeight(contentRef.current.scrollHeight + 'px'); // Keep current height before collapsing
            requestAnimationFrame(() => {
                setMaxHeight('0px');
            });
        }
    }, [isOpen]); // Removed question and question.answers dependencies to prevent unnecessary re-calculations

    // Base font sizes (adjust based on actual Tailwind classes used)
    const baseTitleFontSize = '1rem'; // Assuming default size for title/cropped question
    const baseQuestionFontSize = '1rem'; // Assuming default size for full question body
    const baseAnswerFontSize = '1rem'; // Assuming default size for answer text
    const baseJustificationFontSize = '0.875rem'; // Assuming text-sm for justification
    const baseMetaFontSize = '0.75rem'; // Assuming text-xs for metadata

    // Timer display (read-only in this component)
    // Pass milliseconds (ms) directly to TimerField (canonical, no conversion, no legacy support)
    const timerDisplay = (
        <span className="flex items-center gap-1">
            <TimerField
                valueMs={typeof timeLeftMs === 'number' ? timeLeftMs : 0}
                onChange={(newValueMs) => {
                    if (!onEditTimer) return;
                    onEditTimer(newValueMs);
                }}
            />
        </span>
    );

    const metaString = [
        question.gradeLevel && question.gradeLevel,
        question.discipline,
        question.themes && question.themes.join(', ')
    ].filter(Boolean).join(' · ');

    // --- Stats display toggle state (for ChartBarBig) ---
    const [isStatsDisplayed, setIsStatsDisplayed] = useState(false);

    // Compute stats bar widths
    // The server already sends stats as percentages (0-100) for multiple choice
    const getBarWidth = (idx: number) => {
        if (!stats || stats.type !== 'multipleChoice' || typeof stats.data[idx] !== 'number') return 0;
        return stats.data[idx]; // Already a percentage
    };

    // // Handler for ChartBarBig click
    // const handleStatsToggle = (e: React.MouseEvent) => {
    //     e.stopPropagation();
    //     setIsStatsDisplayed((prev) => {
    //         const newState = !prev;
    //         // Use setTimeout to avoid setState-during-render warning
    //         setTimeout(() => {
    //             if (onStatsToggle) onStatsToggle(newState);
    //         }, 0);
    //         return newState;
    //     });
    // };

    // DEBUG: Log className and question.uid for each render
    logger.info(`[QuestionDisplay] Render: question.uid=${question.uid} className=${className}`);
    return (
        <div
            className={`question-display flex flex-col select-none transition-all duration-150 ease-in-out ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
            style={{ minWidth: 0 }}
            onClick={handleToggle}
            tabIndex={0}
            role="button"
            aria-expanded={isOpen}
        >
            <div
                className={`card w-full flex flex-col ${className}`}
                style={{ minWidth: 0 }}
            >
                <div className="flex flex-col">
                    <div className={`flex items-center justify-between gap-3 question-header ${isOpen ? 'no-bottom-border no-bottom-radius' : ''}`} style={{ paddingTop: 0, paddingBottom: 0 }}>
                        <div className="flex items-center gap-3 flex-1">
                            {/* Checkbox */}
                            {showCheckbox && (
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        if (onCheckboxChange) onCheckboxChange(e.target.checked);
                                    }}
                                    className="w-4 h-4 text-[color:var(--primary)] border-gray-300 rounded focus:ring-0 flex-shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            )}
                            <div className="font-medium fade-right-bottom-crop relative" style={{ minHeight: '1.8em', marginLeft: 0, flexGrow: 0, paddingLeft: 0 }}>
                                {/* For both cases, use the same layout: a span with fade-right-bottom-crop, absolute for no-title, static for title */}
                                <span
                                    className="fade-right-bottom-crop question-text-in-dashboards"
                                    style={{
                                        display: 'block',
                                        position: 'absolute',
                                        left: 0,
                                        right: 0,
                                        top: 0,
                                        zIndex: 2,
                                        transition: `transform ${isOpen ? '.5s' : '1s'} cubic-bezier(0.4,0,0.2,1)`,
                                        // Only hide title when expanded if it's a fake title (no real title) and keepTitleWhenExpanded is false
                                        transform: (isOpen && !question.title && !keepTitleWhenExpanded) ? 'translateY(120px)' : 'translateY(0)',
                                        fontSize: `calc(${baseTitleFontSize} * ${zoomFactor})`,
                                    }}
                                >
                                    <MathJaxWrapper>{collapsedContent}</MathJaxWrapper>
                                </span>
                            </div>
                        </div>
                        {/* Only one of these will render, always right-aligned */}
                        {showControls ? (
                            <div className="flex items-center gap-0 ml-2">
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
                                {/* Trophy button for closing and showing results
                                <button
                                    type="button"
                                    className="p-1 icon-control-hover rounded-full transition-colors duration-150 ml-1"
                                    title="Clôturer la question et afficher les résultats"
                                    aria-label="Clôturer la question et afficher les résultats"
                                    onClick={e => {
                                        e.stopPropagation();
                                        if (onShowResults) onShowResults();
                                        if (onRevealLeaderboard) onRevealLeaderboard();
                                    }}
                                    disabled={disabled || showResultsDisabled}
                                >
                                    <Trophy size={20} />
                                </button> */}
                                {/* ChartBarBig button for statistics */}
                                {/* <button
                                    type="button"
                                    className={`p-1 icon-control-hover rounded-full transition-colors duration-150 ml-1 ${isStatsDisplayed ? 'text-primary' : ''}`}
                                    title={isStatsDisplayed ? "Masquer les statistiques" : "Afficher les statistiques"}
                                    aria-label={isStatsDisplayed ? "Masquer les statistiques" : "Afficher les statistiques"}
                                    onClick={handleStatsToggle}
                                    disabled={disabled}
                                >
                                    <ChartBarBig size={20} />
                                </button> */}
                                {timerDisplay}
                                {/* TEST BUTTON: Only show if showSet44sButton and onEditTimer are provided */}
                                {showSet44sButton && onEditTimer && (
                                    <button
                                        className="ml-2 btn btn-xs btn-accent"
                                        onClick={e => { e.stopPropagation(); onEditTimer(44); }}
                                        title="Set timer to 44s (test)"
                                        type="button"
                                    >
                                        Set 44s
                                    </button>
                                )}
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
                            {question.title ? ( // Modifié: question.titre -> question.title
                                <ul
                                    className={[
                                        "ml-0 mt-0 flex flex-col",
                                        stats && stats.type === 'numeric' ? "gap-1" : "gap-2",
                                        "answers-list p-3 rounded-b-xl rounded-t-none",
                                        isOpen ? "no-top-border" : ""
                                    ].join(" ")}
                                >
                                    {shouldShowTextInExpanded && (
                                        <li
                                            className="mb-2 font-medium text-base text-couleur-global-neutral-700 question-text-in-dashboards"
                                            style={{ fontSize: `calc(${baseQuestionFontSize} * ${zoomFactor})` }}
                                        >
                                            <MathJaxWrapper>{question.text}</MathJaxWrapper>
                                        </li>
                                    )}
                                    {answersForDisplay.length > 0
                                        ? answersForDisplay.map(({ text: answerText, correct }, idx) => (
                                            <li key={idx} className="flex items-center ml-4 relative" style={{ minHeight: '2.25rem' }}>
                                                <div className="flex gap-2 items-center relative z-10 w-full">
                                                    {/* Percentage before icon, rounded to nearest integer */}
                                                    {typeof stats !== 'undefined' && stats.type === 'multipleChoice' && (
                                                        <span className="font-semibold text-xs text-couleur-global-neutral-700" style={{ minWidth: 32, textAlign: 'right' }}>
                                                            {Math.round(getBarWidth(idx))}%
                                                        </span>
                                                    )}
                                                    <span className="answer-icon flex items-center">
                                                        {correct ? (
                                                            <Check size={18} strokeWidth={3} className="text-primary" />
                                                        ) : (
                                                            <X size={18} strokeWidth={3} className="text-secondary" />
                                                        )}
                                                    </span>
                                                    {/* Histogram bar as background, but starting after the icon */}
                                                    {typeof stats !== 'undefined' && stats.type === 'multipleChoice' && (
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
                                                            <span className="answer-text">{answerText}</span>
                                                        </MathJaxWrapper>
                                                    </div>
                                                </div>
                                            </li>
                                        ))
                                        : (
                                            // Show StatisticsChart for numeric questions, otherwise show no answers message
                                            stats && stats.type === 'numeric' ? (
                                                <li className="flex justify-center">
                                                    <div style={{ width: '500px', height: '300px', maxWidth: '100%', maxHeight: '100%' }} onClick={(e) => e.stopPropagation()}>
                                                        <StatisticsChart
                                                            data={stats.data}
                                                            layout="left"
                                                        />
                                                    </div>
                                                </li>
                                            ) : (
                                                <li className="italic text-muted-foreground">Aucune réponse définie</li>
                                            )
                                        )}
                                    {/* Show StatisticsChart for numeric questions after answers */}
                                    {stats && stats.type === 'numeric' && answersForDisplay.length > 0 && (
                                        <li className="flex justify-center">
                                            <div style={{ width: '500px', height: '300px', maxWidth: '100%', maxHeight: '100%' }} onClick={(e) => e.stopPropagation()}>
                                                <StatisticsChart
                                                    data={stats.data}
                                                    layout="left"
                                                />
                                            </div>
                                        </li>
                                    )}
                                    {!hideExplanation && question.explanation && ( // Conditionally show explanation
                                        <div
                                            className="mt-4 pt-2 border-t border-base-300 text-sm text-base-content/70"
                                            style={{ fontSize: `calc(${baseJustificationFontSize} * ${zoomFactor})` }}
                                        >
                                            <span className="font-semibold">Justification :</span> {question.explanation}
                                        </div>
                                    )}
                                </ul>
                            ) : (
                                <>
                                    {shouldShowTextInExpanded && (
                                        <div
                                            className="mb-2 font-medium text-base text-couleur-global-neutral-700 pt-2 question-text-in-dashboards"
                                            style={{ fontSize: `calc(${baseQuestionFontSize} * ${zoomFactor})` }}
                                        >
                                            <MathJaxWrapper>{question.text}</MathJaxWrapper>
                                        </div>
                                    )}
                                    <ul
                                        className={[
                                            "ml-0 mt-0 flex flex-col gap-2 answers-list p-3 rounded-b-xl rounded-t-none",
                                            isOpen ? "no-top-border" : ""
                                        ].join(" ")}
                                    >
                                        {answersForDisplay.length > 0
                                            ? answersForDisplay.map(({ text: answerText, correct }, idx) => (
                                                <li key={idx} className="flex items-center ml-4 relative" style={{ minHeight: '2.25rem' }}>
                                                    <div className="flex gap-2 items-center relative z-10 w-full">
                                                        {/* Percentage before icon, rounded to nearest integer */}
                                                        {typeof stats !== 'undefined' && stats.type === 'multipleChoice' && (
                                                            <span className="font-semibold text-xs text-couleur-global-neutral-700" style={{ minWidth: 32, textAlign: 'right' }}>
                                                                {Math.round(getBarWidth(idx))}%
                                                            </span>
                                                        )}
                                                        <span className="answer-icon flex items-center">
                                                            {correct ? (
                                                                <Check size={18} strokeWidth={3} className="text-primary" />
                                                            ) : (
                                                                <X size={18} strokeWidth={3} className="text-secondary" />
                                                            )}
                                                        </span>
                                                        {/* Histogram bar as background, but starting after the icon */}
                                                        {typeof stats !== 'undefined' && stats.type === 'multipleChoice' && (
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
                                                                <span className="answer-text">{answerText}</span>
                                                            </MathJaxWrapper>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))
                                            : (
                                                // Show StatisticsChart for numeric questions, otherwise show no answers message
                                                stats && stats.type === 'numeric' ? (
                                                    <li className="flex justify-center">
                                                        <div style={{ width: '500px', height: '300px', maxWidth: '100%', maxHeight: '100%' }} onClick={(e) => e.stopPropagation()}>
                                                            <StatisticsChart
                                                                data={stats.data}
                                                                layout="left"
                                                            />
                                                        </div>
                                                    </li>
                                                ) : (
                                                    <li className="italic text-muted-foreground">Aucune réponse définie</li>
                                                )
                                            )}
                                        {/* Show StatisticsChart for numeric questions after answers */}
                                        {stats && stats.type === 'numeric' && answersForDisplay.length > 0 && (
                                            <li className="flex justify-center mt-4">
                                                <div style={{ width: '500px', height: '300px', maxWidth: '100%', maxHeight: '100%' }} onClick={(e) => e.stopPropagation()}>
                                                    <StatisticsChart
                                                        data={stats.data}
                                                        layout="left"
                                                    />
                                                </div>
                                            </li>
                                        )}
                                        {!hideExplanation && question.explanation && ( // Conditionally show explanation
                                            <div
                                                className="mt-4 pt-2 border-t border-base-300 text-sm text-base-content/70"
                                                style={{ fontSize: `calc(${baseJustificationFontSize} * ${zoomFactor})` }}
                                            >
                                                <span className="font-semibold">Justification :</span> {question.explanation}
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

// Memoize QuestionDisplay to prevent unnecessary re-renders
export default React.memo(QuestionDisplay, (prevProps, nextProps) => {
    // Compare essential props that affect rendering
    if (prevProps.isOpen !== nextProps.isOpen) return false;
    if (prevProps.isActive !== nextProps.isActive) return false;
    if (prevProps.disabled !== nextProps.disabled) return false;
    if (prevProps.timerStatus !== nextProps.timerStatus) return false;
    if (prevProps.showResultsDisabled !== nextProps.showResultsDisabled) return false;

    // Only compare timeLeftMs if there's a meaningful difference (>= 1 second)
    const timeDiff = Math.abs((prevProps.timeLeftMs ?? 0) - (nextProps.timeLeftMs ?? 0));
    if (timeDiff >= 1) return false;

    // Compare question object - only key fields that affect display
    if (prevProps.question.uid !== nextProps.question.uid) return false;
    if (prevProps.question.text !== nextProps.question.text) return false;
    if (prevProps.question.durationMs !== nextProps.question.durationMs) return false;

    // Compare answers array length and content for polymorphic questions
    const prevAnswerOptions = getAnswerOptions(prevProps.question);
    const nextAnswerOptions = getAnswerOptions(nextProps.question);
    if (prevAnswerOptions.length !== nextAnswerOptions.length) return false;

    // Compare stats array for meaningful changes
    if (prevProps.stats?.type !== nextProps.stats?.type) return false;

    if (prevProps.stats && nextProps.stats) {
        if (prevProps.stats.data.length !== nextProps.stats.data.length) return false;
        for (let i = 0; i < prevProps.stats.data.length; i++) {
            if (prevProps.stats.data[i] !== nextProps.stats.data[i]) return false;
        }
    }

    // CRITICAL: Compare className for style changes (terminated, etc)
    if (prevProps.className !== nextProps.className) return false;

    return true; // No meaningful changes detected
});
