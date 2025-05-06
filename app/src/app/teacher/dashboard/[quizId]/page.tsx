/**
 * Teacher Dashboard Page Component - Refactored
 *
 * Uses useTeacherQuizSocket hook for real-time logic and TournamentCodeManager
 * component for code handling.
 */

"use client";

import React, { useEffect, useState, useCallback } from "react";
// Removed direct socket import
import DraggableQuestionsList from "@/components/DraggableQuestionsList";
import ConfirmDialog from "@/components/ConfirmDialog";
import { createLogger } from '@/clientLogger';
import TournamentCodeManager from '@/components/TournamentCodeManager'; // Import new component
import { useTeacherQuizSocket, Question } from '@/hooks/useTeacherQuizSocket'; // Remove unused QuizState
import { UsersRound } from "lucide-react";

// Create a logger for this component
const logger = createLogger('TeacherDashboardPage');


// --- Types moved to hook ---


export default function TeacherDashboardPage({ params }: { params: Promise<{ quizId: string }> }) {
    const { quizId } = React.use(params);
    const [questions, setQuestions] = useState<Question[]>([]); // Keep local question state for UI ordering/editing
    const [quizName, setQuizName] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [questionActiveUid, setQuestionActiveUid] = useState<string | null>(null); // UI state for selected question
    const [initialTournamentCode, setInitialTournamentCode] = useState<string | null>(null); // Fetched code
    const [currentTournamentCode, setCurrentTournamentCode] = useState<string | null>(null); // Active code (from fetch or generation)

    // --- Confirmation Dialog State ---
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingPlayIdx, setPendingPlayIdx] = useState<number | null>(null);

    // --- Use the Custom Hook ---
    const {
        quizSocket,
        quizState,
        timerStatus,
        timerQuestionId,
        localTimeLeft,
        emitSetQuestion,
        emitEndQuiz,
        emitPauseQuiz,
        emitResumeQuiz,
        emitSetTimer,
        emitTimerAction,
        emitUpdateTournamentCode,
        connectedCount, // Ajout du compteur de connectés
    } = useTeacherQuizSocket(quizId, currentTournamentCode); // Pass quizId and current code to hook

    // --- Stats state for answer histograms ---
    type StatsData = { stats: number[]; totalAnswers: number };
    const [questionStats, setQuestionStats] = useState<Record<string, StatsData>>({});

    // Listen for stats updates from the socket
    useEffect(() => {
        if (!quizSocket) return;
        const handleStatsUpdate = (data: { questionUid: string; stats: number[]; totalAnswers: number }) => {
            setQuestionStats(prev => ({ ...prev, [data.questionUid]: { stats: data.stats, totalAnswers: data.totalAnswers } }));
        };
        quizSocket.on('quiz_answer_stats_update', handleStatsUpdate);
        return () => {
            quizSocket.off('quiz_answer_stats_update', handleStatsUpdate);
        };
    }, [quizSocket]);

    // --- Initial Data Fetching (Quiz Name, Questions, Initial Code) ---
    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(null);
        setInitialTournamentCode(null); // Reset on quizId change

        const fetchQuizData = async () => {
            try {
                // Fetch quiz name
                const teacherId = typeof window !== 'undefined' ? localStorage.getItem('mathquest_teacher_id') : null;
                let quizListRes;
                if (teacherId) {
                    quizListRes = await fetch(`/api/quiz?enseignant_id=${teacherId}`);
                } else {
                    quizListRes = await fetch(`/api/quiz`); // Will return error, but keeps logic safe
                }
                if (!quizListRes.ok) throw new Error("Erreur lors du chargement des quiz");
                const quizzes: { id: string; nom: string }[] = await quizListRes.json();
                const found = Array.isArray(quizzes) ? quizzes.find((q) => q.id === quizId) : null;
                if (isMounted) setQuizName(found?.nom || "Quiz");

                // Fetch questions
                const questionsRes = await fetch(`/api/teacher/quiz/${quizId}/questions`);
                if (!questionsRes.ok) throw new Error("Erreur lors du chargement des questions");
                const questionsData = await questionsRes.json();
                // Initialize local question state, ensuring 'temps' exists
                const initialQuestions = (questionsData.questions || []).map((q: Question) => ({
                    ...q,
                    temps: q.temps ?? 60 // Default to 60s if undefined
                }));
                if (isMounted) setQuestions(initialQuestions);


                // Fetch initial tournament code
                const codeRes = await fetch(`/api/quiz/${quizId}/tournament-code`);
                if (!codeRes.ok && codeRes.status !== 404) { // Allow 404 (no code exists)
                    logger.warn(`Failed to fetch initial tournament code: ${codeRes.status}`);
                    // Don't throw, just proceed without an initial code
                } else if (codeRes.ok) {
                    const codeData = await codeRes.json();
                    if (codeData && codeData.tournament_code) {
                        // Verify the tournament exists before setting the code
                        try {
                            const tournoiRes = await fetch(`/api/tournament?code=${codeData.tournament_code}`);
                            if (tournoiRes.ok && isMounted) {
                                logger.info(`Fetched initial tournament code: ${codeData.tournament_code}`);
                                setInitialTournamentCode(codeData.tournament_code);
                                setCurrentTournamentCode(codeData.tournament_code); // Set current code
                            } else if (isMounted) {
                                logger.warn(`Fetched tournament code ${codeData.tournament_code}, but tournament not found or component unmounted.`);
                                setInitialTournamentCode(null); // Treat as no code if tournament doesn't exist
                                setCurrentTournamentCode(null);
                            }
                        } catch (tournoiErr) {
                            logger.error("Error verifying tournament existence:", tournoiErr);
                            if (isMounted) {
                                setInitialTournamentCode(null);
                                setCurrentTournamentCode(null);
                            }
                        }
                    } else if (isMounted) {
                        setInitialTournamentCode(null); // No code found
                        setCurrentTournamentCode(null);
                    }
                } else if (isMounted) {
                    // Handle 404 explicitly - no code exists yet
                    logger.info("No initial tournament code found (404).");
                    setInitialTournamentCode(null);
                    setCurrentTournamentCode(null);
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
    }, [quizId]);


    // --- Sync UI Active Question with Hook's Timer State ---
    // This ensures the UI highlights the correct question based on the *actual* running timer
    useEffect(() => {
        if (timerQuestionId) {
            setQuestionActiveUid(timerQuestionId); // Synchronise toujours sur l'UID
        }
    }, [timerQuestionId]);

    // --- Compute effective timeLeft for DraggableQuestionsList ---
    const effectiveTimeLeft = timerStatus === 'stop' ? 0 : (localTimeLeft ?? 0);

    // --- Handlers (using hook emitters) ---

    const handleSelect = useCallback((uid: string) => {
        logger.info(`Manually selecting question with uid: ${uid}`);
        setQuestionActiveUid(uid);
    }, []);

    const handleReorder = useCallback((newQuestions: Question[]) => {
        logger.info("Questions reordered locally:", newQuestions.map(q => q.uid));
        setQuestions(newQuestions);
    }, []);

    const handlePlay = useCallback((uid: string, startTime: number) => {
        logger.info('[handlePlay] called', { uid, startTime, timerStatus, timerQuestionId, questions });
        const questionToPlay = questions.find(q => q.uid === uid);
        if (!questionToPlay) {
            logger.warn('[handlePlay] Question not found', { uid });
            return;
        }
        const currentQuestionUid = timerQuestionId;
        const isTimerRunningOrPaused = timerStatus === 'play' || timerStatus === 'pause';

        if (currentQuestionUid === questionToPlay.uid) {
            if (timerStatus === 'play') {
                logger.info('[handlePlay] Play on already running question: will pause');
                emitPauseQuiz();
                return;
            }
            if (timerStatus === 'pause') {
                logger.info('[handlePlay] Play on paused question: will resume');
                emitResumeQuiz();
                return;
            }
        }

        if (isTimerRunningOrPaused && currentQuestionUid && currentQuestionUid !== questionToPlay.uid) {
            logger.info('[handlePlay] Should show confirmation popup', { pendingPlayUid: uid });
            setPendingPlayIdx(questions.findIndex(q => q.uid === uid));
            setShowConfirm(true);
            return;
        }

        logger.info(`[handlePlay] Starting timer for question ${questionToPlay.uid}`);
        setQuestionActiveUid(questionToPlay.uid);
        emitSetQuestion(questionToPlay.uid, startTime);
    }, [questions, timerStatus, timerQuestionId, emitPauseQuiz, emitResumeQuiz, emitSetQuestion, currentTournamentCode]);

    const handlePause = useCallback(() => {
        logger.info(`Pausing timer for question ${timerQuestionId}`);
        emitPauseQuiz();
    }, [timerQuestionId, emitPauseQuiz]);

    const handleStop = useCallback(() => {
        if (timerQuestionId && (timerStatus === 'play' || timerStatus === 'pause')) {
            logger.info(`Stopping timer for question ${timerQuestionId}`);
            emitTimerAction({ status: 'stop', questionId: timerQuestionId, timeLeft: 0 });
        } else {
            logger.warn("Cannot stop: No active question ID or timer already stopped.");
        }
    }, [timerStatus, timerQuestionId, emitTimerAction]);

    const handleEditTimer = useCallback((uid: string, newTime: number) => {
        const question = questions.find(q => q.uid === uid);
        if (!question) return;
        logger.info(`Editing timer for question ${uid} to ${newTime}s`);
        setQuestions(prev => prev.map(q => q.uid === uid ? { ...q, temps: newTime } : q));
        if (timerQuestionId === question.uid) {
            if (timerStatus === 'pause') {
                logger.info(`Updating paused timer value via timerAction: ${newTime}s`);
                emitTimerAction({ status: 'pause', questionId: question.uid, timeLeft: newTime });
            } else if (timerStatus === 'play') {
                logger.info(`Updating running timer value via setTimer: ${newTime}s`);
                emitSetTimer(newTime);
            } else {
                logger.info(`Updating stopped timer value via setTimer: ${newTime}s`);
                emitSetTimer(newTime);
            }
        }
    }, [questions, timerQuestionId, timerStatus, emitTimerAction, emitSetTimer]);

    const handleTimerAction = useCallback((action: { status: 'play' | 'pause' | 'stop', questionId: string, timeLeft: number }) => {
        logger.debug('handleTimerAction called from DraggableQuestionsList', action);
        emitTimerAction(action);
    }, [emitTimerAction]);

    const handleShowResults = useCallback((uid: string) => {
        logger.info(`[handleShowResults] Clôturer la question et afficher les résultats`, { uid });
        emitTimerAction({ status: 'stop', questionId: uid, timeLeft: 0 });
        quizSocket?.emit('quiz_close_question', { quizId, tournamentCode: currentTournamentCode, questionUid: uid });
    }, [emitTimerAction, quizSocket, quizId, currentTournamentCode]);

    // Callback from TournamentCodeManager when a new code is generated
    const handleCodeGenerated = useCallback((newCode: string | null) => {
        logger.info(`Tournament code updated via TournamentCodeManager: ${newCode}`);
        setCurrentTournamentCode(newCode); // Update the code used by the hook
    }, []);

    // Callback from TournamentCodeManager when it emits update_tournament_code
    const handleCodeUpdateEmitted = useCallback((newCode: string) => {
        // Use the hook's emitter function
        emitUpdateTournamentCode(newCode);
    }, [emitUpdateTournamentCode]);


    // --- Confirmation Dialog ---
    const confirmPlay = () => {
        setShowConfirm(false);
        if (pendingPlayIdx !== null) {
            const questionToPlay = questions[pendingPlayIdx];
            logger.info(`Confirmed play for question ${pendingPlayIdx} (${questionToPlay?.uid})`);
            if (timerQuestionId && (timerStatus === 'play' || timerStatus === 'pause')) {
                emitTimerAction({ status: 'stop', questionId: timerQuestionId, timeLeft: 0 });
            }
            if (questionToPlay) {
                setQuestionActiveUid(questionToPlay.uid);
                emitSetQuestion(questionToPlay.uid, questionToPlay.temps);
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
    const tournamentCodeManagerRef = React.useRef<TournamentCodeManagerRef | null>(null);

    const handleRequestGenerateCode = () => {
        setShowGenerateCodeConfirm(true);
    };
    const confirmGenerateCode = () => {
        setShowGenerateCodeConfirm(false);
        // Appelle la méthode de génération du code du composant enfant
        if (tournamentCodeManagerRef.current && tournamentCodeManagerRef.current.generateTournament) {
            tournamentCodeManagerRef.current.generateTournament();
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
                                <TournamentCodeManager
                                    ref={tournamentCodeManagerRef}
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
                                questions={questions}
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
                                onReorder={handleReorder}
                                onTimerAction={handleTimerAction}
                                disabled={!quizSocket || !quizSocket.connected || quizState?.ended}
                                onShowResults={handleShowResults}
                                showResultsDisabled={() => false}
                                // Always show stats if available
                                getStatsForQuestion={uid => questionStats[uid]?.stats}
                                onStatsToggle={(uid, show) => {
                                    logger.info(`[DASHBOARD] Emitting quiz_toggle_stats`, { quizId, questionUid: uid, show });
                                    if (quizSocket && quizId) {
                                        quizSocket.emit('quiz_toggle_stats', {
                                            quizId,
                                            questionUid: uid,
                                            show
                                        });
                                    }
                                }}
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
        </div>
    );
}

interface TournamentCodeManagerRef {
    generateTournament: () => void;
}


