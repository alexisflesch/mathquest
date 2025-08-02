"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Snackbar from "./Snackbar";
import DraggableQuestionsList from "@/components/DraggableQuestionsList";
import InfoModal from "@/components/SharedModal";
import { createLogger } from '@/clientLogger';
import { useSimpleTimer } from '@/hooks/useSimpleTimer';
import { useAuthState } from '@/hooks/useAuthState';
import { useAccessGuard } from '@/hooks/useAccessGuard';
import { UsersRound, Trophy } from "lucide-react";
import { motion } from 'framer-motion';
import type { Question } from '@shared/types/core/question';
import InfinitySpin from '@/components/InfinitySpin';
import LoadingScreen from '@/components/LoadingScreen';
import { QUESTION_TYPES } from '@shared/types';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import { gameControlStatePayloadSchema, type GameControlStatePayload } from '@shared/types/socketEvents.zod.dashboard';
import type { ConnectedCountPayload, JoinDashboardPayload, EndGamePayload, DashboardAnswerStatsUpdatePayload } from '@shared/types/socket/dashboardPayloads';
import { io, Socket } from 'socket.io-client';

// Answer stats can be legacy format or new format with type discrimination
type AnswerStats = Record<string, number> | {
    type: 'multipleChoice';
    stats: Record<string, number>;
    totalUsers: number;
} | {
    type: 'numeric';
    values: number[];
    totalAnswers: number;
};
import { SOCKET_CONFIG } from '@/config';
import { computeTimeLeftMs } from '../utils/computeTimeLeftMs';
import { makeApiRequest } from '@/config/api';
import { showCorrectAnswersPayloadSchema, type ShowCorrectAnswersPayload } from '@shared/types/socketEvents.zod.dashboard';

// Derive type from Zod schema for type safety
// type ConnectedCountPayload = z.infer<typeof connectedCountPayloadSchema>;
// type JoinDashboardPayload = z.infer<typeof joinDashboardPayloadSchema>;
// type EndGamePayload = z.infer<typeof endGamePayloadSchema>;

const logger = createLogger('TeacherDashboard');

function mapToCanonicalQuestion(q: any): Question {
    const questionData = q.question || q;

    // Support polymorphic structure for answer options
    const answerOptions = questionData.multipleChoiceQuestion?.answerOptions || [];
    const correctAnswers = questionData.multipleChoiceQuestion?.correctAnswers || [];

    // Canonical: always use durationMs in ms, never timeLimit
    const durationMs = questionData.durationMs ?? q.durationMs;

    // Enforce canonical UID: throw if missing
    if (!questionData.uid || typeof questionData.uid !== 'string') {
        throw new Error('[MODERNIZATION ERROR] Question is missing canonical uid: ' + JSON.stringify(q));
    }

    return {
        ...q,
        text: questionData.text || q.text,
        uid: questionData.uid, // Only canonical
        answerOptions,
        correctAnswers,
        durationMs, // canonical ms
        defaultMode: q.questionType || questionData.questionType || QUESTION_TYPES.SINGLE_CHOICE,
        feedbackWaitTime: questionData.feedbackWaitTime ?? q.feedbackWaitTime ?? 3000
        // No timeLimit, no legacy fields
    } as Question;
}

export default function TeacherDashboardClient({ code, gameId }: { code: string, gameId: string }) {
    // Track if the last stats toggle was teacher-initiated
    const lastStatsToggleInitiatedByTeacher = useRef(false);

    // Re-render logging for performance monitoring
    const renderCount = useRef(0);
    const lastRenderTime = useRef(Date.now());

    useEffect(() => {
        renderCount.current++;
        const now = Date.now();
        const timeSinceLastRender = now - lastRenderTime.current;
        lastRenderTime.current = now;

        logger.info(`🔄 [DASHBOARD-RERENDER] TeacherDashboard re-render #${renderCount.current} (${timeSinceLastRender}ms since last)`);
    });
    // --- Canonical timer sync: update per-question durationMs after every timer update ---
    const lastTimerQuestionUidRef = useRef<string | null>(null);
    const lastTimerDurationMsRef = useRef<number | null>(null);

    // Authentication and access control (following established pattern)
    const { isTeacher, isAuthenticated, isLoading: authLoading, userState, userProfile } = useAuthState();
    useAccessGuard({ requireMinimum: 'teacher', redirectTo: '/login' });

    // Basic state
    const [questions, setQuestions] = useState<Question[]>([]);

    // Ref to always have the latest questions state (for timer actions)
    const questionsRef = useRef<Question[]>([]);
    useEffect(() => { questionsRef.current = questions; }, [questions]);

    // Modernization: Store both templateName and gameInstanceName for dashboard title
    const [quizName, setQuizName] = useState<string>("");
    const [gameInstanceName, setGameInstanceName] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // UI state
    const [questionActiveUid, setQuestionActiveUid] = useState<string | null>(null);
    const [expandedUids, setExpandedUids] = useState<Set<string>>(new Set());
    type SnackbarState = { message: string; type?: "success" | "error" } | string | null;
    const [snackbarMessage, setSnackbarMessage] = useState<SnackbarState>(null);
    const [showStats, setShowStats] = useState<boolean>(false); // global stats toggle
    const [showTrophy, setShowTrophy] = useState<boolean>(false); // trophy toggle state
    // Suppression flags for initial backend event
    const hasReceivedInitialStats = useRef(false);
    const hasReceivedInitialTrophy = useRef(false);

    // Confirmation dialogs
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingPlayIdx, setPendingPlayIdx] = useState<number | null>(null);
    const [showFinishedModal, setShowFinishedModal] = useState(false);
    const [pendingFinishedPlayIdx, setPendingFinishedPlayIdx] = useState<number | null>(null);
    const [showEndQuizConfirm, setShowEndQuizConfirm] = useState(false);

    // Restore missing handlers for end quiz (move above return)
    function handleEndQuiz() { setShowEndQuizConfirm(true); }
    function confirmEndQuiz() {
        setShowEndQuizConfirm(false);
        if (quizSocket && code) {
            const payload: EndGamePayload = { accessCode: code };
            try {
                // endGamePayloadSchema.parse(payload);
                quizSocket.emit(SOCKET_EVENTS.TEACHER.END_GAME, payload);
            } catch (error) {
                logger.error('Invalid end_game payload:', error);
            }
        }
    }
    function cancelEndQuiz() { setShowEndQuizConfirm(false); }

    // Socket and quiz state
    const [quizSocket, setQuizSocket] = useState<Socket | null>(null);
    const [quizState, setQuizState] = useState<any>(null);
    const [connectedCount, setConnectedCount] = useState(0);
    const [answerStats, setAnswerStats] = useState<Record<string, AnswerStats>>({});

    // Fetch game data
    useEffect(() => {
        if (authLoading || !isAuthenticated || !isTeacher) {
            logger.info('Waiting for authentication:', {
                authLoading,
                isAuthenticated,
                isTeacher,
                code,
                userState,
                userProfile
            });
            return;
        }
        if (!code) {
            logger.warn('No game code provided');
            setError('No game code provided');
            setLoading(false);
            return;
        }
        logger.info('Setting up socket connection for game code:', code);
        // Keep loading=true until socket data arrives
    }, [code, authLoading, isAuthenticated, isTeacher]);

    useEffect(() => {
        if (!isAuthenticated || !isTeacher || !code) {
            logger.debug('Skipping socket initialization - waiting for auth:', { isAuthenticated, isTeacher, hasCode: !!code });
            return;
        }
        logger.info('Initializing socket connection');
        // Attach JWT from sessionStorage to socket handshake for production auth
        const jwtToken = typeof window !== 'undefined' ? sessionStorage.getItem('mathquest_jwt_token') : null;
        const socket = io(SOCKET_CONFIG.url, {
            ...SOCKET_CONFIG,
            autoConnect: true,
            auth: jwtToken ? { token: jwtToken } : undefined,
        });
        socket.on(SOCKET_EVENTS.CONNECT, () => {
            logger.info('Socket connected:', socket.id);
            logger.info('Joining dashboard with accessCode:', code);
            const payload: JoinDashboardPayload = { accessCode: code };
            try {
                // joinDashboardPayloadSchema.parse(payload);
                socket.emit(SOCKET_EVENTS.TEACHER.JOIN_DASHBOARD, payload);
            } catch (error) {
                logger.error('Invalid join_dashboard payload:', error);
            }
            logger.info('📡 Dashboard attempting to join rooms via JOIN_DASHBOARD event');
        });
        socket.onAny((eventName, ...args) => {
            if (eventName !== 'timer_updated' && eventName !== 'dashboard_timer_updated') {
                logger.debug('Socket event:', eventName, ...args);
            }
        });
        // Listen for backend confirmation of showStats state (projection_show_stats is canonical)
        // Listen for backend-confirmed showStats state (projection_show_stats is canonical)
        socket.on(SOCKET_EVENTS.PROJECTOR.PROJECTION_SHOW_STATS, (payload: { show: boolean }) => {
            if (typeof payload?.show === 'boolean') {
                setShowStats(payload.show);
                logger.info('[DASHBOARD] Received showStats state from backend (projection_show_stats):', payload.show);
                // Only show snackbar if teacher initiated the toggle
                if (lastStatsToggleInitiatedByTeacher.current) {
                    setSnackbarMessage(payload.show ? 'Statistiques affichées' : 'Statistiques masquées');
                    setTimeout(() => setSnackbarMessage(null), 2500);
                    lastStatsToggleInitiatedByTeacher.current = false;
                }
                // Always set suppression flag for initial state
                if (!hasReceivedInitialStats.current) {
                    hasReceivedInitialStats.current = true;
                }
            }
        });
        // Listen for backend confirmation of showCorrectAnswers state (trophy)
        socket.on(SOCKET_EVENTS.TEACHER.SHOW_CORRECT_ANSWERS, (payload: ShowCorrectAnswersPayload) => {
            const parsed = showCorrectAnswersPayloadSchema.safeParse(payload);
            if (!parsed.success) {
                logger.error('Invalid SHOW_CORRECT_ANSWERS payload', parsed.error);
                return;
            }
            const { show, terminatedQuestions } = parsed.data;
            if (typeof show === 'boolean') {
                if (show) {
                    setShowTrophy(true);
                    logger.info('[DASHBOARD] Received showTrophy state from backend (show_correct_answers):', show);
                    setSnackbarMessage('Classement affiché');
                    setTimeout(() => setSnackbarMessage(null), 2500);
                    hasReceivedInitialTrophy.current = true;
                } else {
                    setShowTrophy(false);
                    logger.info('[DASHBOARD] Trophy reset to hidden by backend (show_correct_answers):', show);
                }
            }
            setQuizState((prev: any) => ({
                ...prev,
                terminatedQuestions
            }));
            logger.info('[DASHBOARD] Updated terminatedQuestions from SHOW_CORRECT_ANSWERS:', terminatedQuestions);
        });
        // Listen for initial showStats state from backend (toggle_projection_stats)
        socket.on(SOCKET_EVENTS.TEACHER.TOGGLE_PROJECTION_STATS, (payload: { show: boolean }) => {
            if (typeof payload?.show === 'boolean') {
                setShowStats(payload.show);
                logger.info('[DASHBOARD] Received initial showStats state from backend (toggle_projection_stats):', payload.show);
                // Set suppression flag so snackbar works on first user toggle
                hasReceivedInitialStats.current = true;
                // No snackbar here: only show snackbar on real-time toggle, not initial state
            }
        });
        socket.on(SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE, (state: any) => {
            // Validate and strongly type the payload
            const parsed = gameControlStatePayloadSchema.safeParse(state);
            if (!parsed.success) {
                logger.error('Invalid GAME_CONTROL_STATE payload', parsed.error);
                return;
            }
            const canonicalState: GameControlStatePayload = parsed.data;

            logger.info('Dashboard state received:', canonicalState);
            if (canonicalState.gameId) {
                logger.info(`📍 Dashboard should be listening for stats in room: dashboard_${canonicalState.gameId}`);
                logger.info(`📍 Alternative room format (if quiz mode): teacher_<userId>_${code}`);
                logger.info(`📍 Current accessCode: ${code}`);
            }
            // Modernization: Store both templateName and gameInstanceName for dashboard title
            if (canonicalState.templateName) {
                setQuizName(canonicalState.templateName);
            }
            if (canonicalState.gameInstanceName) {
                setGameInstanceName(canonicalState.gameInstanceName);
            }
            if (canonicalState.questions) {
                const processedQuestions = canonicalState.questions.map(mapToCanonicalQuestion);
                setQuestions(processedQuestions);
                logger.info('Questions loaded:', processedQuestions.length);
            }
            if (canonicalState.currentQuestionUid) {
                setQuestionActiveUid(canonicalState.currentQuestionUid);
                logger.info('Setting current question from initial state:', canonicalState.currentQuestionUid);
            }
            if (
                canonicalState.currentQuestionUid &&
                canonicalState.answerStats &&
                typeof canonicalState.answerStats === "object"
            ) {
                setAnswerStats(prev => ({
                    ...prev,
                    [String(canonicalState.currentQuestionUid)]: canonicalState.answerStats as Record<string, number>
                }));
                logger.info('✅ Loaded initial answer stats for question:', canonicalState.currentQuestionUid, canonicalState.answerStats);
            }
            let computedTimeLeftMs: number | undefined = undefined;
            if (canonicalState.timer) {
                logger.info('📡 Received initial timer state from backend:', canonicalState.timer);
                logger.info('📡 Backend should emit dashboard_timer_updated event separately');
                if (typeof canonicalState.timer.timerEndDateMs === 'number') {
                    computedTimeLeftMs = computeTimeLeftMs(canonicalState.timer.timerEndDateMs);
                }
            }
            setQuizState({ ...canonicalState, computedTimeLeftMs });
            setLoading(false);
        });
        socket.on('quiz_connected_count', (data: ConnectedCountPayload) => {
            // const validation = connectedCountPayloadSchema.safeParse(data);
            // if (!validation.success) {
            //     logger.error('quiz_connected_count validation failed:', validation.error);
            //     return;
            // }
            setConnectedCount(data.count);
        });
        socket.on(SOCKET_EVENTS.TEACHER.DASHBOARD_ANSWER_STATS_UPDATE, (payload: DashboardAnswerStatsUpdatePayload) => {
            logger.info('🎯 RECEIVED answer stats update:', payload);
            if (payload.stats && payload.questionUid) {
                setAnswerStats(prev => ({
                    ...prev,
                    [payload.questionUid]: payload.stats
                }));
                logger.info('✅ Answer stats updated for question:', payload.questionUid, payload.stats);
            }
        });
        socket.on(SOCKET_EVENTS.TEACHER.ANSWER_STATS_UPDATE, (payload: DashboardAnswerStatsUpdatePayload) => {
            logger.info('🎯 RECEIVED alternative answer stats update:', payload);
            if (payload.stats && payload.questionUid) {
                setAnswerStats(prev => ({
                    ...prev,
                    [payload.questionUid]: payload.stats
                }));
                logger.info('✅ Answer stats updated via alternative event:', payload.questionUid, payload.stats);
            }
        });
        const statsCheckInterval = setInterval(() => {
            logger.debug('📊 Current answer stats state:', answerStats);
            logger.debug('📊 Current gameId:', gameId);
            logger.debug('📊 Current questions:', questions.map(q => q.uid));
            logger.debug('📊 Socket connected:', socket.connected);
            if (gameId) {
                logger.debug(`📊 Expected dashboard room: dashboard_${gameId}`);
                logger.debug(`📊 Expected quiz mode room: teacher_<userId>_${code}`);
            }
            const hasAnyStats = Object.keys(answerStats).length > 0;
            logger.debug('📊 Has any answer stats:', hasAnyStats);
            if (!hasAnyStats && questions.length > 0) {
                logger.warn('⚠️ No answer stats received yet, but questions are loaded. Possible room mismatch?');
            }
        }, 10000);
        socket.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
            logger.error('Socket connection error:', error);
            setError('Failed to connect to game server');
            setLoading(false);
        });
        socket.on(SOCKET_EVENTS.TEACHER.ERROR_DASHBOARD, (error: any) => {
            // Log dashboard errors as warnings for user-triggered actions (not errors)
            logger.warn('Dashboard error:', error);
            // Always show user-facing dashboard errors as a snackbar (2s), never as a fatal error
            if (error && error.message) {
                setSnackbarMessage({ message: error.message, type: 'error' });
                setTimeout(() => setSnackbarMessage(null), 2000);
            } else if (error && typeof error === 'string') {
                setSnackbarMessage({ message: String(error), type: 'error' });
                setTimeout(() => setSnackbarMessage(null), 2000);
            } else {
                setSnackbarMessage({ message: 'Erreur inconnue du dashboard', type: 'error' });
                setTimeout(() => setSnackbarMessage(null), 2000);
            }
            // Do NOT setError or setLoading(false) for recoverable dashboard errors; keep loading and allow partial data.
        });
        setQuizSocket(socket);
        return () => {
            logger.info('Disconnecting socket');
            clearInterval(statsCheckInterval);
            socket.disconnect();
        };
    }, [isAuthenticated, isTeacher, code]);

    // --- Canonical timer state: use per-question timer state from useSimpleTimer ---
    const {
        getTimerState,
        timerStates,
        activeQuestionUid: timerActiveQuestionUid,
        startTimer,
        pauseTimer,
        stopTimer,
        editTimer,
        isConnected
    } = useSimpleTimer({
        role: 'teacher',
        accessCode: typeof code === 'string' ? code : '',
        socket: quizSocket
    });

    // Helper: get canonical timer state for a question
    // Always use the latest durationMs from the questions state for display and logic
    const getCanonicalTimerForQuestion = useCallback((questionUid: string) => {
        const timer = getTimerState(questionUid);
        const question = questions.find(q => q.uid === questionUid);
        return {
            ...timer,
            durationMs: question?.durationMs ?? timer?.durationMs ?? 0,
            questionUid,
            isActive: timer?.isActive ?? false,
            timeLeftMs: timer?.timeLeftMs ?? 0,
            status: timer?.status ?? 'stop',
        };
    }, [getTimerState, questions]);

    // Canonical: always use timer state from useSimpleTimer for timer display/actions
    const timerStatus = useMemo(() => {
        return timerActiveQuestionUid ? getCanonicalTimerForQuestion(timerActiveQuestionUid).status : 'stop';
    }, [timerActiveQuestionUid, getCanonicalTimerForQuestion]);

    const timerQuestionUid = useMemo(() => {
        return timerActiveQuestionUid;
    }, [timerActiveQuestionUid]);

    const timeLeftMs = useMemo(() => {
        return timerActiveQuestionUid ? getCanonicalTimerForQuestion(timerActiveQuestionUid).timeLeftMs : 0;
    }, [timerActiveQuestionUid, getCanonicalTimerForQuestion]);

    const timerDurationMs = useMemo(() => {
        return timerActiveQuestionUid ? getCanonicalTimerForQuestion(timerActiveQuestionUid).durationMs : 0;
    }, [timerActiveQuestionUid, getCanonicalTimerForQuestion]);

    // Ref for timer state (for play/confirm logic)
    const timerStateRef = useRef({
        status: timerStatus,
        questionUid: timerQuestionUid,
        timeLeftMs: timeLeftMs
    });
    useEffect(() => {
        timerStateRef.current = {
            status: timerStatus,
            questionUid: timerQuestionUid,
            timeLeftMs: timeLeftMs
        };
    }, [timerStatus, timerQuestionUid, timeLeftMs]);


    // --- Terminated Questions: from canonical quizState ---
    // Canonical: terminatedQuestions is a Record<string, boolean> in quizState (from backend)
    const terminatedQuestions: Record<string, boolean> = useMemo(() => {
        if (quizState && typeof quizState.terminatedQuestions === 'object' && quizState.terminatedQuestions !== null) {
            return quizState.terminatedQuestions;
        }
        return {};
    }, [quizState]);

    // Memoized stats calculation function
    const getStatsForQuestion = useCallback((uid: string) => {
        const stats = answerStats[uid];
        if (stats && typeof stats === 'object') {
            const question = questions.find(q => q.uid === uid);
            const numOptions = question?.answerOptions?.length || 0;
            if (numOptions === 0) return undefined;

            // Handle new polymorphic stats format with type discrimination
            let statsObj: Record<string, number>;
            if ('type' in stats && stats.type === 'multipleChoice') {
                // New format: { type: 'multipleChoice', stats: {...}, totalUsers: number }
                statsObj = stats.stats || {};
            } else {
                // Legacy format: plain object
                statsObj = stats as Record<string, number>;
            }

            const percentageArray: number[] = [];
            for (let i = 0; i < numOptions; i++) {
                const percentage = statsObj[i.toString()] || 0;
                percentageArray.push(percentage);
            }
            return percentageArray;
        }
        return undefined;
    }, [answerStats, questions]);

    const handleSelect = useCallback((uid: string) => {
        setQuestionActiveUid(uid);
    }, []);
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
    const handlePlay = useCallback((uid: string, _timeLeftMs: number) => {
        const currentTimerState = timerStateRef.current;
        const currentTimerStatus = currentTimerState.status;
        const currentTimerQuestionUid = currentTimerState.questionUid;
        // Always use the latest questions state from ref
        const latestQuestions = questionsRef.current;
        const playIdx = latestQuestions.findIndex(q => q.uid === uid);
        const isTerminated = playIdx !== -1 && quizState?.terminatedQuestions && quizState.terminatedQuestions[uid];
        // If clicking a finished question, show finished modal (takes precedence)
        if (isTerminated) {
            setPendingFinishedPlayIdx(playIdx);
            setShowFinishedModal(true);
            return;
        }
        // If another is running/paused, show confirm modal
        if ((currentTimerStatus === 'run' || currentTimerStatus === 'pause') && currentTimerQuestionUid !== uid) {
            if (playIdx !== -1) {
                setPendingPlayIdx(playIdx);
                setShowConfirm(true);
                return;
            }
        }
        handleSelect(uid);
        // Always use the latest durationMs from the latest questions state
        const q = latestQuestions.find(q => q.uid === uid);
        const intendedDurationMs = q?.durationMs ?? _timeLeftMs;
        logger.info('[DASHBOARD][PLAY] Emitting startTimer with teacher-intended durationMs', { uid, intendedDurationMs });
        startTimer(uid, intendedDurationMs);
    }, [startTimer, handleSelect, quizState]);
    // Confirm play for finished question (allow rerun)
    const confirmFinishedPlay = useCallback(() => {
        setShowFinishedModal(false);
        if (pendingFinishedPlayIdx !== null && questions[pendingFinishedPlayIdx]) {
            const question = questions[pendingFinishedPlayIdx];
            handleSelect(question.uid);
            // Rerun: start timer again for finished question
            logger.info('[DASHBOARD][RERUN FINISHED] Emitting startTimer for finished question', { uid: question.uid, durationMs: question.durationMs });
            startTimer(question.uid, question.durationMs);
        }
        setPendingFinishedPlayIdx(null);
    }, [pendingFinishedPlayIdx, questions, handleSelect, startTimer]);
    const cancelFinishedPlay = useCallback(() => {
        setShowFinishedModal(false);
        setPendingFinishedPlayIdx(null);
    }, []);
    const handlePause = useCallback(() => { pauseTimer(); }, [pauseTimer]);
    // Canonical: Resume should always use the latest edited duration if timer was edited while paused
    const handleResume = useCallback((uid: string) => {
        // Always use the latest questions state from ref
        const latestQuestions = questionsRef.current;
        const q = latestQuestions.find(q => q.uid === uid);
        const intendedDurationMs = q?.durationMs ?? 0;
        logger.info('[DASHBOARD][RESUME] Emitting startTimer (run) with teacher-intended durationMs after edit', { uid, intendedDurationMs });
        startTimer(uid, intendedDurationMs);
    }, [startTimer]);
    const handleStop = useCallback(() => { stopTimer(); }, [stopTimer]);
    const handleEditTimer = useCallback((uid: string, newTime: number) => {
        logger.info(`[DASHBOARD] handleEditTimer called`, { uid, newTime, unit: 'ms' });
        setQuestions(prevQs => {
            const updated = prevQs.map(q =>
                q.uid === uid ? { ...q, durationMs: newTime } : q
            );
            logger.info('[DEBUG] handleEditTimer: questions after edit', updated.map(q => ({ uid: (q as any).uid, durationMs: (q as any).durationMs })));
            return updated;
        });
        // Canonical: editTimer only takes (questionUid, durationMs)
        logger.info(`[DASHBOARD] Timer edit: canonical editTimer(uid, durationMs)`, { uid, durationMs: newTime });
        editTimer(uid, newTime);
        logger.info(`[DASHBOARD] Timer edit emitted for question ${uid}: ${newTime}ms`);
    }, [editTimer, timerStatus, timeLeftMs]);
    const handleTimerAction = useCallback((action: { status: 'run' | 'pause' | 'stop' | 'edit', questionUid: string, timeLeftMs: number, newTime?: number }) => {
        switch (action.status) {
            case 'run':
                startTimer(action.questionUid, action.timeLeftMs);
                break;
            case 'pause':
                pauseTimer();
                break;
            case 'stop':
                stopTimer();
                break;
            case 'edit': {
                logger.info(`[DASHBOARD] handleEditTimer (via handleTimerAction) called`, { uid: action.questionUid, newTime: action.newTime, unit: 'ms' });
                const editMs = typeof action.newTime === 'number' ? action.newTime : action.timeLeftMs;
                // Canonical: editTimer only takes (questionUid, durationMs)
                logger.info(`[DASHBOARD] Timer edit: canonical editTimer(uid, durationMs)`, { uid: action.questionUid, durationMs: editMs });
                editTimer(action.questionUid, editMs);
                logger.info(`[DASHBOARD] Timer edit emitted for question ${action.questionUid}: ${editMs}ms`);
                break;
            }
        }
    }, [startTimer, pauseTimer, stopTimer, editTimer, timerStatus, timeLeftMs]);
    const handleReorder = useCallback((newQuestions: Question[]) => {
        setQuestions(newQuestions);
    }, []);
    const confirmPlay = useCallback(() => {
        setShowConfirm(false);
        if (pendingPlayIdx !== null && questions[pendingPlayIdx]) {
            const question = questions[pendingPlayIdx];
            handleSelect(question.uid);
            stopTimer();
            // Always use the teacher's intended durationMs from the UI/question object
            logger.info('[DASHBOARD][CONFIRM PLAY] Emitting startTimer with teacher-intended durationMs', { uid: question.uid, intendedDurationMs: question.durationMs });
            startTimer(question.uid, question.durationMs);
        }
        setPendingPlayIdx(null);
    }, [pendingPlayIdx, questions, handleSelect, stopTimer, startTimer]);
    const cancelPlay = useCallback(() => {
        setShowConfirm(false);
        setPendingPlayIdx(null);
    }, []);
    const handleShowResults = useCallback((questionUid: string) => {
        if (!quizSocket) return;
        const payload = {
            accessCode: code,
            gameId,
            questionUid,
            teacherId: userProfile?.userId
        };
        quizSocket.emit(SOCKET_EVENTS.TEACHER.SHOW_CORRECT_ANSWERS, payload);
        setTimeout(() => {
            setSnackbarMessage(`Affichage des bonnes réponses pour la question ${questionUid}`);
        }, 0);
    }, [quizSocket, code, gameId, userProfile?.userId]);
    // Remove handleStatsToggle, replace with global version
    const handleStatsToggleGlobal = useCallback(() => {
        if (!quizSocket) return;
        // Mark that the next stats toggle is teacher-initiated
        lastStatsToggleInitiatedByTeacher.current = true;
        const payload = {
            accessCode: code,
            gameId,
            show: !showStats, // request the opposite of current state
            teacherId: userProfile?.userId
        };
        quizSocket.emit(SOCKET_EVENTS.TEACHER.TOGGLE_PROJECTION_STATS, payload);
        // No snackbar here: only show snackbar on backend confirmation
    }, [quizSocket, code, gameId, userProfile?.userId, showStats]);

    // Trophy button logic (no questionUid)
    // Only allow toggling ON; cannot be toggled off by teacher
    const handleTrophyGlobal = useCallback(() => {
        if (!quizSocket || showTrophy) return; // Prevent toggling off
        // Request leaderboard and correct answers, but do NOT update local state or snackbar here
        const revealLeaderboardPayload = { accessCode: code };
        quizSocket.emit(SOCKET_EVENTS.TEACHER.REVEAL_LEADERBOARD, revealLeaderboardPayload);
        quizSocket.emit(SOCKET_EVENTS.TEACHER.SHOW_CORRECT_ANSWERS, { accessCode: code, gameId, teacherId: userProfile?.userId });
        // No snackbar here: only show snackbar on backend confirmation
    }, [quizSocket, code, gameId, userProfile?.userId, showTrophy]);
    // Reset trophy when question changes
    useEffect(() => {
        setShowTrophy(false);
    }, [questionActiveUid]);

    // Memoize frequently changing props to prevent unnecessary re-renders
    const isDisabled = useMemo(() => {
        return !quizSocket || !quizSocket.connected || quizState?.ended;
    }, [quizSocket?.connected, quizState?.ended]);

    // Fetch quiz/activity name from API for reliability
    // Remove legacy fetchQuizName effect: all naming now comes from socket payload

    if (authLoading) return <LoadingScreen message="Vérification de l'authentification..." />;
    if (loading) return <LoadingScreen message="Chargement du tableau de bord..." />;
    if (error) return <div className="p-8 text-red-600">Erreur: {error}</div>;
    if (!code) return <div className="p-8 text-orange-600">Aucun code d'accès fourni.</div>;

    // Add a projection page URL for the current code
    const projectionUrl = `/teacher/projection/${code}`;
    return (
        <div className="teacher-content">
            {/* Header */}
            <div className="bg-background border-b border-[color:var(--border)] px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto py-4 sm:py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                                <span className="text-lg sm:text-xl font-semibold text-foreground align-middle">{quizName || '...'}</span>
                                {gameInstanceName && (
                                    <span className="ml-2 text-base font-normal text-muted-foreground">— <span className="italic">{gameInstanceName}</span></span>
                                )}
                            </h1>
                            {/* Projection page link */}
                            <a
                                href={projectionUrl}
                                className="text-blue-600 underline text-sm mt-1 inline-block"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Afficher la page de projection
                            </a>
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                                <UsersRound className="w-4 h-4" />
                                {connectedCount} participant{connectedCount <= 1 ? '' : 's'} connecté{connectedCount <= 1 ? '' : 's'}
                            </p>
                        </div>
                        <div className="hidden sm:block">
                            <button
                                className="btn btn-secondary flex items-center gap-2 whitespace-nowrap"
                                onClick={handleEndQuiz}
                                disabled={isDisabled}
                            >
                                {quizState?.ended ? 'Quiz Terminé' : 'Clôturer'}
                            </button>
                        </div>
                    </div>
                    {/* Mobile end quiz button */}
                    <div className="sm:hidden mt-4 flex justify-end">
                        <button
                            className="btn btn-secondary flex items-center justify-center gap-2"
                            onClick={handleEndQuiz}
                            disabled={isDisabled}
                        >
                            {quizState?.ended ? 'Quiz Terminé' : 'Clôturer'}
                        </button>
                    </div>
                </div>
            </div>
            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {loading && (
                    <div className="flex flex-col items-center justify-center py-16">
                        <InfinitySpin size={48} />
                        <p className="text-muted-foreground mt-4">Chargement du tableau de bord...</p>
                    </div>
                )}
                {/* Questions Section */}
                {!loading && (
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold">Questions</h2>
                            {/* Minimalist Stats + Trophy block */}
                            <div className="flex items-center gap-3 ml-auto">
                                {/* Stats Toggle Button */}
                                <button
                                    className={`group p-2 rounded transition-colors border-2
                                        ${showStats
                                            ? 'bg-[color:var(--primary)] text-white border-[color:var(--primary)]'
                                            : 'border-[color:var(--primary)] text-[color:var(--primary)] hover:bg-[color:var(--primary)] hover:bg-opacity-10 hover:text-white'}
                                        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={handleStatsToggleGlobal}
                                    disabled={isDisabled}
                                    aria-pressed={showStats}
                                    title="Afficher/Masquer les statistiques globales"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-6 h-6 transition-all duration-200 group-hover:stroke-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <rect x="3" y="10" width="4" height="11" rx="1" />
                                        <rect x="9.5" y="3" width="4" height="18" rx="1" />
                                        <rect x="16" y="14" width="4" height="7" rx="1" />
                                    </svg>
                                </button>
                                {/* Trophy Toggle Button */}
                                <button
                                    className={`group p-2 rounded transition-colors border-2
                                        ${showTrophy
                                            ? 'bg-[color:var(--primary)] text-white border-[color:var(--primary)]'
                                            : 'border-[color:var(--primary)] text-[color:var(--primary)] hover:bg-[color:var(--primary)] hover:bg-opacity-10 hover:text-white'}
                                        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => {
                                        handleTrophyGlobal();
                                        // Do not update local state here; wait for backend confirmation
                                    }}
                                    disabled={isDisabled}
                                    aria-pressed={showTrophy}
                                    title="Afficher/Masquer le classement final et les bonnes réponses"
                                >
                                    <Trophy className="w-6 h-6 transition-all duration-200"
                                        strokeWidth={2}
                                    />
                                </button>
                                {loading && <InfinitySpin size={32} />}
                            </div>
                        </div>
                        <DraggableQuestionsList
                            quizId={code}
                            currentTournamentCode={gameId}
                            quizSocket={quizSocket}
                            questions={questions}
                            currentQuestionIdx={quizState?.currentQuestionidx}
                            isChronoRunning={quizState?.chrono?.running}
                            isQuizEnded={quizState?.ended}
                            questionActiveUid={questionActiveUid}
                            onSelect={handleSelect}
                            onPlay={handlePlay}
                            onPause={handlePause}
                            onResume={handleResume}
                            onStop={handleStop}
                            onEditTimer={handleEditTimer}
                            onReorder={handleReorder}
                            timerStatus={timerStatus}
                            timerQuestionUid={timerQuestionUid}
                            timeLeftMs={timeLeftMs}
                            timerDurationMs={timerDurationMs}
                            onTimerAction={handleTimerAction}
                            disabled={isDisabled}
                            expandedUids={expandedUids}
                            onToggleExpand={handleToggleExpand}
                            getStatsForQuestion={getStatsForQuestion}
                            getTimerState={getCanonicalTimerForQuestion}
                            // Pass terminatedQuestions to DraggableQuestionsList
                            terminatedQuestions={terminatedQuestions}
                            // NEW: Teacher dashboard behavior
                            hideExplanation={true}
                            keepTitleWhenExpanded={true}
                        />
                    </section>
                )}
            </div>
            {/* Confirmation Dialog for Question Change */}
            <InfoModal
                isOpen={showConfirm}
                onClose={cancelPlay}
                title="Changer de question ?"
                size="sm"
                showCloseButton={true}
            >
                <div className="mb-6 text-base">
                    Une autre question est en cours ou en pause. Voulez-vous vraiment lancer cette nouvelle question et arrêter la précédente ?
                </div>
                <div className="flex justify-end gap-3 mt-4">
                    <button
                        type="button"
                        className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                        onClick={cancelPlay}
                    >
                        Non
                    </button>
                    <button
                        type="button"
                        className="px-4 py-2 rounded-lg text-white transition disabled:opacity-50 bg-red-600 hover:bg-red-700 font-bold"
                        onClick={confirmPlay}
                    >
                        Oui
                    </button>
                </div>
            </InfoModal>
            {/* Confirmation Dialog for Finished Question (takes precedence) */}
            <InfoModal
                isOpen={showFinishedModal}
                onClose={cancelFinishedPlay}
                title="Relancer la question terminée ?"
                size="sm"
                showCloseButton={true}
            >
                <div className="mb-6 text-base">
                    Attention, cette question est terminée, vous avez déjà communiqué les résultats ! Voulez-vous vraiment la relancer ?
                </div>
                <div className="flex justify-end gap-3 mt-4">
                    <button
                        type="button"
                        className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                        onClick={cancelFinishedPlay}
                    >
                        Non
                    </button>
                    <button
                        type="button"
                        className="px-4 py-2 rounded-lg text-white transition disabled:opacity-50 bg-red-600 hover:bg-red-700 font-bold"
                        onClick={confirmFinishedPlay}
                    >
                        Oui
                    </button>
                </div>
            </InfoModal>
            {/* Confirmation Dialog for End Quiz */}
            <InfoModal
                isOpen={showEndQuizConfirm}
                onClose={cancelEndQuiz}
                title="Clôturer le quiz ?"
                size="sm"
                showCloseButton={true}
            >
                <div className="mb-6 text-base">
                    Êtes-vous sûr de vouloir clôturer ce quiz ? Cette action est irréversible.
                </div>
                <div className="flex justify-end gap-3 mt-4">
                    <button
                        type="button"
                        className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                        onClick={cancelEndQuiz}
                    >
                        Non
                    </button>
                    <button
                        type="button"
                        className="px-4 py-2 rounded-lg text-white transition disabled:opacity-50 bg-red-600 hover:bg-red-700 font-bold"
                        onClick={confirmEndQuiz}
                    >
                        Oui
                    </button>
                </div>
            </InfoModal>
            {/* Snackbar */}
            {/* Snackbar: now supports error type for red background */}
            {snackbarMessage && typeof snackbarMessage === 'object' && 'message' in snackbarMessage ? (
                <Snackbar
                    open={!!snackbarMessage}
                    message={snackbarMessage.message}
                    type={snackbarMessage.type}
                    onClose={() => setSnackbarMessage(null)}
                />
            ) : snackbarMessage && typeof snackbarMessage === 'string' ? (
                <Snackbar
                    open={!!snackbarMessage}
                    message={snackbarMessage}
                    type="success"
                    onClose={() => setSnackbarMessage(null)}
                />
            ) : null}
        </div>
    );
}
