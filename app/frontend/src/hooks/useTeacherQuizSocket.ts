import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { createLogger } from '@/clientLogger';
import { SOCKET_CONFIG } from '@/config';
import { createSocketConfig } from '@/utils';
import { BaseQuestion, Answer } from '@shared/types/question'; // MODIFIED: Added Answer import

const logger = createLogger('useTeacherQuizSocket');

// --- Types (Consider moving to a shared types file if used elsewhere) ---
export interface Question extends BaseQuestion {
    // Extend BaseQuestion with any frontend-specific properties if needed
    // BaseQuestion already includes: uid, text, type, answers, time?, explanation?, tags?
}

export interface QuizState {
    currentQuestionIdx: number | null;
    questions: Question[];
    chrono: { timeLeft: number | null; running: boolean }; // Added chrono property for compatibility
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

export function useTeacherQuizSocket(quizId: string | null, token: string | null) {
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
        if (!quizId || !token) return;

        logger.info(`Initializing socket connection for quiz: ${quizId} to ${SOCKET_CONFIG.url}`);

        // Create socket configuration with authentication
        const socketConfig = createSocketConfig(SOCKET_CONFIG);
        const s = io(SOCKET_CONFIG.url, socketConfig);

        // Manually connect after setting up auth
        s.connect();
        setQuizSocket(s);

        s.on("connect", () => {
            logger.info(`Socket connected: ${s.id}`);

            // Use new socket event to join teacher dashboard
            logger.info(`[DEBUG][CLIENT] Emitting join_dashboard for quizId=${quizId}`);
            s.emit("join_dashboard", { quizId, role: 'teacher' });

            // Request current state immediately after connecting
            s.emit("get_game_state", { quizId });
        });

        s.on("disconnect", (reason) => {
            logger.warn(`Socket disconnected: ${reason}`);
            // Reset state on disconnect
            setQuizState(null);
            setTimerStatus('stop');
            setTimerQuestionId(null);
            setTimeLeft(0);
            setLocalTimeLeft(null);
            if (timerRef.current) clearInterval(timerRef.current);
        });

        s.on("connect_error", (err) => {
            logger.error("Socket connection error:", err);
        });

        s.on("dashboard_joined", ({ room, socketId }) => {
            logger.debug("Server confirms dashboard join", { room, socketId });
        });

        return () => {
            logger.info(`Disconnecting socket for quiz: ${quizId}`);
            s.disconnect();
            setQuizSocket(null);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [quizId, token]);

    // --- State Synchronization with Backend ---
    useEffect(() => {
        if (!quizSocket) return;

        const handleGameControlState = (state: QuizState) => {
            logger.debug('Processing game_control_state', state);

            // Add null safety check
            if (!state) {
                logger.warn('Received null or undefined state in game_control_state');
                return;
            }

            setQuizState(state);

            // Always trust the backend state for timer values
            if (state && state.timerStatus) {
                setTimerStatus(state.timerStatus);
            }

            if (state && state.timerQuestionId) {
                setTimerQuestionId(state.timerQuestionId);
            } else if (state && state.currentQuestionIdx !== null && state.questions && state.questions[state.currentQuestionIdx]) {
                setTimerQuestionId(state.questions[state.currentQuestionIdx].uid);
            }

            // Update timeLeft from backend values with null safety
            if (state && state.timerTimeLeft !== undefined && state.timerTimeLeft !== null) {
                setTimeLeft(state.timerTimeLeft);
            } else if (state && state.chrono && state.chrono.timeLeft !== null) {
                setTimeLeft(state.chrono.timeLeft);
            }

            // Initialize per-question timers for all questions
            if (state && state.questions) {
                setQuestionTimers(prev => {
                    const newTimers: Record<string, QuestionTimerState> = { ...prev };
                    state.questions.forEach(q => {
                        if (!newTimers[q.uid]) {
                            newTimers[q.uid] = {
                                status: state.timerStatus || 'stop',
                                timeLeft: (q.uid === state.timerQuestionId && state.timerTimeLeft != null)
                                    ? state.timerTimeLeft
                                    : q.time || 0,
                                initialTime: q.time || 0,
                                timestamp: null
                            };
                        } else {
                            if (q.uid === state.timerQuestionId && state.timerTimeLeft != null) {
                                newTimers[q.uid] = {
                                    ...newTimers[q.uid],
                                    status: state.timerStatus || 'stop',
                                    timeLeft: state.timerTimeLeft,
                                    timestamp: null
                                };
                            }
                        }
                    });
                    return newTimers;
                });
            }
        };

        // Handle timer updates (keeping the same logic but with new event name)
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

                // Case 1: Handle STOP action - VISUAL FIX: Always display 0 when stopped
                if (data.status === 'stop') {
                    const question = quizState?.questions?.find(q => q.uid === data.questionId);
                    const initialTime = existingTimer?.initialTime || question?.time || 0;
                    // Use backend-provided timeLeft (could be 0 or nonzero)
                    newTimerState = {
                        status: 'stop',
                        timeLeft: data.timeLeft, // Use backend value
                        initialTime: initialTime,
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
                    const initialTime = existingTimer?.initialTime || question?.time || data.timeLeft; // MODIFIED: temps -> time

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
                        : (question?.time || 0); // MODIFIED: temps -> time

                    // Determine initial time to preserve
                    const initialTime = existingTimer?.initialTime || question?.time || fallbackTimeLeft; // MODIFIED: temps -> time

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

        // Handle backend error events
        const handleErrorDashboard = (error: { code?: string; message?: string; details?: string; error?: string; questionId?: string }) => {
            logger.error('Dashboard error received:', error);

            // You can add UI notification logic here
            // For example, show a toast notification or update error state

            // If the error is authentication-related, you might want to redirect to login
            if (error.code === 'AUTHENTICATION_REQUIRED' || error.code === 'NOT_AUTHORIZED') {
                logger.warn('Authentication error - may need to re-authenticate');
                // Could emit a custom event or update local state to handle auth errors
            }

            // For timer-related errors, reset timer state and log specific message
            if (error.code === 'TIMER_ERROR' && error.questionId) {
                logger.error(`Timer error for question ${error.questionId}`);
                setTimerStatus('stop');
                setTimeLeft(0);
                setLocalTimeLeft(0);
            }
        };

        const handleGameError = (error: { message?: string; code?: string; details?: any; error?: string }) => {
            logger.error('Game error received:', error);

            // Handle specific game errors
            if (error.code === 'INVALID_PAYLOAD') {
                logger.error('Payload validation error');
            }
        };

        const handleLobbyError = (error: { error: string; message?: string }) => {
            logger.error('Lobby error received:', error);
        };

        // Enhanced connection error handling
        const handleConnectError = (error: Error) => {
            logger.error('Socket connection error:', error);
            // Reset state on connection errors
            setQuizState(null);
            setTimerStatus('stop');
            setTimeLeft(0);
            setLocalTimeLeft(null);
        };

        const handleDisconnect = (reason: string) => {
            logger.warn('Socket disconnected:', reason);
            // Reset state on disconnect
            setQuizState(null);
            setTimerStatus('stop');
            setTimerQuestionId(null);
            setTimeLeft(0);
            setLocalTimeLeft(null);
            if (timerRef.current) clearInterval(timerRef.current);
        };

        // Register event handlers
        quizSocket.on("game_control_state", handleGameControlState);
        quizSocket.on("quiz_timer_update", handleTimerUpdate);
        quizSocket.on("quiz_connected_count", (data: { count: number }) => {
            logger.debug('Received quiz_connected_count', data);
            setConnectedCount(data.count);
        });

        // Error event handlers
        quizSocket.on("error_dashboard", handleErrorDashboard);
        quizSocket.on("game_error", handleGameError);
        quizSocket.on("lobby_error", handleLobbyError);
        quizSocket.on("connect_error", handleConnectError);
        quizSocket.on("disconnect", handleDisconnect);

        // Request state again if socket reconnects (e.g., after server restart)
        quizSocket.on("connect", () => {
            logger.info("Reconnected, requesting game state again.");
            quizSocket.emit("get_game_state", { quizId });
        });

        return () => {
            // Cleanup all event listeners
            quizSocket.off("game_control_state", handleGameControlState);
            quizSocket.off("quiz_timer_update", handleTimerUpdate);
            quizSocket.off("quiz_connected_count");
            quizSocket.off("error_dashboard", handleErrorDashboard);
            quizSocket.off("game_error", handleGameError);
            quizSocket.off("lobby_error", handleLobbyError);
            quizSocket.off("connect_error", handleConnectError);
            quizSocket.off("disconnect", handleDisconnect);
            quizSocket.off("connect");
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
                logger.debug(`[UI TIMER FIX] Previous question ${prevId} not paused, safe to reset timer to initial value (${prevQuestion.time ?? 0})`); // MODIFIED: temps -> time
                setQuestionTimers(prev => ({
                    ...prev,
                    [prevId]: {
                        status: 'stop',
                        timeLeft: prevQuestion.time ?? 0, // MODIFIED: temps -> time
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
                logger.debug(`[UI TIMER FIX] Setting initial timer for new question ${timerQuestionId} to ${question.time ?? 0}`); // MODIFIED: temps -> time
                return {
                    ...prev,
                    [timerQuestionId]: {
                        status: 'stop',
                        timeLeft: question.time ?? 0, // MODIFIED: temps -> time
                        initialTime: question.time ?? 0, // Store initial time // MODIFIED: temps -> time
                        timestamp: null
                    }
                };
            });

            // Only set localTimeLeft if not already set for this question
            if (localTimeLeftRef.current === null || timerQuestionId !== prevId) {
                setLocalTimeLeft(question.time ?? 0); // MODIFIED: temps -> time
                localTimeLeftRef.current = question.time ?? 0; // MODIFIED: temps -> time
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
                const initialTime = questionTimer.initialTime !== undefined ? questionTimer.initialTime : (question.time || 0); // MODIFIED: temps -> time

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
            const defaultTime = question.time || 0; // MODIFIED: temps -> time
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

    // Updated emitSetQuestion to use new backend event format
    const emitSetQuestion = useCallback((questionUid: string, startTime?: number) => {
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
        }

        // Use new backend event format - simplified payload structure
        logger.info(`Emitting set_question with gameId=${quizId}, questionUid=${questionUid}`);

        const payload: any = {
            gameId: quizId, // New backend uses gameId instead of quizId
            questionUid
        };

        // Only include duration if we have a specific time value to preserve
        if (effectiveStartTime !== undefined) {
            payload.duration = effectiveStartTime;
            logger.info(`[UI TIMER FIX] Including preserved timer duration: ${effectiveStartTime}s`);
        }

        quizSocket?.emit("set_question", payload);

        // Also emit using legacy event name for backward compatibility during transition
        quizSocket?.emit("quiz_set_question", payload);

        // Update local state immediately for smoother UI experience
        if (effectiveStartTime !== undefined) {
            setTimeLeft(effectiveStartTime);
            setLocalTimeLeft(effectiveStartTime);
        } else if (quizState && quizState.questions) {
            const question = quizState.questions.find(q => q.uid === questionUid);
            if (question && question.time !== undefined) {
                setTimeLeft(question.time);
                setLocalTimeLeft(question.time);
            }
        }

        // Just set the active question ID for immediate UI feedback
        setTimerQuestionId(questionUid);

        logger.info(`Waiting for backend confirmation of question ${questionUid}`);
    }, [quizSocket, quizId, questionTimers, quizState]);

    // Updated emitEndQuiz to use new backend event format
    const emitEndQuiz = useCallback(() => {
        logger.info('Emitting end_game', { gameId: quizId });
        quizSocket?.emit("end_game", { gameId: quizId });
    }, [quizSocket, quizId]);

    // Updated emitPauseQuiz to use new timer action system
    const emitPauseQuiz = useCallback(() => {
        logger.info('Emitting quiz_timer_action with action=pause', { gameId: quizId });
        quizSocket?.emit("quiz_timer_action", { gameId: quizId, action: 'pause' });
    }, [quizSocket, quizId]);

    // Updated emitResumeQuiz to use new timer action system  
    const emitResumeQuiz = useCallback(() => {
        logger.info('Emitting quiz_timer_action with action=resume', { gameId: quizId });
        quizSocket?.emit("quiz_timer_action", { gameId: quizId, action: 'resume' });
    }, [quizSocket, quizId]);

    // Updated emitSetTimer to use new backend event format with set_duration action
    const emitSetTimer = useCallback((newTime: number, questionUid?: string) => {
        logger.info('Emitting quiz_timer_action with action=set_duration', {
            gameId: quizId,
            duration: newTime
        });
        quizSocket?.emit("quiz_timer_action", {
            gameId: quizId,
            action: 'set_duration',
            duration: newTime
        });
    }, [quizSocket, quizId]);

    // Updated emitTimerAction to use new backend event format with gameId
    const emitTimerAction = useCallback((action: { status: 'play' | 'pause' | 'stop', questionId: string, timeLeft?: number }) => {
        // For stop actions, immediately update UI to show 0
        if (action.status === 'stop') {
            // Do not update local state here; wait for backend confirmation
        }

        // Map old status names to new backend action names
        let backendAction: 'start' | 'pause' | 'resume' | 'stop';
        switch (action.status) {
            case 'play':
                backendAction = 'start';
                break;
            case 'pause':
                backendAction = 'pause';
                break;
            case 'stop':
                backendAction = 'stop';
                break;
            default:
                backendAction = 'stop';
        }

        // Use new backend event format with gameId instead of quizId
        logger.info(`Emitting quiz_timer_action with gameId=${quizId}, action=${backendAction}`);
        quizSocket?.emit("quiz_timer_action", {
            gameId: quizId, // New backend uses gameId instead of quizId
            action: backendAction,
            duration: action.timeLeft // Include duration for set_duration actions
        });
    }, [quizSocket, quizId, timerQuestionId]);

    // NOTE: Tournament code functionality removed as it's not supported in the new backend architecture
    // The new backend uses accessCode system instead of tournament codes
    const emitUpdateTournamentCode = useCallback((newCode: string) => {
        logger.warn('emitUpdateTournamentCode called but this functionality is deprecated in the new backend architecture');
        logger.info('Use the new accessCode system instead of tournament codes');
        // No longer emit anything as this functionality is not supported
    }, []);

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
