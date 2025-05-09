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
import Snackbar from '@/components/Snackbar';
import { createLogger } from '@/clientLogger';
import MathJaxWrapper from '@/components/MathJaxWrapper';
import TournamentTimer from '@/components/TournamentTimer';
import TournamentQuestionCard from '@/components/TournamentQuestionCard';
import AnswerFeedbackOverlay from '@/components/AnswerFeedbackOverlay';

// Create a logger for this component
const logger = createLogger('TournamentLivePage');

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
    // --- LOGIN CHECK AND REDIRECT ---
    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        const pseudo = localStorage.getItem('mathquest_pseudo');
        const avatar = localStorage.getItem('mathquest_avatar');
        if (!pseudo || !avatar) {
            // Redirect to /student with redirect param
            router.replace(`/student?redirect=/live/${code}`);
        }
    }, [code, router]);
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
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>("");
    const [snackbarType, setSnackbarType] = useState<"success" | "error">("success");
    const [paused, setPaused] = useState(false);
    const pausedRef = useRef(paused);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
    const [isQuizMode, setIsQuizMode] = useState(false);
    const [showExplication, setShowExplication] = useState(false);
    const [explicationText, setExplicationText] = useState<string>("");
    const [explicationDuration, setExplicationDuration] = useState<number>(5);

    useEffect(() => { pausedRef.current = paused; }, [paused]);

    // Add responsive countdown timer display
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsMobile(window.innerWidth < 768);
        }
    }, []);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        handleResize(); // Set initial value
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
            setTimer(20); // Only set timer here, when question changes
            setWaiting(false);
            return;
        }
        const s = io({
            path: "/api/socket/io",
            transports: ["websocket"],
        });
        setSocket(s);
        logger.info('Socket.IO client created and set in state', { socketInstance: !!s });

        // Helper to emit join_tournament
        const emitJoinTournament = () => {
            let cookie_id = null;
            let pseudo = null;
            let avatar = null;
            if (typeof window !== 'undefined') {
                cookie_id = localStorage.getItem('mathquest_cookie_id');
                pseudo = localStorage.getItem('mathquest_pseudo');
                avatar = localStorage.getItem('mathquest_avatar');
            }
            s.emit("join_tournament", { code, cookie_id, pseudo, avatar, isDiffered });
        };

        // Emit join_tournament on initial connect and every reconnect
        s.on("connect", emitJoinTournament);
        emitJoinTournament();

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
        s.on("tournament_question", (payload) => {
            // Round timer down to nearest second
            const roundedTime = payload.remainingTime != null ? Math.floor(payload.remainingTime) : 20;
            logger.debug('tournament_question RECEIVED', payload);
            setCurrentQuestion(payload); // Pass the full payload, not just payload.question

            if (!payload.question) {
                logger.error('Received tournament_question event with no question data');
                return;
            }

            setQuestionIndex(payload.index);
            setTotalQuestions(payload.total);
            setAnswered(false);
            setTimer(roundedTime);
            setWaiting(false);
            setPaused(payload.questionState === "paused");
            pausedRef.current = payload.questionState === "paused";
            setIsQuizMode(!!payload.isQuizMode); // <--- Store quiz mode
            logger.info('UI setIsQuizMode', { isQuizMode: !!payload.isQuizMode }); // <--- Log what is set in state

            logger.debug('Updated state with question data', {
                questionSet: !!payload.question,
                timer: roundedTime,
                paused: payload.questionState === "paused"
            });

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if (payload.questionState === "paused") {
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
        s.on("tournament_set_timer", ({ timeLeft, questionState }) => {
            logger.debug('tournament_set_timer', { timeLeft, questionState, paused: pausedRef.current });
            if (questionState === "stopped") {
                logger.info('Setting timer to 0 because questionState="stopped"');
                setTimer(0);
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                setWaiting(true);
                return;
            }
            // For paused state, update timer value immediately but do not start countdown
            if (questionState === "paused") {
                setTimer(timeLeft);
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                setPaused(true);
                pausedRef.current = true;
                setWaiting(true);
                return;
            }
            // ...existing code for other states...
            setTimer(timeLeft);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if (timeLeft === 0) {
                setWaiting(true);
                return;
            }
            if (!pausedRef.current && timeLeft > 0) {
                setWaiting(false);
                logger.debug('Starting timer interval from tournament_set_timer:', timeLeft);
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
        });

        // Receive tournament end
        s.on("tournament_end", () => {
            setCurrentQuestion(null);
            setWaiting(false);
            if (timerRef.current) clearInterval(timerRef.current);
            // Optionally: show leaderboard
        });

        // Get pseudo/avatar from localStorage for highlighting
        if (typeof window !== 'undefined') {
            // if (isStudent) {
            // } else if (isTeacher) {
            // }
        }

        // Handle tournament code updates
        s.on("tournament_code_updated", ({ oldCode, newCode }) => {
            logger.info(`Received tournament_code_updated: ${oldCode} -> ${newCode}`);

            // If this is our tournament, update our rooms and state
            if (oldCode === code) {
                logger.info(`Our tournament code changed, joining new room: live_${newCode}`);

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
            s.off("connect", emitJoinTournament);
            s.disconnect();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [code, devMode, devModeType, isDiffered]);

    // --- SOCKET EVENTS LOGGING ---
    useEffect(() => {
        if (!socket) {
            logger.warn('Socket is not set in state!');
            return;
        }
        logger.info('Socket is set in state and ready for event listeners', { socketInstance: !!socket });
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

    // Reset selected answers ONLY when the question UID changes
    useEffect(() => {
        setSelectedAnswer(null);
        setSelectedAnswers([]);
        setSnackbarOpen(false);
    }, [currentQuestion?.uid]);

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
        logger.debug('handleSubmitMultiple called', { selectedAnswers, waiting, socket: !!socket, currentQuestion });
        if (devMode) {
            if (!currentQuestion || selectedAnswers.length === 0) return;
            setSnackbarMessage("Réponse enregistrée");
            setSnackbarOpen(true);
            return;
        }

        // Only validate that we have answers to send - server will handle timing validation
        if (!socket || !currentQuestion || selectedAnswers.length === 0) {
            logger.warn('handleSubmitMultiple: missing requirements', {
                socket: !!socket,
                currentQuestion,
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
        // Do not setAnswered(true) here; allow resubmission until timer/lock
    };

    useEffect(() => {
        logger.info('Attaching tournament_question_state_update listener, socket:', !!socket);
        if (!socket) return;
        socket.on("tournament_question_state_update", (updates) => {
            logger.info('Handler called for tournament_question_state_update', updates);
            // PATCH: handle both array and object
            const update = Array.isArray(updates) ? updates[0] : updates;
            if (!update) return;
            logger.info('tournament_question_state_update received, questionState:', update.questionState);
            if (typeof update.remainingTime === 'number') {
                setTimer(Math.floor(update.remainingTime));
            }
            if (update.questionState === 'paused') {
                logger.info('PAUSE branch entered');
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                setPaused(true);
                pausedRef.current = true;
                setWaiting(true);
                logger.debug('paused set to true from tournament_question_state_update');
                logger.info('UI: Timer PAUSED by tournament_question_state_update, timer value:', timer);
            } else if (update.questionState === 'active') {
                logger.info('ACTIVE branch entered');
                setPaused(false);
                pausedRef.current = false;
                setWaiting(false);
                if (!timerRef.current && typeof update.remainingTime === 'number' && update.remainingTime > 0) {
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
            } else {
                logger.info('Other state branch entered:', update.questionState);
            }
        });
        return () => {
            if (socket) socket.off("tournament_question_state_update");
        };
    }, [socket]);

    // --- Trophy/correctAnswers logic for LIVE PAGE ---
    // State for correct answers to show trophy
    const [correctAnswers, setCorrectAnswers] = useState<number[]>([]);
    // Track last question UID to clear trophy when question changes
    const lastQuestionUidRef = useRef<string | null>(null);
    const [readonly, setReadonly] = useState(false);

    // Clear correctAnswers and readonly when question changes
    useEffect(() => {
        if (!currentQuestion?.uid) return;
        if (lastQuestionUidRef.current !== currentQuestion.uid) {
            setCorrectAnswers([]);
            setReadonly(false);
            lastQuestionUidRef.current = currentQuestion.uid;
        }
    }, [currentQuestion?.uid]);

    // Unified: Listen for quiz_question_results, quiz_question_closed, and tournament_correct_answers
    useEffect(() => {
        if (!socket) return;
        const handleResults = (data: { leaderboard?: unknown[]; correctAnswers?: number[] }) => {
            if (Array.isArray(data.correctAnswers)) {
                setCorrectAnswers(data.correctAnswers);
                setReadonly(true);
            }
        };
        socket.on('quiz_question_results', handleResults);
        socket.on('quiz_question_closed', handleResults);
        return () => {
            socket.off('quiz_question_results', handleResults);
            socket.off('quiz_question_closed', handleResults);
        };
    }, [socket]);

    useEffect(() => {
        logger.debug('CurrentQuestion state changed', currentQuestion);
    }, [currentQuestion]);

    useEffect(() => {
        if (!socket) return;
        // Listen for explication event (tournament mode only)
        const handler = (payload: { questionUid: string; explication: string }) => {
            if (!isQuizMode && payload?.explication) {
                setExplicationText(payload.explication);
                setShowExplication(true);
                // setExplicationDuration(5);
                setTimeout(() => setShowExplication(false), explicationDuration * 1000);
            }
        };
        socket.on("explication", handler);
        return () => { socket.off("explication", handler); };
    }, [socket, isQuizMode]);

    // Fermer l'overlay d'explication dès qu'on reçoit un nouvel état de question ou la fin du tournoi
    useEffect(() => {
        if (!socket) return;
        // Ferme l'overlay à l'arrivée d'une nouvelle question ou d'un changement d'état
        const closeExplication = () => setShowExplication(false);
        socket.on("tournament_question_state_update", closeExplication);
        socket.on("quiz_state", closeExplication);
        socket.on("tournament_question", closeExplication);
        socket.on("tournament_end", closeExplication);
        return () => {
            socket.off("tournament_question_state_update", closeExplication);
            socket.off("quiz_state", closeExplication);
            socket.off("tournament_question", closeExplication);
            socket.off("tournament_end", closeExplication);
        };
    }, [socket]);

    // En mode dev, fermer l'overlay quand la question change
    useEffect(() => {
        if (devMode) setShowExplication(false);
    }, [currentQuestion?.uid, devMode]);

    useEffect(() => {
        logger.debug('currentQuestion updated:', currentQuestion);
    }, [currentQuestion]);

    return (
        <div className="main-content">
            {showExplication && (
                <div className="feedback-overlay">
                    <AnswerFeedbackOverlay
                        explanation={explicationText}
                        duration={explicationDuration}
                    />
                </div>
            )}
            <div className={`card w-full max-w-2xl bg-base-100 rounded-lg shadow-xl my-6 relative${showExplication ? " blur-sm" : ""}`}>
                <TournamentTimer timer={timer} isMobile={isMobile} />
                <MathJaxWrapper>
                    {currentQuestion ? (
                        <>
                            {logger.debug('Rendering TournamentQuestionCard', currentQuestion)}
                            <TournamentQuestionCard
                                currentQuestion={currentQuestion}
                                questionIndex={questionIndex}
                                totalQuestions={totalQuestions}
                                isMultipleChoice={isMultipleChoice}
                                selectedAnswer={selectedAnswer}
                                setSelectedAnswer={setSelectedAnswer}
                                selectedAnswers={selectedAnswers}
                                setSelectedAnswers={setSelectedAnswers}
                                handleSingleChoice={handleSingleChoice}
                                handleSubmitMultiple={handleSubmitMultiple}
                                answered={answered}
                                isQuizMode={isQuizMode}
                                correctAnswers={correctAnswers}
                                readonly={readonly}
                            />
                        </>
                    ) : (
                        logger.debug('No currentQuestion, nothing to render'),
                        <div className="text-center text-lg text-gray-500">Chargement...</div>
                    )}
                </MathJaxWrapper>
            </div>

            {/* Apply the same blur effect to the Snackbar when the overlay is shown, but keep its fixed position */}
            <Snackbar
                open={snackbarOpen}
                message={snackbarMessage}
                type={snackbarType}
                onClose={() => setSnackbarOpen(false)}
                className={showExplication ? "blur-sm" : ""}
            />
        </div>
    );
}
