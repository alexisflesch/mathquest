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
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import Snackbar from '@/components/Snackbar';
import { createLogger } from '@/clientLogger';
import MathJaxWrapper from '@/components/MathJaxWrapper';
import TournamentTimer from '@/components/TournamentTimer';
import { SOCKET_CONFIG } from '@/config';
import QuestionCard, { TournamentQuestion } from '@/components/QuestionCard';
import AnswerFeedbackOverlay from '@/components/AnswerFeedbackOverlay';
import { Question } from '@shared/types/quiz/question';
import { FilteredQuestion } from '@shared/types/quiz/liveQuestion';

// Create a logger for this component
const logger = createLogger('TournamentLivePage');

export default function TournamentSessionPage() {
    const { code } = useParams();
    const router = useRouter();
    // --- LOGIN CHECK AND REDIRECT ---
    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        const username = localStorage.getItem('mathquest_username');
        const avatar = localStorage.getItem('mathquest_avatar');
        if (!username || !avatar) {
            // Redirect to /student with redirect param
            router.replace(`/student?redirect=/live/${code}`);
        }

        // Also check tournament status to ensure we're on the correct page
        async function checkTournamentStatus() {
            try {
                const res = await fetch(`/api/tournament-status?code=${code}`);
                if (!res.ok) return;
                const status = await res.json();

                if (status.status === 'finished') {
                    logger.info(`Tournament ${code} is finished but we're on live page, redirecting to leaderboard`);
                    router.replace(`/leaderboard/${code}`);
                } else if (status.status === 'preparing') {
                    logger.info(`Tournament ${code} is still in preparation, redirecting to lobby`);
                    router.replace(`/lobby/${code}`);
                }
            } catch (err) {
                logger.error(`Error checking tournament status: ${err}`);
            }
        }

        checkTournamentStatus();
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
    const [currentCorrectAnswers, setCurrentCorrectAnswers] = useState<number[]>([]);
    const [showQuestionResults, setShowQuestionResults] = useState(false);

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
            const mockQuestionData = devModeType === 'choix_multiple' ? {
                uid: 'mock2',
                text: 'Quelles sont les couleurs primaires ?',
                responses: [
                    { text: 'Rouge', correct: true },
                    { text: 'Vert', correct: false },
                    { text: 'Bleu', correct: true },
                    { text: 'Jaune', correct: true },
                ],
                type: 'choix_multiple' as const,
                subject: 'Arts',
                themes: ['Couleurs'], // Changed from theme: 'Couleurs'
                difficulty: 1,
                gradeLevel: 'CE2', // Changed from level: 'CE2'
            } : {
                uid: 'mock1',
                text: 'Combien font 7 + 5 ?',
                responses: [
                    { text: '10', correct: false },
                    { text: '12', correct: true },
                    { text: '13', correct: false },
                    { text: '14', correct: false },
                ],
                type: 'choix_simple' as const,
                subject: 'Maths',
                themes: ['Additions'], // Changed from theme: 'Additions'
                difficulty: 1,
                gradeLevel: 'CE2', // Changed from level: 'CE2'
            };

            const mockTournamentQuestion: TournamentQuestion = {
                code: "DEV_MODE_CODE",
                question: {
                    ...mockQuestionData,
                    answers: mockQuestionData.responses.map(response => response.text),
                },
                timer: 20,
                questionIndex: 0,
                totalQuestions: 1,
                tournoiState: 'running',
                questionState: 'active',
            };

            setCurrentQuestion(mockTournamentQuestion);
            setQuestionIndex(0);
            setTotalQuestions(1);
            setAnswered(false);
            setTimer(20); // Only set timer here, when question changes
            setWaiting(false);
            return;
        }
        logger.info('Creating socket connection with config:', {
            url: SOCKET_CONFIG.url,
            path: SOCKET_CONFIG.path,
            transports: SOCKET_CONFIG.transports
        });
        // Use the centralized SOCKET_CONFIG without modifications
        const s = io(SOCKET_CONFIG.url, {
            ...SOCKET_CONFIG
        });
        setSocket(s);
        logger.info('Socket.IO client created and set in state', { socketInstance: !!s });

        // Add debug event handlers for connection issues
        s.on("connect_error", (error) => {
            logger.error('Socket.IO connection error:', error);
        });
        s.on("connect_timeout", () => {
            logger.error('Socket.IO connection timeout');
        });
        s.on("error", (error) => {
            logger.error('Socket.IO error:', error);
        });

        // Helper to emit join_tournament using new backend API
        const emitJoinTournament = () => {
            let userId = null;
            let username = null;
            let avatarUrl = null;
            if (typeof window !== 'undefined') {
                userId = localStorage.getItem('mathquest_cookie_id'); // Using cookie_id as userId
                username = localStorage.getItem('mathquest_username');
                avatarUrl = localStorage.getItem('mathquest_avatar');
            }
            logger.info(`Joining tournament ${code}`, { userId, username, avatarUrl, isDiffered });
            s.emit("join_tournament", { accessCode: code, userId, username, avatarUrl });

            // Also verify tournament status when joining to ensure we have the latest state
            // This helps with cases where we missed earlier events
            fetch(`/api/tournament-status?code=${code}`)
                .then(res => res.json())
                .then(status => {
                    logger.info(`Tournament ${code} status check on join:`, status);
                    // If tournament is finished but we're still on the live page, redirect to leaderboard
                    if (status.status === 'finished') {
                        logger.info(`Tournament ${code} is finished, redirecting to leaderboard`);
                        window.location.href = `/leaderboard/${code}`;
                    }
                })
                .catch(err => {
                    logger.error(`Error checking tournament status on join: ${err}`);
                });
        };

        // Emit join_tournament on initial connect and every reconnect
        s.on("connect", () => {
            logger.info("Socket connected, joining tournament...");
            emitJoinTournament();
        });

        // Handle disconnection and reconnection
        s.on("disconnect", (reason) => {
            logger.warn(`Socket disconnected: ${reason}`);
            // Show a visual indication that we're disconnected
            setSnackbarOpen(true);
            setSnackbarMessage("Connexion perdue, tentative de reconnexion...");
            setSnackbarType("error");
        });

        s.on("reconnect", (attemptNumber) => {
            logger.info(`Socket reconnected after ${attemptNumber} attempts`);
            setSnackbarOpen(true);
            setSnackbarMessage("Reconnecté!");
            setSnackbarType("success");
            // Wait a moment before joining to ensure clean reconnection
            setTimeout(emitJoinTournament, 500);
        });

        // Initial join
        emitJoinTournament();

        // Receive a new question
        s.on("game_question", (payload: TournamentQuestion) => {
            // Round timer down to nearest second
            const roundedTime = payload.timer != null ? Math.floor(payload.timer) : 20;
            logger.debug('game_question RECEIVED (full payload):', payload);
            logger.debug('game_question RECEIVED (questionIndex):', payload.questionIndex);
            logger.debug('game_question RECEIVED (totalQuestions):', payload.totalQuestions);
            setCurrentQuestion(payload); // Pass the full payload, not just payload.question

            if (!payload.question) {
                logger.error('Received game_question event with no question data');
                setWaiting(false); // Allow potential recovery or display of error
                return;
            }

            // Set index and total, assuming they are always numbers from backend.
            setQuestionIndex(typeof payload.questionIndex === 'number' ? payload.questionIndex : 0);
            setTotalQuestions(typeof payload.totalQuestions === 'number' ? payload.totalQuestions : 0);

            // Reset states for the new question
            setAnswered(false);
            setSelectedAnswer(null); // Clear single choice selection
            setSelectedAnswers([]);  // Clear multiple choice selections
            setCurrentCorrectAnswers([]); // Reset correct answers display
            setShowQuestionResults(false); // Hide results view for the new question
            setWaiting(false); // Allow interaction with the new question
            setPaused(payload.questionState === "paused"); // Set paused state based on incoming question

            logger.debug('Updated state with new question data', {
                questionSet: !!payload,
                timer: roundedTime,
                paused: payload.questionState === "paused",
                questionIndex: payload.questionIndex,
                totalQuestions: payload.totalQuestions
            });

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }

            setTimer(roundedTime); // Set timer state

            if (payload.questionState === "paused" || roundedTime <= 0) {
                logger.debug('Timer not started because question is paused or timer is zero');
                if (roundedTime <= 0) {
                    setWaiting(true); // If timer is already 0, user should be waiting
                }
                return;
            }

            logger.debug('Starting timer interval from', roundedTime);
            timerRef.current = setInterval(() => {
                setTimer((prev) => {
                    if (pausedRef.current) { // Check ref for most up-to-date paused state
                        if (timerRef.current) clearInterval(timerRef.current); // Stop interval if paused during countdown
                        return prev; // Keep current time if paused
                    }
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

        // Handle timer updates from server (new backend API structure)
        s.on("timer_update", (data) => {
            logger.debug('timer_update', data);

            if (!data || typeof data.timeLeft !== 'number') {
                logger.warn('Invalid timer_update data');
                return;
            }

            // Update timer with the server's timeLeft value
            setTimer(data.timeLeft);

            // Handle paused state
            if (data.status === 'paused') {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                setPaused(true);
                pausedRef.current = true;
                logger.debug('Timer paused from timer_update event');
            }

            // Set waiting state if timer is at 0
            if (data.timeLeft === 0) {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                setWaiting(true);
                logger.debug('Timer set to 0 from timer_update event');
            }
        });

        // Handle game updates from server (teacher dashboard actions)
        s.on("game_update", (data) => {
            logger.debug('game_update', data);

            // The data is directly an object, not an array
            if (!data) {
                logger.warn('Empty game_update data');
                return;
            }

            // Use the data object directly
            const update = data;

            // Update timer with the timeLeft value
            if (typeof update.timeLeft === 'number') {
                setTimer(update.timeLeft);
            }

            // Handle different status types
            if (update.status === 'paused') {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                setPaused(true);
                pausedRef.current = true;
                logger.debug('Timer paused from game_update event');
            } else if (update.status === 'play') {
                setPaused(false);
                pausedRef.current = false;

                // Restart timer if not already running
                if (!timerRef.current && timer !== null && timer > 0) {
                    logger.debug('Restarting timer from game_update event');
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
                logger.debug('Timer stopped from game_update event');
            }
        });

        // Handle set timer events from server (stop button)
        s.on("timer_set", ({ timeLeft, questionState }) => {
            logger.debug('timer_set', { timeLeft, questionState, paused: pausedRef.current });
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
                // setWaiting(true); // Paused does not necessarily mean waiting for next Q, but card is readonly
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
        s.on("answer_received", (payload: { rejected?: boolean; received?: boolean; message?: string; correct?: boolean }) => {
            logger.debug("RECEIVED answer_received", payload);

            if (payload.rejected) {
                setSnackbarType("error");
                setSnackbarMessage(payload.message || "Réponse rejetée");
                setSnackbarOpen(true);
                // User might be able to try again if timer hasn't run out and not rejected for "too late"
                // For now, we assume rejection means they can't answer again for this question.
                setAnswered(true); // Mark as answered even if rejected to prevent resubmission
                setWaiting(true);  // Wait for next server action (e.g. results or next question)
            } else if (payload.received) {
                setSnackbarType("success");
                setSnackbarMessage("Réponse envoyée");
                setSnackbarOpen(true);
                setAnswered(true);
                setWaiting(true);
            }
        });

        // Receive question results (correct answers)
        s.on("correct_answers", (payload: { questionId: string }) => {
            logger.debug("RECEIVED correct_answers", payload);
            // Note: Backend sends correct_answers event but actual correct answers are derived from the question
            // Ensure currentQuestion and its nested question object are not null
            if (currentQuestion && typeof currentQuestion.question === 'object' && currentQuestion.question.uid === payload.questionId) {
                // Extract correct answers from the question object
                const question = currentQuestion.question as any;
                let correctIndices: number[] = [];

                if (question.correctAnswers && Array.isArray(question.correctAnswers)) {
                    // New backend structure with correctAnswers boolean array
                    correctIndices = question.correctAnswers
                        .map((isCorrect: boolean, index: number) => isCorrect ? index : -1)
                        .filter((index: number) => index !== -1);
                } else if (question.responses && Array.isArray(question.responses)) {
                    // Old structure with responses array
                    correctIndices = question.responses
                        .map((response: any, index: number) => response.correct ? index : -1)
                        .filter((index: number) => index !== -1);
                }

                setCurrentCorrectAnswers(correctIndices);
                setShowQuestionResults(true);
                // setWaiting(true) should already be true from timer expiry or answer submission.
                // The card becomes readonly via showQuestionResults prop.
                logger.info('Displaying correct answers for question:', payload.questionId);
            } else {
                logger.warn("Received correct_answers for a different or non-object question", {
                    currentUid: currentQuestion?.question && typeof currentQuestion.question === 'object' ? currentQuestion.question.uid : 'N/A',
                    receivedUid: payload.questionId
                });
            }
        });

        // Receive tournament end
        s.on("game_ended", () => {
            setCurrentQuestion(null);
            setWaiting(false);
            if (timerRef.current) clearInterval(timerRef.current);
            // Optionally: show leaderboard
        });

        // Get username/avatar from localStorage for highlighting
        if (typeof window !== 'undefined') {
            // if (isStudent) {
            // } else if (isTeacher) {
            // }
        }

        // Handle tournament code updates
        s.on("game_code_updated", ({ oldCode, newCode }) => {
            logger.info(`Received game_code_updated: ${oldCode} -> ${newCode}`);

            // If this is our tournament, update our rooms and state
            if (oldCode === code) {
                logger.info(`Our tournament code changed, joining new room: game_${newCode}`);

                // Fetch user details from localStorage for the new join emission
                let userId = null;
                let username = null;
                let avatarUrl = null;
                if (typeof window !== 'undefined') {
                    userId = localStorage.getItem('mathquest_cookie_id');
                    username = localStorage.getItem('mathquest_username');
                    avatarUrl = localStorage.getItem('mathquest_avatar');
                }

                // Join the new tournament room
                s.emit("join_tournament", {
                    accessCode: newCode,
                    userId: userId,
                    username: username,
                    avatarUrl: avatarUrl
                });

                // Redirect after code change.
                // Note: Currently redirects to the leaderboard of the *old* code.
                // This might need to be /live/${newCode} or /leaderboard/${newCode} depending on desired UX.
                router.replace(`/leaderboard/${code}`);
            }
        });

        return () => {
            s.off("connect", emitJoinTournament);
            s.off("game_question"); // Make sure to turn off the listener
            s.disconnect();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [code, devMode, devModeType, isDiffered, router]);

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
        // Log live_question
        socket.on("game_question", (payload) => {
            logger.debug("RECEIVED game_question", payload);
        });
        // Log answer result
        socket.on("answer_received", (payload) => {
            logger.debug("RECEIVED answer_received", payload);
        });
        // Log tournament_end
        socket.on("game_ended", (payload) => {
            logger.info("RECEIVED game_ended", payload);
        });
        // Log errors
        socket.on("game_error", (payload) => {
            logger.error("RECEIVED game_error", payload);
        });
        // Log finished redirect
        socket.on("game_finished_redirect", (payload) => {
            logger.info("RECEIVED game_finished_redirect", payload);
        });
        return () => {
            socket.offAny();
            socket.off("game_question");
            socket.off("answer_received");
            socket.off("game_ended");
            socket.off("game_error");
            socket.off("game_finished_redirect");
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
        socket.on("game_finished_redirect", ({ accessCode }) => {
            router.replace(`/leaderboard/${accessCode}`);
        });
        return () => {
            socket.off("game_finished_redirect");
        };
    }, [socket, router, devMode]);

    useEffect(() => {
        if (!socket) return;
        // Listen for tournament_already_played event
        socket.on("game_already_played", ({ accessCode }) => {
            // Redirect to leaderboard if already played
            router.replace(`/leaderboard/${accessCode}`);
        });

        // Handle redirect to lobby if tournament hasn't started yet,
        // but ONLY if we don't have a current question (meaning we're not already playing)
        socket.on("game_redirect_to_lobby", ({ accessCode }) => {
            // Only redirect if we don't already have a question
            if (!currentQuestion) {
                logger.info("Received game_redirect_to_lobby, redirecting to lobby");
                router.replace(`/lobby/${accessCode}`);
            } else {
                logger.info("Received game_redirect_to_lobby but ignored - already have question");
            }
        });

        return () => {
            socket.off("game_already_played");
            socket.off("game_redirect_to_lobby");
        };
    }, [socket, router, currentQuestion]);

    // Reset selected answers ONLY when the question UID changes
    const currentQuestionUid = useMemo(() => {
        if (currentQuestion && typeof currentQuestion.question === 'object' && currentQuestion.question !== null) {
            // Check if uid exists on the object, covering both FilteredQuestion and Question types
            if ('uid' in currentQuestion.question) {
                return currentQuestion.question.uid;
            }
        }
        return undefined;
    }, [currentQuestion]);

    useEffect(() => {
        setSelectedAnswer(null);
        setSelectedAnswers([]);
        setSnackbarOpen(false);
    }, [currentQuestionUid]);

    // Helper: is multiple choice
    const isMultipleChoice = useMemo(() => {
        if (!currentQuestion) return false;

        // Check if it's inside the question object
        if (typeof currentQuestion.question === 'object' && currentQuestion.question !== null) {
            const q = currentQuestion.question as FilteredQuestion | Question;
            return q.type === "choix_multiple";
        }

        return false;
    }, [currentQuestion]);

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

        logger.debug('Emitting game_answer', {
            accessCode: code,
            questionId: currentQuestionUid,
            answer: currentQuestion.question && typeof currentQuestion.question === 'object' && 'answerOptions' in currentQuestion.question
                ? (currentQuestion.question as any).answerOptions[idx]
                : idx.toString(),
            clientTimestamp,
            isDiffered,
        });
        socket.emit("game_answer", {
            accessCode: code,
            questionId: currentQuestionUid,
            answer: currentQuestion.question && typeof currentQuestion.question === 'object' && 'answerOptions' in currentQuestion.question
                ? (currentQuestion.question as any).answerOptions[idx]
                : idx.toString(),
            clientTimestamp,
            isDiffered,
        });
        // Don't show snackbar immediately - wait for server response
    };

    // Handle multiple choice answer submission
    const handleSubmitMultiple = () => {
        logger.debug('handleSubmitMultiple called', { selectedAnswers, waiting, socket: !!socket, currentQuestion });
        if (devMode) {
            if (!currentQuestion || selectedAnswers.length === 0)
                setSnackbarMessage("Réponse enregistrée");
            setSnackbarOpen(true);
            return;
        }

        // Only validate that we have answers to send - server will handle timing validation
        if (!socket || !currentQuestion || selectedAnswers.length === 0) {
            logger.warn('handleSubmitMultiple: socket, currentQuestion, or selectedAnswers missing/empty');
            // Optionally, provide user feedback if answers are empty
            if (selectedAnswers.length === 0) {
                setSnackbarMessage("Veuillez sélectionner au moins une réponse.");
                setSnackbarType("error");
                setSnackbarOpen(true);
            }
            return;
        }

        const clientTimestamp = Date.now();
        // const questionData = currentQuestion.question; // Not needed due to currentQuestionUid
        // const questionUidForAnswer = (questionData && typeof questionData === 'object') ? (questionData as any).uid : undefined; // Replaced by currentQuestionUid

        logger.debug('Emitting game_answer', {
            accessCode: code,
            questionId: currentQuestionUid,
            answer: selectedAnswers.map(idx =>
                currentQuestion.question && typeof currentQuestion.question === 'object' && 'answerOptions' in currentQuestion.question
                    ? (currentQuestion.question as any).answerOptions[idx]
                    : idx.toString()
            ),
            clientTimestamp,
            isDiffered,
        });
        socket.emit("game_answer", {
            accessCode: code,
            questionId: currentQuestionUid,
            answer: selectedAnswers.map(idx =>
                currentQuestion.question && typeof currentQuestion.question === 'object' && 'answerOptions' in currentQuestion.question
                    ? (currentQuestion.question as any).answerOptions[idx]
                    : idx.toString()
            ),
            clientTimestamp,
            isDiffered,
        });
        // Do not setAnswered(true) here; allow resubmission until timer/lock
    };

    // Note: Removed old tournament_question_state_update handler as it's replaced by the new backend events

    // --- Trophy/correctAnswers logic for LIVE PAGE ---
    // State for correct answers to show trophy
    const [correctAnswers, setCorrectAnswers] = useState<number[]>([]);
    // Track last question UID to clear trophy when question changes
    const lastQuestionUidRef = useRef<string | null>(null);
    const [readonly, setReadonly] = useState(false);

    // Clear correctAnswers and readonly when question changes
    useEffect(() => {
        if (!currentQuestionUid) return;
        if (lastQuestionUidRef.current !== currentQuestionUid) {
            setCorrectAnswers([]);
            setReadonly(false);
            lastQuestionUidRef.current = currentQuestionUid;
        }
    }, [currentQuestionUid]);

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
        socket.on("live_question", closeExplication);
        socket.on("tournament_end", closeExplication);
        return () => {
            socket.off("tournament_question_state_update", closeExplication);
            socket.off("quiz_state", closeExplication);
            socket.off("live_question", closeExplication);
            socket.off("tournament_end", closeExplication);
        };
    }, [socket]);

    // En mode dev, fermer l'overlay quand la question change
    useEffect(() => {
        if (devMode) setShowExplication(false);
    }, [currentQuestionUid, devMode]);

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
                            {logger.debug('Rendering QuestionCard', currentQuestion)}
                            <QuestionCard
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
