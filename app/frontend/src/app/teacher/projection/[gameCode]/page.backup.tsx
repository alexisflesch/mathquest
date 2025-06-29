/**
 * Teacher Projection Page Component
 *
 * This page provides a full-screen projection view for teachers to display
 * quiz content on a larger screen (projector, interactive whiteboard, etc.)
 * Features:
 * - Draggable and resizable components
 * - Real-time updates via socket connection
 * - Same authentication as the dashboard
 * - Components can be arranged freely and can overlap
 */

"use client";

import React, { useEffect, useState, useRef } from "react";
import { Layout, Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "@/app/globals.css";
import { createLogger } from '@/clientLogger';
import { useProjectionQuizSocket } from '@/hooks/useProjectionQuizSocket';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import QuestionCard from '@/components/QuestionCard';
import { Timer } from 'lucide-react';
import QRCode from 'react-qr-code';
import ClassementPodium from '@/components/ClassementPodium';
import ZoomControls from '@/components/ZoomControls';
import type { QuizQuestion, TournamentQuestion } from '@shared/types';
import type { QuestionData } from '@shared/types/socketEvents';
import type { QuizState } from '@/hooks/useTeacherQuizSocket';
import { QUESTION_TYPES } from '@shared/types';

const ResponsiveGridLayout = WidthProvider(Responsive);
const logger = createLogger('ProjectionPage');

// Helper function to format timer display
function formatTimer(val: number | null) {
    if (val === null) return '-';
    if (val >= 60) {
        const m = Math.floor(val / 60);
        const s = val % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }
    return val.toString();
}

// Helper function to convert milliseconds to seconds for timer display
function formatTimerMs(timeLeftMs: number | null) {
    if (timeLeftMs === null || timeLeftMs === undefined) return '-';
    const seconds = Math.ceil(timeLeftMs / 1000); // Convert ms to seconds, round up
    return formatTimer(seconds);
}

import { SOCKET_EVENTS } from '@shared/types/socket/events';

export default function ProjectionPage() {
    const params = useParams();
    const gameCode = typeof params.gameCode === 'string' ? params.gameCode : Array.isArray(params.gameCode) ? params.gameCode[0] : '';
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentTournamentCode, setCurrentTournamentCode] = useState<string | null>(gameCode);
    const [baseUrl, setBaseUrl] = useState<string>("");
    const [zoomFactors, setZoomFactors] = useState({
        question: 1,
        classement: 1,
    });

    // --- Listen for leaderboard/correct answer updates ---
    // Note: leaderboard now comes from hookLeaderboard via useProjectionQuizSocket
    const [correctAnswers, setCorrectAnswers] = useState<boolean[]>([]);

    // --- Stats state ---
    type StatsData = { stats: number[]; totalAnswers: number };
    const [questionStats, setQuestionStats] = useState<Record<string, StatsData>>({});
    const [localShowStats, setLocalShowStats] = useState<Record<string, boolean>>({});

    // State for gameId (fetched from gameCode)
    const [gameId, setGameId] = useState<string | null>(null);

    // Fetch gameId from gameCode
    useEffect(() => {
        const fetchGameId = async () => {
            try {
                setLoading(true);
                setError(null);
                logger.info('Fetching game details for access code:', gameCode);

                const response = await fetch(`/api/games/access-code/${gameCode}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch game details');
                }

                if (!data.gameInstance || !data.gameInstance.id) {
                    throw new Error('Invalid game instance data received');
                }

                logger.info('Game details fetched successfully:', {
                    gameId: data.gameInstance.id,
                    accessCode: data.gameInstance.accessCode,
                    status: data.gameInstance.status
                });

                setGameId(data.gameInstance.id);
            } catch (error: any) {
                logger.error('Failed to fetch game details:', error.message);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        if (gameCode && !gameId) {
            fetchGameId();
        }
    }, [gameCode, gameId]);

    // Only initialize socket connection once we have gameId
    const {
        socket,
        gameState,
        currentQuestion: socketCurrentQuestion,
        currentQuestionUid: hookCurrentQuestionUid,
        timerStatus,
        timerQuestionUid,
        timeLeftMs,
        connectedCount,
        gameStatus,
        isAnswersLocked,
        leaderboard: hookLeaderboard,
        // NEW: Projection display state
        showStats,
        currentStats,
        showCorrectAnswers,
        correctAnswersData
    } = useProjectionQuizSocket(gameCode, gameId); // Pass both gameCode and gameId

    // NEW: Connect projection display state to QuestionCard props  
    // Convert currentStats format from {0: 25, 1: 50, 2: 15, 3: 10} to StatsData format
    const statsToShow: StatsData = {
        stats: Object.values(currentStats), // Convert object values to array
        totalAnswers: Object.values(currentStats).reduce((sum, count) => sum + count, 0)
    };
    const showStatsFlag = showStats; // From useProjectionQuizSocket hook

    // Debug what we're getting from the hook
    useEffect(() => {
        logger.debug('🔍 Projection page state check:', {
            hasGameState: !!gameState,
            gameState: gameState ? {
                gameId: gameState.gameId,
                status: gameState.status,
                questionUids: gameState.questionUids,
                // timerQuestionUid: gameState.timer?.questionUid // Removed: use canonical timer only
            } : null,
            gameStatus,
            connectedCount,
            // NEW: Log projection display state
            showStats,
            showCorrectAnswers,
            hasCurrentStats: Object.keys(currentStats).length > 0,
            hasCorrectAnswersData: !!correctAnswersData?.questionUid
        });
    }, [gameState, gameStatus, connectedCount, showStats, showCorrectAnswers, currentStats, correctAnswersData]);



    // Debug leaderboard updates from hook
    useEffect(() => {
        logger.info('🏆 [Projection] Leaderboard updated from hook:', {
            leaderboardLength: hookLeaderboard.length,
            leaderboard: hookLeaderboard,
            gameCode,
            gameId
        });
    }, [hookLeaderboard, gameCode, gameId]);

    // Extract tournament code from game state when available
    useEffect(() => {
        if (gameState && (gameState.accessCode || gameState.gameId) && !currentTournamentCode) {
            const code = gameState.accessCode || gameState.gameId;
            logger.info('Setting tournament code from game state:', code);
            if (code) {
                setCurrentTournamentCode(code);
            }
        }
    }, [gameState, currentTournamentCode]);

    // Move this function here, after setCorrectAnswers is defined:
    const debugSetCorrectAnswers = (val: boolean[], reason: string) => {
        logger.debug(`[Projection] setCorrectAnswers called`, { val, reason });
        setCorrectAnswers(val);
    };

    // Clear correctAnswers when a new question is set
    const lastQuestionIdRef = useRef<string | null>(null);
    useEffect(() => {
        if (!gameState || !timerQuestionUid) return;
        if (lastQuestionIdRef.current !== timerQuestionUid) {
            debugSetCorrectAnswers([], 'new question');
            lastQuestionIdRef.current = timerQuestionUid;
        }
    }, [gameState, timerQuestionUid]);

    // --- Patch: Ensure timer is set to 0 and countdown is stopped when quiz is stopped ---
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
        // Always clear any running timer interval when timer is stopped or at zero
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, [timerStatus, timeLeftMs]);

    // --- Force timer to zero if stopped, even if timeLeftMs is not zero ---
    useEffect(() => {
        if (timerStatus === 'stop' && timeLeftMs !== 0) {
            logger.debug('[Projection] Forcing timeLeftMs to 0 because timerStatus is stop. Previous value:', timeLeftMs);
            // Note: We don't have setLocalTimeLeft, we rely on socket updates
        }
    }, [timerStatus, timeLeftMs]);

    // Log every timer update for debugging the blinking effect
    useEffect(() => {
        logger.debug('[Projection] Timer display update:', {
            timerStatus,
            timeLeftMs,
        });
    }, [timerStatus, timeLeftMs]);

    // Set the base URL for QR code generation
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const protocol = window.location.protocol;
            const host = window.location.host;
            setBaseUrl(`${protocol}//${host}`);
        }
    }, []);

    // Grid layout state with QR code, question, timer, et classement
    const [layout, setLayout] = useState<Layout[]>([
        { i: "live-timer", x: 0, y: 0, w: 6, h: 4, static: false },
        { i: "question", x: 12, y: 0, w: 16, h: 24, static: false },
        { i: "qrcode", x: 0, y: 6, w: 10, h: 10, static: false },
        { i: "classement", x: 30, y: 2, w: 18, h: 22, static: false }, // Ajout classement
    ]);

    // Z-index management for component stacking order
    const [zIndexes, setZIndexes] = useState({
        "live-timer": 1,
        question: 2,
        qrcode: 3,
        classement: 4 // Ajout classement
    });
    const [highestZ, setHighestZ] = useState(4);
    const gridRef = useRef(null);

    // State pour forcer le re-rendu du podium et relancer l'animation
    const [podiumKey, setPodiumKey] = useState(0);
    const [questionKey, setQuestionKey] = useState(0); // Ajout d'une clé pour la question

    // State vars for QuestionCard - won't be used for interaction but needed for props
    // const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    // const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);

    // Teacher authentication check
    const { userState, userProfile, isLoading: authLoading } = useAuth();

    useEffect(() => {
        const checkTeacherAuth = async () => {
            setLoading(true);
            setError(null);

            // Check if user is authenticated as teacher using new auth system
            if (authLoading) {
                // Wait for auth to load
                return;
            }

            if (userState !== 'teacher') {
                logger.warn('User is not a teacher, redirecting to login');
                router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
                return;
            }

            if (!userProfile.userId) {
                logger.warn('No teacher ID found in userProfile, redirecting to login');
                router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
                return;
            }

            // The projection page connects directly to an existing game instance
            // No need to fetch quiz data or generate tournament codes
            setLoading(false);
            logger.info('Teacher authentication passed for projection view of game:', gameCode);
        };

        checkTeacherAuth();
    }, [gameCode, router, userState, userProfile, authLoading]);

    // Handle bringing a component to the front when interacted with
    const bringToFront = (id: string) => {
        logger.debug(`Bringing component to front: ${id}`);
        setHighestZ(prev => prev + 1);
        setZIndexes(prev => ({
            ...prev,
            [id]: highestZ + 1
        }));
    };

    // Handle zoom changes avec mise à jour des clés de montage
    const handleZoom = (id: string, direction: 'in' | 'out') => {
        setZoomFactors(prev => {
            // Check if the id is a valid key before proceeding
            if (!(id in prev)) return prev;
            const currentZoom = prev[id as keyof typeof prev] || 1;
            let newZoom;
            if (direction === 'in') {
                newZoom = Math.min(currentZoom + 0.1, 3); // Max zoom 300%
            } else {
                newZoom = Math.max(currentZoom - 0.1, 0.5); // Min zoom 50%
            }
            newZoom = Math.max(0.1, newZoom);

            // Force remounting the component when zoom changes
            if (id === 'question') {
                setQuestionKey(k => k + 1);
            } else if (id === 'classement') {
                setPodiumKey(k => k + 1);
            }

            return { ...prev, [id]: newZoom };
        });
    };

    // Format timer display
    // const formatTime = (seconds: number | null): string => { ... };

    // Get current question from game state
    const getCurrentQuestion = (): QuestionData | null => {
        if (!gameState || !timerQuestionUid) {
            logger.debug('🔍 [getCurrentQuestion] No question available:', {
                hasGameState: !!gameState,
                timerQuestionUid,
                gameStateQuestionData: gameState?.questionData
            });
            return null;
        }
        // In canonical GameState, the current question data is stored in questionData
        // Only return it if it matches the timer's current questionUid
        if (gameState.questionData && gameState.questionData.uid === timerQuestionUid) {
            logger.debug('✅ [getCurrentQuestion] Found matching question:', {
                questionUid: gameState.questionData.uid,
                timerQuestionUid
            });
            return gameState.questionData as QuestionData;
        }

        logger.debug('❌ [getCurrentQuestion] Question UID mismatch:', {
            gameStateQuestionUid: gameState.questionData?.uid,
            timerQuestionUid,
            hasQuestionData: !!gameState.questionData
        });
        return null;
    };

    // Empty handler functions (needed for props but won't be used because of readonly mode)
    const noopHandler = () => { };
    const noopSetState = () => { };

    // Données fictives pour le classement (à remplacer par les vraies données plus tard)
    // const fakeTop3 = [...];
    // const fakeOthers = [...];

    const currentQuestion = getCurrentQuestion();
    const currentTournamentQuestion: TournamentQuestion | null = currentQuestion
        ? { question: currentQuestion }
        : null;
    const currentQuestionUid = currentQuestion?.uid;
    const tournamentUrl = currentTournamentCode ? `${baseUrl}/live/${currentTournamentCode}` : '';

    // Helper: should show QR code for a component if its data is not available
    const shouldShowQRCode = {
        timer: timeLeftMs == null || isNaN(timeLeftMs),
        question: !currentTournamentQuestion,
        classement: !hookLeaderboard || hookLeaderboard.length === 0,
    };

    // Defensive: Only render grid if layout is defined and not empty
    if (authLoading) return <div className="p-8">Vérification de l'authentification...</div>;
    if (loading) return <div className="p-8">Chargement de la vue projection...</div>;
    if (error) return <div className="p-8 text-red-600">Erreur: {error}</div>;
    if (!gameCode) return <div className="p-8 text-orange-600">Aucun code de jeu fourni.</div>;
    if (!gameState) return <div className="p-8">Connexion au jeu en cours...</div>;
    if (!layout || layout.length === 0) return <div className="p-8 text-orange-600">Aucun layout défini pour la projection.</div>;

    return (
        <div className="main-content w-full max-w-none px-0">
            {!currentTournamentCode ? (
                <div className="alert alert-warning justify-center m-4">
                    Aucun code de tournoi disponible pour ce jeu. Vérifiez que le jeu est bien démarré.
                </div>
            ) : (
                <ResponsiveGridLayout
                    ref={gridRef}
                    className="layout w-full"
                    layouts={{ lg: layout }}
                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                    cols={{ lg: 48, md: 36, sm: 24, xs: 12, xxs: 6 }}
                    rowHeight={20}
                    margin={[0, 0]}
                    isResizable={true}
                    isDraggable={true}
                    isDroppable={true}
                    allowOverlap={true}
                    preventCollision={false}
                    compactType={null}
                    useCSSTransforms={true}
                    autoSize={false}
                    verticalCompact={false}
                    isBounded={false}
                    onLayoutChange={(newLayout: Layout[]) => {
                        if (JSON.stringify(newLayout) !== JSON.stringify(layout)) {
                            setLayout(newLayout);
                        }
                    }}
                    onDrag={(layout: Layout[], oldItem: any, newItem: any, placeholder: any, e: MouseEvent, element: HTMLElement) => {
                        bringToFront(newItem.i);
                    }}
                    style={{ height: "calc(100vh - 56px)" }}
                    onDragStart={(layout, oldItem, newItem) => {
                        bringToFront(newItem.i);
                    }}
                >
                    {/* Live-timer */}
                    <div
                        key="live-timer"
                        className="rounded-full shadow-lg border border-primary flex items-center justify-center overflow-hidden relative"
                        style={{
                            zIndex: zIndexes["live-timer"],
                            background: 'var(--navbar)',
                            color: 'var(--primary-foreground)'
                        }}
                        onClick={() => bringToFront("live-timer")}
                    >
                        {shouldShowQRCode.timer ? (
                            <div className="w-full h-full flex flex-col items-center justify-center p-2">
                                <QRCode value={tournamentUrl} size={128} style={{ width: '100%', height: '100%' }} />
                                <div className="font-mono text-center mt-2 break-all text-xs">{currentTournamentCode}</div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 w-full h-full justify-center">
                                <Timer className="w-8 h-8 block flex-shrink-0" style={{ color: 'var(--light-foreground)' }} />
                                <span className="font-bold text-3xl" style={{ color: 'var(--light-foreground)', lineHeight: '1' }}>
                                    {formatTimerMs(timeLeftMs)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Question display */}
                    <div
                        key="question"
                        className="card bg-base-100 rounded-lg shadow-xl flex flex-col items-center justify-center overflow-hidden relative"
                        style={{ zIndex: zIndexes.question }}
                        onClick={() => bringToFront("question")}
                    >
                        <ZoomControls
                            zoomFactor={zoomFactors.question}
                            onZoomIn={() => handleZoom("question", 'in')}
                            onZoomOut={() => handleZoom("question", 'out')}
                        />
                        <div className="card-body w-full h-full p-4 overflow-auto">
                            {shouldShowQRCode.question ? (
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                    <QRCode value={tournamentUrl} size={192} style={{ width: '100%', height: '100%' }} />
                                    <div className="font-mono text-center mt-2 break-all text-base">{currentTournamentCode}</div>
                                </div>
                            ) : (
                                <div
                                    className="w-full h-full flex items-start justify-center"
                                    style={{ position: 'relative' }}
                                >
                                    <div
                                        style={{
                                            transform: `scale(${zoomFactors.question})`,
                                            transformOrigin: 'top center',
                                            width: `calc(100% / ${zoomFactors.question})`,
                                            maxWidth: `calc(100% / ${zoomFactors.question})`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {currentTournamentQuestion && (
                                            <QuestionCard
                                                key={questionKey}
                                                currentQuestion={currentTournamentQuestion}
                                                questionIndex={currentQuestionUid ? gameState?.questionUids.findIndex(uid => uid === currentQuestionUid) ?? 0 : 0}
                                                totalQuestions={gameState?.questionUids.length ?? 0}
                                                isMultipleChoice={currentQuestion?.questionType === QUESTION_TYPES.MULTIPLE_CHOICE}
                                                selectedAnswer={null}
                                                setSelectedAnswer={noopSetState}
                                                selectedAnswers={[]}
                                                setSelectedAnswers={noopSetState}
                                                handleSingleChoice={noopHandler}
                                                handleSubmitMultiple={noopHandler}
                                                answered={false}
                                                isQuizMode={true}
                                                readonly={true}
                                                correctAnswers={correctAnswers}
                                                stats={statsToShow}
                                                showStats={showStatsFlag}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* QR Code Component (always shows QR) */}
                    <div
                        key="qrcode"
                        className="card bg-base-100 rounded-lg shadow-xl flex flex-col items-center justify-center overflow-hidden relative"
                        style={{ zIndex: zIndexes.qrcode }}
                        onClick={() => bringToFront("qrcode")}
                    >
                        <div className="card-body w-full h-full p-0 flex flex-col items-center justify-center">
                            <div className="w-full h-full flex flex-col items-center justify-center p-0">
                                <div className="bg-white p-0 rounded-lg w-full flex items-center justify-center" style={{ maxHeight: '85%', aspectRatio: '1/1' }}>
                                    <QRCode value={tournamentUrl} size={256} style={{ height: '100%', width: '100%', maxWidth: '100%', maxHeight: '100%', aspectRatio: '1/1' }} viewBox={`0 0 256 256`} />
                                </div>
                                <div className="text-center mt-2" style={{ maxHeight: '15%' }}>
                                    <div className="font-mono font-bold text-xl">{currentTournamentCode}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Classement Podium */}
                    <div
                        key="classement"
                        className="card bg-base-100 rounded-lg shadow-xl flex flex-col items-center justify-center relative"
                        style={{ zIndex: zIndexes.classement }}
                        onClick={() => bringToFront("classement")}
                    >
                        <ZoomControls
                            zoomFactor={zoomFactors.classement}
                            onZoomIn={() => handleZoom("classement", 'in')}
                            onZoomOut={() => handleZoom("classement", 'out')}
                        />
                        <div className="card-body w-full h-full p-4 flex flex-col items-start justify-start overflow-hidden">
                            {shouldShowQRCode.classement ? (
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                    <QRCode value={tournamentUrl} size={192} style={{ width: '100%', height: '100%' }} />
                                    <div className="font-mono text-center mt-2 break-all text-base">{currentTournamentCode}</div>
                                </div>
                            ) : (
                                <div
                                    style={{
                                        transform: `scale(${zoomFactors.classement})`,
                                        transformOrigin: 'top center',
                                        width: `calc(100% / ${zoomFactors.classement})`,
                                        maxWidth: `calc(100% / ${zoomFactors.classement})`,
                                        height: `calc(100% / ${zoomFactors.classement})`,
                                        position: 'relative',
                                    }}
                                >
                                    <ClassementPodium
                                        key={podiumKey}
                                        top3={hookLeaderboard.slice(0, 3).map((entry) => ({
                                            userId: entry.userId,
                                            name: entry.username || 'Unknown Player',
                                            avatarEmoji: entry.avatarEmoji || '👤',
                                            score: entry.score,
                                        }))}
                                        others={hookLeaderboard.slice(3).map((entry) => ({
                                            userId: entry.userId,
                                            name: entry.username || 'Unknown Player',
                                            score: entry.score,
                                        }))}
                                        correctAnswers={correctAnswers}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </ResponsiveGridLayout>
            )}
        </div>
    );
}