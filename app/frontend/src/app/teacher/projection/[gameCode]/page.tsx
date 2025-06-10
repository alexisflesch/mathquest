/**
 * Teacher Projection Page Component
 *
 * This page provides a full-screen projection view for teachers to display
 * q    // Listen for show    // Clear correctAnswers when a new question is set
    const lastQuestionIdRef = useRef<string | null>(null);
    useEffect(() => {
        if (!gameState || !timerQuestionId) return;
        if (lastQuestionIdRef.current !== timerQuestionId) {
            debugSetCorrectAnswers([], 'new question detected');
            lastQuestionIdRef.current = timerQuestionId;
        }
    }, [gameState, timerQuestionId]);ts toggle
    useEffect(() => {
        if (!gameSocket) return;
        const handleToggleStats = (data: { quizId: string; questionUid: string; show: boolean }) => {
            setShowStats(prev => ({ ...prev, [data.questionUid]: data.show }));
        };
        gameSocket.on(SOCKET_EVENTS.LEGACY_QUIZ.TOGGLE_STATS, handleToggleStats);
        return () => {
            gameSocket.off(SOCKET_EVENTS.LEGACY_QUIZ.TOGGLE_STATS, handleToggleStats);
        };
    }, [gameSocket]);nts on a larger screen (projector, interactive whiteboard, etc.)
 * Features:
 * - Draggable and resizable components
 * - Real-time updates via socket connection
 * - Same authentication as the dashboard
 * - Components can be arranged freely and can overlap
 */

"use client";

import React, { useEffect, useState, useRef, use } from "react"; // Import use
import { Layout, Responsive, WidthProvider } from "react-grid-layout"; // Import Layout type
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "@/app/globals.css";
import { createLogger } from '@/clientLogger';
import { useProjectionQuizSocket } from '@/hooks/migrations';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import QuestionCard from '@/components/QuestionCard';
import { Timer } from 'lucide-react'; // Suppression de MoveDiagonal2 et ZoomIn/ZoomOut car géré par ZoomControls
import QRCode from 'react-qr-code';
import ClassementPodium from '@/components/ClassementPodium';
import ZoomControls from '@/components/ZoomControls'; // Import du nouveau composant
import { Question } from '@/types'; // Remove unused QuizState import
import type { TournamentQuestion } from '@shared/types';
import type { QuestionData } from '@shared/types/socketEvents';

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

import { SOCKET_EVENTS } from '@shared/types/socket/events';

export default function ProjectionPage({ params }: { params: Promise<{ gameCode: string }> }) {
    const resolvedParams = use(params);
    const { gameCode }: { gameCode: string } = resolvedParams;
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // const [quizName, setQuizName] = useState<string>(""); // TODO: Remove if not used
    const [currentTournamentCode, setCurrentTournamentCode] = useState<string | null>(gameCode);
    // const [isMobile, setIsMobile] = useState(false); // TODO: Remove if not used
    const [baseUrl, setBaseUrl] = useState<string>("");
    // Ensure zoomFactors state is declared here
    const [zoomFactors, setZoomFactors] = useState({
        question: 1,
        classement: 1,
    });

    // --- Listen for leaderboard/correct answer updates ---
    const [leaderboard, setLeaderboard] = useState<{ username: string; avatar: string; score: number }[]>([]); // Specify type
    const [correctAnswers, setCorrectAnswers] = useState<boolean[]>([]);

    // --- Stats state ---
    type StatsData = { stats: number[]; totalAnswers: number };
    const [questionStats, setQuestionStats] = useState<Record<string, StatsData>>({});
    const [showStats, setShowStats] = useState<Record<string, boolean>>({});

    // Move the useProjectionQuizSocket hook call to the top, before any useEffect or code that uses gameSocket
    const {
        gameSocket,
        gameState,
        timerStatus,
        timerQuestionId,
        localTimeLeft,
        setLocalTimeLeft, // <-- Now available
        connectedCount,
    } = useProjectionQuizSocket(gameCode, null); // Use gameCode directly

    // Extract tournament code from game state when available
    useEffect(() => {
        if (gameState && gameState.accessCode && !currentTournamentCode) {
            logger.info('Setting tournament code from game state:', gameState.accessCode);
            setCurrentTournamentCode(gameState.accessCode);
        }
    }, [gameState, currentTournamentCode]);

    // Move this function here, after setCorrectAnswers is defined:
    const debugSetCorrectAnswers = (val: boolean[], reason: string) => {
        logger.debug(`[Projection] setCorrectAnswers called`, { val, reason });
        setCorrectAnswers(val);
    };

    // --- Legacy event listeners removed: migrate to new event system or use quizState ---
    // useEffect(() => {
    //     if (!gameSocket) return;
    //     const handleResults = (data: { leaderboard: { username: string; avatar: string; score: number }[]; correctAnswers: number[] }) => {
    //         logger.info('[Projection] Received quiz_question_results', data);
    //         setLeaderboard(data.leaderboard || []);
    //         debugSetCorrectAnswers(data.correctAnswers || [], 'quiz_question_results');
    //         setPodiumKey(k => k + 1); // Remount ClassementPodium for animation
    //     };
    //     gameSocket.on(SOCKET_EVENTS.LEGACY_QUIZ.QUESTION_RESULTS, handleResults);
    //     return () => {
    //         gameSocket.off(SOCKET_EVENTS.LEGACY_QUIZ.QUESTION_RESULTS, handleResults);
    //     };
    // }, [gameSocket]);
    // useEffect(() => {
    //     if (!gameSocket) return;
    //     const handleClosed = (data: { leaderboard: { username: string; avatar: string; score: number }[]; correctAnswers: number[] }) => {
    //         logger.info('[Projection] Received quiz_question_closed', data);
    //         setLeaderboard(data.leaderboard || []);
    //         debugSetCorrectAnswers(data.correctAnswers || [], 'quiz_question_closed');
    //     };
    //     gameSocket.on(SOCKET_EVENTS.LEGACY_QUIZ.QUESTION_CLOSED, handleClosed);
    //     return () => {
    //         gameSocket.off(SOCKET_EVENTS.LEGACY_QUIZ.QUESTION_CLOSED, handleClosed);
    //     };
    // }, [gameSocket]);
    // useEffect(() => {
    //     if (!gameSocket) return;
    //     const handleStatsUpdate = (data: { questionUid: string; stats: number[]; totalAnswers: number }) => {
    //         setQuestionStats(prev => ({ ...prev, [data.questionUid]: { stats: data.stats, totalAnswers: data.totalAnswers } }));
    //     };
    //     gameSocket.on(SOCKET_EVENTS.LEGACY_QUIZ.ANSWER_STATS_UPDATE, handleStatsUpdate);
    //     return () => {
    //         gameSocket.off(SOCKET_EVENTS.LEGACY_QUIZ.ANSWER_STATS_UPDATE, handleStatsUpdate);
    //     };
    // }, [gameSocket]);
    // useEffect(() => {
    //     if (!gameSocket) return;
    //     const handleToggleStats = (data: { quizId: string; questionUid: string; show: boolean }) => {
    //         setShowStats(prev => ({ ...prev, [data.questionUid]: data.show }));
    //     };
    //     gameSocket.on(SOCKET_EVENTS.LEGACY_QUIZ.TOGGLE_STATS, handleToggleStats);
    //     return () => {
    //         gameSocket.off(SOCKET_EVENTS.LEGACY_QUIZ.TOGGLE_STATS, handleToggleStats);
    //     };
    // }, [gameSocket]);

    // Clear correctAnswers when a new question is set
    const lastQuestionIdRef = useRef<string | null>(null);
    useEffect(() => {
        if (!gameState || !timerQuestionId) return;
        if (lastQuestionIdRef.current !== timerQuestionId) {
            debugSetCorrectAnswers([], 'new question');
            lastQuestionIdRef.current = timerQuestionId;
        }
    }, [gameState, timerQuestionId]);

    // --- Patch: Ensure timer is set to 0 and countdown is stopped when quiz is stopped ---
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
        // Always clear any running timer interval when timer is stopped or at zero
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, [timerStatus, localTimeLeft]);

    // --- Force timer to zero if stopped, even if localTimeLeft is not zero ---
    useEffect(() => {
        if (timerStatus === 'stop' && localTimeLeft !== 0) {
            logger.debug('[Projection] Forcing localTimeLeft to 0 because timerStatus is stop. Previous value:', localTimeLeft);
            setLocalTimeLeft(0);
        }
    }, [timerStatus, localTimeLeft]);

    // Log every timer update for debugging the blinking effect
    useEffect(() => {
        logger.debug('[Projection] Timer display update:', {
            timerStatus,
            localTimeLeft,
        });
    }, [timerStatus, localTimeLeft]);

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
        if (!gameState || !timerQuestionId) {
            return null;
        }
        const found = gameState.questions.find((q: QuestionData) => q.uid === timerQuestionId) || null;
        return found;
    };

    // Empty handler functions (needed for props but won't be used because of readonly mode)
    const noopHandler = () => { };
    const noopSetState = () => { };

    // Données fictives pour le classement (à remplacer par les vraies données plus tard)
    // const fakeTop3 = [...];
    // const fakeOthers = [...];

    // Defensive: Only render grid if layout is defined and not empty
    if (authLoading) return <div className="p-8">Vérification de l'authentification...</div>;
    if (loading) return <div className="p-8">Chargement de la vue projection...</div>;
    if (error) return <div className="p-8 text-red-600">Erreur: {error}</div>;
    if (!gameCode) return <div className="p-8 text-orange-600">Aucun code de jeu fourni.</div>;
    if (!gameState) return <div className="p-8">Connexion au jeu en cours...</div>;
    if (!layout || layout.length === 0) return <div className="p-8 text-orange-600">Aucun layout défini pour la projection.</div>;

    const currentQuestion = getCurrentQuestion();
    // Map to QuestionCard's expected format
    const currentTournamentQuestion: TournamentQuestion | null = currentQuestion
        ? {
            uid: currentQuestion.uid,
            question: currentQuestion.text,
            type: currentQuestion.questionType,
            answers: Array.isArray(currentQuestion.answerOptions)
                ? currentQuestion.answerOptions
                : [],
        }
        : null;
    const currentQuestionUid = currentTournamentQuestion?.uid;
    const statsToShow = currentQuestionUid && showStats[currentQuestionUid] ? questionStats[currentQuestionUid] : undefined;
    const showStatsFlag = !!(currentQuestionUid && showStats[currentQuestionUid]);

    // Generate the full tournament URL for the QR code
    const tournamentUrl = currentTournamentCode ? `${baseUrl}/live/${currentTournamentCode}` : '';

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
                    onLayoutChange={(newLayout: Layout[]) => setLayout(newLayout)} // Handler type matches state type
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
                        <div className="flex items-center gap-2 w-full h-full justify-center">
                            <Timer
                                className="w-8 h-8 block flex-shrink-0"
                                style={{ color: 'var(--light-foreground)' }}
                            />
                            <span
                                className="font-bold text-3xl"
                                style={{
                                    color: 'var(--light-foreground)',
                                    lineHeight: '1',
                                }}
                            >
                                {formatTimer(localTimeLeft)}
                            </span>
                        </div>
                    </div>

                    {/* Question display - ajout de la scrollbar */}
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
                        {/* Conteneur principal avec overflow-auto pour permettre le défilement */}
                        <div className="card-body w-full h-full p-4 overflow-auto">
                            {currentTournamentQuestion ? (
                                <div
                                    className="w-full h-full flex items-start justify-center"
                                    style={{
                                        position: 'relative'
                                    }}
                                >
                                    {/* Conteneur avec transformation pour zoom */}
                                    <div
                                        style={{
                                            transform: `scale(${zoomFactors.question})`,
                                            transformOrigin: 'top center', // Alignement en haut
                                            width: `calc(100% / ${zoomFactors.question})`,
                                            maxWidth: `calc(100% / ${zoomFactors.question})`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <QuestionCard
                                            key={questionKey}
                                            currentQuestion={currentTournamentQuestion}
                                            questionIndex={gameState?.questions.findIndex(q => q.uid === currentTournamentQuestion?.uid) ?? 0}
                                            totalQuestions={gameState?.questions.length ?? 0}
                                            isMultipleChoice={currentTournamentQuestion?.type === 'choix_multiple'}
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
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-500 flex items-center justify-center w-full h-full">
                                    Aucune question active
                                </div>
                            )}
                        </div>
                    </div>

                    {/* QR Code Component */}
                    <div
                        key="qrcode"
                        className="card bg-base-100 rounded-lg shadow-xl flex flex-col items-center justify-center overflow-hidden relative"
                        style={{ zIndex: zIndexes.qrcode }}
                        onClick={() => bringToFront("qrcode")}
                    >
                        <div className="card-body w-full h-full p-0 flex flex-col items-center justify-center">
                            <div className="w-full h-full flex flex-col items-center justify-center p-0">
                                {/* QR Code */}
                                <div className="bg-white p-0 rounded-lg w-full flex items-center justify-center"
                                    style={{ maxHeight: '85%', aspectRatio: '1/1' }}>
                                    <QRCode
                                        value={tournamentUrl}
                                        size={256}
                                        style={{
                                            height: '100%',
                                            width: '100%',
                                            maxWidth: '100%',
                                            maxHeight: '100%',
                                            aspectRatio: '1/1',
                                        }}
                                        viewBox={`0 0 256 256`}
                                    />
                                </div>

                                {/* Tournament Code */}
                                <div className="text-center mt-2" style={{ maxHeight: '15%' }}>
                                    <div className="font-mono font-bold text-xl">
                                        {currentTournamentCode}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Classement Podium - structure optimisée pour l'animation */}
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
                        {/* Conteneur sans margin et sans scrollbar */}
                        <div className="card-body w-full h-full p-4 flex flex-col items-start justify-start overflow-hidden">
                            {/* Conteneur principal pour le contenu zoomable */}
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
                                    top3={leaderboard.slice(0, 3).map((entry) => ({
                                        name: entry.username,
                                        avatarEmoji: entry.avatar,
                                        score: entry.score,
                                    }))}
                                    others={leaderboard.slice(3).map((entry) => ({
                                        name: entry.username,
                                        score: entry.score,
                                    }))}
                                    correctAnswers={correctAnswers}
                                />
                            </div>
                        </div>
                    </div>
                </ResponsiveGridLayout>
            )}
        </div>
    );
}