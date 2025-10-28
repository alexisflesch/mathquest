/**
 * PracticeModeProgression Component
 * 
 * Handles the progression UI shown in practice mode after answering a question.
 * Shows "Next Question" or "Finish Training" buttons and optional explanation reopen.
 */

import React, { useEffect, useRef } from 'react';
import { createLogger } from '@/clientLogger';

const logger = createLogger('PracticeModeProgression');

interface PracticeModeProgressionProps {
    gameMode: string;
    answered: boolean;
    showFeedbackOverlay: boolean;
    questionIndex: number;
    totalQuestions: number;
    hasExplanation: boolean;
    currentQuestion: any;
    handleRequestNextQuestion: () => void;
    onReopenFeedback: () => void;
}

const PracticeModeProgression = React.memo(({
    gameMode,
    answered,
    showFeedbackOverlay,
    questionIndex,
    totalQuestions,
    hasExplanation,
    currentQuestion,
    handleRequestNextQuestion,
    onReopenFeedback
}: PracticeModeProgressionProps) => {
    // Re-render logging for performance monitoring
    const renderCount = useRef(0);
    const lastRenderTime = useRef(Date.now());

    useEffect(() => {
        renderCount.current++;
        const now = Date.now();
        const timeSinceLastRender = now - lastRenderTime.current;
        lastRenderTime.current = now;

        if (typeof window !== 'undefined' && window.location.search?.includes('mqdebug=1')) {
            logger.info(`🔄 [PRACTICE-RERENDER] PracticeModeProgression re-render #${renderCount.current} (${timeSinceLastRender}ms since last)`);
        }
    });

    if (gameMode !== 'practice' || !answered || showFeedbackOverlay) {
        return null;
    }

    return (
        <div className="p-4 text-center">
            <div className="space-y-2">
                <div className="text-sm text-gray-600">
                    Question {questionIndex + 1} sur {totalQuestions} terminée
                </div>
                {questionIndex < totalQuestions - 1 ? (
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={handleRequestNextQuestion}
                        disabled={!currentQuestion}
                        data-testid="practice-continue"
                    >
                        Question suivante →
                    </button>
                ) : (
                    <button
                        className="btn btn-success btn-lg"
                        onClick={handleRequestNextQuestion}
                        disabled={!currentQuestion}
                    >
                        Terminer l&apos;entraînement ✓
                    </button>
                )}

                {/* Show explanation again if available */}
                {hasExplanation && (
                    <button
                        className="btn btn-outline btn-sm"
                        onClick={onReopenFeedback}
                    >
                        Revoir l&apos;explication
                    </button>
                )}
            </div>
        </div>
    );
});

PracticeModeProgression.displayName = 'PracticeModeProgression';

export default PracticeModeProgression;
