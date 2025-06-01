import React, { useEffect, useRef, useState } from "react";
import { BookOpenCheck } from "lucide-react";
import { motion } from "framer-motion";

interface AnswerFeedbackOverlayProps {
    explanation: string;
    duration?: number; // in seconds
    onClose?: () => void;
}

const DEFAULT_DURATION = 5;

const AnswerFeedbackOverlay: React.FC<AnswerFeedbackOverlayProps> = ({
    explanation,
    duration = DEFAULT_DURATION,
    onClose,
}) => {
    const [visible, setVisible] = useState(true);
    const progressBarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (progressBarRef.current) {
            // Reset to 100% instantly, then animate to 0%
            progressBarRef.current.style.transition = 'none';
            progressBarRef.current.style.width = '100%';
            // Force reflow
            void progressBarRef.current.offsetWidth;
            progressBarRef.current.style.transition = `width ${duration}s linear`;
            progressBarRef.current.style.width = '0%';
        }
        // Masquer l'overlay après la durée
        const timeout = setTimeout(() => {
            setVisible(false);
            onClose?.();
        }, duration * 1000);
        return () => clearTimeout(timeout);
    }, [duration]);

    if (!visible) return null;

    return (
        <div className="feedback-overlay" role="dialog" aria-live="polite">
            <div className="feedback-overlay-inner main-content-alignment">
                <div className="feedback-card max-w-xl w-[95%] mx-2" style={{ width: '95%' }}>
                    <div className="feedback-header">
                        <motion.span
                            className="feedback-icon"
                            animate={{ scale: [1, 1.15, 1], opacity: [1, 0.7, 1] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                        >
                            <BookOpenCheck size={32} strokeWidth={2.4} />
                        </motion.span>
                        <div className="feedback-timer-bar" style={{ flex: 1 }}>
                            <div
                                className="feedback-timer-progress"
                                ref={progressBarRef}
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>
                    <div className="feedback-title text-center mt-0">Explication&nbsp;:</div>
                    <p className="feedback-text mb-3 p-2">{explanation}</p>
                </div>
            </div>
        </div>
    );
};

export default AnswerFeedbackOverlay;
