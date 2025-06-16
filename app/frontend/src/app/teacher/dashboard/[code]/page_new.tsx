/**
 * Teacher Dashboard Page - Clean Rewrite
 * 
 * Simple, working dashboard using patterns from other pages that work.
 */

"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import DraggableQuestionsList from "@/components/DraggableQuestionsList";
import ConfirmDialog from "@/components/ConfirmDialog";
import { createLogger } from '@/clientLogger';
import { useSimpleTimer } from '@/hooks/useSimpleTimer';
import { UsersRound } from "lucide-react";
import { makeApiRequest } from '@/config/api';
import { type Question } from '@/types/api';
import InfinitySpin from '@/components/InfinitySpin';
import { QUESTION_TYPES } from '@shared/types';
import { io, Socket } from 'socket.io-client';

const logger = createLogger('TeacherDashboard');

function mapToCanonicalQuestion(q: any): Question {
    const questionData = q.question || q;
    const answerOptions = questionData.answerOptions || [];
    const correctAnswers = questionData.correctAnswers || [];
    const timeLimit = questionData.timeLimit ?? q.timeLimit ?? 60;

    return {
        ...q,
        text: questionData.text || q.text,
        uid: questionData.uid || q.uid,
        answerOptions,
        correctAnswers,
        timeLimit,
        defaultMode: q.questionType || questionData.questionType || QUESTION_TYPES.SINGLE_CHOICE,
        feedbackWaitTime: questionData.feedbackWaitTime ?? q.feedbackWaitTime ?? 3000
    };
}

export default function TeacherDashboardPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = React.use(params);

    // Basic state
    const [questions, setQuestions] = useState<Question[]>([]);
    const [quizName, setQuizName] = useState<string>("");
    const [gameId, setGameId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // UI state
    const [questionActiveUid, setQuestionActiveUid] = useState<string | null>(null);
    const [expandedUids, setExpandedUids] = useState<Set<string>>(new Set());
    const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

    // Confirmation dialogs
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingPlayIdx, setPendingPlayIdx] = useState<number | null>(null);
    const [showEndQuizConfirm, setShowEndQuizConfirm] = useState(false);

    // Socket and quiz state
    const [quizSocket, setQuizSocket] = useState<Socket | null>(null);
    const [quizState, setQuizState] = useState<any>(null);
    const [connectedCount, setConnectedCount] = useState(0);

    // Get auth token
    const getAuthToken = () => {
        if (typeof window === 'undefined') return null;

        const localStorageToken = localStorage.getItem('mathquest_jwt_token');
        if (localStorageToken) return localStorageToken;

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

    // Fetch game data
    useEffect(() => {
        if (!code || !token) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                logger.info('Fetching game data for code:', code);

                // Get game instance
                const gameData = await makeApiRequest<{ gameInstance: { id: string, name: string, gameTemplateId: string } }>(`games/${code}`);
                const gameInstance = gameData.gameInstance;

                setGameId(gameInstance.id);
                setQuizName(gameInstance.name || "Quiz");
                logger.info('Game instance resolved:', { gameId: gameInstance.id, name: gameInstance.name });

                // Get questions
                const templateData = await makeApiRequest<{ gameTemplate: { questions: any[] } }>(`game-templates/${gameInstance.gameTemplateId}`);
                const processedQuestions = templateData.gameTemplate.questions.map(mapToCanonicalQuestion);

                setQuestions(processedQuestions);
                logger.info('Questions loaded:', processedQuestions.length);

            } catch (err) {
                logger.error('Error fetching data:', err);
                setError((err as Error).message || "Error loading dashboard");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [code, token]);

    // Initialize socket
    useEffect(() => {
        if (!token || !gameId) return;

        logger.info('Initializing socket connection');

        const socketUrl = process.env.NODE_ENV === 'production'
            ? 'https://mathquest-backend.onrender.com'
            : 'http://localhost:3001';

        const socket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
            logger.info('Socket connected:', socket.id);
            socket.emit('join_quiz', { accessCode: code, gameId });
        });

        socket.on('game_control_state', (state: any) => {
            logger.info('Game control state received:', state);
            setQuizState(state);
        });

        socket.on('connected_count_update', (count: number) => {
            setConnectedCount(count);
        });

        socket.on('connect_error', (error) => {
            logger.error('Socket connection error:', error);
        });

        setQuizSocket(socket);

        return () => {
            logger.info('Disconnecting socket');
            socket.disconnect();
        };
    }, [token, gameId, code]);

    // Simple timer hook
    const {
        status: timerStatus,
        questionUid: timerQuestionUid,
        timeLeftMs,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer
    } = useSimpleTimer({
        role: 'teacher',
        gameId: gameId || '',
        accessCode: code || '',
        socket: quizSocket
    });

    // Sync active question with timer
    useEffect(() => {
        if (timerQuestionUid) {
            setQuestionActiveUid(timerQuestionUid);
        }
    }, [timerQuestionUid]);

    // Mapped questions for DraggableQuestionsList
    const mappedQuestions = useMemo(() => {
        return questions.map(mapToCanonicalQuestion);
    }, [questions]);

    // Event handlers
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

    const handlePlay = useCallback((uid: string, startTime: number) => {
        const question = questions.find(q => q.uid === uid);
        if (!question) return;

        // If same question is active, toggle play/pause
        if (timerQuestionUid === uid) {
            if (timerStatus === 'play') {
                pauseTimer();
                return;
            }
            if (timerStatus === 'pause') {
                resumeTimer();
                return;
            }
        }

        // If different question is running, show confirmation
        if (timerQuestionUid && timerQuestionUid !== uid && (timerStatus === 'play' || timerStatus === 'pause')) {
            setPendingPlayIdx(questions.findIndex(q => q.uid === uid));
            setShowConfirm(true);
            return;
        }

        // Start new timer
        const durationMs = (question.timeLimit || 60) * 1000;
        startTimer(uid, durationMs);
    }, [questions, timerQuestionUid, timerStatus, startTimer, pauseTimer, resumeTimer]);

    const handlePause = useCallback(() => {
        pauseTimer();
    }, [pauseTimer]);

    const handleStop = useCallback(() => {
        stopTimer();
    }, [stopTimer]);

    const handleEditTimer = useCallback((uid: string, newTime: number) => {
        setQuestions(prev => prev.map(q =>
            q.uid === uid ? { ...q, timeLimit: newTime } : q
        ));

        // If this is the active paused timer, restart with new duration
        if (timerQuestionUid === uid && timerStatus === 'pause') {
            startTimer(uid, newTime * 1000);
        }
    }, [timerQuestionUid, timerStatus, startTimer]);

    const handleTimerAction = useCallback((action: { status: 'play' | 'pause' | 'stop', questionUid: string, timeLeftMs: number }) => {
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

    const handleReorder = useCallback((newQuestions: Question[]) => {
        setQuestions(newQuestions);
    }, []);

    // Confirmation handlers
    const confirmPlay = () => {
        setShowConfirm(false);
        if (pendingPlayIdx !== null && questions[pendingPlayIdx]) {
            const question = questions[pendingPlayIdx];
            stopTimer(); // Stop current timer
            startTimer(question.uid, (question.timeLimit || 60) * 1000); // Start new timer
        }
        setPendingPlayIdx(null);
    };

    const cancelPlay = () => {
        setShowConfirm(false);
        setPendingPlayIdx(null);
    };

    // End quiz handlers
    const handleEndQuiz = () => {
        setShowEndQuizConfirm(true);
    };

    const confirmEndQuiz = () => {
        setShowEndQuizConfirm(false);
        if (quizSocket && gameId) {
            quizSocket.emit('end_quiz', { gameId });
        }
    };

    const cancelEndQuiz = () => {
        setShowEndQuizConfirm(false);
    };

    // Render loading/error states
    if (loading) return <div className="p-8">Chargement du tableau de bord...</div>;
    if (error) return <div className="p-8 text-red-600">Erreur: {error}</div>;
    if (!code) return <div className="p-8 text-orange-600">Aucun code d'accès fourni.</div>;

    // Check if disabled
    const isDisabled = !quizSocket || !quizSocket.connected || quizState?.ended;

    return (
        <div className="main-content">
            <div className="card w-full max-w-4xl shadow-xl bg-base-100 m-4 my-6">
                <div className="flex flex-col gap-8">
                    <div className="card-body flex-1 flex flex-col gap-8 min-h-0 overflow-y-auto w-full p-0">

                        {/* Header */}
                        <div className="flex flex-row items-center justify-between mb-2 gap-2">
                            <h1 className="card-title text-3xl">Tableau de bord – {quizName}</h1>
                            <button
                                className="btn btn-secondary"
                                onClick={handleEndQuiz}
                                disabled={isDisabled}
                            >
                                {quizState?.ended ? 'Quiz Terminé' : 'Terminer le quiz'}
                            </button>
                        </div>

                        {/* Connection info */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                            <div className="flex items-center gap-2 ml-auto text-base-content/80">
                                <UsersRound className="w-6 h-6" />
                                <span className="font-semibold">{connectedCount}</span>
                            </div>
                        </div>

                        {/* Questions */}
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
                                onReorder={handleReorder}
                                quizId={gameId || ''}
                                currentTournamentCode={code || ''}
                                onTimerAction={handleTimerAction}
                                disabled={isDisabled}
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
                message="Une autre question est en cours ou en pause. Voulez-vous vraiment lancer cette nouvelle question et arrêter la précédente ?"
                onConfirm={confirmPlay}
                onCancel={cancelPlay}
            />

            <ConfirmDialog
                open={showEndQuizConfirm}
                title="Terminer le quiz ?"
                message="Êtes-vous sûr de vouloir terminer ce quiz ? Cette action est irréversible."
                onConfirm={confirmEndQuiz}
                onCancel={cancelEndQuiz}
            />

            {/* Snackbar */}
            {snackbarMessage && (
                <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded shadow-lg">
                    {snackbarMessage}
                </div>
            )}
        </div>
    );
}
