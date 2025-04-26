/**
 * Teacher Dashboard Page Component
 * 
 * This component provides the teacher control interface for managing live quizzes.
 * Key functionality includes:
 * 
 * - Real-time control of quiz questions and timing via Socket.IO
 * - Question navigation and display management
 * - Timer controls (play, pause, stop, adjust time)
 * - Tournament code generation and management
 * - Quiz state synchronization between teacher and student views
 * 
 * The dashboard maintains a bidirectional connection with both the server-side
 * quiz state and the student tournament interface. When a teacher takes actions
 * in this dashboard, they are propagated to all connected student devices.
 */

"use client";

import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import DraggableQuestionsList from "@/components/DraggableQuestionsList";
import ConfirmDialog from "@/components/ConfirmDialog";
import { createLogger } from '@/clientLogger';

// Create a logger for this component
const logger = createLogger('TeacherDashboard');

// --- Types ---
interface Response {
    texte: string;
    correct: boolean;
}
interface Question {
    uid: string;
    question: string;
    reponses: Response[];
    temps?: number;
    type?: string;
    explication?: string;
}
interface QuizState {
    currentQuestionIdx: number | null;
    questions: Question[];
    chrono: { timeLeft: number | null; running: boolean };
    locked: boolean;
    ended: boolean;
    stats: Record<string, unknown>;
}

export default function TeacherDashboardPage({ params }: { params: Promise<{ quizId: string }> }) {
    const { quizId } = React.use(params);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [quizName, setQuizName] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [questionActiveUid, setQuestionActiveUid] = useState<string | null>(null);
    const [quizSocket, setQuizSocket] = useState<Socket | null>(null);
    const [quizState, setQuizState] = useState<QuizState | null>(null);
    const [tournamentCode, setTournamentCode] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingPlayIdx, setPendingPlayIdx] = useState<number | null>(null);
    const [timerStatus, setTimerStatus] = useState<'play' | 'pause' | 'stop'>('stop');
    const [timerQuestionId, setTimerQuestionId] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);

    // Local timer state for countdown
    const [localTimeLeft, setLocalTimeLeft] = useState<number | null>(null);
    const timerRef = React.useRef<NodeJS.Timeout | null>(null);

    // Sync local timer with quizState
    useEffect(() => {
        if (!quizState || !quizState.chrono) return;
        setLocalTimeLeft(quizState.chrono.timeLeft);
        if (timerRef.current) clearInterval(timerRef.current);
        if (quizState.chrono.running && quizState.chrono.timeLeft !== null) {
            timerRef.current = setInterval(() => {
                setLocalTimeLeft(prev => {
                    if (prev === null) return null;
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [quizState?.chrono.running, quizState?.chrono.timeLeft]);

    // --- Tournament Code Generation ---
    const handleGenerateTournament = async () => {
        setGenerating(true);
        setTournamentCode(null);
        try {
            const res = await fetch(`/api/quiz/${quizId}/tournament-code`, {
                method: 'POST',
            });
            const data = await res.json();
            if (res.ok && data.tournament_code) {
                const newCode = data.tournament_code;
                setTournamentCode(newCode);

                // After generating a new code, inform the server to update socket communications
                if (quizSocket) {
                    logger.info(`New tournament code generated: ${newCode}, informing server`);
                    quizSocket.emit("update_tournament_code", {
                        quizId,
                        tournamentCode: newCode
                    });

                    // If there's an active question, re-emit it with the new tournament code
                    if (quizState &&
                        typeof quizState.currentQuestionIdx === 'number' &&
                        quizState.currentQuestionIdx >= 0) {

                        logger.info(`Re-emitting current question with new tournament code`);
                        const currentIdx = quizState.currentQuestionIdx;
                        const currentQuestion = quizState.questions[currentIdx];

                        // Re-emit the current question with the new tournament code
                        quizSocket.emit("quiz_set_question", {
                            quizId,
                            questionIdx: currentIdx,
                            chrono: quizState.chrono.timeLeft,
                            code: newCode
                        });
                    }
                }
            } else {
                setTournamentCode(data.message || 'Erreur lors de la génération');
            }
        } catch {
            setTournamentCode('Erreur lors de la génération');
        } finally {
            setGenerating(false);
        }
    }

    useEffect(() => {
        setLoading(true);
        setError(null);
        // Fetch the tournament code for this quiz (single source of truth)
        fetch(`/api/quiz/${quizId}/tournament-code`)
            .then(res => res.json())
            .then(async data => {
                if (data && data.tournament_code) {
                    // Check if a tournament with this code actually exists
                    const tournoiRes = await fetch(`/api/tournament?code=${data.tournament_code}`);
                    if (tournoiRes.ok) {
                        setTournamentCode(data.tournament_code);
                    } else {
                        setTournamentCode(null);
                    }
                } else {
                    setTournamentCode(null);
                }
            });
        // Fetch questions and quiz name as before
        fetch(`/api/teacher/quiz/${quizId}/questions`)
            .then(res => {
                if (!res.ok) throw new Error("Erreur lors du chargement des questions");
                return res.json();
            })
            .then(data => {
                setQuestions(data.questions || []);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
        fetch(`/api/quiz`)
            .then(res => res.json())
            .then((quizzes: { id: string; nom: string }[]) => {
                const found = Array.isArray(quizzes) ? quizzes.find((q) => q.id === quizId) : null;
                setQuizName(found?.nom || "Quiz");
            })
            .catch(() => setQuizName("Quiz"));
    }, [quizId]);

    // Connexion socket.io pour le quiz
    useEffect(() => {
        if (!quizId) return;
        const s = io({ path: "/api/socket/io", transports: ["websocket"] });
        setQuizSocket(s);
        s.emit("join_quiz", { quizId, role: "teacher" });
        s.on("joined_room", ({ room, socketId, rooms }) => {
            logger.debug("Server confirms join", { room, socketId });
        });
        // Log all socket events for debugging
        s.onAny((event, ...args) => {
            logger.debug(`Socket event: ${event}`, args);
        });
        return () => { s.disconnect(); };
    }, [quizId]);

    // Listen for quiz_state events
    useEffect(() => {
        if (!quizSocket) return;
        const handleQuizState = (state: QuizState) => {
            setQuizState(state);
        };
        quizSocket.on("quiz_state", handleQuizState);
        return () => {
            quizSocket.off("quiz_state", handleQuizState);
        };
    }, [quizSocket]);

    // --- Socket Actions ---
    const setQuestion = (idx: number, chrono?: number) => {
        const code = tournamentCode;
        quizSocket?.emit("quiz_set_question", { quizId, questionIdx: idx, chrono, code });
    };
    const endQuiz = () => {
        quizSocket?.emit("quiz_end", { quizId });
    };

    // --- Handlers ---
    const handlePlay = (idx: number, chrono?: number) => {
        // If a question is running or paused (timeLeft > 0), and it's not the same question, show confirm dialog
        if (
            quizState &&
            quizState.chrono &&
            typeof quizState.currentQuestionIdx === 'number' &&
            quizState.chrono.timeLeft !== null && quizState.chrono.timeLeft > 0 &&
            quizState.currentQuestionIdx !== idx
        ) {
            setPendingPlayIdx(idx);
            setShowConfirm(true);
            return;
        }

        // If the same question is already selected but paused, resume it
        if (quizState &&
            quizState.chrono &&
            quizState.chrono.running === false &&
            quizState.currentQuestionIdx === idx) {
            logger.info(`Resuming paused timer for question ${idx}`);
            quizSocket?.emit("quiz_resume", { quizId });
        } else {
            // Starting a new question
            setQuestionActiveUid(questions[idx].uid);
            // Always use the latest edited timer value for this question
            const chronoToUse = questions[idx]?.temps;
            setQuestion(idx, chronoToUse);
            // Emit timer change for tournament clients right after starting the question
            if (tournamentCode && typeof chronoToUse === 'number') {
                quizSocket?.emit("quiz_set_timer", { quizId, timeLeft: chronoToUse });
            }
        }
    };

    const handlePause = (idx: number) => {
        quizSocket?.emit("quiz_pause", { quizId });
    };

    const handleStop = (idx: number) => {
        // Get the active question ID
        if (quizState && typeof quizState.currentQuestionIdx === 'number') {
            const activeQuestionIdx = quizState.currentQuestionIdx;
            const activeQuestionId = quizState.questions[activeQuestionIdx]?.uid;

            if (activeQuestionId && quizSocket) {
                logger.info('Stopping question timer, emitting quiz_timer_action with stop status');
                // This will both set timer to 0 and change the status to stopped
                quizSocket.emit("quiz_timer_action", {
                    status: 'stop',
                    questionId: activeQuestionId,
                    timeLeft: 0,
                    quizId
                });
            } else {
                logger.warn('Cannot stop timer: no active question or socket connection');
            }
        }
    };

    const handleEditTimer = (idx: number, newTime: number) => {
        logger.info(`Editing timer for question ${idx} to ${newTime}s (active: ${quizState?.currentQuestionIdx === idx})`);

        // Always update local state for questions[idx].temps
        setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, temps: newTime } : q));

        // If the question is currently selected, also update the active timer
        if (quizState && typeof quizState.currentQuestionIdx === 'number' && quizState.currentQuestionIdx === idx) {
            // Important: Update the timeLeft state to match the new edited value
            setTimeLeft(newTime);

            // Get the question ID for timer updates
            const questionId = questions[idx]?.uid;

            if (questionId && quizSocket) {
                // For paused questions, use quiz_timer_action to force a complete timer update
                if (quizState.chrono && quizState.chrono.running === false) {
                    logger.info(`Sending complete timer update for paused question: ${newTime}s`);
                    quizSocket.emit("quiz_timer_action", {
                        status: 'pause',
                        questionId: questionId,
                        timeLeft: newTime,
                        quizId
                    });
                } else {
                    // For running or stopped questions, just update the timer value
                    logger.info(`Updating timer value: ${newTime}s`);
                    quizSocket.emit("quiz_set_timer", { quizId, timeLeft: newTime });
                }
            }
        }
    };

    const handleSelect = (uid: string) => {
        setQuestionActiveUid(uid);
    };

    const handleReorder = (newQuestions: typeof questions) => {
        setQuestions(newQuestions);
    };

    // Callback for QuestionSelector
    const handleTimerAction = ({ status, questionId, timeLeft }: { status: 'play' | 'pause' | 'stop', questionId: string, timeLeft: number }) => {
        logger.debug('handleTimerAction', { status, questionId, timeLeft });
        setTimerStatus(status);
        setTimerQuestionId(questionId);
        setTimeLeft(timeLeft);
        if (quizSocket) {
            logger.info('Emitting quiz_timer_action', { status, questionId, timeLeft, quizId });
            quizSocket.emit("quiz_timer_action", { status, questionId, timeLeft, quizId });
        } else {
            logger.warn('quizSocket not ready');
        }
    };

    // Listen for timer updates from server
    useEffect(() => {
        if (!quizSocket) return;
        const handleTimerUpdate = (data: { status: 'play' | 'pause' | 'stop', questionId: string, timeLeft: number }) => {
            logger.debug('Received quiz_timer_update', data);
            setTimerStatus(data.status);
            setTimerQuestionId(data.questionId);
            setTimeLeft(data.timeLeft);
            // Also update the active question if needed
            if (data.status === 'play' && data.questionId) {
                setQuestionActiveUid(data.questionId);
            }
        };
        quizSocket.on("quiz_timer_update", handleTimerUpdate);
        return () => {
            quizSocket.off("quiz_timer_update", handleTimerUpdate);
        };
    }, [quizSocket]);

    if (loading) return <div className="p-8">Chargement…</div>;
    if (error) return <div className="p-8 text-red-600">{error}</div>;

    return (
        <>
            <main className="p-8 space-y-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold">Tableau de bord – {quizName}</h1>
                    <button className="btn btn-primary" onClick={handleGenerateTournament} disabled={generating}>
                        {generating ? 'Génération...' : 'Générer un code tournoi'}
                    </button>
                </div>
                {tournamentCode && (
                    <div className="alert alert-info flex items-center gap-4 mb-4">
                        <span>Code tournoi à donner aux élèves :</span>
                        <span className="font-mono text-2xl font-bold">{tournamentCode}</span>
                        <button className="btn btn-xs btn-outline" onClick={() => navigator.clipboard.writeText(tournamentCode)}>Copier</button>
                    </div>
                )}
                <section>
                    <h2 className="text-xl font-semibold mb-2">Navigation et contrôle</h2>
                    {/* Affichage de l'état temps réel du quiz */}
                    {quizState && (
                        <div className="mb-4 p-4 bg-base-200 rounded-xl">
                            <div className="flex items-center gap-4">
                                <span className="font-bold">Question en cours :</span>
                                {typeof quizState.currentQuestionIdx === 'number' && quizState.questions[quizState.currentQuestionIdx] ? (
                                    <span>{quizState.questions[quizState.currentQuestionIdx].question}</span>
                                ) : <span className="italic text-gray-500">Aucune</span>}
                                {quizState.chrono && localTimeLeft !== null && (
                                    <span className="ml-4 px-3 py-1 rounded-full bg-primary text-primary-foreground font-bold">{localTimeLeft}s</span>
                                )}
                                {quizState.locked && <span className="ml-2 badge badge-warning">Verrouillée</span>}
                                {quizState.ended && <span className="ml-2 badge badge-error">Quiz terminé</span>}
                            </div>
                        </div>
                    )}
                    {/* Contrôles prof */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        <button className="btn btn-error" onClick={endQuiz}>Terminer le quiz</button>
                    </div>
                    <DraggableQuestionsList
                        questions={questions}
                        quizState={quizState}
                        questionActiveUid={questionActiveUid}
                        onSelect={handleSelect}
                        onPlay={handlePlay}
                        onPause={handlePause}
                        onStop={handleStop}
                        onEditTimer={handleEditTimer}
                        onReorder={handleReorder}
                        timerStatus={timerStatus}
                        timerQuestionId={timerQuestionId}
                        timeLeft={timeLeft}
                        onTimerAction={handleTimerAction}
                    />
                </section>
                <section>
                    <h2 className="text-xl font-semibold mb-2">Statistiques en temps réel</h2>
                    <div className="bg-white/80 rounded p-4 text-gray-700">
                        <p>Statistiques à venir… (nombre de réponses, répartition, score moyen, taux de réussite)</p>
                    </div>
                </section>
                <section>
                    <h2 className="text-xl font-semibold mb-2">Gestion des sessions</h2>
                    <div className="bg-white/80 rounded p-4 text-gray-700">
                        <p>Contrôles à venir… (lancer, rejouer, chrono, verrouiller)</p>
                    </div>
                </section>
            </main>
            <ConfirmDialog
                open={showConfirm}
                title="Changer de question ?"
                message="Êtes-vous sûr de vouloir changer de question ? Une question est toujours en cours."
                onConfirm={() => {
                    setShowConfirm(false);
                    if (pendingPlayIdx !== null) {
                        // Force play the pending question
                        setQuestionActiveUid(questions[pendingPlayIdx].uid);
                        setQuestion(pendingPlayIdx, questions[pendingPlayIdx].temps);
                        setPendingPlayIdx(null);
                    }
                }}
                onCancel={() => {
                    setShowConfirm(false);
                    setPendingPlayIdx(null);
                }}
            />
        </>
    );
}

// Helper function to format seconds into MM:SS
function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${paddedMinutes}:${paddedSeconds}`;
}


