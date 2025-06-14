/**
 * Teacher Dashboard Page Component - Refactored
 *
 * Uses useTeacherQuizSocket hook for real-time logic and CodeManag    const token = get    const {
        quizSocket,
        quizState,
        timerStatus,
        timerQuestionUid,
        timeLeftMs,
        localTimeLeftMs,
        connectedCount,
        emitSetQuestion,
        emitEndQuiz,
        emitPauseQuiz,
        emitResumeQuiz,
        emitSetTimer,
        emitTimerAction,
        emitUpdateTournamentCode
    } = useTeacherQuizSocket(accessCode, token, gameId); const {
        quizSocket,
        quizState,
        timerStatus,
        timerQuestionUid,
        timeLeftMs,
        localTimeLeftMs,
        connectedCount,
        emitSetQuestion,
        emitEndQuiz,
        emitPauseQuiz,
        emitResumeQuiz,
        emitSetTimer,
        emitTimerAction,
        emitUpdateTournamentCode,
    } = useTeacherQuizSocket(currentTournamentCode, token, gameId); // Pass accessCode, token, gameId (actual database ID)or code handling.
 */

"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
// Removed direct socket import
import DraggableQuestionsList from "@/components/DraggableQuestionsList";
import ConfirmDialog from "@/components/ConfirmDialog";
import { createLogger } from '@/clientLogger';
import CodeManager from '@/components/CodeManager'; // Import new component
import { useTeacherQuizSocket } from '@/hooks/useTeacherQuizSocket';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import { UsersRound } from "lucide-react";
import { log } from "console";
import { makeApiRequest } from '@/config/api';
import { QuizListResponseSchema, TeacherQuizQuestionsResponseSchema, TournamentCodeResponseSchema, TournamentVerificationResponseSchema, type QuizListResponse, type TeacherQuizQuestionsResponse, type TournamentCodeResponse, type TournamentVerificationResponse, type Question } from '@/types/api';
import { STORAGE_KEYS } from '@/constants/auth';
import InfinitySpin from '@/components/InfinitySpin';
import { logTimerEvent, logTimerState, logTimerCalculation, logTimerError } from '@/utils/timerDebugLogger';
import { QUESTION_TYPES } from '@shared/types'; // <-- Import QUESTION_TYPES

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

    // Extract timer value from standard timeLimit field only
    const timeLimit = questionData.timeLimit ?? q.timeLimit ?? 60;

    logger.info('[DEBUG mapToCanonicalQuestion] Timer extraction:', {
        'questionData.timeLimit': questionData.timeLimit,
        'q.timeLimit': q.timeLimit,
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

export default function TeacherDashboardPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = React.use(params); // This is now the access code like "379CCT"
    const [questions, setQuestions] = useState<Question[]>([]); // Keep local question state for UI ordering/editing
    const [quizName, setQuizName] = useState<string>("");
    const [gameId, setGameId] = useState<string | null>(null); // Store the actual database UUID
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [questionActiveUid, setQuestionActiveUid] = useState<string | null>(null); // UI state for selected question
    const [expandedUids, setExpandedUids] = useState<Set<string>>(new Set()); // Track expanded questions
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

    // Log access code and gameId resolution for debugging
    useEffect(() => {
        logger.info('TeacherDashboardPage - URL params:', {
            code, // This is the access code from URL
            gameId // This will be the resolved database UUID
        });
    }, [code, gameId]);

    const {
        quizSocket,
        quizState,
        timerStatus,
        timerQuestionUid,
        timeLeftMs,
        localTimeLeftMs,
        connectedCount,
        emitSetQuestion,
        emitEndQuiz,
        emitPauseQuiz,
        emitResumeQuiz,
        emitSetTimer,
        emitTimerAction,
        emitUpdateTournamentCode,
    } = useTeacherQuizSocket(code, token, gameId); // Pass accessCode (from URL), token, gameId (database UUID)

    // Comprehensive timer state debugging
    useEffect(() => {
        logTimerState('dashboard_timer_values_changed', {
            timerStatus,
            timerQuestionUid,
            timeLeftMs,
            timeLeftType: typeof timeLeftMs,
            localTimeLeftMs,
            localTimeLeftType: typeof localTimeLeftMs,
            connectedCount,
            quizSocketConnected: !!quizSocket?.connected,
            quizStateExists: !!quizState,
            quizStateChrono: quizState?.chrono,
            quizStateTimerStatus: quizState?.timerStatus,
            quizStateTimerTimeLeft: quizState?.timerTimeLeft
        });
    }, [timerStatus, timerQuestionUid, timeLeftMs, localTimeLeftMs, quizSocket?.connected, quizState?.chrono, quizState?.timerStatus, quizState?.timerTimeLeft]);

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
            // Optionally, use data.defaultMode to style the snackbar
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

    // --- Initial Data Fetching (Resolve access code to game UUID, fetch questions, etc.) ---
    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(null);
        setGameId(null); // Reset on code change

        const fetchQuizData = async () => {
            try {
                // First, resolve the access code to get the game instance UUID
                logger.info(`[DEBUG] Resolving access code to game instance:`, { code });

                const gameInstanceData = await makeApiRequest<{ gameInstance: { id: string, name: string, gameTemplateId: string, accessCode?: string } }>(`games/${code}`);
                const gameInstance = gameInstanceData.gameInstance;

                if (isMounted) {
                    setQuizName(gameInstance.name || "Quiz");
                    setGameId(gameInstance.id); // Store the actual database UUID
                    logger.info(`[DEBUG] Resolved game instance:`, {
                        accessCode: code,
                        gameId: gameInstance.id,
                        gameName: gameInstance.name
                    });
                }

                // Fetch the game template with questions using the template ID
                const gameTemplateData = await makeApiRequest<{ gameTemplate: { id: string, name: string, questions: any[] } }>(`game-templates/${gameInstance.gameTemplateId}`);

                // Debug: Log the raw API response
                logger.info('[DEBUG] Raw API response:', gameTemplateData);
                logger.info('[DEBUG] Questions from API:', gameTemplateData.gameTemplate.questions);

                // Initialize local question state, ensuring 'temps' exists and preserving all API fields
                const initialQuestions = (gameTemplateData.gameTemplate.questions || []).map((q: any, index: number) => {
                    logger.info(`[DEBUG] Processing question ${index}:`, q);

                    // Extract timer values from nested question structure using standard timeLimit field
                    const questionData = q.question || q;
                    const timeLimit = questionData.timeLimit ?? q.timeLimit ?? 60;

                    const processedQuestion = {
                        ...q,
                        defaultMode: q.questionType || questionData.questionType || QUESTION_TYPES.SINGLE_CHOICE, // Default type if not provided
                        timeLimit: timeLimit, // Use standard timeLimit field only
                        feedbackWaitTime: questionData.feedbackWaitTime ?? q.feedbackWaitTime ?? 3000 // Default to 3s if null
                    };

                    logger.info(`[DEBUG] Processed question ${index} timer:`, {
                        'questionData.timeLimit': questionData.timeLimit,
                        'q.timeLimit': q.timeLimit,
                        'final timeLimit': timeLimit
                    });
                    logger.info(`[DEBUG] Processed question ${index}:`, processedQuestion);
                    return processedQuestion;
                });

                logger.info('[DEBUG] Final initialQuestions:', initialQuestions);
                if (isMounted) setQuestions(initialQuestions);

                // Set tournament code - the code from URL is the access code
                if (isMounted) {
                    logger.info(`Using access code from URL: ${code}`);
                    setInitialTournamentCode(code);
                    setCurrentTournamentCode(code);
                }
            } catch (err: unknown) {
                logger.error("Error fetching initial data:", err);
                if (isMounted) setError((err as Error).message || "Une erreur est survenue");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        if (code) {
            fetchQuizData();
        } else {
            setLoading(false); // No code, nothing to load
        }

        return () => { isMounted = false; };
    }, [code, token]); // Add token as dependency to refetch when token changes


    // --- Sync UI Active Question with Hook's Timer State ---
    // This ensures the UI highlights the correct question based on the *actual* running timer
    useEffect(() => {
        if (timerQuestionUid) {
            setQuestionActiveUid(timerQuestionUid); // Synchronise toujours sur l'UID
        }
        // DO NOT mutate expandedUids here or in any effect!
    }, [timerQuestionUid]);

    // --- Memoize mapped questions to prevent unnecessary re-renders ---
    const mappedQuestions = useMemo(() => {
        return questions.map(mapToCanonicalQuestion);
    }, [questions]);

    // --- Compute effective timeLeftMs for DraggableQuestionsList with throttling ---
    const [throttledTimeLeft, setThrottledTimeLeft] = useState<number>(0);

    // Throttle timer updates for better performance
    useEffect(() => {
        const newTimeLeft = timerStatus === 'stop' ? 0 : (localTimeLeftMs ?? timeLeftMs ?? 0);

        logTimerCalculation('dashboard_effective_time_calculation', {
            timerStatus,
            localTimeLeftMs,
            timeLeftMs,
            newTimeLeft,
            throttledTimeLeft,
            willUpdate: Math.abs(newTimeLeft - throttledTimeLeft) >= 1,
            difference: Math.abs(newTimeLeft - throttledTimeLeft)
        });

        // Only update if there's a meaningful change (1 second or more)
        if (Math.abs(newTimeLeft - throttledTimeLeft) >= 1) {
            logTimerEvent('dashboard_throttled_time_updated', {
                from: throttledTimeLeft,
                to: newTimeLeft
            });
            setThrottledTimeLeft(newTimeLeft);
        }
    }, [timerStatus, localTimeLeftMs, timeLeftMs, throttledTimeLeft]);

    const effectiveTimeLeft = throttledTimeLeft;

    // Log effective time for debugging
    useEffect(() => {
        logTimerState('dashboard_effective_time_left', {
            effectiveTimeLeft,
            throttledTimeLeft,
            displayValue: effectiveTimeLeft
        });
    }, [effectiveTimeLeft, throttledTimeLeft]);

    // --- Handlers (using hook emitters) ---

    const handleSelect = useCallback((uid: string) => {
        setQuestionActiveUid(uid);
    }, []);

    // Toggle expansion for a question
    const handleToggleExpand = useCallback((uid: string) => {
        setExpandedUids(prev => {
            const next = new Set(prev);
            if (next.has(uid)) {
                next.delete(uid);
            } else {
                next.add(uid);
            }
            return next;
        });
    }, []);

    const handleReorder = useCallback((newQuestions: Question[]) => {
        setQuestions(newQuestions);
    }, []);

    const handlePlay = useCallback((uid: string, startTime: number) => {
        logger.info(`[DASHBOARD] handlePlay called:`, {
            uid,
            startTime,
            accessCode: code,
            gameId,
            currentTournamentCode,
            timerStatus,
            timerQuestionUid,
            socketConnected: !!quizSocket?.connected
        });

        const questionToPlay = mappedQuestions.find(q => q.uid === uid);
        if (!questionToPlay) {
            logger.warn(`[DASHBOARD] Question not found for uid: ${uid}`);
            logger.warn(`[DASHBOARD] Available question UIDs:`, mappedQuestions.map(q => q.uid));
            return;
        }
        const currentQuestionUid = timerQuestionUid;
        const isTimerRunningOrPaused = timerStatus === 'play' || timerStatus === 'pause';

        if (currentQuestionUid === questionToPlay.uid) {
            if (timerStatus === 'play') {
                logger.info(`[DASHBOARD] Pausing currently playing question:`, {
                    questionUid: questionToPlay.uid,
                    accessCode: code,
                    gameId,
                    currentTournamentCode
                });
                emitPauseQuiz();
                return;
            }
            if (timerStatus === 'pause') {
                logger.info(`[DASHBOARD] Resuming currently paused question:`, {
                    questionUid: questionToPlay.uid,
                    accessCode: code,
                    gameId,
                    currentTournamentCode
                });
                emitResumeQuiz();
                return;
            }
        }

        if (isTimerRunningOrPaused && currentQuestionUid && currentQuestionUid !== questionToPlay.uid) {
            setPendingPlayIdx(questions.findIndex(q => q.uid === uid));
            setShowConfirm(true);
            return;
        }

        // Use the new unified timer action approach that handles question switching automatically
        setQuestionActiveUid(questionToPlay.uid);

        logger.debug('handlePlay about to call emitTimerAction', {
            'questionToPlay.uid': questionToPlay.uid,
            'questionToPlay.uid type': typeof questionToPlay.uid,
            'questionToPlay object': questionToPlay,
            'startTime': startTime,
            'startTime type': typeof startTime,
            uid,
            'uid type': typeof uid,
            'uid === questionToPlay.uid': uid === questionToPlay.uid,
            accessCode: code,
            gameId,
            currentTournamentCode
        });

        // Send timer action with questionUid - backend will handle question switching automatically
        // Convert startTime from seconds to milliseconds for timer action
        emitTimerAction({
            status: 'play',
            questionUid: questionToPlay.uid,
            timeLeftMs: startTime * 1000 // Convert seconds to milliseconds
        });
    }, [mappedQuestions, emitPauseQuiz, emitResumeQuiz, emitSetQuestion]); // Updated to use mappedQuestions

    const handlePause = useCallback(() => {
        logger.info(`[DASHBOARD] About to emit pause:`, {
            accessCode: code,
            gameId,
            currentTournamentCode,
            socketConnected: !!quizSocket?.connected
        });
        emitPauseQuiz();
    }, [emitPauseQuiz]); // Keep minimal dependencies

    const handleStop = useCallback(() => {
        // Use current timer state from closure - avoid dependencies that cause re-renders
        if (timerQuestionUid && (timerStatus === 'play' || timerStatus === 'pause')) {
            logger.info(`[DASHBOARD] About to emit stop timer action:`, {
                timerQuestionUid,
                timerStatus,
                accessCode: code,
                gameId,
                currentTournamentCode,
                socketConnected: !!quizSocket?.connected
            });
            emitTimerAction({ status: 'stop', questionUid: timerQuestionUid, timeLeftMs: 0 });
        }
    }, [emitTimerAction, timerQuestionUid, timerStatus]); // Include timer state but optimized for essential logic

    const handleEditTimer = useCallback((uid: string, newTime: number) => {
        const question = questions.find(q => q.uid === uid);
        if (!question) return;
        setQuestions(prev => prev.map(q => q.uid === uid ? { ...q, timeLimit: newTime } : q));
        // Only emitSetTimer for paused or inactive timer edits. Do NOT auto-resume.
        emitSetTimer(newTime, question.uid);
        logger.info(`[DASHBOARD] Timer updated for question ${question.uid}: ${newTime}`);
        // Do NOT call emitTimerAction({ status: 'play', ... }) here. Only resume on explicit user action.
    }, [questions, emitSetTimer]); // Removed frequently changing timer states

    const handleTimerAction = useCallback((action: { status: 'play' | 'pause' | 'stop', questionUid: string, timeLeftMs: number }) => {
        logger.info(`[DASHBOARD] About to emit timer action:`, {
            action,
            accessCode: code,
            gameId,
            currentTournamentCode,
            socketConnected: !!quizSocket?.connected
        });
        emitTimerAction(action);
        logger.info(`[DASHBOARD] Timer action emitted:`, action);

        // Force synchronization after emitting the action - REMOVED LEGACY_QUIZ.GET_TIMER
        // if (action.status === 'play') {
        //     quizSocket?.emit(SOCKET_EVENTS.LEGACY_QUIZ.GET_TIMER, { quizId: action.questionUid }, (response: { timeLeftMs?: number }) => {
        //         logger.info(`[DASHBOARD] Timer synchronized after play action:`, response);
        //         setQuestions(prev => prev.map(q => q.uid === action.questionUid ? { ...q, temps: response.timeLeftMs } : q));
        //     });
        // }
    }, [emitTimerAction]); // Removed quizSocket from dependencies

    const handleShowResults = useCallback((uid: string) => {
        logger.info(`[DASHBOARD] About to emit show results (stop) action:`, {
            uid,
            accessCode: code,
            gameId,
            currentTournamentCode,
            socketConnected: !!quizSocket?.connected
        });
        emitTimerAction({ status: 'stop', questionUid: uid, timeLeftMs: 0 });
        // quizSocket?.emit(SOCKET_EVENTS.LEGACY_QUIZ.CLOSE_QUESTION, { quizId, tournamentCode: currentTournamentCode, questionUid: uid }); // REMOVED
        // Consider if emitLockAnswers(true) is needed here or if stopping timer is sufficient
    }, [emitTimerAction]); // Removed frequently changing dependencies

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
            if (timerQuestionUid && (timerStatus === 'play' || timerStatus === 'pause')) {
                emitTimerAction({ status: 'stop', questionUid: timerQuestionUid, timeLeftMs: 0 });
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

    // Memoize the onReorder callback to prevent unnecessary re-renders
    const handleReorderMemoized = useCallback((qs: Question[]) => {
        setQuestions(qs.map(q => {
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
        }));
    }, []);

    // --- Render Logic ---
    if (loading) return <div className="p-8">Chargement du tableau de bord...</div>;
    if (error) return <div className="p-8 text-red-600">Erreur: {error}</div>;
    if (!code) return <div className="p-8 text-orange-600">Aucun code d'accès fourni.</div>;

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
                                    quizId={gameId || ''}
                                    quizSocket={quizSocket}
                                    quizState={quizState}
                                    initialTournamentCode={initialTournamentCode}
                                    onCodeGenerated={handleCodeGenerated}
                                    onCodeUpdateEmitted={handleCodeUpdateEmitted}
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
                                    {currentTournamentCode && (
                                        <a href={`/teacher/projection/${currentTournamentCode}`} target="_blank" rel="noopener noreferrer"
                                            className="text-primary underline font-medium">
                                            Afficher la vue projecteur
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <h2 className="text-xl font-semibold">Questions</h2>
                                {loading && <InfinitySpin size={32} />}
                            </div>
                            <DraggableQuestionsList
                                quizSocket={quizSocket}
                                questions={mappedQuestions}
                                currentQuestionIdx={quizState?.currentQuestionidx}
                                isChronoRunning={quizState?.chrono?.running}
                                isQuizEnded={quizState?.ended}
                                questionActiveUid={questionActiveUid}
                                timerStatus={timerStatus}
                                timerQuestionUid={timerQuestionUid}
                                timeLeftMs={effectiveTimeLeft}
                                onSelect={handleSelect}
                                onPlay={handlePlay}
                                onPause={handlePause}
                                onStop={handleStop}
                                onEditTimer={handleEditTimer}
                                onReorder={handleReorderMemoized}
                                quizId={gameId || ''}
                                currentTournamentCode={currentTournamentCode || ''}
                                onTimerAction={handleTimerAction}
                                disabled={!quizSocket || !quizSocket.connected || quizState?.ended}
                                expandedUids={expandedUids}
                                onToggleExpand={handleToggleExpand}
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


