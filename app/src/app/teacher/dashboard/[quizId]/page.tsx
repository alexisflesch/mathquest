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
                const quizListRes = await fetch(`/api/quiz`);
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
            setQuestionActiveUid(timerQuestionId);
        }
        // Optional: Clear selection if timer stops? Depends on desired UX.
        // else if (timerStatus === 'stop') {
        //     setQuestionActiveUid(null);
        // }
    }, [timerQuestionId, timerStatus]);


    // --- Handlers (using hook emitters) ---

    // Corrected signature: uid and startTime
    const handlePlay = useCallback((uid: string, startTime: number) => {
        const idx = questions.findIndex(q => q.uid === uid); // Find index using uid
        if (idx === -1) return;
        const questionToPlay = questions[idx];

        const currentQuestionUid = timerQuestionId;
        const isTimerRunningOrPaused = timerStatus === 'play' || timerStatus === 'pause';

        if (isTimerRunningOrPaused && currentQuestionUid && currentQuestionUid !== questionToPlay.uid) {
            setPendingPlayIdx(idx);
            setShowConfirm(true);
            return;
        }

        if (timerStatus === 'pause' && currentQuestionUid === questionToPlay.uid) {
            logger.info(`Resuming paused timer for question ${questionToPlay.uid}`);
            emitResumeQuiz();
        } else {
            logger.info(`Starting timer for question ${questionToPlay.uid}`);
            setQuestionActiveUid(questionToPlay.uid);
            // Use startTime passed from DraggableQuestionsList (which defaults to q.temps)
            emitSetQuestion(idx, startTime);
        }
        // Updated dependencies
    }, [questions, timerStatus, timerQuestionId, emitResumeQuiz, emitSetQuestion, setPendingPlayIdx, setShowConfirm]);

    // Corrected signature: no index needed
    const handlePause = useCallback(() => {
        if (timerStatus === 'play' && timerQuestionId) {
            logger.info(`Pausing timer for question ${timerQuestionId}`);
            emitPauseQuiz();
        } else {
            logger.warn("Cannot pause: Timer not playing or no active question ID.");
        }
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
                // For stopped timers, just update local state (no need to tell server)
                logger.info(`Timer for question ${question.uid} is stopped, only local 'temps' updated.`);
            }
        } else {
            // For non-active questions, we only update local state
            // The new time will be used when this question is activated
            logger.info(`Editing timer for non-active question ${question.uid}. Local 'temps' updated to ${newTime}s.`);
            // No server emit needed - the server will get the updated time when the question is played
        }

    }, [questions, timerQuestionId, timerStatus, emitTimerAction, emitSetTimer]);


    const handleSelect = useCallback((uid: string) => {
        // Only update the visual selection, don't trigger socket events
        setQuestionActiveUid(uid);
    }, []);

    const handleReorder = useCallback((newQuestions: Question[]) => {
        // Update local order. Does NOT inform the server yet.
        // TODO: Need a mechanism to persist this order if desired (e.g., emit a 'reorder_questions' event).
        logger.info("Questions reordered locally.");
        setQuestions(newQuestions);
    }, []);

    // Callback for DraggableQuestionsList's internal timer buttons (if any)
    // This might be redundant now if all actions go through handlePlay/Pause/Stop/Edit
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
            if (questionToPlay) {
                setQuestionActiveUid(questionToPlay.uid); // Update UI selection
                emitSetQuestion(pendingPlayIdx, questionToPlay.temps); // Use hook emitter
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
            setPendingQuestionUid(uid);
            setShowChangeQuestionConfirm(true);
        } else {
            setQuestionActiveUid(uid);
            emitSetQuestion(questions.findIndex(q => q.uid === uid), questions.find(q => q.uid === uid)?.temps || 60);
        }
    };

    const confirmChangeQuestion = () => {
        if (pendingQuestionUid) {
            setQuestionActiveUid(pendingQuestionUid);
            emitSetQuestion(questions.findIndex(q => q.uid === pendingQuestionUid), questions.find(q => q.uid === pendingQuestionUid)?.temps || 60);
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
        <>
            <main className="p-8 space-y-8">
                {/* Ligne 1 : Titre + bouton terminer */}
                <div className="flex flex-row items-center justify-between mb-2 gap-2">
                    <h1 className="text-3xl font-bold">Tableau de bord – {quizName}</h1>
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
                {/* Ligne 2 : TournamentCodeManager + compteur, responsive */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                    {/* TournamentCodeManager (gère code + bouton) */}
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
                    {/* Saut de ligne forcé sur mobile après le bouton */}
                    <div className="basis-full h-0 sm:hidden" />
                    {/* Compteur utilisateurs connectés */}
                    <div className="flex items-center gap-2 ml-auto text-base-content/80">
                        <UsersRound className="w-6 h-6" />
                        <span className="font-semibold">{connectedCount}</span>
                    </div>
                </div>
                {/* Sur mobile, couper la ligne en 2 (3+3) */}
                {/* Les autres sections restent inchangées */}
                <section>
                    <h2 className="text-xl font-semibold mb-4">Questions</h2>
                    {/* Add a message if socket is not connected */}
                    {!quizSocket || !quizSocket.connected && (
                        <div className="alert alert-warning mb-4">
                            Connexion au serveur en cours ou perdue... Les contrôles sont désactivés.
                        </div>
                    )}
                    <DraggableQuestionsList
                        questions={questions} // Pass local questions state for ordering/display
                        // Pass state derived from the hook
                        currentQuestionIdx={quizState?.currentQuestionIdx} // Pass specific prop
                        isChronoRunning={quizState?.chrono?.running} // Pass specific prop
                        isQuizEnded={quizState?.ended} // Pass specific prop
                        questionActiveUid={questionActiveUid} // Pass local UI selection state
                        timerStatus={timerStatus}
                        timerQuestionId={timerQuestionId}
                        timeLeft={localTimeLeft ?? 0} // Use local countdown for display
                        // Pass handlers
                        onSelect={handleSelect}
                        onPlay={handlePlay}
                        onPause={handlePause}
                        onStop={handleStop}
                        onEditTimer={handleEditTimer}
                        onReorder={handleReorder}
                        onTimerAction={handleTimerAction} // Keep if DraggableQuestionsList needs it
                        // Disable controls if socket is not connected or quiz ended
                        disabled={!quizSocket || !quizSocket.connected || quizState?.ended}
                    />
                </section>

                {/* Statistics Section (Placeholder) */}
                <section>
                    <h2 className="text-xl font-semibold mb-2">Statistiques en temps réel</h2>
                    <div className="bg-base-200 rounded p-4 text-base-content/80">
                        <p>Statistiques à venir… (nombre de réponses, répartition, score moyen, taux de réussite)</p>
                        {/* Display raw quizState for debugging */}
                        {/* <pre className="text-xs mt-4 overflow-auto max-h-60 bg-base-300 p-2 rounded">
                            {JSON.stringify(quizState, null, 2)}
                        </pre> */}
                    </div>
                </section>

                {/* Removed "Gestion des sessions" placeholder */}

            </main>

            {/* Confirmation Dialog */}
            <ConfirmDialog
                open={showConfirm}
                title="Changer de question ?"
                message="Une autre question est en cours ou en pause. Voulez-vous vraiment lancer cette nouvelle question et arrêter la précédente ?"
                onConfirm={confirmPlay}
                onCancel={cancelPlay}
            />

            {/* Change Question Confirmation Dialog */}
            <ConfirmDialog
                open={showChangeQuestionConfirm}
                title="Changer de question ?"
                message="Une question est en cours. Voulez-vous vraiment passer à une autre question ?"
                onConfirm={confirmChangeQuestion}
                onCancel={cancelChangeQuestion}
            />

            {/* Confirmation Dialog pour la génération d'un nouveau code tournoi */}
            <ConfirmDialog
                open={showGenerateCodeConfirm}
                title="Générer un nouveau code"
                message="Les résultats du tournoi actuel seront perdus. Continuer ?"
                onConfirm={confirmGenerateCode}
                onCancel={cancelGenerateCode}
            />
        </>
    );
}

interface TournamentCodeManagerRef {
    generateTournament: () => void;
}


