import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { createLogger } from '@/clientLogger';
import { SOCKET_CONFIG } from '@/config';
import { createSocketConfig } from '@/utils';
import { BaseQuestion, Answer } from '@shared/types/question'; // MODIFIED: Added Answer import
import { SOCKET_EVENTS } from '@shared/types/socket/events';

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

    // NEW: Store per-question timer states (simplified for backend-driven updates)
    const [questionTimers, setQuestionTimers] = useState<Record<string, QuestionTimerState>>({});

    // TIMER MANAGEMENT OVERHAUL: Internal UI timer refs for smooth countdown display
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
        const now = Date.now();
        const previousValue = localTimeLeftRef.current;

        // Always update the ref value
        localTimeLeftRef.current = newTimeLeft;

        // Only update state if enough time has passed or if the value changed significantly
        if (now - lastUpdateTimeRef.current >= UI_UPDATE_THRESHOLD || Math.abs((previousValue || 0) - newTimeLeft) > 1) {
            setLocalTimeLeft(newTimeLeft);
            lastUpdateTimeRef.current = now;
        }
    }, []);

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

        s.on(SOCKET_EVENTS.CONNECT, () => {
            logger.info(`Socket connected: ${s.id}`);

            // Use Phase 8 dashboard join event with gameId parameter
            logger.info(`[DEBUG][CLIENT] Emitting join_dashboard for gameId=${quizId}`);
            s.emit(SOCKET_EVENTS.TEACHER.JOIN_DASHBOARD, { gameId: quizId });

            // Note: No need for separate GET_GAME_STATE - join_dashboard returns comprehensive state
        });

        s.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
            logger.warn(`Socket disconnected: ${reason}`);
            // Reset state on disconnect
            setQuizState(null);
            setTimerStatus('stop');
            setTimerQuestionId(null);
            setTimeLeft(0);
            setLocalTimeLeft(null);
        });

        s.on(SOCKET_EVENTS.CONNECT_ERROR, (err) => {
            logger.error("Socket connection error:", err);
        });

        s.on(SOCKET_EVENTS.TEACHER.DASHBOARD_JOINED, ({ room, socketId }) => {
            logger.debug("Server confirms dashboard join", { room, socketId });
        });

        return () => {
            logger.info(`Disconnecting socket for quiz: ${quizId}`);
            s.disconnect();
            setQuizSocket(null);
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

            // TIMER MANAGEMENT OVERHAUL: Simplified backend-driven timer updates
            // Always trust backend values and status
            setTimerStatus(data.status);
            setTimerQuestionId(data.questionId);
            setTimeLeft(data.timeLeft);
            setLocalTimeLeft(data.timeLeft);

            // Update the per-question timer state for UI consistency
            setQuestionTimers(prev => ({
                ...prev,
                [data.questionId]: {
                    status: data.status,
                    timeLeft: data.timeLeft,
                    timestamp: data.timestamp || Date.now(),
                    initialTime: prev[data.questionId]?.initialTime || data.timeLeft
                }
            }));

            logger.debug(`[TIMER OVERHAUL] Updated timer display to ${data.timeLeft}s (status: ${data.status})`);
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
        };

        // Register Phase 8 event handlers
        quizSocket.on(SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE, handleGameControlState);

        // Register specific dashboard update events from Phase 8
        quizSocket.on(SOCKET_EVENTS.TEACHER.DASHBOARD_QUESTION_CHANGED, ({ questionUid, timer }) => {
            logger.debug('Received dashboard_question_changed', { questionUid, timer });
            setTimerQuestionId(questionUid);
            if (timer && timer.timeRemaining !== undefined) {
                setTimeLeft(timer.timeRemaining);
                setLocalTimeLeft(timer.timeRemaining);
            }
        });

        quizSocket.on(SOCKET_EVENTS.TEACHER.DASHBOARD_TIMER_UPDATED, (timerData) => {
            logger.debug('Received dashboard_timer_updated', timerData);
            handleTimerUpdate(timerData);
        });

        quizSocket.on(SOCKET_EVENTS.TEACHER.DASHBOARD_ANSWERS_LOCK_CHANGED, ({ answersLocked }) => {
            logger.debug('Received dashboard_answers_lock_changed', { answersLocked });
            // Update locked state in quizState if needed
            if (quizState) {
                setQuizState(prev => prev ? { ...prev, locked: answersLocked } : prev);
            }
        });

        quizSocket.on(SOCKET_EVENTS.TEACHER.DASHBOARD_GAME_STATUS_CHANGED, ({ status }) => {
            logger.debug('Received dashboard_game_status_changed', { status });
            // Update game status in quizState if needed
            if (quizState) {
                setQuizState(prev => prev ? { ...prev, ended: status === 'completed' } : prev);
            }
        });

        // Legacy timer update for backward compatibility
        quizSocket.on(SOCKET_EVENTS.TEACHER.TIMER_UPDATE, handleTimerUpdate);

        quizSocket.on(SOCKET_EVENTS.TEACHER.CONNECTED_COUNT, (data: { count: number }) => {
            logger.debug('Received quiz_connected_count', data);
            setConnectedCount(data.count);
        });

        // Error event handlers
        quizSocket.on(SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, handleErrorDashboard);
        quizSocket.on(SOCKET_EVENTS.GAME.GAME_ERROR, handleGameError);
        quizSocket.on(SOCKET_EVENTS.LOBBY.LOBBY_ERROR, handleLobbyError);
        quizSocket.on(SOCKET_EVENTS.CONNECT_ERROR, handleConnectError);
        quizSocket.on(SOCKET_EVENTS.DISCONNECT, handleDisconnect);

        // Request state again if socket reconnects (e.g., after server restart)
        quizSocket.on(SOCKET_EVENTS.CONNECT, () => {
            logger.info("Reconnected, rejoining dashboard with gameId.");
            quizSocket.emit(SOCKET_EVENTS.TEACHER.JOIN_DASHBOARD, { gameId: quizId });
        });

        return () => {
            // Cleanup all event listeners
            quizSocket.off(SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE, handleGameControlState);
            quizSocket.off(SOCKET_EVENTS.TEACHER.TIMER_UPDATE, handleTimerUpdate);
            quizSocket.off(SOCKET_EVENTS.TEACHER.CONNECTED_COUNT);
            quizSocket.off(SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, handleErrorDashboard);
            quizSocket.off(SOCKET_EVENTS.GAME.GAME_ERROR, handleGameError);
            quizSocket.off(SOCKET_EVENTS.LOBBY.LOBBY_ERROR, handleLobbyError);
            quizSocket.off(SOCKET_EVENTS.CONNECT_ERROR, handleConnectError);
            quizSocket.off(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
            quizSocket.off(SOCKET_EVENTS.CONNECT);
        };
    }, [quizSocket, quizId, timerStatus, timerQuestionId, quizState]);

    // --- Backend-Driven Question Timer State Management ---
    useEffect(() => {
        if (!quizState || !quizState.questions || !timerQuestionId) return;

        const question = quizState.questions.find(q => q.uid === timerQuestionId);
        if (!question) return;

        // TIMER MANAGEMENT OVERHAUL: Simplified question timer initialization
        // Only initialize timer state if it doesn't exist, let backend control the values
        setQuestionTimers(prev => {
            if (!prev[timerQuestionId]) {
                logger.debug(`[TIMER OVERHAUL] Initializing timer state for question ${timerQuestionId}`);
                return {
                    ...prev,
                    [timerQuestionId]: {
                        status: 'stop',
                        timeLeft: question.time || 0,
                        initialTime: question.time || 0,
                        timestamp: null
                    }
                };
            }
            return prev;
        });
    }, [timerQuestionId, quizState]);

    // --- Simple Display Timer Update ---
    useEffect(() => {
        if (!timerQuestionId || !questionTimers[timerQuestionId]) return;

        const questionTimer = questionTimers[timerQuestionId];

        // TIMER MANAGEMENT OVERHAUL: Simple display update from stored state
        if (questionTimer.timeLeft !== undefined) {
            setTimeLeft(questionTimer.timeLeft);
            setLocalTimeLeft(questionTimer.timeLeft);
            logger.debug(`[TIMER OVERHAUL] Display updated for question ${timerQuestionId}: ${questionTimer.timeLeft}s`);
        }
    }, [timerQuestionId, questionTimers]);

    // --- Internal UI Timer for Smooth Countdown Display ---
    useEffect(() => {
        // TIMER MANAGEMENT OVERHAUL: Implement proper internal UI timer
        // Backend provides discrete timer events, frontend provides smooth countdown display

        // Clear any existing timer/animation frame
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (!timerQuestionId || timerStatus === 'stop') {
            // When stopped, display the backend-provided timeLeft value
            if (timeLeft !== null) {
                setLocalTimeLeft(timeLeft);
            }
            return;
        }

        if (timerStatus === 'pause') {
            // When paused, show the current backend value without countdown
            if (timeLeft !== null) {
                setLocalTimeLeft(timeLeft);
            }
            return;
        }

        if (timerStatus === 'play' && timeLeft !== null && timeLeft > 0) {
            // Start internal countdown timer from backend-provided value
            startTimeRef.current = Date.now();
            initialDurationRef.current = timeLeft;
            setLocalTimeLeft(timeLeft);

            logger.debug(`[TIMER OVERHAUL] Starting internal countdown from ${timeLeft}s`);

            // Use requestAnimationFrame for smooth countdown
            const tick = () => {
                if (startTimeRef.current === null || initialDurationRef.current === null) return;

                const now = Date.now();
                const elapsed = (now - startTimeRef.current) / 1000;
                const remaining = Math.max(initialDurationRef.current - elapsed, 0);
                const roundedRemaining = Math.floor(remaining);

                // Update display with throttling
                updateLocalTimeLeft(roundedRemaining);

                if (remaining <= 0) {
                    // Timer finished - stop countdown but don't change timer status
                    // Backend will send the authoritative timer event
                    if (animationFrameRef.current) {
                        cancelAnimationFrame(animationFrameRef.current);
                        animationFrameRef.current = null;
                    }
                    startTimeRef.current = null;
                    initialDurationRef.current = null;
                } else {
                    // Continue countdown
                    animationFrameRef.current = requestAnimationFrame(tick);
                }
            };

            animationFrameRef.current = requestAnimationFrame(tick);
        }

        // Note: No local countdown logic - backend will send timer updates as needed
        // This eliminates sync issues and ensures backend is single source of truth
    }, [timerStatus, timeLeft, timerQuestionId]);

    // --- Emitter Functions ---
    const getTeacherId = () => (typeof window !== 'undefined' ? localStorage.getItem('mathquest_teacher_id') : null);

    // Updated emitSetQuestion to use Phase 8 backend event format
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

        // Use Phase 8 backend event format with gameId
        logger.info(`Emitting set_question with gameId=${quizId}, questionUid=${questionUid}`);

        const payload: any = {
            gameId: quizId, // Phase 8 backend uses gameId
            questionUid
        };

        // Note: Phase 8 backend handles timer initialization based on question.time
        // Duration parameter not needed unless overriding default

        quizSocket?.emit(SOCKET_EVENTS.TEACHER.SET_QUESTION, payload);

        // TIMER MANAGEMENT OVERHAUL: Remove optimistic state updates
        // Just set the active question ID for immediate UI feedback
        // Backend will send proper timer state via timer_update events
        setTimerQuestionId(questionUid);

        logger.info(`Waiting for backend confirmation of question ${questionUid}`);
    }, [quizSocket, quizId, questionTimers, quizState]);

    // Updated emitEndQuiz to use new backend event format
    const emitEndQuiz = useCallback(() => {
        logger.info('Emitting end_game', { gameId: quizId });
        quizSocket?.emit(SOCKET_EVENTS.TEACHER.END_GAME, { gameId: quizId });
    }, [quizSocket, quizId]);

    // Updated emitPauseQuiz to use new timer action system
    const emitPauseQuiz = useCallback(() => {
        logger.info('Emitting quiz_timer_action with action=pause', { gameId: quizId });
        quizSocket?.emit(SOCKET_EVENTS.TEACHER.TIMER_ACTION, { gameId: quizId, action: 'pause' });
    }, [quizSocket, quizId]);

    // Updated emitResumeQuiz to use new timer action system  
    const emitResumeQuiz = useCallback(() => {
        logger.info('Emitting quiz_timer_action with action=resume', { gameId: quizId });
        quizSocket?.emit(SOCKET_EVENTS.TEACHER.TIMER_ACTION, { gameId: quizId, action: 'resume' });
    }, [quizSocket, quizId]);

    // Updated emitSetTimer to use new backend event format with set_duration action
    const emitSetTimer = useCallback((newTime: number, questionUid?: string) => {
        logger.info('Emitting quiz_timer_action with action=set_duration', {
            gameId: quizId,
            duration: newTime
        });
        quizSocket?.emit(SOCKET_EVENTS.TEACHER.TIMER_ACTION, {
            gameId: quizId,
            action: 'set_duration',
            duration: newTime
        });
    }, [quizSocket, quizId]);

    // Updated emitTimerAction to use Phase 8 backend event format
    const emitTimerAction = useCallback((action: { status: 'play' | 'pause' | 'stop', questionId: string, timeLeft?: number }) => {
        // Map frontend status names to Phase 8 backend action names
        let backendAction: 'start' | 'pause' | 'resume' | 'stop' | 'set_duration';

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

        const payload: any = {
            gameId: quizId, // Phase 8 backend uses gameId
            action: backendAction
        };

        // Include duration for set_duration actions or when preserving timer state
        if (action.timeLeft !== undefined) {
            payload.duration = action.timeLeft;
        }

        logger.info(`Emitting quiz_timer_action with gameId=${quizId}, action=${backendAction}`, payload);
        quizSocket?.emit(SOCKET_EVENTS.TEACHER.TIMER_ACTION, payload);
    }, [quizSocket, quizId]);

    // Updated emitLockAnswers to use Phase 8 backend event format
    const emitLockAnswers = useCallback((lock: boolean) => {
        logger.info(`Emitting lock_answers with gameId=${quizId}, lock=${lock}`);
        quizSocket?.emit(SOCKET_EVENTS.TEACHER.LOCK_ANSWERS, {
            gameId: quizId,
            lock: lock
        });
    }, [quizSocket, quizId]);

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
        emitLockAnswers, // NEW: Phase 8 answer lock control
        emitUpdateTournamentCode,
    };
}
