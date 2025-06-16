/**
 * Teacher Dashboard Page Component - Modernized Timer System
 *
 * Uses the new useSimpleTimer hook for clean, maintainable timer management.
 * Eliminates the complex legacy timer logic and provides a simple, reliable interface.
 */

"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import DraggableQuestionsList from "@/components/DraggableQuestionsList";
import ConfirmDialog from "@/components/ConfirmDialog";
import { createLogger } from '@/clientLogger';
import { useSimpleTimer } from '@/hooks/useSimpleTimer';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import { UsersRound } from "lucide-react";
import { makeApiRequest } from '@/config/api';
import { QuizListResponseSchema, TeacherQuizQuestionsResponseSchema, TournamentCodeResponseSchema, TournamentVerificationResponseSchema, type QuizListResponse, type TeacherQuizQuestionsResponse, type TournamentCodeResponse, type TournamentVerificationResponse, type Question } from '@/types/api';
import { STORAGE_KEYS } from '@/constants/auth';
import InfinitySpin from '@/components/InfinitySpin';
import { QUESTION_TYPES } from '@shared/types';
import { io, Socket } from 'socket.io-client';

// Create a logger for this component
const logger = createLogger('TeacherDashboardPage');


// Add this mapping function above the component if not present
function mapToCanonicalQuestion(q: any) {
    logger.info('[DEBUG mapToCanonicalQuestion] Input question:', q);

    // Handle the answer format conversion
    let answerOptions: string[] = [];
    let correctAnswers: boolean[] = [];

    // Check if the question object has the nested question structure
    const questionData = q.question || q;

    if (questionData.answerOptions && Array.isArray(questionData.answerOptions)) {
        // New API format - from nested question object
        answerOptions = questionData.answerOptions;
        correctAnswers = questionData.correctAnswers || [];
        logger.info('[DEBUG mapToCanonicalQuestion] Using new API format from nested question');
    } else if (q.answerOptions && Array.isArray(q.answerOptions)) {
        // New API format - direct on question
        answerOptions = q.answerOptions;
        correctAnswers = q.correctAnswers || [];
        logger.info('[DEBUG mapToCanonicalQuestion] Using new API format direct');
    } else if (q.answers && Array.isArray(q.answers)) {
        // Legacy format
        answerOptions = q.answers.map((a: any) => a.text || a);
        correctAnswers = q.answers.map((a: any) => a.correct || false);
        logger.info('[DEBUG mapToCanonicalQuestion] Using legacy format');
    } else {
        logger.warn('[DEBUG mapToCanonicalQuestion] No recognizable answer format found');
    }

    // Extract timer value from standard timeLimit field only
    const timeLimit = questionData.timeLimit ?? q.timeLimit ?? 60;

    logger.info('[DEBUG mapToCanonicalQuestion] Timer extraction:', {
        'questionData.timeLimit': questionData.timeLimit,
        'q.timeLimit': q.timeLimit,
        'final timeLimit': timeLimit
    });

    const result = {
        ...q,
        // Use the data from the nested question object if it exists
        text: questionData.text || q.text,
        uid: questionData.uid || q.uid,
        answerOptions,
        correctAnswers,
        timeLimit,
    };

    logger.info('[DEBUG mapToCanonicalQuestion] Output question:', result);
    return result;
}

export default function TeacherDashboardPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = React.use(params); // This is now the access code like "379CCT"
    const [questions, setQuestions] = useState<Question[]>([]); // Keep local question state for UI ordering/editing
    const [quizName, setQuizName] = useState<string>("");
    const [gameId, setGameId] = useState<string | null>(null); // Store the actual database UUID
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [questionActiveUid, setQuestionActiveUid] = useState<string | null>(null); // UI state for selected question
    const [expandedUids, setExpandedUids] = useState<Set<string>>(new Set()); // Track expanded questions
    const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

    // --- Confirmation Dialog State ---
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingPlayIdx, setPendingPlayIdx] = useState<number | null>(null);

    // --- Use the Custom Hook ---
    // Get token from localStorage or cookies
    const getAuthToken = () => {
        if (typeof window === 'undefined') return null;

        // First try localStorage
        const localStorageToken = localStorage.getItem('mathquest_jwt_token');
        if (localStorageToken) return localStorageToken;

        // Fallback to cookies
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'teacherToken' && value) {
                return value;
            }
        }
        return null;
    };

    const token = getAuthToken();

    // Log access code and gameId resolution for debugging
    useEffect(() => {
        logger.info('TeacherDashboardPage - URL params:', {
            code, // This is the access code from URL
            gameId // This will be the resolved database UUID
        });
    }, [code, gameId]);

    // Socket connection for basic game management (non-timer)
    const [quizSocket, setQuizSocket] = useState<Socket | null>(null);
    const [quizState, setQuizState] = useState<any>(null);
    const [connectedCount, setConnectedCount] = useState(0);

    // Initialize socket connection (wait for gameId to be available)
    useEffect(() => {
        if (!token || !code || !gameId) {
            logger.info('Socket connection waiting for:', { hasToken: !!token, hasCode: !!code, hasGameId: !!gameId });
            return;
        }

        logger.info('Initializing socket connection with:', { code, gameId });

        const socketUrl = process.env.NODE_ENV === 'production'
            ? 'https://mathquest-backend.onrender.com'
            : 'http://localhost:3001';

        const socket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
            logger.info('Socket connected:', socket.id);
            logger.info('Joining quiz with:', { accessCode: code, gameId });
            // Join the game room
            socket.emit('join_quiz', { accessCode: code, gameId });
        });

        socket.on('game_control_state', (state: any) => {
            logger.debug('Received game_control_state', state);
            setQuizState(state);
        });

        socket.on('connected_count_update', (count: number) => {
            logger.debug('Connected count update:', count);
            setConnectedCount(count);
        });

        socket.on('connect_error', (error) => {
            logger.error('Socket connection error:', error);
        });

        socket.on('disconnect', (reason) => {
            logger.warn('Socket disconnected:', reason);
        });

        setQuizSocket(socket);

        return () => {
            logger.info('Cleaning up socket connection');
            socket.disconnect();
        };
    }, [token, code, gameId]); // Now properly depends on gameId being available

    // Simple timer hook - only initialize when we have required data
    const timerConfig = useMemo(() => {
        if (!gameId || !code || !quizSocket) {
            return null;
        }
        return {
            role: 'teacher' as const,
            gameId,
            accessCode: code,
            socket: quizSocket
        };
    }, [gameId, code, quizSocket]);

    const {
        status: timerStatus,
        questionUid: timerQuestionUid,
        timeLeftMs,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        isConnected: timerConnected
    } = useSimpleTimer(timerConfig || {
        role: 'teacher',
        gameId: '',
        accessCode: '',
        socket: null
    });

    // --- Stats state for answer histograms ---
    type StatsData = { stats: number[]; totalAnswers: number };
    const [questionStats, setQuestionStats] = useState<Record<string, StatsData>>({});

    // Listen for stats updates from the socket
    // useEffect(() => {
    //     if (!quizSocket) return;
    //     const handleStatsUpdate = (data: { questionUid: string; stats: number[]; totalAnswers: number }) => {
    //         setQuestionStats(prev => ({ ...prev, [data.questionUid]: { stats: data.stats, totalAnswers: data.totalAnswers } }));
    //     };
    //     quizSocket.on(SOCKET_EVENTS.LEGACY_QUIZ.ANSWER_STATS_UPDATE, handleStatsUpdate);
    //     return () => {
    //         quizSocket.off(SOCKET_EVENTS.LEGACY_QUIZ.ANSWER_STATS_UPDATE, handleStatsUpdate);
    //     };
    // }, [quizSocket]);

    // Sync questionStats from quizState.stats
    useEffect(() => {
        if (quizState?.stats) {
            const newStats: Record<string, StatsData> = {};
            for (const uid in quizState.stats) {
                const statItem = quizState.stats[uid];
                if (
                    statItem &&
                    typeof statItem === 'object' &&
                    'stats' in statItem &&
                    Array.isArray((statItem as any).stats) &&
                    'totalAnswers' in statItem &&
                    typeof (statItem as any).totalAnswers === 'number'
                ) {
                    newStats[uid] = {
                        stats: (statItem as any).stats as number[],
                        totalAnswers: (statItem as any).totalAnswers as number,
                    };
                } else {
                    // Log if the structure is unexpected, but don't break
                    logger.warn(`Unexpected structure for quizState.stats[${uid}]:`, statItem);
                }
            }
            setQuestionStats(newStats);
        }
    }, [quizState?.stats]);

    useEffect(() => {
        if (!quizSocket) return;

        const handleActionResponse = (data: { message: string; type?: 'info' | 'warning' | 'error' | 'success' }) => { // Updated data type
            logger.info(`[Snackbar] Received notification:`, data);
            setSnackbarMessage(data.message);
            // Optionally, use data.defaultMode to style the snackbar
        };

        quizSocket.on('error_dashboard', handleActionResponse); // Use error_dashboard event for notifications

        return () => {
            quizSocket.off('error_dashboard', handleActionResponse); // Use error_dashboard event for notifications
        };
    }, [quizSocket]);

    useEffect(() => {
        const handleQuizTimerUpdateStop = () => {
            logger.info(`[Snackbar] Received quizTimerUpdateStop event`);
            setSnackbarMessage('Timer arrêté.');
        };

        window.addEventListener('quizTimerUpdateStop', handleQuizTimerUpdateStop);

        return () => {
            window.removeEventListener('quizTimerUpdateStop', handleQuizTimerUpdateStop);
        };
    }, []);

    // --- Initial Data Fetching (Resolve access code to game UUID, fetch questions, etc.) ---
    useEffect(() => {
        logger.info('Data fetching useEffect triggered with:', { code, token: !!token });
        
        let isMounted = true;
        setLoading(true);
        setError(null);
        setGameId(null); // Reset on code change

        const fetchQuizData = async () => {
            try {
                // First, resolve the access code to get the game instance UUID
                logger.info(`[DEBUG] Resolving access code to game instance:`, { code });

                const gameInstanceData = await makeApiRequest<{ gameInstance: { id: string, name: string, gameTemplateId: string, accessCode?: string } }>(`games/${code}`);
                const gameInstance = gameInstanceData.gameInstance;

                if (isMounted) {
                    setQuizName(gameInstance.name || "Quiz");
                    setGameId(gameInstance.id); // Store the actual database UUID
                    logger.info(`[DEBUG] Resolved game instance:`, {
                        accessCode: code,
                        gameId: gameInstance.id,
                        gameName: gameInstance.name
                    });
                }

                // Fetch the game template with questions using the template ID
                const gameTemplateData = await makeApiRequest<{ gameTemplate: { id: string, name: string, questions: any[] } }>(`game-templates/${gameInstance.gameTemplateId}`);

                // Debug: Log the raw API response
                logger.info('[DEBUG] Raw API response:', gameTemplateData);
                logger.info('[DEBUG] Questions from API:', gameTemplateData.gameTemplate.questions);

                // Initialize local question state, ensuring 'temps' exists and preserving all API fields
                const initialQuestions = (gameTemplateData.gameTemplate.questions || []).map((q: any, index: number) => {
                    logger.info(`[DEBUG] Processing question ${index}:`, q);

                    // Extract timer values from nested question structure using standard timeLimit field
                    const questionData = q.question || q;
                    const timeLimit = questionData.timeLimit ?? q.timeLimit ?? 60;

                    const processedQuestion = {
                        ...q,
                        defaultMode: q.questionType || questionData.questionType || QUESTION_TYPES.SINGLE_CHOICE, // Default type if not provided
                        timeLimit: timeLimit, // Use standard timeLimit field only
                        feedbackWaitTime: questionData.feedbackWaitTime ?? q.feedbackWaitTime ?? 3000 // Default to 3s if null
                    };

                    logger.info(`[DEBUG] Processed question ${index} timer:`, {
                        'questionData.timeLimit': questionData.timeLimit,
                        'q.timeLimit': q.timeLimit,
                        'final timeLimit': timeLimit
                    });
                    logger.info(`[DEBUG] Processed question ${index}:`, processedQuestion);
                    return processedQuestion;
                });

                logger.info('[DEBUG] Final initialQuestions:', initialQuestions);
                if (isMounted) setQuestions(initialQuestions);

            } catch (err: unknown) {
                logger.error("Error fetching initial data:", err);
                if (isMounted) setError((err as Error).message || "Une erreur est survenue");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        if (code) {
            fetchQuizData();
        } else {
            setLoading(false); // No code, nothing to load
        }

        return () => { isMounted = false; };
    }, [code, token]); // Add token as dependency to refetch when token changes

    // Debug logging for disabled state

    // Initialize socket connection (wait for gameId to be available)
    useEffect(() => {
        if (!token || !code || !gameId) {
            logger.info('Socket connection waiting for:', { hasToken: !!token, hasCode: !!code, hasGameId: !!gameId });
            return;
        }

        logger.info('Initializing socket connection with:', { code, gameId });

        const socketUrl = process.env.NODE_ENV === 'production'
            ? 'https://mathquest-backend.onrender.com'
            : 'http://localhost:3001';

        const socket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
            logger.info('Socket connected:', socket.id);
            logger.info('Joining quiz with:', { accessCode: code, gameId });
            // Join the game room
            socket.emit('join_quiz', { accessCode: code, gameId });
        });

        socket.on('game_control_state', (state: any) => {
            logger.debug('Received game_control_state', state);
            setQuizState(state);
        });

        socket.on('connected_count_update', (count: number) => {
            logger.debug('Connected count update:', count);
            setConnectedCount(count);
        });

        socket.on('connect_error', (error) => {
            logger.error('Socket connection error:', error);
        });

        socket.on('disconnect', (reason) => {
            logger.warn('Socket disconnected:', reason);
        });

        setQuizSocket(socket);

        return () => {
            logger.info('Cleaning up socket connection');
            socket.disconnect();
        };
    }, [token, code, gameId]); // Now properly depends on gameId being available

    // Simple timer hook - only initialize when we have required data
    const timerConfig = useMemo(() => {
        if (!gameId || !code || !quizSocket) {
            return null;
        }
        return {
            role: 'teacher' as const,
            gameId,
            accessCode: code,
            socket: quizSocket
        };
    }, [gameId, code, quizSocket]);

    const {
        status: timerStatus,
        questionUid: timerQuestionUid,
        timeLeftMs,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        isConnected: timerConnected
    } = useSimpleTimer(timerConfig || {
        role: 'teacher',
        gameId: '',
        accessCode: '',
        socket: null
    });

    // --- Stats state for answer histograms ---
    type StatsData = { stats: number[]; totalAnswers: number };
    const [questionStats, setQuestionStats] = useState<Record<string, StatsData>>({});

    // Listen for stats updates from the socket
    // useEffect(() => {
    //     if (!quizSocket) return;
    //     const handleStatsUpdate = (data: { questionUid: string; stats: number[]; totalAnswers: number }) => {
    //         setQuestionStats(prev => ({ ...prev, [data.questionUid]: { stats: data.stats, totalAnswers: data.totalAnswers } }));
    //     };
    //     quizSocket.on(SOCKET_EVENTS.LEGACY_QUIZ.ANSWER_STATS_UPDATE, handleStatsUpdate);
    //     return () => {
    //         quizSocket.off(SOCKET_EVENTS.LEGACY_QUIZ.ANSWER_STATS_UPDATE, handleStatsUpdate);
    //     };
    // }, [quizSocket]);

    // Sync questionStats from quizState.stats
    useEffect(() => {
        if (quizState?.stats) {
            const newStats: Record<string, StatsData> = {};
            for (const uid in quizState.stats) {
                const statItem = quizState.stats[uid];
                if (
                    statItem &&
                    typeof statItem === 'object' &&
                    'stats' in statItem &&
                    Array.isArray((statItem as any).stats) &&
                    'totalAnswers' in statItem &&
                    typeof (statItem as any).totalAnswers === 'number'
                ) {
                    newStats[uid] = {
                        stats: (statItem as any).stats as number[],
                        totalAnswers: (statItem as any).totalAnswers as number,
                    };
                } else {
                    // Log if the structure is unexpected, but don't break
                    logger.warn(`Unexpected structure for quizState.stats[${uid}]:`, statItem);
                }
            }
            setQuestionStats(newStats);
        }
    }, [quizState?.stats]);

    useEffect(() => {
        if (!quizSocket) return;

        const handleActionResponse = (data: { message: string; type?: 'info' | 'warning' | 'error' | 'success' }) => { // Updated data type
            logger.info(`[Snackbar] Received notification:`, data);
            setSnackbarMessage(data.message);
            // Optionally, use data.defaultMode to style the snackbar
        };

        quizSocket.on('error_dashboard', handleActionResponse); // Use error_dashboard event for notifications

        return () => {
            quizSocket.off('error_dashboard', handleActionResponse); // Use error_dashboard event for notifications
        };
    }, [quizSocket]);

    useEffect(() => {
        const handleQuizTimerUpdateStop = () => {
            logger.info(`[Snackbar] Received quizTimerUpdateStop event`);
            setSnackbarMessage('Timer arrêté.');
        };

        window.addEventListener('quizTimerUpdateStop', handleQuizTimerUpdateStop);

        return () => {
            window.removeEventListener('quizTimerUpdateStop', handleQuizTimerUpdateStop);
        };
    }, []);

    // --- Initial Data Fetching (Resolve access code to game UUID, fetch questions, etc.) ---
    useEffect(() => {
        logger.info('Data fetching useEffect triggered with:', { code, token: !!token });
        
        let isMounted = true;
        setLoading(true);
        setError(null);
        setGameId(null); // Reset on code change

        const fetchQuizData = async () => {
            try {
                // First, resolve the access code to get the game instance UUID
                logger.info(`[DEBUG] Resolving access code to game instance:`, { code });

                const gameInstanceData = await makeApiRequest<{ gameInstance: { id: string, name: string, gameTemplateId: string, accessCode?: string } }>(`games/${code}`);
                const gameInstance = gameInstanceData.gameInstance;

                if (isMounted) {
                    setQuizName(gameInstance.name || "Quiz");
                    setGameId(gameInstance.id); // Store the actual database UUID
                    logger.info(`[DEBUG] Resolved game instance:`, {
                        accessCode: code,
                        gameId: gameInstance.id,
                        gameName: gameInstance.name
                    });
                }

                // Fetch the game template with questions using the template ID
                const gameTemplateData = await makeApiRequest<{ gameTemplate: { id: string, name: string, questions: any[] } }>(`game-templates/${gameInstance.gameTemplateId}`);

                // Debug: Log the raw API response
                logger.info('[DEBUG] Raw API response:', gameTemplateData);
                logger.info('[DEBUG] Questions from API:', gameTemplateData.gameTemplate.questions);

                // Initialize local question state, ensuring 'temps' exists and preserving all API fields
                const initialQuestions = (gameTemplateData.gameTemplate.questions || []).map((q: any, index: number) => {
                    logger.info(`[DEBUG] Processing question ${index}:`, q);

                    // Extract timer values from nested question structure using standard timeLimit field
                    const questionData = q.question || q;
                    const timeLimit = questionData.timeLimit ?? q.timeLimit ?? 60;

                    const processedQuestion = {
                        ...q,
                        defaultMode: q.questionType || questionData.questionType || QUESTION_TYPES.SINGLE_CHOICE, // Default type if not provided
                        timeLimit: timeLimit, // Use standard timeLimit field only
                        feedbackWaitTime: questionData.feedbackWaitTime ?? q.feedbackWaitTime ?? 3000 // Default to 3s if null
                    };

                    logger.info(`[DEBUG] Processed question ${index} timer:`, {
                        'questionData.timeLimit': questionData.timeLimit,
                        'q.timeLimit': q.timeLimit,
                        'final timeLimit': timeLimit
                    });
                    logger.info(`[DEBUG] Processed question ${index}:`, processedQuestion);
                    return processedQuestion;
                });

                logger.info('[DEBUG] Final initialQuestions:', initialQuestions);
                if (isMounted) setQuestions(initialQuestions);

            } catch (err: unknown) {
                logger.error("Error fetching initial data:", err);
                if (isMounted) setError((err as Error).message || "Une erreur est survenue");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        if (code) {
            fetchQuizData();
        } else {
            setLoading(false); // No code, nothing to load
        }

        return () => { isMounted = false; };
    }, [code, token]); // Add token as dependency to refetch when token changes


    // --- Sync UI Active Question with Timer State ---
    useEffect(() => {
        if (timerQuestionUid) {
            setQuestionActiveUid(timerQuestionUid);
        }
    }, [timerQuestionUid]);

    // --- Memoize mapped questions to prevent unnecessary re-renders ---
    const mappedQuestions = useMemo(() => {
        return questions.map(mapToCanonicalQuestion);
    }, [questions]);

    // --- Handlers (using hook emitters) ---

    const handleSelect = useCallback((uid: string) => {
        setQuestionActiveUid(uid);
        logger.info(`[DASHBOARD] Question selected:`, uid);
    }, []);

    // Toggle expansion for a question
    const handleToggleExpand = useCallback((uid: string) => {
        setExpandedUids(prev => {
            const newSet = new Set(prev);
            if (newSet.has(uid)) {
                newSet.delete(uid);
            } else {
                newSet.add(uid);
            }
            return newSet;
        });
    }, []);

    const handleReorder = useCallback((newQuestions: Question[]) => {
        setQuestions(newQuestions);
    }, []);

    const handlePlay = useCallback((uid: string, timeLeftMs: number) => {
        logger.info(`[DASHBOARD] handlePlay called:`, {
            uid,
            timeLeftMs,
            accessCode: code,
            gameId,
            timerStatus,
            timerQuestionUid,
            socketConnected: !!quizSocket?.connected
        });

        const questionToPlay = mappedQuestions.find(q => q.uid === uid);
        if (!questionToPlay) {
            logger.warn(`[DASHBOARD] Question not found for uid: ${uid}`);
            logger.warn(`[DASHBOARD] Available question UIDs:`, mappedQuestions.map(q => q.uid));
            return;
        }
        const currentQuestionUid = timerQuestionUid;
        const isTimerRunningOrPaused = timerStatus === 'play' || timerStatus === 'pause';

        if (currentQuestionUid === questionToPlay.uid) {
            if (timerStatus === 'play') {
                logger.info(`[DASHBOARD] Pausing currently playing question:`, {
                    questionUid: questionToPlay.uid,
                    accessCode: code,
                    gameId
                });
                pauseTimer();
                return;
            }
            if (timerStatus === 'pause') {
                logger.info(`[DASHBOARD] Resuming currently paused question:`, {
                    questionUid: questionToPlay.uid,
                    accessCode: code,
                    gameId,
                });
                resumeTimer();
                return;
            }
        }

        if (isTimerRunningOrPaused && currentQuestionUid && currentQuestionUid !== questionToPlay.uid) {
            logger.info(`[DASHBOARD] Timer conflict detected - showing confirmation dialog:`, {
                isTimerRunningOrPaused,
                currentQuestionUid,
                newQuestionUid: questionToPlay.uid,
                timerStatus
            });
            setPendingPlayIdx(mappedQuestions.findIndex(q => q.uid === uid));
            setShowConfirm(true);
            return;
        }

        // Start new timer for the question
        setQuestionActiveUid(questionToPlay.uid);
        const durationMs = questionToPlay.timeLimit * 1000; // Convert to milliseconds
        logger.info(`[DASHBOARD] Starting timer for question:`, {
            questionUid: questionToPlay.uid,
            durationMs
        });
        startTimer(questionToPlay.uid, durationMs);
    }, [mappedQuestions, pauseTimer, resumeTimer, startTimer, timerStatus, timerQuestionUid]);

    const handlePause = useCallback(() => {
        logger.info(`[DASHBOARD] Pausing timer`);
        pauseTimer();
    }, [pauseTimer]);

    const handleStop = useCallback(() => {
        if (timerQuestionUid && (timerStatus === 'play' || timerStatus === 'pause')) {
            logger.info(`[DASHBOARD] Stopping timer for question:`, timerQuestionUid);
            stopTimer();
        }
    }, [stopTimer, timerQuestionUid, timerStatus]);

    const handleEditTimer = useCallback((uid: string, newTime: number) => {
        const question = questions.find(q => q.uid === uid);
        if (!question) return;

        // Update local question state
        setQuestions(prev => prev.map(q => q.uid === uid ? { ...q, timeLimit: newTime } : q));

        // If this is the active timer question and timer is paused, update the timer
        if (timerQuestionUid === uid && timerStatus === 'pause') {
            const newDurationMs = newTime * 1000;
            logger.info(`[DASHBOARD] Updating timer duration for paused question:`, { uid, newDurationMs });
            // For paused timers, we need to restart with new duration
            startTimer(uid, newDurationMs);
        }

        logger.info(`[DASHBOARD] Timer updated for question ${uid}: ${newTime} seconds`);
    }, [questions, timerQuestionUid, timerStatus, startTimer]);

    const handleTimerAction = useCallback((action: { status: 'play' | 'pause' | 'stop', questionUid: string, timeLeftMs: number }) => {
        logger.info(`[DASHBOARD] handleTimerAction called:`, action);

        // Map the legacy action format to simple timer actions
        switch (action.status) {
            case 'play':
                startTimer(action.questionUid, action.timeLeftMs);
                break;
            case 'pause':
                pauseTimer();
                break;
            case 'stop':
                stopTimer();
                break;
        }
    }, [startTimer, pauseTimer, stopTimer]);

    const handleShowResults = useCallback((uid: string) => {
        logger.info(`[DASHBOARD] About to emit show results (stop) action:`, {
            uid,
            accessCode: code,
            gameId,
            socketConnected: !!quizSocket?.connected
        });
        stopTimer();
        // quizSocket?.emit(SOCKET_EVENTS.LEGACY_QUIZ.CLOSE_QUESTION, { quizId, tournamentCode: currentTournamentCode, questionUid: uid }); // REMOVED
        // Consider if emitLockAnswers(true) is needed here or if stopping timer is sufficient
    }, [stopTimer]);


    // --- Confirmation Dialog ---
    const confirmPlay = () => {
        logger.info(`[DASHBOARD] confirmPlay called:`, {
            pendingPlayIdx,
            timerQuestionUid,
            timerStatus,
            mappedQuestionsLength: mappedQuestions.length
        });

        setShowConfirm(false);
        if (pendingPlayIdx !== null && pendingPlayIdx >= 0 && pendingPlayIdx < mappedQuestions.length) {
            const questionToPlay = mappedQuestions[pendingPlayIdx];
            logger.info(`[DASHBOARD] confirmPlay - playing question:`, {
                questionToPlay: questionToPlay?.uid,
                currentTimerQuestion: timerQuestionUid,
                currentTimerStatus: timerStatus
            });

            if (questionToPlay) {
                // Stop current timer if one is running
                if (timerQuestionUid && (timerStatus === 'play' || timerStatus === 'pause')) {
                    logger.info(`[DASHBOARD] confirmPlay - stopping current timer for:`, timerQuestionUid);
                    stopTimer();
                }

                // Set the new active question and start its timer
                setQuestionActiveUid(questionToPlay.uid);
                const timeToUse = questionToPlay.timeLimit * 1000; // Convert to ms
                logger.info(`[DASHBOARD] confirmPlay - starting new timer:`, {
                    questionUid: questionToPlay.uid,
                    timeToUse,
                    timeLimitOriginal: questionToPlay.timeLimit
                });
                startTimer(questionToPlay.uid, timeToUse);
            }
            setPendingPlayIdx(null);
        }
    };
    const cancelPlay = () => {
        logger.info(`[DASHBOARD] cancelPlay called:`, {
            pendingPlayIdx,
            showConfirm
        });
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
        // Use basic socket emitter for ending the quiz
        if (quizSocket && gameId) {
            quizSocket.emit('end_quiz', { gameId });
        }
    };

    const cancelEndQuiz = () => {
        setShowEndQuizConfirm(false);
    };

    // Memoize the onReorder callback to prevent unnecessary re-renders
    const handleReorderMemoized = useCallback((qs: Question[]) => {
        setQuestions(qs.map(q => {
            let correctAnswers: string[] = [];
            if (Array.isArray(q.correctAnswers) && q.correctAnswers.length > 0) {
                if (typeof q.correctAnswers[0] === 'boolean' && Array.isArray(q.answerOptions)) {
                    correctAnswers = q.answerOptions.filter((_: string, i: number) => (q.correctAnswers as boolean[])[i]);
                } else if (typeof q.correctAnswers[0] === 'string') {
                    correctAnswers = (q.correctAnswers as (string | boolean)[]).filter((a): a is string => typeof a === 'string');
                }
            }
            return {
                ...q,
                timeLimit: q.timeLimit ?? 20, // Default to 20 seconds if null
                feedbackWaitTime: q.feedbackWaitTime ?? 3000, // Default to 3 seconds if null
                answers: Array.isArray(q.answerOptions)
                    ? q.answerOptions.map((text: string) => ({ text, correct: correctAnswers.includes(text) }))
                    : []
            };
        }));
    }, []);

    // --- Debug logging for disabled state ---
    useEffect(() => {
        logger.info('Dashboard disabled state debugging:', {
            hasQuizSocket: !!quizSocket,
            socketConnected: quizSocket?.connected,
            quizStateEnded: quizState?.ended,
            quizState: quizState,
            timerConnected: timerConnected,
            gameId: gameId,
            code: code,
            token: !!token
        });
    }, [quizSocket, quizSocket?.connected, quizState?.ended, quizState, timerConnected, gameId, code, token]);

    // Additional debugging for quiz state changes
    useEffect(() => {
        logger.info('Quiz state changed:', {
            quizState,
            ended: quizState?.ended,
            chrono: quizState?.chrono,
            currentQuestionIdx: quizState?.currentQuestionidx
        });
    }, [quizState]);

    // --- Render Logic ---
    if (loading) return <div className="p-8">Chargement du tableau de bord...</div>;
    if (error) return <div className="p-8 text-red-600">Erreur: {error}</div>;
    if (!code) return <div className="p-8 text-orange-600">Aucun code d'accès fourni.</div>;

    return (
        <div className="main-content">
            <div className="card w-full max-w-4xl shadow-xl bg-base-100 m-4 my-6">
                <div className="flex flex-col gap-8">
                    <div className="card-body flex-1 flex flex-col gap-8 min-h-0 overflow-y-auto w-full p-0">
                        <div className="flex flex-row items-center justify-between mb-2 gap-2">
                            <h1 className="card-title text-3xl">Tableau de bord – {quizName}</h1>
                            <button 
                                className="btn btn-secondary" 
                                onClick={handleEndQuiz} 
                                disabled={(() => {
                                    const noSocket = !quizSocket;
                                    const quizEnded = quizState?.ended;
                                    const isDisabled = noSocket || quizEnded;
                                    
                                    logger.debug('End quiz button disabled check:', {
                                        noSocket,
                                        quizEnded,
                                        isDisabled,
                                        socketId: quizSocket?.id
                                    });
                                    
                                    return isDisabled;
                                })()}
                            >
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
                            <div className="basis-full h-0 sm:hidden" />
                            <div className="flex items-center gap-2 ml-auto text-base-content/80">
                                <UsersRound className="w-6 h-6" />
                                <span className="font-semibold">{connectedCount}</span>
                            </div>
                        </div>
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <h2 className="text-xl font-semibold">Questions</h2>
                                {loading && <InfinitySpin size={32} />}
                            </div>
                            <DraggableQuestionsList
                                quizSocket={quizSocket}
                                questions={mappedQuestions}
                                currentQuestionIdx={quizState?.currentQuestionidx}
                                isChronoRunning={quizState?.chrono?.running}
                                isQuizEnded={quizState?.ended}
                                questionActiveUid={questionActiveUid}
                                timerStatus={timerStatus}
                                timerQuestionUid={timerQuestionUid}
                                timeLeftMs={timeLeftMs}
                                onSelect={handleSelect}
                                onPlay={handlePlay}
                                onPause={handlePause}
                                onStop={handleStop}
                                onEditTimer={handleEditTimer}
                                onReorder={handleReorderMemoized}
                                quizId={gameId || ''}
                                currentTournamentCode={code || ''}
                                onTimerAction={handleTimerAction}
                                disabled={(() => {
                                    const noSocket = !quizSocket;
                                    const notConnected = !quizSocket?.connected;
                                    const quizEnded = quizState?.ended;
                                    const isDisabled = noSocket || notConnected || quizEnded;
                                    
                                    logger.debug('DraggableQuestionsList disabled check:', {
                                        noSocket,
                                        notConnected,
                                        quizEnded,
                                        isDisabled,
                                        socketId: quizSocket?.id,
                                        quizState
                                    });
                                    
                                    return isDisabled;
                                })()}
                                expandedUids={expandedUids}
                                onToggleExpand={handleToggleExpand}
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
            {snackbarMessage && (
                <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded shadow-lg">
                    {snackbarMessage}
                </div>
            )}
        </div>
    );
}

interface CodeManagerRef {
    generateTournament: () => void;
}


