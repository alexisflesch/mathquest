'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import LoadingScreen from '@/components/LoadingScreen';
import { createLogger } from '@/clientLogger';
import { makeApiRequest } from '@/config/api';
import type { PracticeSettings } from '@shared/types/practice/session';

// Import the original practice session component
import PracticeSessionPage from '../session/page';

const logger = createLogger('PracticeSessionWithAccessCode');

interface GameInstance {
    id: string;
    name: string;
    accessCode: string;
    playMode: string;
    settings: {
        practiceSettings: PracticeSettings;
        [key: string]: any;
    };
}

export default function PracticeSessionWithAccessCodePage() {
    const params = useParams();
    const router = useRouter();
    const accessCode = params?.accessCode as string;

    const [gameInstance, setGameInstance] = useState<GameInstance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!accessCode) {
            setError('No access code provided');
            setLoading(false);
            return;
        }

        const fetchGameInstance = async () => {
            try {
                logger.info('Fetching game instance for access code:', accessCode);
                
                const response = await makeApiRequest<GameInstance>(`/api/games/access-code/${accessCode}`, {
                    method: 'GET',
                });

                if (!response.success || !response.data) {
                    throw new Error(response.error || 'Failed to fetch game instance');
                }

                const instance = response.data;
                
                // Verify this is a practice session
                if (instance.playMode !== 'practice') {
                    logger.warn('Game instance is not a practice session, redirecting to appropriate page');
                    // Redirect to the appropriate page based on playMode
                    router.push(`/student/join?accessCode=${accessCode}`);
                    return;
                }

                logger.info('Successfully loaded practice game instance:', instance);
                setGameInstance(instance);
                setLoading(false);
            } catch (err) {
                logger.error('Error fetching game instance:', err);
                setError(err instanceof Error ? err.message : 'Failed to load practice session');
                setLoading(false);
            }
        };

        fetchGameInstance();
    }, [accessCode, router]);

    // Show loading state
    if (loading) {
        return (
            <LoadingScreen 
                message="Loading practice session..." 
                subMessage="Fetching session details"
            />
        );
    }

    // Show error state
    if (error || !gameInstance) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <h1 className="text-xl font-bold text-red-600 mb-4">Session Not Found</h1>
                    <p className="text-gray-600 mb-6">
                        {error || 'Could not find a practice session with this access code.'}
                    </p>
                    <button
                        onClick={() => router.push('/student')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Convert GameInstance settings to URL params for the original component
    const practiceSettings = gameInstance.settings.practiceSettings;
    const searchParams = new URLSearchParams({
        discipline: practiceSettings.discipline || '',
        gradeLevel: practiceSettings.gradeLevel || '',
        themes: practiceSettings.themes?.join(',') || '',
        limit: practiceSettings.questionCount?.toString() || '10'
    });

    // Use a wrapper div to inject the URL params context
    return (
        <div>
            {/* Temporarily update the URL to match what the original component expects */}
            <PracticeSessionPageWrapper searchParams={searchParams} />
        </div>
    );
}

// Wrapper component to provide the search params context
function PracticeSessionPageWrapper({ searchParams }: { searchParams: URLSearchParams }) {
    useEffect(() => {
        // Update the current URL to include the practice parameters
        // This allows the original component to read them via useSearchParams
        const currentUrl = new URL(window.location.href);
        const currentPath = currentUrl.pathname;
        
        // Append the search params to current URL
        window.history.replaceState(
            null, 
            '', 
            `${currentPath}?${searchParams.toString()}`
        );
    }, [searchParams]);

    return <PracticeSessionPage />;
}

            } catch (error) {
                logger.error('Error fetching GameInstance', error);
                setGameInstanceError('Impossible de charger la session d\'entraînement');
                setLoadingGameInstance(false);
            }
        };

        fetchGameInstance();
    }, [accessCode]);

    // Initialize practice session hook with auto-start when params are ready (same as original)
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
            randomizeQuestions: false
        },
        autoStart: true // Auto-start session when connected and params are ready
    });

    // Manual session start trigger (fallback) - same as original
    useEffect(() => {
        // Only start if we have valid parameters and are connected but no session exists
        if (practiceParams.discipline && practiceParams.level &&
            practiceState.connected && !practiceState.session && !practiceState.connecting) {
            logger.debug('Manually starting practice session with params', practiceParams);
            startSession();
        }
    }, [practiceParams.discipline, practiceParams.level, practiceState.connected,
    practiceState.session, practiceState.connecting, startSession]);

    // Reset selected answers when question changes (same as original)
    const currentQuestionUid = practiceState.currentQuestion?.uid;
    useEffect(() => {
        setSelectedAnswer(null);
        setSelectedAnswers([]);
        setSnackbarOpen(false);
        setShowFeedbackOverlay(false);
    }, [currentQuestionUid]);

    // Helper: is multiple choice (same as original)
    const isMultipleChoice = useMemo(() => {
        return practiceState.currentQuestion?.questionType === "choix_multiple";
    }, [practiceState.currentQuestion?.questionType]);

    // All the handler functions exactly the same as original
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

    const handleMultipleChoice = (idx: number) => {
        setSelectedAnswers(prev => {
            if (prev.includes(idx)) {
                return prev.filter(i => i !== idx);
            } else {
                return [...prev, idx];
            }
        });
    };

    const handleRequestNextQuestion = () => {
        if (!practiceState.sessionId) return;
        getNextQuestion();
    };

    const handleShowStats = () => {
        setShowStatsModal(true);
    };

    const handleEndSession = () => {
        if (!practiceState.sessionId) return;
        endSession('user_quit');
        router.push('/student/create-game?training=true');
    };

    // Show loading screen while fetching GameInstance (NEW - not in original)
    if (loadingGameInstance) {
        return (
            <LoadingScreen 
                message="Chargement de la session d'entraînement..." 
            />
        );
    }

    // Show error if GameInstance couldn't be loaded (NEW - not in original)
    if (gameInstanceError) {
        return (
            <div className="min-h-screen bg-[color:var(--background)] flex items-center justify-center p-4">
                <div className="bg-[color:var(--card)] rounded-xl p-8 text-center max-w-md">
                    <div className="text-4xl mb-4">⚠️</div>
                    <h1 className="text-xl font-bold mb-4 text-[color:var(--foreground)]">
                        Erreur de chargement
                    </h1>
                    <p className="text-[color:var(--muted-foreground)] mb-6">
                        {gameInstanceError}
                    </p>
                    <button
                        onClick={() => router.push('/student/create-game?training=true')}
                        className="px-6 py-2 bg-[color:var(--primary)] text-[color:var(--primary-foreground)] rounded-lg hover:bg-opacity-90 transition-colors"
                    >
                        Retour à la création
                    </button>
                </div>
            </div>
        );
    }

    // From here, it's exactly the same as the original practice page
    // Show initial loading
    if (!practiceState.connected || practiceState.connecting) {
        return (
            <LoadingScreen 
                message="Connexion à l'entraînement..." 
            />
        );
    }

    // Connection error handling
    if (practiceState.error) {
        logger.error("Practice session error:", practiceState.error);
        return (
            <div className="min-h-screen bg-[color:var(--background)] flex items-center justify-center p-4">
                <div className="bg-[color:var(--card)] rounded-xl p-8 text-center max-w-md">
                    <div className="text-4xl mb-4">❌</div>
                    <h1 className="text-xl font-bold mb-4 text-[color:var(--foreground)]">
                        Erreur de connexion
                    </h1>
                    <p className="text-[color:var(--muted-foreground)] mb-6">
                        {practiceState.error}
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={clearError}
                            className="px-4 py-2 bg-[color:var(--secondary)] text-[color:var(--secondary-foreground)] rounded-lg hover:bg-opacity-90 transition-colors"
                        >
                            Réessayer
                        </button>
                        <button
                            onClick={() => router.push('/student/create-game?training=true')}
                            className="px-4 py-2 bg-[color:var(--primary)] text-[color:var(--primary-foreground)] rounded-lg hover:bg-opacity-90 transition-colors"
                        >
                            Nouvelle session
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Show completion screen
    if (practiceState.isCompleted && practiceState.completionSummary) {
        return (
            <div className="min-h-screen bg-[color:var(--background)] flex items-center justify-center p-4">
                <div className="bg-[color:var(--card)] rounded-xl p-8 text-center max-w-md">
                    <div className="text-6xl mb-6">🎉</div>
                    <h1 className="text-2xl font-bold mb-4 text-[color:var(--foreground)]">
                        Bravo ! Entraînement terminé.
                    </h1>
                    <div className="space-y-3 mb-6 text-[color:var(--muted-foreground)]">
                        <p><strong>Questions répondues:</strong> {practiceState.completionSummary.totalQuestions}</p>
                        <p><strong>Bonnes réponses:</strong> {practiceState.completionSummary.correctAnswers}</p>
                        <p><strong>Précision:</strong> {practiceState.completionSummary.finalAccuracy.toFixed(1)}%</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push('/student/create-game?training=true')}
                            className="px-6 py-2 bg-[color:var(--primary)] text-[color:var(--primary-foreground)] rounded-lg hover:bg-opacity-90 transition-colors"
                        >
                            Nouvel entraînement
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Main UI render - continue exactly like original below this point
    // Helper variables for display
    const currentQuestion = practiceState.currentQuestion;
    const currentQuestionNumber = practiceState.questionProgress?.currentQuestionNumber || 1;
    const totalQuestions = practiceState.questionProgress?.totalQuestions || 1;
    const isReadonly = practiceState.hasAnswered;

    // Main practice session UI (exactly like original)
    return (
        <div className="min-h-screen bg-[color:var(--background)] bg-dots-pattern">
            {/* Header section with navigation and progress - exactly like original but with access code display */}
            <div className="bg-[color:var(--card)] border-b border-[color:var(--border)] shadow-sm">
                <div className="max-w-2xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        {/* Left side */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.push('/student/create-game?training=true')}
                                className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
                                aria-label="Retour"
                            >
                                ← Retour
                            </button>
                            
                            {practiceState.questionProgress && (
                                <div className="text-sm">
                                    <span className="text-[color:var(--muted-foreground)]">Question</span>
                                    <span className="mx-1 font-medium text-[color:var(--foreground)]">
                                        {currentQuestionNumber}
                                    </span>
                                    <span className="text-[color:var(--muted-foreground)]">sur {totalQuestions}</span>
                                </div>
                            )}

                            {/* NEW: Show access code */}
                            <div className="text-xs px-2 py-1 bg-[color:var(--secondary)] text-[color:var(--secondary-foreground)] rounded">
                                Code: {accessCode}
                            </div>
                        </div>

                        {/* Right side */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleShowStats}
                                className="p-2 text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] rounded-lg hover:bg-[color:var(--muted)] transition-colors"
                                title="Voir les statistiques"
                            >
                                <BarChart3 size={18} />
                            </button>
                            <button
                                onClick={handleEndSession}
                                className="p-2 text-[color:var(--muted-foreground)] hover:text-[color:var(--alert)] rounded-lg hover:bg-[color:var(--muted)] transition-colors"
                                title="Terminer l'entraînement"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content area - exactly like original */}
            <div className="max-w-2xl mx-auto p-4">
                {/* Main Question Card - exactly like original */}
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

                    {/* Practice mode controls inside the same card - exactly like original */}
                    {practiceState.hasAnswered && !showFeedbackOverlay && (
                        <div className="mt-4">
                            <div className="flex justify-between items-center">
                                {/* Left side: Explanation button */}
                                {practiceState.lastFeedback?.explanation ? (
                                    <button
                                        className="btn btn-outline btn-sm flex items-center gap-2"
                                        onClick={() => setShowFeedbackOverlay(true)}
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
                </div>

                {/* Rest of the original UI components exactly as they are */}
                {/* Stats Modal - exactly like original */}
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
                                    <h2 className="feedback-title">Statistiques de l'entraînement</h2>
                                </div>

                                {/* Stats content */}
                                <div className="feedback-content space-y-4">
                                    {practiceState.session && (
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="bg-[color:var(--muted)] p-3 rounded-lg text-center">
                                                <div className="text-xl font-bold text-[color:var(--foreground)]">
                                                    {practiceState.session.statistics.questionsAttempted}
                                                </div>
                                                <div className="text-[color:var(--muted-foreground)]">Questions tentées</div>
                                            </div>

                                            <div className="bg-[color:var(--muted)] p-3 rounded-lg text-center">
                                                <div className="text-xl font-bold text-[color:var(--success)]">
                                                    {practiceState.session.statistics.correctAnswers}
                                                </div>
                                                <div className="text-[color:var(--muted-foreground)]">Bonnes réponses</div>
                                            </div>

                                            <div className="bg-[color:var(--muted)] p-3 rounded-lg text-center">
                                                <div className="text-xl font-bold text-[color:var(--alert)]">
                                                    {practiceState.session.statistics.incorrectAnswers}
                                                </div>
                                                <div className="text-[color:var(--muted-foreground)]">Erreurs</div>
                                            </div>

                                            <div className="bg-[color:var(--muted)] p-3 rounded-lg text-center">
                                                <div className="text-xl font-bold text-[color:var(--primary)]">
                                                    {practiceState.session.statistics.accuracyPercentage.toFixed(1)}%
                                                </div>
                                                <div className="text-[color:var(--muted-foreground)]">Précision</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer actions */}
                                <div className="feedback-footer">
                                    <button
                                        onClick={() => setShowStatsModal(false)}
                                        className="btn btn-primary btn-sm w-full"
                                    >
                                        Continuer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Feedback overlay - exactly like original */}
                {showFeedbackOverlay && practiceState.lastFeedback?.explanation && (
                    <AnswerFeedbackOverlay
                        explanation={practiceState.lastFeedback.explanation}
                        duration={feedbackDuration}
                        onClose={() => setShowFeedbackOverlay(false)}
                        mode="practice"
                        allowManualClose={true}
                    />
                )}

                {/* Snackbar - exactly like original */}
                <Snackbar
                    open={snackbarOpen}
                    message={snackbarMessage}
                    type={snackbarType}
                    onClose={() => setSnackbarOpen(false)}
                />
            </div>
        </div>
    );

    // UI state matching existing practice page exactly
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>("");
    const [snackbarType, setSnackbarType] = useState<"success" | "error">("success");

    // Feedback overlay state (exactly like existing practice page)
    const [showFeedbackOverlay, setShowFeedbackOverlay] = useState(false);
    const [feedbackText, setFeedbackText] = useState<string>("");
    const [feedbackDuration, setFeedbackDuration] = useState<number>(0);

    // Stats modal state
    const [showStatsModal, setShowStatsModal] = useState(false);

    // Extract practice settings from GameInstance
    const practiceSettings = useMemo(() => {
        if (!gameInstance?.settings?.practiceSettings) {
            return null;
        }
        return gameInstance.settings.practiceSettings;
    }, [gameInstance]);

    // Fetch GameInstance details on component mount
    useEffect(() => {
        const fetchGameInstance = async () => {
            if (!accessCode) {
                setGameInstanceError('Code d\'accès manquant');
                setLoadingGameInstance(false);
                return;
            }

            try {
                setLoadingGameInstance(true);
                setGameInstanceError(null);

                logger.info('Fetching GameInstance', { accessCode });

                const response = await makeApiRequest<{ gameInstance: GameInstance }>(`games/${accessCode}`);

                logger.info('GameInstance fetched', response);

                if (response.gameInstance.playMode !== 'practice') {
                    setGameInstanceError('Ce code ne correspond pas à une session d\'entraînement');
                    setLoadingGameInstance(false);
                    return;
                }

                setGameInstance(response.gameInstance);
                setLoadingGameInstance(false);

            } catch (error) {
                logger.error('Error fetching GameInstance', error);
                setGameInstanceError('Impossible de charger la session d\'entraînement');
                setLoadingGameInstance(false);
            }
        };

        fetchGameInstance();
    }, [accessCode]);

    // Initialize practice session hook with extracted settings
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
        settings: practiceSettings || {
            gradeLevel: '',
            discipline: '',
            themes: [],
            questionCount: 10,
            showImmediateFeedback: true,
            allowRetry: true,
            randomizeQuestions: false
        },
        autoStart: false // Don't auto-start until we have settings
    });

    // Start session when practice settings are available
    useEffect(() => {
        if (practiceSettings && practiceState.connected && !practiceState.session && !practiceState.connecting) {
            logger.debug('Starting practice session with settings', practiceSettings);
            startSession();
        }
    }, [practiceSettings, practiceState.connected, practiceState.session, practiceState.connecting, startSession]);

    // Reset selected answers when question changes (like existing practice page)
    const currentQuestionUid = practiceState.currentQuestion?.uid;
    useEffect(() => {
        setSelectedAnswer(null);
        setSelectedAnswers([]);
        setSnackbarOpen(false);
        setShowFeedbackOverlay(false);
    }, [currentQuestionUid]);

    // Helper: is multiple choice (exactly like existing practice page)
    const isMultipleChoice = useMemo(() => {
        return practiceState.currentQuestion?.questionType === "choix_multiple";
    }, [practiceState.currentQuestion?.questionType]);

    // Handle single choice answer submission (exactly like existing practice page)
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

    // Handle multiple choice answer submission (exactly like existing practice page)
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

    // Handle multiple choice selection (exactly like existing practice page)
    const handleMultipleChoice = (idx: number) => {
        setSelectedAnswers(prev => {
            if (prev.includes(idx)) {
                return prev.filter(i => i !== idx);
            } else {
                return [...prev, idx];
            }
        });
    };

    // Handle next question (exactly like existing practice page)
    const handleNextQuestion = () => {
        if (!practiceState.sessionId) return;
        getNextQuestion();
    };

    // Handle end session (exactly like existing practice page)
    const handleEndSession = () => {
        if (!practiceState.sessionId) return;
        endSession('user_quit');
        router.push('/student/create-game?training=true');
    };

    // Show loading screen while fetching GameInstance
    if (loadingGameInstance) {
        return (
            <LoadingScreen
                message="Chargement de la session d'entraînement..."
            />
        );
    }

    // Show error if GameInstance couldn't be loaded
    if (gameInstanceError) {
        return (
            <div className="min-h-screen bg-[color:var(--background)] flex items-center justify-center p-4">
                <div className="bg-[color:var(--card)] rounded-xl p-8 text-center max-w-md">
                    <div className="text-4xl mb-4">⚠️</div>
                    <h1 className="text-xl font-bold mb-4 text-[color:var(--foreground)]">
                        Erreur de chargement
                    </h1>
                    <p className="text-[color:var(--muted-foreground)] mb-6">
                        {gameInstanceError}
                    </p>
                    <button
                        onClick={() => router.push('/student/create-game?training=true')}
                        className="px-6 py-2 bg-[color:var(--primary)] text-[color:var(--primary-foreground)] rounded-lg hover:bg-opacity-90 transition-colors"
                    >
                        Retour à la création
                    </button>
                </div>
            </div>
        );
    }

    // Show loading screen while connecting to practice session
    if (!practiceState.connected || practiceState.connecting) {
        return (
            <LoadingScreen
                message="Connexion à la session d'entraînement..."
            />
        );
    }

    // Show error if practice session failed
    if (practiceState.error) {
        return (
            <div className="min-h-screen bg-[color:var(--background)] flex items-center justify-center p-4">
                <div className="bg-[color:var(--card)] rounded-xl p-8 text-center max-w-md">
                    <div className="text-4xl mb-4">❌</div>
                    <h1 className="text-xl font-bold mb-4 text-[color:var(--foreground)]">
                        Erreur de session
                    </h1>
                    <p className="text-[color:var(--muted-foreground)] mb-6">
                        {practiceState.error}
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={clearError}
                            className="px-4 py-2 bg-[color:var(--secondary)] text-[color:var(--secondary-foreground)] rounded-lg hover:bg-opacity-90 transition-colors"
                        >
                            Réessayer
                        </button>
                        <button
                            onClick={() => router.push('/student/create-game?training=true')}
                            className="px-4 py-2 bg-[color:var(--primary)] text-[color:var(--primary-foreground)] rounded-lg hover:bg-opacity-90 transition-colors"
                        >
                            Nouvelle session
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Show completion screen
    if (practiceState.isCompleted && practiceState.completionSummary) {
        return (
            <div className="min-h-screen bg-[color:var(--background)] flex items-center justify-center p-4">
                <div className="bg-[color:var(--card)] rounded-xl p-8 text-center max-w-md">
                    <div className="text-6xl mb-6">🎉</div>
                    <h1 className="text-2xl font-bold mb-4 text-[color:var(--foreground)]">
                        Entraînement terminé !
                    </h1>
                    <div className="space-y-3 mb-6 text-[color:var(--muted-foreground)]">
                        <p><strong>Questions répondues:</strong> {practiceState.completionSummary.totalQuestions}</p>
                        <p><strong>Bonnes réponses:</strong> {practiceState.completionSummary.correctAnswers}</p>
                        <p><strong>Précision:</strong> {practiceState.completionSummary.finalAccuracy.toFixed(1)}%</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push('/student/create-game?training=true')}
                            className="px-6 py-2 bg-[color:var(--primary)] text-[color:var(--primary-foreground)] rounded-lg hover:bg-opacity-90 transition-colors"
                        >
                            Nouvel entraînement
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Show waiting screen if no current question
    if (!practiceState.currentQuestion) {
        return (
            <LoadingScreen
                message="Préparation de la question..."
            />
        );
    }

    // Helper variables for current question display
    const currentQuestion = practiceState.currentQuestion;
    const currentQuestionNumber = practiceState.questionProgress?.currentQuestionNumber || 1;
    const totalQuestions = practiceState.questionProgress?.totalQuestions || 1;

    // Main practice session UI (reuse existing practice page structure)
    return (
        <MathJaxWrapper>
            <div className="min-h-screen bg-[color:var(--background)]">
                {/* Header with progress and controls */}
                <div className="bg-[color:var(--card)] border-b border-[color:var(--border)] p-4">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-lg font-semibold text-[color:var(--foreground)]">
                                Entraînement
                            </h1>
                            {practiceState.questionProgress && (
                                <div className="text-sm text-[color:var(--muted-foreground)]">
                                    Question {practiceState.questionProgress.currentQuestionNumber} / {practiceState.questionProgress.totalQuestions}
                                </div>
                            )}
                            <div className="text-xs px-2 py-1 bg-[color:var(--secondary)] text-[color:var(--secondary-foreground)] rounded">
                                Code: {accessCode}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowStatsModal(true)}
                                className="p-2 text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] rounded-lg hover:bg-[color:var(--muted)] transition-colors"
                                title="Voir les statistiques"
                            >
                                <BarChart3 size={20} />
                            </button>
                            <button
                                onClick={handleEndSession}
                                className="p-2 text-[color:var(--muted-foreground)] hover:text-[color:var(--alert)] rounded-lg hover:bg-[color:var(--muted)] transition-colors"
                                title="Terminer l'entraînement"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Question content - simplified version that works */}
                <div className="max-w-4xl mx-auto p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 my-6">
                        {currentQuestion ? (
                            <div>
                                {/* Question title and text */}
                                <div className="mb-6">
                                    <h2 className="text-xl font-semibold mb-3 text-gray-800">
                                        {currentQuestion.title}
                                    </h2>
                                    <div className="text-gray-700 text-lg">
                                        {currentQuestion.text}
                                    </div>
                                </div>

                                {/* Answer options */}
                                <div className="space-y-3">
                                    {currentQuestion.answerOptions.map((option, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() =>
                                                isMultipleChoice
                                                    ? handleMultipleChoice(idx)
                                                    : handleSingleChoice(idx)
                                            }
                                            disabled={practiceState.hasAnswered}
                                            className={`
                                                w-full p-3 text-left rounded-lg border-2 transition-all
                                                ${practiceState.hasAnswered
                                                    ? practiceState.lastFeedback?.correctAnswers[idx]
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-300 bg-gray-50'
                                                    : (isMultipleChoice
                                                        ? (selectedAnswers.includes(idx)
                                                            ? 'border-blue-500 bg-blue-50'
                                                            : 'border-gray-300 hover:border-blue-300')
                                                        : (selectedAnswer === idx
                                                            ? 'border-blue-500 bg-blue-50'
                                                            : 'border-gray-300 hover:border-blue-300'))
                                                }
                                                ${practiceState.hasAnswered ? 'cursor-not-allowed' : 'cursor-pointer'}
                                            `}
                                        >
                                            <div className="flex items-center">
                                                <span className="w-6 h-6 rounded-full border-2 border-current mr-3 flex items-center justify-center text-xs">
                                                    {String.fromCharCode(65 + idx)}
                                                </span>
                                                <span>{option}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Submit button for multiple choice */}
                                {isMultipleChoice && !practiceState.hasAnswered && (
                                    <div className="mt-4">
                                        <button
                                            onClick={handleSubmitMultiple}
                                            disabled={selectedAnswers.length === 0}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        >
                                            Valider
                                        </button>
                                    </div>
                                )}

                                {/* Practice mode controls */}
                                {practiceState.hasAnswered && !showFeedbackOverlay && (
                                    <div className="mt-6 flex justify-between items-center">
                                        {/* Left side: Explanation button */}
                                        {practiceState.lastFeedback?.explanation ? (
                                            <button
                                                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-2"
                                                onClick={() => setShowFeedbackOverlay(true)}
                                            >
                                                <MessageCircle size={16} />
                                                Explication
                                            </button>
                                        ) : (
                                            <div></div>
                                        )}

                                        {/* Right side: Next question button */}
                                        <button
                                            onClick={handleNextQuestion}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            Question suivante →
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-lg text-gray-500 p-8">
                                {practiceState.connecting ? 'Connexion...' :
                                    'En attente de la prochaine question...'
                                }
                            </div>
                        )}
                    </div>
                </div>

                {/* Feedback overlay */}
                {showFeedbackOverlay && practiceState.lastFeedback?.explanation && (
                    <AnswerFeedbackOverlay
                        explanation={practiceState.lastFeedback.explanation}
                        onClose={() => setShowFeedbackOverlay(false)}
                        mode="practice"
                        allowManualClose={true}
                    />
                )}

                {/* Snackbar */}
                <Snackbar
                    open={snackbarOpen}
                    message={snackbarMessage}
                    type={snackbarType}
                    onClose={() => setSnackbarOpen(false)}
                />

                {/* Stats modal */}
                {showStatsModal && practiceState.session && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-[color:var(--card)] rounded-xl p-6 max-w-md w-full">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
                                    Statistiques
                                </h2>
                                <button
                                    onClick={() => setShowStatsModal(false)}
                                    className="p-1 text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] rounded"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span>Questions tentées:</span>
                                    <span className="font-medium">{practiceState.session.statistics.questionsAttempted}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Bonnes réponses:</span>
                                    <span className="font-medium text-[color:var(--success)]">{practiceState.session.statistics.correctAnswers}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Mauvaises réponses:</span>
                                    <span className="font-medium text-[color:var(--alert)]">{practiceState.session.statistics.incorrectAnswers}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Précision:</span>
                                    <span className="font-medium">{practiceState.session.statistics.accuracyPercentage.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MathJaxWrapper>
    );
}
