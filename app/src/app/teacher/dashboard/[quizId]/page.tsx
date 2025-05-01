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
import { useTeacherQuizSocket, Question, QuizState } from '@/hooks/useTeacherQuizSocket'; // Import hook and types
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


    // --- Handlers (using hook emitters) ---

    const handleSelect = useCallback((uid: string) => {
        // Only update the visual selection, don't trigger socket events
        logger.info(`Manually selecting question with uid: ${uid}`);
        setQuestionActiveUid(uid);
    }, []);

    const handleReorder = useCallback((newQuestions: Question[]) => {
        // Update local order only, does NOT inform the server yet
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

        // Si on clique sur la question déjà sélectionnée
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
        emitSetQuestion(questionToPlay.uid, startTime); // ENVOIE L'UID UNIQUEMENT
    }, [questions, timerStatus, timerQuestionId, emitPauseQuiz, emitResumeQuiz, emitSetQuestion]);

    // Corrected signature: no index needed
    const handlePause = useCallback(() => {
        logger.info(`Pausing timer for question ${timerQuestionId}`);
        emitPauseQuiz();
    }, [timerStatus, timerQuestionId, emitPauseQuiz]);

    // Corrected signature: no index needed
    const handleStop = useCallback(() => {
        if (timerQuestionId && (timerStatus === 'play' || timerStatus === 'pause')) {
            logger.info(`Stopping timer for question ${timerQuestionId}`);
            emitTimerAction({
                status: 'stop',
                questionId: timerQuestionId,
                timeLeft: 0,
            });
        } else {
            logger.warn("Cannot stop: No active question ID or timer already stopped.");
        }
    }, [timerStatus, timerQuestionId, emitTimerAction]);


    // CHANGED: handleEditTimer now takes uid instead of idx
    const handleEditTimer = useCallback((uid: string, newTime: number) => {
        const question = questions.find(q => q.uid === uid);
        if (!question) return;

        logger.info(`Editing timer for question ${uid} to ${newTime}s`);

        // 1. Update local question state immediately for UI responsiveness
        setQuestions(prev => prev.map(q => q.uid === uid ? { ...q, temps: newTime } : q));

        // 2. For active questions, update the server based on timer status
        if (timerQuestionId === question.uid) {
            if (timerStatus === 'pause') {
                logger.info(`Updating paused timer value via timerAction: ${newTime}s`);
                emitTimerAction({
                    status: 'pause',
                    questionId: question.uid,
                    timeLeft: newTime,
                });
            } else if (timerStatus === 'play') {
                logger.info(`Updating running timer value via setTimer: ${newTime}s`);
                emitSetTimer(newTime);
            } else {
                // Pour les timers arrêtés (status = 'stop'), on utilise également emitSetTimer
                // pour mettre à jour le temps sur le serveur
                logger.info(`Updating stopped timer value via setTimer: ${newTime}s`);
                emitSetTimer(newTime);
            }
        } else {
            // For non-active questions, we only update local state
            // The new time will be used when this question is activated
            logger.info(`Editing timer for non-active question ${question.uid}. Local 'temps' updated to ${newTime}s.`);
            // No server emit needed - the server will get the updated time when the question is played
        }

    }, [questions, timerQuestionId, timerStatus, emitTimerAction, emitSetTimer]);

    const handleTimerAction = useCallback((action: { status: 'play' | 'pause' | 'stop', questionId: string, timeLeft: number }) => {
        logger.debug('handleTimerAction called from DraggableQuestionsList', action);
        // Directly emit the action using the hook's emitter
        emitTimerAction(action);
    }, [emitTimerAction]);

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


    // --- Confirmation Dialog Logic ---
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
                emitSetQuestion(questionToPlay.uid, questionToPlay.temps); // ENVOIE L'UID UNIQUEMENT
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

    // --- Change Question Confirmation Logic ---
    const [showChangeQuestionConfirm, setShowChangeQuestionConfirm] = useState(false);
    const [pendingQuestionUid, setPendingQuestionUid] = useState<string | null>(null);

    const handleChangeQuestion = (uid: string) => {
        if (timerStatus === 'play' || timerStatus === 'pause') {
            setPendingPlayIdx(questions.findIndex(q => q.uid === uid));
            setShowChangeQuestionConfirm(true);
        } else {
            setQuestionActiveUid(uid);
            emitSetQuestion(uid, questions.find(q => q.uid === uid)?.temps || 60); // ENVOIE L'UID UNIQUEMENT
        }
    };

    const confirmChangeQuestion = () => {
        if (pendingQuestionUid) {
            setQuestionActiveUid(pendingQuestionUid);
            emitSetQuestion(pendingQuestionUid, questions.find(q => q.uid === pendingQuestionUid)?.temps || 60); // ENVOIE L'UID UNIQUEMENT
        }
        setShowChangeQuestionConfirm(false);
        setPendingQuestionUid(null);
    };

    const cancelChangeQuestion = () => {
        setShowChangeQuestionConfirm(false);
        setPendingQuestionUid(null);
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
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
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
                                timeLeft={localTimeLeft ?? 0}
                                onSelect={handleSelect}
                                onPlay={handlePlay}
                                onPause={handlePause}
                                onStop={handleStop}
                                onEditTimer={handleEditTimer}
                                onReorder={handleReorder}
                                onTimerAction={handleTimerAction}
                                disabled={!quizSocket || !quizSocket.connected || quizState?.ended}
                            />
                        </section>
                        <section>
                            <h2 className="text-xl font-semibold mb-2">Statistiques en temps réel</h2>
                            <div className="bg-base-200 rounded p-4 text-base-content/80">
                                <p>Statistiques à venir… (nombre de réponses, répartition, score moyen, taux de réussite)</p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
            {/* Confirmation Dialogs */}
            <ConfirmDialog
                open={showConfirm}
                title="Changer de question ?"
                message="Une autre question est en cours ou en pause. Voulez-vous vraiment lancer cette nouvelle question et arrêter la précédente ?"
                onConfirm={confirmPlay}
                onCancel={cancelPlay}
            />
            <ConfirmDialog
                open={showChangeQuestionConfirm}
                title="Changer de question ?"
                message="Une question est en cours. Voulez-vous vraiment passer à une autre question ?"
                onConfirm={confirmChangeQuestion}
                onCancel={cancelChangeQuestion}
            />
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


