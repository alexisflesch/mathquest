import React, { useEffect, useRef, useState } from "react";
import { BookOpenCheck, CheckCircle, XCircle, X } from "lucide-react";
import { motion } from "framer-motion";
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import MathJaxWrapper from "./MathJaxWrapper";

interface AnswerFeedbackOverlayProps {
    explanation: string;
    duration?: number; // in seconds
    onClose?: () => void;
    isCorrect?: boolean;
    correctAnswers?: boolean[]; // Array of booleans indicating correct answers
    answerOptions?: string[]; // Array of answer options to convert boolean array to text
    showTimer?: boolean;
    mode?: 'tournament' | 'quiz' | 'practice';
    allowManualClose?: boolean;
}

const DEFAULT_DURATION = 5;

const AnswerFeedbackOverlay: React.FC<AnswerFeedbackOverlayProps> = ({
    explanation,
    duration = DEFAULT_DURATION,
    onClose,
    isCorrect,
    correctAnswers,
    answerOptions,
    showTimer = true,
    mode = 'tournament',
    allowManualClose = false,
}) => {
    const [visible, setVisible] = useState(true);
    const progressBarRef = useRef<HTMLDivElement>(null);

    const handleClose = () => {
        setVisible(false);
        onClose?.();
    };

    // Convert boolean array to text array
    const getCorrectAnswersText = () => {
        if (!correctAnswers || !answerOptions) return [];

        return correctAnswers
            .map((isCorrect, index) => isCorrect ? answerOptions[index] : null)
            .filter((text): text is string => text !== null);
    };

    useEffect(() => {
        if (showTimer && progressBarRef.current) {
            // Reset to 100% instantly, then animate to 0%
            progressBarRef.current.style.transition = 'none';
            progressBarRef.current.style.width = '100%';
            // Force reflow
            void progressBarRef.current.offsetWidth;
            progressBarRef.current.style.transition = `width ${duration}s linear`;
            progressBarRef.current.style.width = '0%';
        }

        // Note: No auto-close logic - parent component controls visibility
        // The duration is only used for the progress bar animation
        // Return empty cleanup function for consistency
        return () => { };
    }, [duration, showTimer]);

    if (!visible) return null;

    // Always use book icon and "Explication" text as requested
    const getIcon = () => {
        return <BookOpenCheck size={32} strokeWidth={2.4} />;
    };

    const getTitle = () => {
        return "Explication";
    };

    return (
        <div
            className="feedback-overlay"
            data-testid="feedback-overlay"
            role="dialog"
            aria-live="polite"
            onClick={mode === 'practice' ? handleClose : undefined} // Allow clicking anywhere in practice mode
            style={{ cursor: mode === 'practice' ? 'pointer' : 'default' }}
        >
            <div className="feedback-overlay-inner">
                <div
                    className="feedback-card max-w-xl w-[95%] mx-2"
                    style={{ width: '95%' }}
                    onClick={mode === 'practice' ? handleClose : undefined} // Allow clicking on card itself in practice mode
                >
                    {/* Manual close button for practice mode */}
                    {allowManualClose && (
                        <button
                            onClick={handleClose}
                            className="absolute top-2 right-2 btn btn-sm btn-circle btn-ghost"
                            aria-label="Close feedback"
                        >
                            <X size={16} />
                        </button>
                    )}

                    <div className="feedback-header">
                        <motion.span
                            className="feedback-icon"
                            animate={{ scale: [1, 1.15, 1], opacity: [1, 0.7, 1] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                        >
                            {getIcon()}
                        </motion.span>
                        {showTimer && (
                            <div className="feedback-timer-bar" style={{ flex: 1 }}>
                                <div
                                    className="feedback-timer-progress"
                                    ref={progressBarRef}
                                    style={{ width: '100%' }}
                                />
                            </div>
                        )}
                    </div>

                    <div className="feedback-title text-center mt-0">{getTitle()}</div>

                    {/* Show correct answers if provided and answer was incorrect */}
                    {isCorrect === false && correctAnswers && answerOptions && (
                        <div className="feedback-correct-answers mb-2 p-2 bg-base-200 rounded">
                            <div className="text-sm font-semibold text-success mb-1">Bonne réponse :</div>
                            <div className="text-sm">
                                {getCorrectAnswersText().join(', ')}
                            </div>
                        </div>
                    )}

                    <MathJaxWrapper>
                        <p className="feedback-text mb-3 p-2" data-testid="feedback-explanation">{explanation}</p>
                    </MathJaxWrapper>
                </div>
            </div>
        </div>
    );
};

export default AnswerFeedbackOverlay;
