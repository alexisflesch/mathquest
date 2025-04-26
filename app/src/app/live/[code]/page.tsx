/**
 * Tournament Page Component
 * 
 * This component manages the student-facing tournament experience, handling:
 * - Socket.IO connection to the tournament room
 * - Question display and answer submission
 * - Timer management (countdown, pause, resume)
 * - Synchronization with teacher dashboard actions
 * 
 * The component supports both real-time tournaments and differed (asynchronous) mode,
 * with different state management for each mode. It also has a dev mode for testing.
 */

"use client";
import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { useAuth } from '@/components/AuthProvider';
import { Timer } from 'lucide-react';
import Snackbar from '@/components/Snackbar';
import { createLogger } from '@/clientLogger';

// Create a logger for this component
const logger = createLogger('Tournament');

interface TournamentQuestion {
    uid: string;
    question: string;
    reponses: { texte: string; correct?: boolean }[];
    type: string;
    discipline: string;
    theme: string;
    difficulte: number;
    niveau: string;
    auteur?: string;
    explication?: string;
    tags?: string[];
    temps?: number;
}

export default function TournamentSessionPage() {
    const { code } = useParams();
    const router = useRouter();
    // DEV MODE: check for ?dev=1&mode=choix_simple or ?dev=1&mode=choix_multiple
    const [devMode, setDevMode] = useState(false);
    const [devModeType, setDevModeType] = useState<'choix_simple' | 'choix_multiple'>('choix_simple');
    const [socket, setSocket] = useState<Socket | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<TournamentQuestion | null>(null);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [answered, setAnswered] = useState(false);
    const [timer, setTimer] = useState<number | null>(null);
    const [waiting, setWaiting] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState<string>("");
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const { isStudent, isTeacher } = useAuth();
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]); // For multiple choice
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>("");
    const [snackbarType, setSnackbarType] = useState<"success" | "error">("success");
    const [paused, setPaused] = useState(false);
    const pausedRef = useRef(paused);
    useEffect(() => { pausedRef.current = paused; }, [paused]);

    // Add responsive countdown timer display
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // Detect differed mode from URL
    const [isDiffered, setIsDiffered] = useState(false);
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            setIsDiffered(params.get('differed') === '1');
        }
    }, []);

    // Connect to socket.io and handle real-time events
    useEffect(() => {
        // DEV MODE: check URL params
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('dev') === '1') {
                setDevMode(true);
                const mode = params.get('mode');
                if (mode === 'choix_multiple') setDevModeType('choix_multiple');
                else setDevModeType('choix_simple');
            }
        }
    }, []);

    useEffect(() => {
        if (devMode) {
            // Mock question for dev mode
            const mockQuestion = devModeType === 'choix_multiple' ? {
                uid: 'mock2',
                question: 'Quelles sont les couleurs primaires ?',
                reponses: [
                    { texte: 'Rouge', correct: true },
                    { texte: 'Vert', correct: false },
                    { texte: 'Bleu', correct: true },
                    { texte: 'Jaune', correct: true },
                ],
                type: 'choix_multiple',
                discipline: 'Arts',
                theme: 'Couleurs',
                difficulte: 1,
                niveau: 'CE2',
            } : {
                uid: 'mock1',
                question: 'Combien font 7 + 5 ?',
                reponses: [
                    { texte: '10', correct: false },
                    { texte: '12', correct: true },
                    { texte: '13', correct: false },
                    { texte: '14', correct: false },
                ],
                type: 'choix_simple',
                discipline: 'Maths',
                theme: 'Additions',
                difficulte: 1,
                niveau: 'CE2',
            };
            setCurrentQuestion(mockQuestion);
            setQuestionIndex(0);
            setTotalQuestions(1);
            setAnswered(false);
            setShowResult(false);
            setTimer(20); // Only set timer here, when question changes
            setWaiting(false);
            return;
        }
        const s = io({
            path: "/api/socket/io",
            transports: ["websocket"],
        });
        setSocket(s);

        // Join the tournament room
        let cookie_id = null;
        let pseudo = null;
        let avatar = null;
        if (typeof window !== 'undefined') {
            cookie_id = localStorage.getItem('mathquest_cookie_id');
            pseudo = localStorage.getItem('mathquest_pseudo');
            avatar = localStorage.getItem('mathquest_avatar');
            logger.debug('cookie_id before join_tournament:', cookie_id);
            logger.debug('pseudo before join_tournament:', pseudo);
            logger.debug('avatar before join_tournament:', avatar);
        }
        s.emit("join_tournament", { code, cookie_id, pseudo, avatar, isDiffered });

        // Receive a new question
        s.on("tournament_question", ({ question, index, total, remainingTime, questionState }) => {
            // Round timer to nearest second
            const roundedTime = remainingTime != null ? Math.round(remainingTime) : 20;
            logger.debug('tournament_question RECEIVED', {
                questionId: question?.uid,
                questionText: question?.question?.substring(0, 30) + (question?.question?.length > 30 ? '...' : ''),
                index,
                total,
                remainingTime: roundedTime,
                questionState,
                responseCount: question?.reponses?.length
            });

            if (!question) {
                logger.error('Received tournament_question event with no question data');
                return;
            }

            setCurrentQuestion(question);
            setQuestionIndex(index);
            setTotalQuestions(total);
            setAnswered(false);
            setShowResult(false);
            setTimer(roundedTime);
            setWaiting(false);
            setPaused(questionState === "paused");
            pausedRef.current = questionState === "paused";

            logger.debug('Updated state with question data', {
                questionSet: !!question,
                timer: roundedTime,
                paused: questionState === "paused"
            });

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if (questionState === "paused") {
                // Do not start timer interval if paused
                logger.debug('Timer not started because question is paused');
                return;
            }

            logger.debug('Starting timer interval from', roundedTime);
            timerRef.current = setInterval(() => {
                setTimer((prev) => {
                    if (prev === null) return null;
                    if (prev <= 1) {
                        if (timerRef.current) clearInterval(timerRef.current);
                        setWaiting(true);
                        logger.debug('Timer reached 0, setWaiting(true)');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        });

        // Handle pause event from server
        s.on("tournament_pause", () => {
            logger.debug('tournament_pause');
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            setPaused(true);
            pausedRef.current = true;
            setWaiting(true);
            logger.debug('paused set to true');
        });

        // Handle resume event from server
        s.on("tournament_resume", () => {
            logger.debug('tournament_resume');
            setWaiting(false);
            setPaused(false);
            pausedRef.current = false;
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setTimer((prev) => {
                    if (prev === null) return null;
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        setWaiting(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        });

        // Handle tournament_timer_update events from server
        s.on("tournament_timer_update", (data) => {
            logger.debug('tournament_timer_update', data);

            if (!data || !data[0]) {
                logger.warn('Empty tournament_timer_update data');
                return;
            }

            const update = data[0];

            // Update timer with the server's timeLeft value
            setTimer(update.timeLeft);

            // Handle paused state
            if (update.status === 'pause') {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                setPaused(true);
                pausedRef.current = true;
                logger.debug('Timer paused from timer_update event');
            }

            // Set waiting state if timer is at 0
            if (update.timeLeft === 0) {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                setWaiting(true);
                logger.debug('Timer set to 0 from timer_update event');
            }
        });

        // Handle quiz_update events from server (teacher dashboard actions)
        s.on("quiz_update", (data) => {
            logger.debug('quiz_update', data);

            // The data is directly an object, not an array
            if (!data) {
                logger.warn('Empty quiz_update data');
                return;
            }

            // Use the data object directly
            const update = data;

            // Update timer with the timeLeft value
            if (typeof update.timeLeft === 'number') {
                setTimer(update.timeLeft);
            }

            // Handle different status types
            if (update.status === 'pause') {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                setPaused(true);
                pausedRef.current = true;
                logger.debug('Timer paused from quiz_update event');
            } else if (update.status === 'play') {
                setPaused(false);
                pausedRef.current = false;

                // Restart timer if not already running
                if (!timerRef.current && timer !== null && timer > 0) {
                    logger.debug('Restarting timer from quiz_update event');
                    timerRef.current = setInterval(() => {
                        setTimer((prev) => {
                            if (prev === null) return null;
                            if (prev <= 1) {
                                if (timerRef.current) clearInterval(timerRef.current);
                                setWaiting(true);
                                return 0;
                            }
                            return prev - 1;
                        });
                    }, 1000);
                }
            } else if (update.status === 'stop') {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                setTimer(0);
                setWaiting(true);
                logger.debug('Timer stopped from quiz_update event');
            }
        });

        // Handle set timer to 0 from server (stop button)
        s.on("tournament_set_timer", ({ timeLeft }) => {
            logger.debug('tournament_set_timer', { timeLeft, paused: pausedRef.current });
            setTimer(timeLeft);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if (timeLeft === 0) {
                setWaiting(true);
                logger.debug('setWaiting(true) because timeLeft is 0');
            } else if (typeof timeLeft === 'number' && timeLeft > 0) {
                // Only start countdown if not paused
                if (!pausedRef.current) {
                    setWaiting(false);
                    logger.debug('Starting countdown interval (not paused)');
                    timerRef.current = setInterval(() => {
                        setTimer((prev) => {
                            if (prev === null) return null;
                            if (prev <= 1) {
                                if (timerRef.current) clearInterval(timerRef.current);
                                setWaiting(true);
                                logger.debug('Timer reached 0, setWaiting(true)');
                                return 0;
                            }
                            return prev - 1;
                        });
                    }, 1000);
                } else {
                    logger.debug('Timer updated but NOT starting countdown (paused)');
                }
            }
        });

        // Receive answer result
        s.on("tournament_answer_result", (payload) => {
            logger.debug("RECEIVED tournament_answer_result", payload);

            // Only show feedback about whether the answer was received or rejected
            if (payload.rejected) {
                // Show error for rejected answers (e.g., too late)
                setSnackbarType("error");
                setSnackbarMessage(payload.message || "Réponse rejetée");
                setSnackbarOpen(true);
            } else if (payload.received) {
                // Show simple confirmation that answer was received, without any correctness indication
                setSnackbarType("success");
                setSnackbarMessage("Réponse envoyée");
                setSnackbarOpen(true);
            }

            setAnswered(true);
            setShowResult(false); // Don't show result
        });

        // Receive tournament end
        s.on("tournament_end", ({ finalScore }) => {
            setShowResult(true);
            setResult(`Tournoi terminé ! Score : ${finalScore}`);
            setCurrentQuestion(null);
            setWaiting(false);
            if (timerRef.current) clearInterval(timerRef.current);
            // Optionally: show leaderboard
        });

        // Get pseudo/avatar from localStorage for highlighting
        if (typeof window !== 'undefined') {
            if (isStudent) {
            } else if (isTeacher) {
            }
        }

        // Handle tournament code updates
        s.on("tournament_code_updated", ({ oldCode, newCode }) => {
            logger.info(`Received tournament_code_updated: ${oldCode} -> ${newCode}`);

            // If this is our tournament, update our rooms and state
            if (oldCode === code) {
                logger.info(`Our tournament code changed, joining new room: tournament_${newCode}`);

                // Join the new tournament room
                s.emit("join_tournament", {
                    code: newCode,
                    cookie_id,
                    pseudo,
                    avatar,
                    isDiffered
                });

                // Redirect to the new tournament URL to keep everything consistent
                router.replace(`/leaderboard/${code}`);
            }
        });

        return () => {
            s.disconnect();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [code, isStudent, isTeacher, devMode, devModeType, isDiffered]);

    // --- SOCKET EVENTS LOGGING ---
    useEffect(() => {
        if (!socket) return;
        // Log all socket events for debug
        socket.onAny((event, ...args) => {
            logger.debug(`socket event: ${event}`, args);
        });
        // Log tournament_question
        socket.on("tournament_question", (payload) => {
            logger.debug("RECEIVED tournament_question", payload);
        });
        // Log answer result
        socket.on("tournament_answer_result", (payload) => {
            logger.debug("RECEIVED tournament_answer_result", payload);
        });
        // Log tournament_end
        socket.on("tournament_end", (payload) => {
            logger.info("RECEIVED tournament_end", payload);
        });
        // Log errors
        socket.on("tournament_error", (payload) => {
            logger.error("RECEIVED tournament_error", payload);
        });
        // Log finished redirect
        socket.on("tournament_finished_redirect", (payload) => {
            logger.info("RECEIVED tournament_finished_redirect", payload);
        });
        return () => {
            socket.offAny();
            socket.off("tournament_question");
            socket.off("tournament_answer_result");
            socket.off("tournament_end");
            socket.off("tournament_error");
            socket.off("tournament_finished_redirect");
        };
    }, [socket]);

    // Timer logic for dev mode
    useEffect(() => {
        if (!devMode) return;
        if (timerRef.current) clearInterval(timerRef.current);
        if (timer !== null && timer > 0) {
            timerRef.current = setInterval(() => {
                setTimer((prev) => {
                    if (prev === null) return null;
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [devMode, timer]);

    useEffect(() => {
        if (devMode) return; // In dev mode, skip socket logic and timer end handling
        if (!currentQuestion || timer === null) return;
        if (timer === 0) {
            setWaiting(true);
        }
    }, [timer, currentQuestion, devMode]);

    useEffect(() => {
        if (devMode) return; // In dev mode, skip socket logic
        if (!socket) return;
        // Listen for tournament finished redirect
        socket.on("tournament_finished_redirect", ({ code }) => {
            router.replace(`/leaderboard/${code}`);
        });
        return () => {
            socket.off("tournament_finished_redirect");
        };
    }, [socket, router, devMode]);

    useEffect(() => {
        if (!socket) return;
        // Listen for tournament_already_played event
        socket.on("tournament_already_played", ({ code }) => {
            // Redirect to leaderboard if already played
            router.replace(`/leaderboard/${code}`);
        });

        // Handle redirect to lobby if tournament hasn't started yet,
        // but ONLY if we don't have a current question (meaning we're not already playing)
        socket.on("tournament_redirect_to_lobby", ({ code }) => {
            // Only redirect if we don't already have a question
            if (!currentQuestion) {
                logger.info("Received tournament_redirect_to_lobby, redirecting to lobby");
                router.replace(`/lobby/${code}`);
            } else {
                logger.info("Received tournament_redirect_to_lobby but ignored - already have question");
            }
        });

        return () => {
            socket.off("tournament_already_played");
            socket.off("tournament_redirect_to_lobby");
        };
    }, [socket, router, currentQuestion]);

    // Reset selected answers when new question arrives
    useEffect(() => {
        setSelectedAnswer(null);
        setSelectedAnswers([]);
        setSnackbarOpen(false);
    }, [currentQuestion]);

    // Helper: is multiple choice
    const isMultipleChoice = currentQuestion?.type === "choix_multiple";

    // Handle single choice answer submission
    const handleSingleChoice = (idx: number) => {
        logger.debug('handleSingleChoice called', { idx, waiting, selectedAnswer, socket: !!socket, currentQuestion });

        // Allow answering even if timer has expired - let server handle validation
        setSelectedAnswer(idx === selectedAnswer ? null : idx);
        if (!socket || !currentQuestion) {
            logger.warn('handleSingleChoice: socket or currentQuestion missing');
            return;
        }
        const clientTimestamp = Date.now();
        logger.debug('Emitting tournament_answer', {
            code,
            questionUid: currentQuestion.uid,
            answerIdx: idx,
            clientTimestamp,
            isDiffered,
        });
        socket.emit("tournament_answer", {
            code,
            questionUid: currentQuestion.uid,
            answerIdx: idx,
            clientTimestamp,
            isDiffered,
        });
        // Don't show snackbar immediately - wait for server response
    };

    // Handle multiple choice answer submission
    const handleSubmitMultiple = () => {
        logger.debug('handleSubmitMultiple called', { selectedAnswers, answered, waiting, socket: !!socket, currentQuestion });
        if (devMode) {
            if (!currentQuestion || answered || selectedAnswers.length === 0) return;
            setAnswered(true);
            setSnackbarMessage("Réponse enregistrée");
            setSnackbarOpen(true);
            return;
        }

        // Only validate that we have answers to send - server will handle timing validation
        if (!socket || !currentQuestion || answered || selectedAnswers.length === 0) {
            logger.warn('handleSubmitMultiple: missing requirements', {
                socket: !!socket,
                currentQuestion,
                answered,
                selectedAnswers
            });
            return;
        }

        const clientTimestamp = Date.now();
        logger.debug('Emitting tournament_answer', {
            code,
            questionUid: currentQuestion.uid,
            answerIdx: selectedAnswers, // Send array for multiple
            clientTimestamp,
            isDiffered,
        });
        socket.emit("tournament_answer", {
            code,
            questionUid: currentQuestion.uid,
            answerIdx: selectedAnswers, // Send array for multiple
            clientTimestamp,
            isDiffered,
        });
        setAnswered(true);
        // Don't show snackbar immediately - wait for server response
    };

    // Instead, just show a simple end message if needed
    if (devMode && !currentQuestion) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200">
                <div className="card bg-base-100 shadow-xl p-2">
                    <div className="card-body items-center">
                        <div className="text-xl font-bold">Fin du test dev mode.</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentQuestion && !showResult) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200">
                <div className="card bg-base-100 shadow-xl p-2">
                    <div className="card-body items-center">
                        <div className="text-xl font-bold">En attente du début du tournoi…</div>
                    </div>
                </div>
            </div>
        );
    }

    // In the return, show the result if showResult is true
    if (showResult) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200">
                <div className="card bg-base-100 shadow-xl p-2">
                    <div className="card-body items-center">
                        <div className="text-xl font-bold">{result || "Tournoi terminé !"}</div>
                    </div>
                </div>
            </div>
        );
    }

    // Helper to format timer as MM:SS if >= 60, else just seconds
    function formatTimer(val: number | null) {
        if (val === null) return '-';
        if (val >= 60) {
            const m = Math.floor(val / 60);
            const s = val % 60;
            return `${m}:${s.toString().padStart(2, '0')}`;
        }
        return val.toString();
    }

    return (
        <div className="min-h-screen flex flex-col items-center bg-base-200 p-2">
            {isMobile ? (
                <div className="fixed top-24 right-4 z-50 flex items-center navbar-timer-bg px-4 py-2 rounded-full shadow-lg border border-primary"
                    style={{ background: 'var(--navbar)', color: 'var(--primary-foreground)' }}>
                    <div className="flex items-center gap-1 align-middle">
                        <Timer className="w-5 h-5" style={{ display: 'block', color: 'var(--primary-foreground)' }} />
                        <span className="text-lg font-bold flex items-center leading-none" style={{ color: 'var(--primary-foreground)' }}>{formatTimer(timer)}</span>
                    </div>
                </div>
            ) : (
                <div className="fixed top-4 right-4 z-50 flex items-center navbar-timer-bg px-4 py-2 rounded-full shadow-lg border border-primary"
                    style={{ background: 'var(--navbar)', color: 'var(--primary-foreground)' }}>
                    <Timer className="w-5 h-5 mr-2" style={{ display: 'block', color: 'var(--primary-foreground)' }} />
                    <span className="text-lg font-bold flex items-center leading-none" style={{ color: 'var(--primary-foreground)' }}>{formatTimer(timer)}</span>
                </div>
            )}
            <Snackbar
                open={snackbarOpen}
                message={snackbarMessage}
                type={snackbarType}
                onClose={() => setSnackbarOpen(false)}
            />
            <div className="card w-full max-w-xl shadow-xl bg-base-100 mt-6 md:mt-16">
                <div className="card-body items-center gap-8">
                    {currentQuestion && (
                        <>
                            <div className="w-full bg-base-200 rounded-xl p-6 flex flex-col gap-6 items-center">
                                <h3 className="text-2xl mb-2 font-bold">Question {questionIndex + 1} / {totalQuestions}</h3>
                                <div className="mb-4 text-xl font-semibold text-center">
                                    {currentQuestion.question}
                                </div>
                                <ul className="flex flex-col w-full">
                                    {currentQuestion.reponses.map((rep, idx) => {
                                        const isSelected = isMultipleChoice
                                            ? selectedAnswers.includes(idx)
                                            : selectedAnswer === idx;
                                        return (
                                            <li
                                                key={idx}
                                                className={idx !== currentQuestion.reponses.length - 1 ? "mb-2" : ""}
                                            >
                                                <button
                                                    className={[
                                                        "btn-answer w-full text-left transition-colors",
                                                        "bg-base-100",
                                                        "rounded-lg py-3 px-4"
                                                    ].join(" ")}
                                                    style={{
                                                        border: isSelected ? '2px solid var(--navbar)' : '2px solid transparent',
                                                        boxShadow: isSelected ? '0 0 0 2px var(--navbar)' : undefined,
                                                        background: isSelected ? 'var(--light-blue)' : undefined,
                                                    }}
                                                    onClick={() => {
                                                        if (isMultipleChoice) {
                                                            setSelectedAnswers((prev) =>
                                                                prev.includes(idx)
                                                                    ? prev.filter((i) => i !== idx)
                                                                    : [...prev, idx]
                                                            );
                                                        } else {
                                                            handleSingleChoice(idx);
                                                        }
                                                    }}
                                                >
                                                    {rep.texte}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                                {isMultipleChoice && (
                                    <button
                                        className="btn btn-primary mt-2 self-end"
                                        onClick={handleSubmitMultiple}
                                        disabled={selectedAnswers.length === 0}
                                    >
                                        Valider
                                    </button>
                                )}
                                {/* Remove score display */}
                                {/* <div className="font-bold">Score: {score}</div> */}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
