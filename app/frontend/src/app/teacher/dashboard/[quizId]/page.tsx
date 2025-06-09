/**
 * Teacher Dashboard Page Component - Refactored
 *
 * Uses useTeacherQuizSocket hook for real-time logic and CodeManager
 * component for code handling.
 */

"use client";

import React, { useEffect, useState, useCallback } from "react";
// Removed direct socket import
import DraggableQuestionsList from "@/components/DraggableQuestionsList";
import ConfirmDialog from "@/components/ConfirmDialog";
import { createLogger } from '@/clientLogger';
import CodeManager from '@/components/CodeManager'; // Import new component
import { useTeacherQuizSocket } from '@/hooks/migrations';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import { UsersRound } from "lucide-react";
import { log } from "console";
import { makeApiRequest } from '@/config/api';
import { QuizListResponseSchema, TeacherQuizQuestionsResponseSchema, TournamentCodeResponseSchema, TournamentVerificationResponseSchema, type QuizListResponse, type TeacherQuizQuestionsResponse, type TournamentCodeResponse, type TournamentVerificationResponse, type Question } from '@/types/api';
import { STORAGE_KEYS } from '@/constants/auth';

// Create a logger for this component
const logger = createLogger('TeacherDashboardPage');


// Add this mapping function above the component if not present
function mapToCanonicalQuestion(q: any) {
    logger.info('[DEBUG mapToCanonicalQuestion] Input question:', q);

    // Handle the answer format conversion
    let answerOptions: string[] = [];
    let correctAnswers: boolean[] = [];

    // Check if the question object has the nested question structure
    const questionData = q.question || q;

    if (questionData.answerOptions && Array.isArray(questionData.answerOptions)) {
        // New API format - from nested question object
        answerOptions = questionData.answerOptions;
        correctAnswers = questionData.correctAnswers || [];
        logger.info('[DEBUG mapToCanonicalQuestion] Using new API format from nested question');
    } else if (q.answerOptions && Array.isArray(q.answerOptions)) {
        // New API format - direct on question
        answerOptions = q.answerOptions;
        correctAnswers = q.correctAnswers || [];
        logger.info('[DEBUG mapToCanonicalQuestion] Using new API format direct');
    } else if (q.answers && Array.isArray(q.answers)) {
        // Legacy format
        answerOptions = q.answers.map((a: any) => a.text || a);
        correctAnswers = q.answers.map((a: any) => a.correct || false);
        logger.info('[DEBUG mapToCanonicalQuestion] Using legacy format');
    } else {
        logger.warn('[DEBUG mapToCanonicalQuestion] No recognizable answer format found');
    }

    // Fixed timer extraction - prioritize nested question.timeLimit over fallbacks
    const timeLimit = questionData.timeLimit ?? questionData.time ?? questionData.temps ??
        q.timeLimit ?? q.time ?? q.temps ?? 60;

    logger.info('[DEBUG mapToCanonicalQuestion] Timer extraction:', {
        'questionData.timeLimit': questionData.timeLimit,
        'questionData.time': questionData.time,
        'questionData.temps': questionData.temps,
        'q.timeLimit': q.timeLimit,
        'q.time': q.time,
        'q.temps': q.temps,
        'final timeLimit': timeLimit
    });

    const result = {
        ...q,
        // Use the data from the nested question object if it exists
        text: questionData.text || q.text,
        uid: questionData.uid || q.uid,
        answerOptions,
        correctAnswers,
        timeLimit,
    };

    logger.info('[DEBUG mapToCanonicalQuestion] Output question:', result);
    return result;
}

export default function TeacherDashboardPage({ params }: { params: Promise<{ quizId: string }> }) {
    const { quizId } = React.use(params);
    const [questions, setQuestions] = useState<Question[]>([]); // Keep local question state for UI ordering/editing
    const [quizName, setQuizName] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [questionActiveUid, setQuestionActiveUid] = useState<string | null>(null); // UI state for selected question
    const [initialTournamentCode, setInitialTournamentCode] = useState<string | null>(null); // Fetched code
    const [currentTournamentCode, setCurrentTournamentCode] = useState<string | null>(null); // Active code (from fetch or generation)
    const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

    // --- Confirmation Dialog State ---
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingPlayIdx, setPendingPlayIdx] = useState<number | null>(null);

    // --- Use the Custom Hook ---
    // Get token from localStorage or cookies
    const getAuthToken = () => {
        if (typeof window === 'undefined') return null;

        // First try localStorage
        const localStorageToken = localStorage.getItem('mathquest_jwt_token');
        if (localStorageToken) return localStorageToken;

        // Fallback to cookies
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'teacherToken' && value) {
                return value;
            }
        }
        return null;
    };

    const token = getAuthToken();
    const {
        quizSocket,
        quizState,
        timerStatus,
        timerQuestionId,
        timeLeft,
        localTimeLeft,
        connectedCount,
        emitSetQuestion,
        emitEndQuiz,
        emitPauseQuiz,
        emitResumeQuiz,
        emitSetTimer,
        emitTimerAction,
        emitUpdateTournamentCode,
    } = useTeacherQuizSocket(currentTournamentCode, token, quizId); // Pass accessCode, token, quizId

    // --- Stats state for answer histograms ---
    type StatsData = { stats: number[]; totalAnswers: number };
    const [questionStats, setQuestionStats] = useState<Record<string, StatsData>>({});

    // Listen for stats updates from the socket
    // useEffect(() => {
    //     if (!quizSocket) return;
    //     const handleStatsUpdate = (data: { questionUid: string; stats: number[]; totalAnswers: number }) => {
    //         setQuestionStats(prev => ({ ...prev, [data.questionUid]: { stats: data.stats, totalAnswers: data.totalAnswers } }));
    //     };
    //     quizSocket.on(SOCKET_EVENTS.LEGACY_QUIZ.ANSWER_STATS_UPDATE, handleStatsUpdate);
    //     return () => {
    //         quizSocket.off(SOCKET_EVENTS.LEGACY_QUIZ.ANSWER_STATS_UPDATE, handleStatsUpdate);
    //     };
    // }, [quizSocket]);

    // Sync questionStats from quizState.stats
    useEffect(() => {
        if (quizState?.stats) {
            const newStats: Record<string, StatsData> = {};
            for (const uid in quizState.stats) {
                const statItem = quizState.stats[uid];
                if (
                    statItem &&
                    typeof statItem === 'object' &&
                    'stats' in statItem &&
                    Array.isArray((statItem as any).stats) &&
                    'totalAnswers' in statItem &&
                    typeof (statItem as any).totalAnswers === 'number'
                ) {
                    newStats[uid] = {
                        stats: (statItem as any).stats as number[],
                        totalAnswers: (statItem as any).totalAnswers as number,
                    };
                } else {
                    // Log if the structure is unexpected, but don't break
                    logger.warn(`Unexpected structure for quizState.stats[${uid}]:`, statItem);
                }
            }
            setQuestionStats(newStats);
        }
    }, [quizState?.stats]);

    useEffect(() => {
        if (!quizSocket) return;

        const handleActionResponse = (data: { message: string; type?: 'info' | 'warning' | 'error' | 'success' }) => { // Updated data type
            logger.info(`[Snackbar] Received notification:`, data);
            setSnackbarMessage(data.message);
            // Optionally, use data.type to style the snackbar
        };

        quizSocket.on('error_dashboard', handleActionResponse); // Use error_dashboard event for notifications

        return () => {
            quizSocket.off('error_dashboard', handleActionResponse); // Use error_dashboard event for notifications
        };
    }, [quizSocket]);

    useEffect(() => {
        const handleQuizTimerUpdateStop = () => {
            logger.info(`[Snackbar] Received quizTimerUpdateStop event`);
            setSnackbarMessage('Timer arrêté.');
        };

        window.addEventListener('quizTimerUpdateStop', handleQuizTimerUpdateStop);

        return () => {
            window.removeEventListener('quizTimerUpdateStop', handleQuizTimerUpdateStop);
        };
    }, []);

    // --- Initial Data Fetching (Quiz Name, Questions, Initial Code) ---
    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(null);
        setInitialTournamentCode(null); // Reset on quizId change

        const fetchQuizData = async () => {
            try {
                // First, fetch the game instance to get the template ID and access code

                const gameInstanceData = await makeApiRequest<{ gameInstance: { id: string, name: string, gameTemplateId: string, accessCode?: string } }>(`games/id/${quizId}`);
                const gameInstance = gameInstanceData.gameInstance;

                if (isMounted) setQuizName(gameInstance.name || "Quiz");

                // Fetch the game template with questions using the template ID
                const gameTemplateData = await makeApiRequest<{ gameTemplate: { id: string, name: string, questions: any[] } }>(`game-templates/${gameInstance.gameTemplateId}`);

                // Debug: Log the raw API response
                logger.info('[DEBUG] Raw API response:', gameTemplateData);
                logger.info('[DEBUG] Questions from API:', gameTemplateData.gameTemplate.questions);

                // Initialize local question state, ensuring 'temps' exists and preserving all API fields
                const initialQuestions = (gameTemplateData.gameTemplate.questions || []).map((q: any, index: number) => {
                    logger.info(`[DEBUG] Processing question ${index}:`, q);

                    // Extract timer values from nested question structure
                    const questionData = q.question || q;
                    const timeLimit = questionData.timeLimit ?? questionData.time ?? questionData.temps ??
                        q.timeLimit ?? q.time ?? q.temps ?? 60;

                    const processedQuestion = {
                        ...q,
                        type: q.questionType || questionData.questionType || 'choix_simple', // Default type if not provided
                        temps: timeLimit, // Use extracted timeLimit for backward compatibility
                        timeLimit: timeLimit, // Also set timeLimit for consistency
                        feedbackWaitTime: questionData.feedbackWaitTime ?? q.feedbackWaitTime ?? 3000 // Default to 3s if null
                    };

                    logger.info(`[DEBUG] Processed question ${index} timer:`, {
                        'questionData.timeLimit': questionData.timeLimit,
                        'questionData.time': questionData.time,
                        'questionData.temps': questionData.temps,
                        'final timeLimit': timeLimit
                    });
                    logger.info(`[DEBUG] Processed question ${index}:`, processedQuestion);
                    return processedQuestion;
                });

                logger.info('[DEBUG] Final initialQuestions:', initialQuestions);
                if (isMounted) setQuestions(initialQuestions);

                // Set tournament code from game instance access code
                if (gameInstance.accessCode) {
                    if (isMounted) {
                        logger.info(`Using game instance access code: ${gameInstance.accessCode}`);
                        setInitialTournamentCode(gameInstance.accessCode);
                        setCurrentTournamentCode(gameInstance.accessCode);
                    }
                } else {
                    if (isMounted) {
                        setInitialTournamentCode(null);
                        setCurrentTournamentCode(null);
                    }
                }
            } catch (err: unknown) {
                logger.error("Error fetching initial data:", err);
                if (isMounted) setError((err as Error).message || "Une erreur est survenue");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        if (quizId) {
            fetchQuizData();
        } else {
            setLoading(false); // No quizId, nothing to load
        }

        return () => { isMounted = false; };
    }, [quizId, token]); // Add token as dependency to refetch when token changes


    // --- Sync UI Active Question with Hook's Timer State ---
    // This ensures the UI highlights the correct question based on the *actual* running timer
    useEffect(() => {
        if (timerQuestionId) {
            setQuestionActiveUid(timerQuestionId); // Synchronise toujours sur l'UID
        }
    }, [timerQuestionId]);

    // --- Compute effective timeLeft for DraggableQuestionsList ---
    const effectiveTimeLeft = timerStatus === 'stop' ? 0 : (localTimeLeft ?? timeLeft ?? 0);

    // --- Handlers (using hook emitters) ---

    const handleSelect = useCallback((uid: string) => {
        setQuestionActiveUid(uid);
    }, []);

    const handleReorder = useCallback((newQuestions: Question[]) => {
        setQuestions(newQuestions);
    }, []);

    const handlePlay = useCallback((uid: string, startTime: number) => {
        const questionToPlay = questions.find(q => q.uid === uid);
        if (!questionToPlay) {
            return;
        }
        const currentQuestionUid = timerQuestionId;
        const isTimerRunningOrPaused = timerStatus === 'play' || timerStatus === 'pause';

        if (currentQuestionUid === questionToPlay.uid) {
            if (timerStatus === 'play') {
                emitPauseQuiz();
                return;
            }
            if (timerStatus === 'pause') {
                emitResumeQuiz();
                return;
            }
        }

        if (isTimerRunningOrPaused && currentQuestionUid && currentQuestionUid !== questionToPlay.uid) {
            setPendingPlayIdx(questions.findIndex(q => q.uid === uid));
            setShowConfirm(true);
            return;
        }

        if (timerStatus === 'stop' || timerStatus === 'pause') {
            setQuestionActiveUid(questionToPlay.uid);
            emitSetQuestion(questionToPlay.uid); // Do not send startTime to avoid resetting backend timer
        } else {
            setQuestionActiveUid(questionToPlay.uid);
            emitSetQuestion(questionToPlay.uid, startTime);
        }
    }, [questions, timerStatus, timerQuestionId, emitPauseQuiz, emitResumeQuiz, emitSetQuestion, currentTournamentCode]);

    const handlePause = useCallback(() => {
        emitPauseQuiz();
    }, [timerQuestionId, emitPauseQuiz]);

    const handleStop = useCallback(() => {
        if (timerQuestionId && (timerStatus === 'play' || timerStatus === 'pause')) {
            emitTimerAction({ status: 'stop', questionId: timerQuestionId, timeLeft: 0 });
        }
    }, [timerStatus, timerQuestionId, emitTimerAction]);

    const handleEditTimer = useCallback((uid: string, newTime: number) => {
        const question = questions.find(q => q.uid === uid);
        if (!question) return;
        setQuestions(prev => prev.map(q => q.uid === uid ? { ...q, temps: newTime } : q));
        // Only emitSetTimer for paused or inactive timer edits. Do NOT auto-resume.
        emitSetTimer(newTime, question.uid);
        logger.info(`[DASHBOARD] Timer updated for question ${question.uid}: ${newTime}`);
        // Do NOT call emitTimerAction({ status: 'play', ... }) here. Only resume on explicit user action.
    }, [questions, timerQuestionId, timerStatus, emitSetTimer]);

    const handleTimerAction = useCallback((action: { status: 'play' | 'pause' | 'stop', questionId: string, timeLeft: number }) => {
        emitTimerAction(action);
        logger.info(`[DASHBOARD] Timer action emitted:`, action);

        // Force synchronization after emitting the action - REMOVED LEGACY_QUIZ.GET_TIMER
        // if (action.status === 'play') {
        //     quizSocket?.emit(SOCKET_EVENTS.LEGACY_QUIZ.GET_TIMER, { quizId: action.questionId }, (response: { timeLeft: number }) => {
        //         logger.info(`[DASHBOARD] Timer synchronized after play action:`, response);
        //         setQuestions(prev => prev.map(q => q.uid === action.questionId ? { ...q, temps: response.timeLeft } : q));
        //     });
        // }
    }, [emitTimerAction, quizSocket]);

    const handleShowResults = useCallback((uid: string) => {
        emitTimerAction({ status: 'stop', questionId: uid, timeLeft: 0 });
        // quizSocket?.emit(SOCKET_EVENTS.LEGACY_QUIZ.CLOSE_QUESTION, { quizId, tournamentCode: currentTournamentCode, questionUid: uid }); // REMOVED
        // Consider if emitLockAnswers(true) is needed here or if stopping timer is sufficient
    }, [emitTimerAction, quizSocket, quizId, currentTournamentCode]);

    // Callback from CodeManager when a new code is generated
    const handleCodeGenerated = useCallback((newCode: string | null) => {
        setCurrentTournamentCode(newCode); // Update the code used by the hook
    }, []);

    // Callback from CodeManager when it emits update_tournament_code
    const handleCodeUpdateEmitted = useCallback((newCode: string) => {
        // Use the hook's emitter function
        emitUpdateTournamentCode(newCode);
    }, [emitUpdateTournamentCode]);


    // --- Confirmation Dialog ---
    const confirmPlay = () => {
        setShowConfirm(false);
        if (pendingPlayIdx !== null) {
            const questionToPlay = questions[pendingPlayIdx];
            if (timerQuestionId && (timerStatus === 'play' || timerStatus === 'pause')) {
                emitTimerAction({ status: 'stop', questionId: timerQuestionId, timeLeft: 0 });
            }
            if (questionToPlay) {
                setQuestionActiveUid(questionToPlay.uid);
                emitSetQuestion(questionToPlay.uid, questionToPlay.time);
            }
            setPendingPlayIdx(null);
        }
    };
    const cancelPlay = () => {
        setShowConfirm(false);
        setPendingPlayIdx(null);
    };

    // --- End Quiz Confirmation Logic ---
    const [showEndQuizConfirm, setShowEndQuizConfirm] = useState(false);

    const handleEndQuiz = () => {
        setShowEndQuizConfirm(true);
    };

    const confirmEndQuiz = () => {
        setShowEndQuizConfirm(false);
        emitEndQuiz();
    };

    const cancelEndQuiz = () => {
        setShowEndQuizConfirm(false);
    };

    // --- Confirmation Dialog for Tournament Code Generation ---
    const [showGenerateCodeConfirm, setShowGenerateCodeConfirm] = useState(false);
    const CodeManagerRef = React.useRef<CodeManagerRef | null>(null);

    const handleRequestGenerateCode = () => {
        setShowGenerateCodeConfirm(true);
    };
    const confirmGenerateCode = () => {
        setShowGenerateCodeConfirm(false);
        // Appelle la méthode de génération du code du composant enfant
        if (CodeManagerRef.current && CodeManagerRef.current.generateTournament) {
            CodeManagerRef.current.generateTournament();
        }
    };
    const cancelGenerateCode = () => {
        setShowGenerateCodeConfirm(false);
    };

    // --- Render Logic ---
    if (loading) return <div className="p-8">Chargement du tableau de bord...</div>;
    if (error) return <div className="p-8 text-red-600">Erreur: {error}</div>;
    if (!quizId) return <div className="p-8 text-orange-600">Aucun ID de quiz fourni.</div>;

    return (
        <div className="main-content">
            <div className="card w-full max-w-4xl shadow-xl bg-base-100 m-4 my-6">
                <div className="flex flex-col gap-8">
                    <div className="card-body flex-1 flex flex-col gap-8 min-h-0 overflow-y-auto w-full p-0">
                        <div className="flex flex-row items-center justify-between mb-2 gap-2">
                            <h1 className="card-title text-3xl">Tableau de bord – {quizName}</h1>
                            <button className="btn btn-secondary" onClick={handleEndQuiz} disabled={!quizSocket || quizState?.ended}>
                                {quizState?.ended ? 'Quiz Terminé' : 'Terminer le quiz'}
                            </button>
                            <ConfirmDialog
                                open={showEndQuizConfirm}
                                title="Terminer le quiz ?"
                                message="Êtes-vous sûr de vouloir terminer ce quiz ? Cette action est irréversible."
                                onConfirm={confirmEndQuiz}
                                onCancel={cancelEndQuiz}
                            />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                            <div>
                                <CodeManager
                                    ref={CodeManagerRef}
                                    quizId={quizId}
                                    quizSocket={quizSocket}
                                    quizState={quizState}
                                    initialTournamentCode={initialTournamentCode}
                                    onCodeGenerated={handleCodeGenerated}
                                    onCodeUpdateEmitted={handleCodeUpdateEmitted}
                                    onRequestGenerateCode={handleRequestGenerateCode}
                                />
                            </div>
                            <div className="basis-full h-0 sm:hidden" />
                            <div className="flex items-center gap-2 ml-auto text-base-content/80">
                                <UsersRound className="w-6 h-6" />
                                <span className="font-semibold">{connectedCount}</span>
                            </div>
                        </div>
                        {/* Quiz status message */}
                        <div className="mb-4">
                            {quizState?.ended ? (
                                <div className="alert alert-info text-base-content">
                                    Ce quiz est maintenant terminé. Veuillez générer un nouveau code pour le ré-utiliser.
                                </div>
                            ) : !currentTournamentCode ? (
                                <div className="alert alert-warning text-base-content">
                                    Vous devez d&apos;abord générer un code pour pouvoir utiliser ce quiz.
                                </div>
                            ) : (
                                <div className="alert alert-success text-base-content flex justify-between items-center">
                                    <span>Quiz en cours.</span>
                                    <a href={`/teacher/projection/${quizId}`} target="_blank" rel="noopener noreferrer"
                                        className="text-primary underline font-medium">
                                        Afficher la vue projecteur
                                    </a>
                                </div>
                            )}
                        </div>
                        <section>
                            <h2 className="text-xl font-semibold mb-4">Questions</h2>
                            {!quizSocket || !quizSocket.connected && (
                                <div className="alert alert-warning mb-4">
                                    Connexion au serveur en cours ou perdue... Les contrôles sont désactivés.
                                </div>
                            )}
                            <DraggableQuestionsList
                                quizSocket={quizSocket}
                                questions={questions.map(mapToCanonicalQuestion)}
                                currentQuestionIdx={quizState?.currentQuestionIdx}
                                isChronoRunning={quizState?.chrono?.running}
                                isQuizEnded={quizState?.ended}
                                questionActiveUid={questionActiveUid}
                                timerStatus={timerStatus}
                                timerQuestionId={timerQuestionId}
                                timeLeft={effectiveTimeLeft}
                                onSelect={handleSelect}
                                onPlay={handlePlay}
                                onPause={handlePause}
                                onStop={handleStop}
                                onEditTimer={handleEditTimer}
                                onReorder={qs => setQuestions(qs.map(q => {
                                    let correctAnswers: string[] = [];
                                    if (Array.isArray(q.correctAnswers) && q.correctAnswers.length > 0) {
                                        if (typeof q.correctAnswers[0] === 'boolean' && Array.isArray(q.answerOptions)) {
                                            correctAnswers = q.answerOptions.filter((_: string, i: number) => (q.correctAnswers as boolean[])[i]);
                                        } else if (typeof q.correctAnswers[0] === 'string') {
                                            correctAnswers = (q.correctAnswers as (string | boolean)[]).filter((a): a is string => typeof a === 'string');
                                        }
                                    }
                                    return {
                                        ...q,
                                        timeLimit: q.timeLimit ?? 20, // Default to 20 seconds if null
                                        feedbackWaitTime: q.feedbackWaitTime ?? 3000, // Default to 3 seconds if null
                                        answers: Array.isArray(q.answerOptions)
                                            ? q.answerOptions.map((text: string) => ({ text, correct: correctAnswers.includes(text) }))
                                            : []
                                    };
                                }))}
                                quizId={quizId}
                                currentTournamentCode={currentTournamentCode || ''}
                                onTimerAction={handleTimerAction}
                                disabled={!quizSocket || !quizSocket.connected || quizState?.ended}
                            />
                        </section>
                    </div>
                </div>
            </div>
            {/* Confirmation Dialogs */}
            <ConfirmDialog
                open={showConfirm}
                title="Changer de question ?"
                message={"Une autre question est en cours ou en pause. Voulez-vous vraiment lancer cette nouvelle question et arrêter la précédente ?"}
                onConfirm={confirmPlay}
                onCancel={cancelPlay}
            />
            {/* Removed ConfirmDialog for changing questions because confirmChangeQuestion and cancelChangeQuestion are not defined */}
            <ConfirmDialog
                open={showGenerateCodeConfirm}
                title="Générer un nouveau code"
                message="Les résultats du tournoi actuel seront perdus. Continuer ?"
                onConfirm={confirmGenerateCode}
                onCancel={cancelGenerateCode}
            />
            {snackbarMessage && (
                <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded shadow-lg">
                    {snackbarMessage}
                </div>
            )}
        </div>
    );
}

interface CodeManagerRef {
    generateTournament: () => void;
}


