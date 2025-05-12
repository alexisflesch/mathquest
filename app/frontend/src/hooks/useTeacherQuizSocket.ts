import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { createLogger } from '@/clientLogger';
import { SOCKET_CONFIG } from '@/config';

const logger = createLogger('useTeacherQuizSocket');

// --- Types (Consider moving to a shared types file if used elsewhere) ---
interface Response {
    texte: string;
    correct: boolean;
}
export interface Question {
    uid: string;
    question: string;
    reponses: Response[];
    temps?: number;
    type?: string;
    explication?: string;
}
export interface QuizState {
    currentQuestionIdx: number | null;
    questions: Question[];
    chrono: { timeLeft: number | null; running: boolean };
    locked: boolean;
    ended: boolean;
    stats: Record<string, unknown>;
    profSocketId?: string | null;
    timerStatus?: 'play' | 'pause' | 'stop' | null;
    timerQuestionId?: string | null;
    timerTimeLeft?: number | null;
    timerTimestamp?: number;
    questionStates?: Record<string, boolean>;
}

// New interface for per-question timer state
interface QuestionTimerState {
    status: 'play' | 'pause' | 'stop';
    timeLeft: number;
    timestamp: number | null;
    initialTime?: number; // Added to store the original timer value for resetting
}

export function useTeacherQuizSocket(quizId: string | null, tournamentCode: string | null) {
    const [quizSocket, setQuizSocket] = useState<Socket | null>(null);
    const [quizState, setQuizState] = useState<QuizState | null>(null);
    const [timerStatus, setTimerStatus] = useState<'play' | 'pause' | 'stop'>('stop');
    const [timerQuestionId, setTimerQuestionId] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [localTimeLeft, setLocalTimeLeft] = useState<number | null>(null);
    const [connectedCount, setConnectedCount] = useState<number>(1); // 1 = prof connecté par défaut

    // NEW: Store per-question timer states
    const [questionTimers, setQuestionTimers] = useState<Record<string, QuestionTimerState>>({});

    // Références pour le timer basé sur l'horloge système
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const initialDurationRef = useRef<number | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Use a ref to store the local time left to avoid unnecessary re-renders
    const localTimeLeftRef = useRef<number | null>(null);
    // Track last UI update time to throttle state updates
    const lastUpdateTimeRef = useRef<number>(0);
    // Threshold in ms - only update UI state every 200ms
    const UI_UPDATE_THRESHOLD = 200;

    // --- Debounced logging for timer updates ---
    const lastLoggedTimerRef = useRef<Record<string, { status: string; intTimeLeft: number | null }>>({});

    // Update the state only when necessary and not too frequently
    const updateLocalTimeLeft = useCallback((newTimeLeft: number) => {
        // Round to whole numbers only
        const roundedTimeLeft = Math.floor(newTimeLeft);

        // Always update the ref immediately for accurate internal state
        localTimeLeftRef.current = roundedTimeLeft;

        // Only update React state (causing re-render) if enough time has passed
        const now = Date.now();
        if (now - lastUpdateTimeRef.current > UI_UPDATE_THRESHOLD) {
            lastUpdateTimeRef.current = now;
            setLocalTimeLeft(roundedTimeLeft);
        }
    }, []); // Ensure this function is stable and doesn't change on every render

    // --- Socket Connection ---
    useEffect(() => {
        if (!quizId) return;

        logger.info(`Initializing socket connection for quiz: ${quizId} to ${SOCKET_CONFIG.url}`);
        // Connect to backend using complete centralized configuration
        const s = io(SOCKET_CONFIG.url, SOCKET_CONFIG);
        setQuizSocket(s);

        // Always get both teacherId and cookie_id from localStorage
        const teacherId = typeof window !== 'undefined' ? localStorage.getItem('mathquest_teacher_id') : null;
        const cookie_id = typeof window !== 'undefined' ? localStorage.getItem('mathquest_cookie_id') : null;
        logger.info(`[DEBUG][CLIENT] Emitting join_quiz for quizId=${quizId}, teacherId=${teacherId}, cookie_id=${cookie_id}`);
        s.emit("join_quiz", { quizId, teacherId, role: 'teacher', cookie_id });

        s.on("connect", () => {
            logger.info(`Socket connected: ${s.id}`);
            // Request current state immediately after connecting
            s.emit("get_quiz_state", { quizId });
        });

        s.on("disconnect", (reason) => {
            logger.warn(`Socket disconnected: ${reason}`);
            setQuizState(null); // Reset state on disconnect
            setTimerStatus('stop');
            setTimerQuestionId(null);
            setTimeLeft(0);
            setLocalTimeLeft(null);
            if (timerRef.current) clearInterval(timerRef.current);
        });

        s.on("connect_error", (err) => {
            logger.error("Socket connection error:", err);
        });

        s.on("joined_room", ({ room, socketId }) => {
            logger.debug("Server confirms join", { room, socketId });
        });

        return () => {
            logger.info(`Disconnecting socket for quiz: ${quizId}`);
            s.disconnect();
            setQuizSocket(null);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [quizId]);

    // --- State Synchronization with Backend ---
    useEffect(() => {
        if (!quizSocket) return;

        const handleQuizState = (state: QuizState) => {
            logger.debug('Processing quiz_state', state);
            setQuizState(state);

            // Always trust the backend state for timer values
            if (state.timerStatus) {
                setTimerStatus(state.timerStatus);
            }

            if (state.timerQuestionId) {
                setTimerQuestionId(state.timerQuestionId);
            } else if (state.currentQuestionIdx !== null && state.questions[state.currentQuestionIdx]) {
                setTimerQuestionId(state.questions[state.currentQuestionIdx].uid);
            }

            // Update timeLeft from backend values
            if (state.timerTimeLeft !== undefined && state.timerTimeLeft !== null) {
                setTimeLeft(state.timerTimeLeft);
            } else if (state.chrono && state.chrono.timeLeft !== null) {
                setTimeLeft(state.chrono.timeLeft);
            }
        };

        // Ensure `event` is properly typed or checked before comparison
        const handleTimerUpdate = (data: { status: 'play' | 'pause' | 'stop', questionId: string, timeLeft: number, timestamp?: number }) => {
            logger.debug('Received quiz_timer_update', data);

            // Debounced/deduplicated logging for timer updates
            const { questionId, timeLeft, status } = data;
            const intTimeLeft = Math.floor(timeLeft);
            const last = lastLoggedTimerRef.current[questionId] || { status: '', intTimeLeft: null };
            if (last.status !== status || last.intTimeLeft !== intTimeLeft) {
                logger.info(`[TIMER UPDATE] Question ${questionId}: status=${status}, timeLeft=${intTimeLeft}s`);
                lastLoggedTimerRef.current[questionId] = { status, intTimeLeft };
            }

            // Always update status for global app state
            setTimerStatus(data.status);

            // Set the active question ID
            if (data.questionId) {
                setTimerQuestionId(data.questionId);
            }

            // Update the per-question timer state with enhanced logic to preserve paused values
            setQuestionTimers(prev => {
                const existingTimer = prev[data.questionId];
                let newTimerState: QuestionTimerState;

                // CRITICAL BUG FIX: Enhanced logic to handle various scenarios

                // Case 1: Handle STOP action - VISUAL FIX: Always display 0 when stopped
                if (data.status === 'stop') {
                    const question = quizState?.questions?.find(q => q.uid === data.questionId);

                    // Determine the initial time to preserve - try multiple sources
                    const initialTime = existingTimer?.initialTime ||  // Use existing stored initial time if available
                        (existingTimer?.status === 'play' || existingTimer?.status === 'pause' ? existingTimer.timeLeft : 0) || // Or use current timeLeft if running/paused
                        question?.temps || 0; // Or fall back to question default time

                    // Store the initial time in the timer state (for future reference),
                    // but set timeLeft to 0 for visual display purposes
                    logger.debug(`[UI TIMER FIX] Setting visual timer to 0 for STOPPED question ${data.questionId} (preserving original time: ${initialTime}s for later use)`);
                    newTimerState = {
                        status: 'stop',
                        timeLeft: 0, // Display as 0 for visual feedback
                        initialTime: initialTime, // Store original time for later use
                        timestamp: null
                    };
                }

                // Case 2: If switching back to a paused question and trying to play it, keep its paused timeLeft
                else if (data.status === 'play' &&
                    existingTimer?.status === 'pause' &&
                    existingTimer?.timeLeft > 0) {

                    logger.debug(`[UI TIMER FIX] Resuming paused question ${data.questionId} with stored time: ${existingTimer.timeLeft}s`);
                    newTimerState = {
                        status: data.status,
                        timeLeft: existingTimer.timeLeft, // Keep the paused timeLeft
                        timestamp: data.timestamp || Date.now(),
                        initialTime: existingTimer.initialTime // Preserve initialTime if available
                    };
                }

                // Case 3: If we get valid timer values from backend, use them
                else if (data.timeLeft > 0) {
                    const question = quizState?.questions?.find(q => q.uid === data.questionId);
                    // Determine initial time to preserve (either from existing timer state or question default)
                    const initialTime = existingTimer?.initialTime || question?.temps || data.timeLeft;

                    logger.debug(`[UI TIMER FIX] Using backend time value (${data.timeLeft}s) for ${data.questionId}`);
                    newTimerState = {
                        status: data.status,
                        timeLeft: data.timeLeft,
                        timestamp: data.timestamp || Date.now(),
                        initialTime: initialTime // Preserve original time for later use
                    };
                }

                // Case 4: For any other case, use the best available value
                else {
                    const question = quizState?.questions?.find(q => q.uid === data.questionId);
                    const fallbackTimeLeft = (existingTimer?.timeLeft > 0)
                        ? existingTimer.timeLeft
                        : (question?.temps || 0);

                    // Determine initial time to preserve
                    const initialTime = existingTimer?.initialTime || question?.temps || fallbackTimeLeft;

                    logger.debug(`[UI TIMER FIX] Using fallback time (${fallbackTimeLeft}s) for ${data.questionId}`);
                    newTimerState = {
                        status: data.status,
                        timeLeft: fallbackTimeLeft,
                        timestamp: data.timestamp || Date.now(),
                        initialTime: initialTime // Preserve original time for later use
                    };
                }

                // Update UI display timers if this is the active question
                if (timerQuestionId === data.questionId) {
                    logger.debug(`[UI TIMER FIX] Updating active question display to ${newTimerState.timeLeft}s (status: ${newTimerState.status})`);

                    // Update the display timers
                    setTimeLeft(newTimerState.timeLeft);

                    // Update the local time if not in play mode (play mode manages its own countdown)
                    if (data.status !== 'play') {
                        setLocalTimeLeft(newTimerState.timeLeft);
                    }
                }

                // Return updated timer state for this question
                return {
                    ...prev,
                    [data.questionId]: newTimerState
                };
            });

            logger.debug(`[useTeacherQuizSocket] Updated questionTimers: ${JSON.stringify(questionTimers)}`);
        };

        quizSocket.on("quiz_state", handleQuizState);
        quizSocket.on("quiz_timer_update", handleTimerUpdate);
        quizSocket.on("quiz_connected_count", (data: { count: number }) => {
            logger.debug('Received quiz_connected_count', data);
            setConnectedCount(data.count);
        });

        // Request state again if socket reconnects (e.g., after server restart)
        quizSocket.on("connect", () => {
            logger.info("Reconnected, requesting quiz state again.");
            quizSocket.emit("get_quiz_state", { quizId });
        });

        return () => {
            quizSocket.off("quiz_state", handleQuizState);
            quizSocket.off("quiz_timer_update", handleTimerUpdate);
            quizSocket.off("quiz_connected_count");
            quizSocket.off("connect");
            quizSocket.offAny();
        };
    }, [quizSocket, quizId, timerStatus, timerQuestionId, quizState]);

    // --- Immediate local timer reset on question change ---
    // Track the previous timerQuestionId to reset its timer state on question switch
    const prevTimerQuestionIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!quizState || !quizState.questions) return;
        if (!timerQuestionId) return;
        const question = quizState.questions.find(q => q.uid === timerQuestionId);
        if (!question) return;

        // Capture questionTimers in a ref to avoid dependency issues
        const currentQuestionTimers = questionTimers;

        // --- Reset timer for the previous question ONLY IF WE HAVEN'T PAUSED IT ---
        const prevId = prevTimerQuestionIdRef.current;
        if (prevId && prevId !== timerQuestionId) {
            // CRITICAL BUG FIX: Check if the previous question has a paused state before resetting
            // Only reset if the question is not paused (has status 'stop' or no status)
            const prevTimer = currentQuestionTimers[prevId];
            const prevQuestion = quizState.questions.find(q => q.uid === prevId);

            if (prevQuestion && (!prevTimer || prevTimer.status === 'stop')) {
                logger.debug(`[UI TIMER FIX] Previous question ${prevId} not paused, safe to reset timer to initial value (${prevQuestion.temps ?? 0})`);
                setQuestionTimers(prev => ({
                    ...prev,
                    [prevId]: {
                        status: 'stop',
                        timeLeft: prevQuestion.temps ?? 0,
                        timestamp: null
                    }
                }));
            } else if (prevTimer && prevTimer.status === 'pause') {
                // If timer is paused, preserve its timeLeft value
                logger.debug(`[UI TIMER FIX] Preserving paused timer for question ${prevId}: ${prevTimer.timeLeft}s`);
                // No state update needed - we're keeping the existing timer state
            }
        }
        prevTimerQuestionIdRef.current = timerQuestionId;

        // --- Handle timer for current question when switching ---
        if (!currentQuestionTimers[timerQuestionId]) {
            // Case 1: No timer state exists yet, create it
            setQuestionTimers(prev => {
                if (prev[timerQuestionId]) {
                    // Timer state already exists (from backend or previous pause), do not overwrite
                    logger.debug(`[UI TIMER FIX] Using existing timer state for question ${timerQuestionId}: ${JSON.stringify(prev[timerQuestionId])}`);
                    return prev;
                }
                logger.debug(`[UI TIMER FIX] Setting initial timer for new question ${timerQuestionId} to ${question.temps ?? 0}`);
                return {
                    ...prev,
                    [timerQuestionId]: {
                        status: 'stop',
                        timeLeft: question.temps ?? 0,
                        initialTime: question.temps ?? 0, // Store initial time
                        timestamp: null
                    }
                };
            });

            // Only set localTimeLeft if not already set for this question
            if (localTimeLeftRef.current === null || timerQuestionId !== prevId) {
                setLocalTimeLeft(question.temps ?? 0);
                localTimeLeftRef.current = question.temps ?? 0;
            }
        } else {
            // Case 2: Timer state exists, check if we need to restore from a stopped state
            const existingTimer = currentQuestionTimers[timerQuestionId];

            // If timer was stopped (shows 0) but we have initialTime, restore it when switching back
            if (existingTimer.status === 'stop' && existingTimer.timeLeft === 0 && existingTimer.initialTime !== undefined) {
                logger.info(`[UI TIMER FIX] Restoring stopped question ${timerQuestionId} from 0 to initial time: ${existingTimer.initialTime}s`);

                setQuestionTimers(prev => ({
                    ...prev,
                    [timerQuestionId]: {
                        ...prev[timerQuestionId],
                        timeLeft: existingTimer.initialTime as number,
                    }
                }));

                // Update display timers
                setTimeLeft(existingTimer.initialTime);
                setLocalTimeLeft(existingTimer.initialTime);
                localTimeLeftRef.current = existingTimer.initialTime;
            }
        }

        // DEBUG - Log the current state of all question timers whenever the active question changes
        logger.debug(`[UI TIMER DEBUG] All question timers after switching to ${timerQuestionId}:`, JSON.stringify(currentQuestionTimers));

        // CRITICAL: Removed questionTimers from dependency array to prevent circular updates
    }, [timerQuestionId, quizState]);

    // --- Effect to update display timer when active question changes ---
    useEffect(() => {
        if (!timerQuestionId || !quizState || !quizState.questions) return;

        // Find question in quiz state
        const question = quizState.questions.find(q => q.uid === timerQuestionId);
        if (!question) {
            logger.warn(`[UI TIMER FIX] Cannot update display timer: Question ${timerQuestionId} not found`);
            return;
        }

        // Get current question's timer state if it exists
        const questionTimer = questionTimers[timerQuestionId];
        if (questionTimer) {
            logger.info(`[UI TIMER FIX] Question ${timerQuestionId} switched to active, timer state: ${JSON.stringify(questionTimer)}`);

            // If the question has a paused state with a valid timeLeft, use that value
            if (questionTimer.status === 'pause' && questionTimer.timeLeft > 0) {
                logger.info(`[UI TIMER FIX] Using preserved paused timer value (${questionTimer.timeLeft}s) for question ${timerQuestionId}`);
                setTimeLeft(questionTimer.timeLeft);
                setLocalTimeLeft(questionTimer.timeLeft);
            }
            // If question is already running, trust the backend value
            else if (questionTimer.status === 'play' && questionTimer.timeLeft > 0) {
                logger.info(`[UI TIMER FIX] Setting timer for running question ${timerQuestionId} to ${questionTimer.timeLeft}s`);
                setTimeLeft(questionTimer.timeLeft);
                setLocalTimeLeft(questionTimer.timeLeft);
            }
            // If timer is stopped, use the stored initial value or revert to question's default
            else if (questionTimer.status === 'stop') {
                // Use the stored initialTime if available, otherwise fall back to question's default
                const initialTime = questionTimer.initialTime !== undefined ? questionTimer.initialTime : (question.temps || 0);

                // CRITICAL FIX: When displaying a stopped question, check if it's showing 0 (just stopped) or if we're switching back to it
                if (questionTimer.timeLeft === 0) {
                    // If the timer was explicitly stopped (timeLeft=0), check if we're actively viewing it or switching back
                    if (timerStatus === 'stop') {
                        // Currently viewing the same question that was just stopped - show 0
                        logger.info(`[UI TIMER FIX] Showing 0 for recently stopped question ${timerQuestionId}`);
                        setTimeLeft(0);
                        setLocalTimeLeft(0);
                    } else {
                        // Switching back to a previously stopped question - restore the initial time
                        logger.info(`[UI TIMER FIX] Restoring initial time (${initialTime}s) for previously stopped question ${timerQuestionId}`);
                        setTimeLeft(initialTime);
                        setLocalTimeLeft(initialTime);

                        // Update the timer state to show the initial time instead of 0
                        setQuestionTimers(prev => ({
                            ...prev,
                            [timerQuestionId]: {
                                ...prev[timerQuestionId],
                                timeLeft: initialTime
                            }
                        }));
                    }
                } else {
                    // Regular case - use the stored timeLeft value
                    logger.info(`[UI TIMER FIX] Setting timer for stopped question ${timerQuestionId} to value ${questionTimer.timeLeft}s`);
                    setTimeLeft(questionTimer.timeLeft);
                    setLocalTimeLeft(questionTimer.timeLeft);
                }
            }
        } else {
            // No timer state exists yet, use the question's default
            const defaultTime = question.temps || 0;
            logger.info(`[UI TIMER FIX] No existing timer for question ${timerQuestionId}, using default ${defaultTime}s`);
            setTimeLeft(defaultTime);
            setLocalTimeLeft(defaultTime);
        }
    }, [timerQuestionId, quizState, questionTimers, timerStatus]);

    // --- Local Timer Countdown based on system clock ---
    useEffect(() => {
        // Clean up any previous animation frame
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (!timerQuestionId || timerStatus === 'stop') return;

        logger.debug(`Timer status changed: ${timerStatus}, timeLeft from backend: ${timeLeft}`);

        if (timerStatus === 'play' && timeLeft !== null && timeLeft > 0) {
            // Initialize local timer with backend value
            startTimeRef.current = Date.now();
            initialDurationRef.current = timeLeft;

            // Set initial value without throttling
            localTimeLeftRef.current = timeLeft;
            setLocalTimeLeft(timeLeft);
            lastUpdateTimeRef.current = Date.now();

            logger.debug(`Starting local countdown with initial value: ${timeLeft}s`);

            // Timer tick function using system clock and requestAnimationFrame
            const tick = () => {
                if (startTimeRef.current === null || initialDurationRef.current === null) return;

                const now = Date.now();
                const elapsed = (now - startTimeRef.current) / 1000; // in seconds
                const remaining = Math.max(initialDurationRef.current - elapsed, 0);

                // Use Math.floor instead of rounding to always show whole numbers only
                const wholeNumberRemaining = Math.floor(remaining);

                // Update using our throttled update function
                updateLocalTimeLeft(wholeNumberRemaining);

                if (remaining <= 0) {
                    // Timer finished
                    if (animationFrameRef.current) {
                        cancelAnimationFrame(animationFrameRef.current);
                        animationFrameRef.current = null;
                    }
                    startTimeRef.current = null;
                    initialDurationRef.current = null;
                } else {
                    // Continue the animation loop
                    animationFrameRef.current = requestAnimationFrame(tick);
                }
            };

            // Start the animation loop (single call, loop maintained in tick function)
            animationFrameRef.current = requestAnimationFrame(tick);
        } else if (timerStatus === 'pause') {
            // On pause, preserve the current value and stop counting
            if (timeLeft !== null) {
                localTimeLeftRef.current = timeLeft;
                setLocalTimeLeft(timeLeft);
            }
            startTimeRef.current = null; // Stop the countdown
        } else {
            // On stop, reset everything
            startTimeRef.current = null;
            initialDurationRef.current = null;
            localTimeLeftRef.current = 0;
            setLocalTimeLeft(0);
        }

        // Cleanup on unmount or state change
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        };
    }, [timerStatus, timeLeft, timerQuestionId, updateLocalTimeLeft]);

    // --- Emitter Functions ---
    const getTeacherId = () => (typeof window !== 'undefined' ? localStorage.getItem('mathquest_teacher_id') : null);

    // ENHANCED: Uses UID to set active question and preserves timer values
    const emitSetQuestion = useCallback((questionUid: string, startTime?: number) => {
        const code = tournamentCode;
        const teacherId = typeof window !== 'undefined' ? localStorage.getItem('mathquest_teacher_id') : null;
        const cookie_id = typeof window !== 'undefined' ? localStorage.getItem('mathquest_cookie_id') : null;

        // ENHANCED: Check if we have a preserved timer value for this question
        let effectiveStartTime = startTime;

        // If no explicit startTime is provided, check if we have a stored timer value
        if (startTime === undefined && questionTimers[questionUid]) {
            // If we have a paused timer for this question, use its value
            if (questionTimers[questionUid].status === 'pause' && questionTimers[questionUid].timeLeft > 0) {
                effectiveStartTime = questionTimers[questionUid].timeLeft;
                logger.info(`[UI TIMER FIX] Using preserved paused timer value (${effectiveStartTime}s) for question ${questionUid}`);
            }
            // If the timer was playing, we might have a more recent value
            else if (questionTimers[questionUid].status === 'play' && questionTimers[questionUid].timeLeft > 0) {
                effectiveStartTime = questionTimers[questionUid].timeLeft;
                logger.info(`[UI TIMER FIX] Using stored timer value (${effectiveStartTime}s) for previously playing question ${questionUid}`);
            }
            // Otherwise, the timer might have the initial/stop value which should match the question default
        }

        // Log with effective startTime information
        logger.info(`Emitting quiz_set_question`, {
            quizId,
            questionUid,
            code,
            teacherId,
            cookie_id,
            startTime: effectiveStartTime !== undefined ? effectiveStartTime : 'using default from backend',
            source: effectiveStartTime === startTime ? 'provided' : (effectiveStartTime !== undefined ? 'preserved' : 'default')
        });

        // Send the startTime parameter to backend if provided or if we have a preserved value
        if (effectiveStartTime !== undefined) {
            quizSocket?.emit("quiz_set_question", {
                quizId,
                questionUid,
                code,
                teacherId,
                cookie_id,
                startTime: effectiveStartTime,
                preserveTimer: true // Signal to backend that we're sending a preserved timer value
            });

            // Also update our local state immediately for a smoother UI experience
            if (quizState && quizState.questions) {
                const question = quizState.questions.find(q => q.uid === questionUid);
                if (question) {
                    setTimeLeft(effectiveStartTime);
                    setLocalTimeLeft(effectiveStartTime);
                }
            }
        } else {
            quizSocket?.emit("quiz_set_question", { quizId, questionUid, code, teacherId, cookie_id });

            // Use question default time
            if (quizState && quizState.questions) {
                const question = quizState.questions.find(q => q.uid === questionUid);
                if (question && question.temps !== undefined) {
                    setTimeLeft(question.temps);
                    setLocalTimeLeft(question.temps);
                }
            }
        }

        // Just set the active question ID for immediate UI feedback
        setTimerQuestionId(questionUid);

        logger.info(`Waiting for backend confirmation of question ${questionUid}`);
    }, [quizSocket, quizId, tournamentCode, questionTimers, quizState]);

    const emitEndQuiz = useCallback(() => {
        const teacherId = typeof window !== 'undefined' ? localStorage.getItem('mathquest_teacher_id') : null;
        const cookie_id = typeof window !== 'undefined' ? localStorage.getItem('mathquest_cookie_id') : null;
        logger.info('Emitting quiz_end', { quizId, teacherId, cookie_id, tournamentCode });
        quizSocket?.emit("quiz_end", { quizId, teacherId, cookie_id, tournamentCode });
    }, [quizSocket, quizId, tournamentCode]);

    const emitPauseQuiz = useCallback(() => {
        const teacherId = typeof window !== 'undefined' ? localStorage.getItem('mathquest_teacher_id') : null;
        const cookie_id = typeof window !== 'undefined' ? localStorage.getItem('mathquest_cookie_id') : null;
        logger.info('Emitting quiz_pause', { quizId, teacherId, cookie_id, tournamentCode });
        quizSocket?.emit("quiz_pause", { quizId, teacherId, cookie_id, tournamentCode });
    }, [quizSocket, quizId, tournamentCode]);

    const emitResumeQuiz = useCallback(() => {
        const teacherId = typeof window !== 'undefined' ? localStorage.getItem('mathquest_teacher_id') : null;
        const cookie_id = typeof window !== 'undefined' ? localStorage.getItem('mathquest_cookie_id') : null;
        logger.info('Emitting quiz_resume', { quizId, teacherId, cookie_id, tournamentCode });
        quizSocket?.emit("quiz_resume", { quizId, teacherId, cookie_id, tournamentCode });
    }, [quizSocket, quizId, tournamentCode]);

    const emitSetTimer = useCallback((newTime: number, questionUid?: string) => {
        const teacherId = typeof window !== 'undefined' ? localStorage.getItem('mathquest_teacher_id') : null;
        const cookie_id = typeof window !== 'undefined' ? localStorage.getItem('mathquest_cookie_id') : null;
        logger.info('Emitting quiz_set_timer', { quizId, timeLeft: newTime, teacherId, cookie_id, tournamentCode, questionUid });
        quizSocket?.emit("quiz_set_timer", { quizId, timeLeft: newTime, teacherId, cookie_id, tournamentCode, questionUid });
    }, [quizSocket, quizId, tournamentCode]);

    // Refactor emitTimerAction to send clear and consistent messages to the backend
    const emitTimerAction = useCallback((action: { status: 'play' | 'pause' | 'stop', questionId: string, timeLeft?: number }) => {
        const teacherId = typeof window !== 'undefined' ? localStorage.getItem('mathquest_teacher_id') : null;
        const cookie_id = typeof window !== 'undefined' ? localStorage.getItem('mathquest_cookie_id') : null;

        // For play and pause actions, don't send timeLeft - let the backend calculate it
        // This ensures we use the backend as the source of truth
        if (action.status === 'play' || action.status === 'pause') {
            logger.info(`Emitting quiz_timer_action for ${action.status} without timeLeft`);
            quizSocket?.emit("quiz_timer_action", {
                status: action.status,
                questionId: action.questionId,
                quizId,
                teacherId: getTeacherId(),
                cookie_id: typeof window !== 'undefined' ? localStorage.getItem('mathquest_cookie_id') : null,
                tournamentCode
            });
            return;
        }

        // For stop actions, immediately update UI to show 0
        if (action.status === 'stop') {
            // Store current timer state before stopping (for potential restoration later)
            const questionTimer = questionTimers[action.questionId];
            const question = quizState?.questions?.find(q => q.uid === action.questionId);

            // Get the initial time to preserve for later
            const initialTime = question?.temps ||
                (questionTimer?.initialTime ||
                    (questionTimer?.timeLeft > 0 ? questionTimer.timeLeft : 0));

            logger.info(`[STOP ACTION] Immediate visual update - setting ${action.questionId} timer to 0 (preserving initial: ${initialTime}s)`);

            // Update UI immediately to show 0
            if (timerQuestionId === action.questionId) {
                setLocalTimeLeft(0);
                setTimeLeft(0);
            }

            // Store in timer state with initialTime preserved
            setQuestionTimers(prev => ({
                ...prev,
                [action.questionId]: {
                    status: 'stop',
                    timeLeft: 0, // Display 0 for immediate visual feedback
                    initialTime: initialTime,
                    timestamp: null
                }
            }));
        }

        // For stop and other actions, include any provided timeLeft
        logger.info('Emitting quiz_timer_action', { ...action, quizId, teacherId, cookie_id, tournamentCode });
        quizSocket?.emit("quiz_timer_action", { ...action, quizId, teacherId, cookie_id, tournamentCode });
    }, [quizSocket, quizId, tournamentCode]);

    const emitUpdateTournamentCode = useCallback((newCode: string) => {
        const teacherId = typeof window !== 'undefined' ? localStorage.getItem('mathquest_teacher_id') : null;
        const cookie_id = typeof window !== 'undefined' ? localStorage.getItem('mathquest_cookie_id') : null;
        logger.info('Emitting update_tournament_code', { quizId, tournamentCode: newCode, teacherId, cookie_id });
        quizSocket?.emit("update_tournament_code", { quizId, tournamentCode: newCode, teacherId, cookie_id });
    }, [quizSocket, quizId]);

    // Expose the updated methods
    return {
        quizSocket,
        quizState,
        timerStatus,
        timerQuestionId,
        timeLeft,
        localTimeLeft,
        connectedCount,
        questionTimers, // NEW: Expose per-question timer states
        emitSetQuestion,
        emitEndQuiz,
        emitPauseQuiz,
        emitResumeQuiz,
        emitSetTimer,
        emitTimerAction,
        emitUpdateTournamentCode,
    };
}
