import React, { useEffect, useRef, useState } from "react";
import { BookOpenCheck, CheckCircle, XCircle, X } from "lucide-react";
import { motion } from "framer-motion";

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

        // Auto-close after duration (unless manual close is allowed and user needs to close manually)
        if (!allowManualClose) {
            const timeout = setTimeout(() => {
                handleClose();
            }, duration * 1000);
            return () => clearTimeout(timeout);
        }

        // Return empty cleanup function for consistency
        return () => { };
    }, [duration, showTimer, allowManualClose]);

    if (!visible) return null;

    // Determine icon and styling based on correctness
    const getIcon = () => {
        if (isCorrect === true) {
            return <CheckCircle size={32} strokeWidth={2.4} className="text-success" />;
        } else if (isCorrect === false) {
            return <XCircle size={32} strokeWidth={2.4} className="text-error" />;
        }
        return <BookOpenCheck size={32} strokeWidth={2.4} />;
    };

    const getTitle = () => {
        if (isCorrect === true) {
            return "Correct !";
        } else if (isCorrect === false) {
            return "Incorrect";
        }
        return "Explication :";
    };

    return (
        <div className="feedback-overlay" role="dialog" aria-live="polite">
            <div className="feedback-overlay-inner main-content-alignment">
                <div className="feedback-card max-w-xl w-[95%] mx-2" style={{ width: '95%' }}>
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

                    <p className="feedback-text mb-3 p-2">{explanation}</p>

                    {/* Manual close hint for practice mode */}
                    {allowManualClose && (
                        <div className="text-xs text-base-content/60 text-center">
                            Cliquez sur × pour continuer
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnswerFeedbackOverlay;
