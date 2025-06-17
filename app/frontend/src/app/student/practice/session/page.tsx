'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessageCircle, BarChart3, X } from 'lucide-react';
import { usePracticeSession } from '@/hooks/usePracticeSession';
import InfinitySpin from '@/components/InfinitySpin';
import LoadingScreen from '@/components/LoadingScreen';
import MathJaxWrapper from '@/components/MathJaxWrapper';
import QuestionCard from '@/components/QuestionCard';
import Snackbar from '@/components/Snackbar';
import AnswerFeedbackOverlay from '@/components/AnswerFeedbackOverlay';
import { createLogger } from '@/clientLogger';
import type { FilteredQuestion } from '@shared/types/quiz/liveQuestion';
import type { TournamentQuestion } from '@shared/types';

const logger = createLogger('PracticeSessionPage');

// Simple user data functions for practice mode
function getUserId(): string {
    if (typeof window === 'undefined') return 'practice-user';
    return localStorage.getItem('mathquest_user_id') || `practice-${Date.now()}`;
}

function getUsername(): string {
    if (typeof window === 'undefined') return 'Practice User';
    return localStorage.getItem('mathquest_username') || 'Practice User';
}

interface PracticeParams {
    discipline: string;
    level: string;
    themes: string[];
    limit: number;
    gameTemplateId?: string;
}

interface PracticeSessionPageProps {
    gameInstance?: any; // GameInstance from access code flow  
    practiceSettings?: any; // PracticeSettings from access code flow
}

export default function PracticeSessionPage({ gameInstance, practiceSettings }: PracticeSessionPageProps = {}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const userId = getUserId();
    const username = getUsername();

    // Parse practice parameters from URL
    const [practiceParams, setPracticeParams] = useState<PracticeParams>({
        discipline: '',
        level: '',
        themes: [],
        limit: 10,
        gameTemplateId: undefined
    });

    // UI state matching live page exactly
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>("");
    const [snackbarType, setSnackbarType] = useState<"success" | "error">("success");

    // Feedback overlay state (exactly like live page)
    const [showFeedbackOverlay, setShowFeedbackOverlay] = useState(false);
    const [feedbackText, setFeedbackText] = useState<string>("");
    const [feedbackDuration, setFeedbackDuration] = useState<number>(0);

    // Stats modal state
    const [showStatsModal, setShowStatsModal] = useState(false);

    // Extract practice parameters from props (access code flow) or URL (original flow)
    useEffect(() => {
        if (practiceSettings && gameInstance) {
            // Use data from GameInstance (access code flow)
            setPracticeParams({
                discipline: practiceSettings.discipline || '',
                level: practiceSettings.gradeLevel || '',
                themes: practiceSettings.themes || [],
                limit: practiceSettings.questionCount || 10,
                gameTemplateId: gameInstance.gameTemplateId || undefined
            });
        } else {
            // Extract from URL params (original flow)
            const discipline = searchParams.get("discipline") || "";
            const level = searchParams.get("gradeLevel") || "";
            const themesParam = searchParams.get("themes") || "";
            const limit = parseInt(searchParams.get("limit") || "10", 10);
            const gameTemplateId = searchParams.get("gameTemplateId") || "";
            const themes = themesParam ? themesParam.split(',').filter(t => t.trim()) : [];

            setPracticeParams({ discipline, level, themes, limit, gameTemplateId });
        }
    }, [searchParams, practiceSettings, gameInstance]);

    // Initialize practice session hook with auto-start when params are ready
    const {
        state: practiceState,
        startSession,
        submitAnswer,
        requestFeedback,
        getNextQuestion,
        endSession,
        clearError
    } = usePracticeSession({
        userId,
        settings: {
            discipline: practiceParams.discipline,
            gradeLevel: practiceParams.level,
            themes: practiceParams.themes,
            questionCount: practiceParams.limit,
            showImmediateFeedback: true,
            allowRetry: true,
            randomizeQuestions: false,
            gameTemplateId: practiceParams.gameTemplateId
        },
        autoStart: true // Auto-start session when connected and params are ready
    });

    // Manual session start trigger (fallback) - ensure session starts when params are ready
    useEffect(() => {
        // Only start if we have valid parameters and are connected but no session exists
        if (practiceParams.discipline && practiceParams.level &&
            practiceState.connected && !practiceState.session && !practiceState.connecting) {
            logger.debug('Manually starting practice session with params', practiceParams);
            startSession();
        }
    }, [practiceParams.discipline, practiceParams.level, practiceState.connected,
    practiceState.session, practiceState.connecting, startSession]);

    // Reset selected answers when question changes (like live page)
    const currentQuestionUid = practiceState.currentQuestion?.uid;
    useEffect(() => {
        setSelectedAnswer(null);
        setSelectedAnswers([]);
        setSnackbarOpen(false);
        setShowFeedbackOverlay(false);
    }, [currentQuestionUid]);

    // Helper: is multiple choice (exactly like live page)
    const isMultipleChoice = useMemo(() => {
        return practiceState.currentQuestion?.questionType === "choix_multiple";
    }, [practiceState.currentQuestion?.questionType]);

    // Handle single choice answer submission (exactly like live page)
    const handleSingleChoice = (idx: number) => {
        if (!practiceState.currentQuestion) return;

        setSelectedAnswer(idx === selectedAnswer ? null : idx);

        const clientTimestamp = Date.now();
        logger.debug('Submitting single choice answer', {
            questionUid: practiceState.currentQuestion.uid,
            answer: idx,
            clientTimestamp
        });

        submitAnswer(practiceState.currentQuestion.uid, [idx], clientTimestamp);
    };

    // Handle multiple choice answer submission (exactly like live page)
    const handleSubmitMultiple = () => {
        if (selectedAnswers.length === 0) {
            setSnackbarMessage("Veuillez sélectionner au moins une réponse.");
            setSnackbarType("error");
            setSnackbarOpen(true);
            return;
        }

        if (!practiceState.currentQuestion) return;

        const clientTimestamp = Date.now();
        logger.debug('Submitting multiple choice answers', {
            questionUid: practiceState.currentQuestion.uid,
            answers: selectedAnswers,
            clientTimestamp
        });

        submitAnswer(practiceState.currentQuestion.uid, selectedAnswers, clientTimestamp);
    };

    // Handle next question request (exactly like live page)
    const handleRequestNextQuestion = async () => {
        if (!practiceState.currentQuestion) return;

        try {
            await getNextQuestion();
            logger.debug('Requesting next question in practice mode');
        } catch (error) {
            logger.error('Failed to get next question', error);
            setSnackbarMessage("Failed to load next question");
            setSnackbarType("error");
            setSnackbarOpen(true);
        }
    };

    // Handle showing stats modal
    const handleShowStats = () => {
        setShowStatsModal(true);
    };

    // Convert practice question to format expected by QuestionCard (exactly like live page)
    const currentQuestion: TournamentQuestion | null = useMemo(() => {
        if (!practiceState.currentQuestion) return null;

        const convertedQuestion: FilteredQuestion = {
            uid: practiceState.currentQuestion.uid,
            text: practiceState.currentQuestion.text,
            questionType: practiceState.currentQuestion.questionType,
            answerOptions: practiceState.currentQuestion.answerOptions || []
        };

        return {
            question: convertedQuestion,
            remainingTime: undefined, // No timer for practice
            questionIndex: (practiceState.questionProgress?.currentQuestionNumber || 1) - 1, // Convert to 0-based index
            totalQuestions: practiceState.questionProgress?.totalQuestions || practiceParams.limit,
            tournoiState: 'running'
        };
    }, [practiceState.currentQuestion, practiceState.questionProgress, practiceParams.limit]);

    // Determine if component should be readonly (showing answers like live page)
    const isReadonly = useMemo(() => {
        return practiceState.hasAnswered; // After answer submitted, show correct answers
    }, [practiceState.hasAnswered]);

    // Handle feedback overlay effects (like live page)
    useEffect(() => {
        if (practiceState.lastFeedback?.explanation && practiceState.hasAnswered) {
            logger.debug('Setting feedback text from lastFeedback', {
                explanation: practiceState.lastFeedback.explanation,
                hasAnswered: practiceState.hasAnswered,
                questionUid: practiceState.currentQuestion?.uid
            });
            setFeedbackText(practiceState.lastFeedback.explanation);
            setFeedbackDuration(10);
            // Don't auto-show overlay - user must click the feedback button
        } else {
            logger.debug('No feedback text available', {
                hasExplanation: !!practiceState.lastFeedback?.explanation,
                hasAnswered: practiceState.hasAnswered,
                lastFeedback: practiceState.lastFeedback
            });
        }
    }, [practiceState.lastFeedback, practiceState.hasAnswered]);

    // Handle socket errors
    useEffect(() => {
        if (practiceState.error) {
            setSnackbarType("error");
            setSnackbarMessage(practiceState.error);
            setSnackbarOpen(true);
        }
    }, [practiceState.error]);

    // Loading state
    if (practiceState.connecting) {
        return <LoadingScreen message="Connexion à la session d'entraînement..." />;
    }

    // Error state with better UX
    if (practiceState.error) {
        const isConnectionError = practiceState.error.includes('serveur') ||
            practiceState.error.includes('connexion') ||
            practiceState.error.includes('réseau');

        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 flex items-center justify-center p-4">
                <div className="text-center bg-white dark:bg-base-200 p-8 rounded-lg shadow-lg max-w-md w-full">
                    <div className="text-red-600 dark:text-red-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d={isConnectionError
                                    ? "M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                    : "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"} />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-2">
                        {isConnectionError ? 'Problème de connexion' : 'Erreur'}
                    </h2>
                    <p className="text-red-600 dark:text-red-300 mb-6">{practiceState.error}</p>

                    <div className="space-y-3">
                        {isConnectionError && (
                            <button
                                onClick={() => {
                                    clearError();
                                    // Try to reconnect
                                    setTimeout(() => window.location.reload(), 100);
                                }}
                                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Réessayer la connexion
                            </button>
                        )}

                        <button
                            onClick={() => router.push('/student/practice')}
                            className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Retour aux paramètres
                        </button>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Recharger la page
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Session completed state
    if (practiceState.isCompleted && practiceState.session) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-lg shadow-lg">
                    <div className="text-green-600 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-green-800 mb-4">Practice Session Complete!</h2>
                    <div className="text-gray-600 mb-6">
                        <p>Questions Answered: {practiceState.session.statistics.questionsAttempted}</p>
                        <p>Correct Answers: {practiceState.session.statistics.correctAnswers}</p>
                        <p>Accuracy: {Math.round(practiceState.session.statistics.accuracyPercentage)}%</p>
                    </div>
                    <button
                        onClick={() => router.push('/student/practice')}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Back to Practice
                    </button>
                </div>
            </div>
        );
    }

    // No current question state
    if (!practiceState.currentQuestion) {
        return <LoadingScreen message="Chargement de la question..." />;
    }

    // Calculate current question number and accuracy properly
    const currentQuestionNumber = practiceState.questionProgress?.currentQuestionNumber || 1;
    const totalQuestions = practiceState.questionProgress?.totalQuestions || practiceParams.limit;
    const accuracy = practiceState.session?.statistics.accuracyPercentage || 0;

    // Main practice interface (exactly matching live page structure)
    return (
        <div className="main-content">
            {/* Feedback Overlay - exactly like live page */}
            {showFeedbackOverlay && (
                <div className="feedback-overlay">
                    <AnswerFeedbackOverlay
                        explanation={feedbackText}
                        duration={feedbackDuration}
                        onClose={() => setShowFeedbackOverlay(false)}
                        isCorrect={practiceState.lastFeedback?.isCorrect}
                        allowManualClose={true}
                        mode="practice"
                        showTimer={false} // Don't show decreasing timer in practice mode
                    />
                </div>
            )}

            {/* Main Question Card - exactly like live page */}
            <div className={`card w-full max-w-2xl bg-base-100 rounded-lg shadow-xl my-6 relative${showFeedbackOverlay || showStatsModal ? " blur-sm" : ""}`}>
                {/* No timer for practice mode - only difference from live page */}

                <MathJaxWrapper>
                    {currentQuestion ? (
                        <QuestionCard
                            currentQuestion={currentQuestion}
                            questionIndex={currentQuestionNumber - 1}
                            totalQuestions={totalQuestions}
                            isMultipleChoice={isMultipleChoice}
                            selectedAnswer={selectedAnswer}
                            setSelectedAnswer={setSelectedAnswer}
                            selectedAnswers={selectedAnswers}
                            setSelectedAnswers={setSelectedAnswers}
                            handleSingleChoice={handleSingleChoice}
                            handleSubmitMultiple={handleSubmitMultiple}
                            answered={practiceState.hasAnswered}
                            isQuizMode={false} // Set to false to show question title like live page in practice mode
                            readonly={isReadonly}
                            correctAnswers={practiceState.lastFeedback && practiceState.currentQuestion ?
                                practiceState.currentQuestion.answerOptions.map((_, answerIdx) =>
                                    practiceState.lastFeedback?.correctAnswers[answerIdx] || false
                                ) : undefined
                            }
                        />
                    ) : (
                        <div className="text-center text-lg text-gray-500 p-8">
                            {practiceState.connecting ? 'Connexion...' :
                                'En attente de la prochaine question...'
                            }
                        </div>
                    )}
                </MathJaxWrapper>

                {/* Practice mode controls inside the same card - exactly like live page */}
                {practiceState.hasAnswered && !showFeedbackOverlay && (
                    <div className="mt-4">
                        <div className="flex justify-between items-center">
                            {/* Left side: Explanation button - always available after answering */}
                            {practiceState.hasAnswered && practiceState.currentQuestion ? (
                                <button
                                    className="btn btn-outline btn-sm flex items-center gap-2"
                                    onClick={() => {
                                        // If we already have explanation, show it
                                        if (practiceState.lastFeedback?.explanation) {
                                            setShowFeedbackOverlay(true);
                                        } else if (practiceState.currentQuestion) {
                                            // Otherwise request explanation from server
                                            requestFeedback(practiceState.currentQuestion.uid);
                                        }
                                    }}
                                    title="Voir l'explication"
                                >
                                    <MessageCircle size={16} />
                                </button>
                            ) : (
                                <div></div> // Empty div to maintain spacing
                            )}

                            {/* Right side: Next question or home button */}
                            {currentQuestionNumber < totalQuestions ? (
                                <button
                                    className="btn btn-primary btn-sm flex items-center gap-2"
                                    onClick={handleRequestNextQuestion}
                                    disabled={!practiceState.currentQuestion}
                                >
                                    Suivant →
                                </button>
                            ) : (
                                <button
                                    className="btn btn-outline btn-sm flex items-center gap-2"
                                    onClick={handleShowStats}
                                >
                                    <BarChart3 size={16} />
                                    Bilan
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>            {/* Stats Modal - styled like feedback overlay with dark theme compatibility */}
            {showStatsModal && (
                <div
                    className="feedback-overlay"
                    role="dialog"
                    aria-live="polite"
                    onClick={() => setShowStatsModal(false)}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="feedback-overlay-inner">
                        <div
                            className="feedback-card max-w-md w-[95%] mx-2"
                            onClick={() => setShowStatsModal(false)}
                        >
                            {/* Close button */}
                            <button
                                onClick={() => setShowStatsModal(false)}
                                className="absolute top-2 right-2 btn btn-sm btn-circle btn-ghost"
                                aria-label="Fermer le bilan"
                            >
                                <X size={16} />
                            </button>

                            {/* Modal header with icon and title centered */}
                            <div className="feedback-header justify-center">
                                <span className="feedback-icon">
                                    <BarChart3 size={32} strokeWidth={2.4} />
                                </span>
                                <span className="feedback-title">Bilan de l'entraînement</span>
                            </div>

                            {/* Modal content */}
                            <div className="feedback-text space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-base-content/70">Discipline :</span>
                                    <span className="font-semibold">{practiceParams.discipline}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-base-content/70">Niveau :</span>
                                    <span className="font-semibold">{practiceParams.level}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-base-content/70">{practiceParams.themes.length === 1 ? 'Thème' : 'Thèmes'} :</span>
                                    <span className="font-semibold text-right flex-1 ml-2">
                                        {practiceParams.themes.length > 0 ? practiceParams.themes.join(', ') : 'Tous'}
                                    </span>
                                </div>

                                <hr className="border-base-content/20" />

                                <div className="flex justify-between items-center">
                                    <span className="text-base-content/70">Questions traitées :</span>
                                    <span className="font-semibold">{practiceState.session?.statistics.questionsAttempted || 0}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-base-content/70">Réponses correctes :</span>
                                    <span className="font-semibold text-success">{practiceState.session?.statistics.correctAnswers || 0}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-base-content/70">Précision :</span>
                                    <span className="font-semibold text-primary">{Math.round(practiceState.session?.statistics.accuracyPercentage || 0)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Snackbar for notifications - exactly like live page */}
            <Snackbar
                open={snackbarOpen}
                message={snackbarMessage}
                type={snackbarType}
                onClose={() => setSnackbarOpen(false)}
                className={showFeedbackOverlay || showStatsModal ? "blur-sm" : ""}
            />
        </div>
    );
}
