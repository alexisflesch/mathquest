/**
 * Teacher Projection Page Component
 *
 * This page provides a full-screen projection view for teachers to display
 * quiz components on a larger screen (projector, interactive whiteboard, etc.)
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
import { useProjectionQuizSocket } from '@/hooks/useProjectionQuizSocket';
import { useRouter } from 'next/navigation';
import TournamentQuestionCard from '@/components/TournamentQuestionCard';
import { Timer } from 'lucide-react'; // Suppression de MoveDiagonal2 et ZoomIn/ZoomOut car géré par ZoomControls
import QRCode from 'react-qr-code';
import ClassementPodium from '@/components/ClassementPodium';
import ZoomControls from '@/components/ZoomControls'; // Import du nouveau composant
import { Question } from '@/types'; // Remove unused QuizState import
import type { TournamentQuestion } from '@/components/TournamentQuestionCard';

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

export default function ProjectionPage({ params }: { params: Promise<{ quizId: string }> }) { // Update params type to Promise
    const resolvedParams = use(params); // Use React.use() to resolve the params Promise
    const { quizId }: { quizId: string } = resolvedParams; // Destructure from resolved params
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // const [quizName, setQuizName] = useState<string>(""); // TODO: Remove if not used
    const [currentTournamentCode, setCurrentTournamentCode] = useState<string | null>(null);
    // const [isMobile, setIsMobile] = useState(false); // TODO: Remove if not used
    const [baseUrl, setBaseUrl] = useState<string>("");
    // Ensure zoomFactors state is declared here
    const [zoomFactors, setZoomFactors] = useState({
        question: 1,
        classement: 1,
    });

    // --- Listen for leaderboard/correct answer updates ---
    const [leaderboard, setLeaderboard] = useState<{ pseudo: string; avatar: string; score: number }[]>([]); // Specify type
    const [correctAnswers, setCorrectAnswers] = useState<number[]>([]);

    // --- Stats state ---
    type StatsData = { stats: number[]; totalAnswers: number };
    const [questionStats, setQuestionStats] = useState<Record<string, StatsData>>({});
    const [showStats, setShowStats] = useState<Record<string, boolean>>({});

    // Move the useProjectionQuizSocket hook call to the top, before any useEffect or code that uses quizSocket
    const {
        quizSocket,
        quizState,
        timerStatus,
        timerQuestionId,
        localTimeLeft,
        setLocalTimeLeft, // <-- Now available
        connectedCount,
    } = useProjectionQuizSocket(quizId, currentTournamentCode);

    // Move this function here, after setCorrectAnswers is defined:
    const debugSetCorrectAnswers = (val: number[], reason: string) => {
        logger.debug(`[Projection] setCorrectAnswers called`, { val, reason });
        setCorrectAnswers(val);
    };

    useEffect(() => {
        if (!quizSocket) return;
        const handleResults = (data: { leaderboard: { pseudo: string; avatar: string; score: number }[]; correctAnswers: number[] }) => {
            logger.info('[Projection] Received quiz_question_results', data);
            setLeaderboard(data.leaderboard || []);
            debugSetCorrectAnswers(data.correctAnswers || [], 'quiz_question_results');
            setPodiumKey(k => k + 1); // Remount ClassementPodium for animation
        };
        quizSocket.on('quiz_question_results', handleResults);
        return () => {
            quizSocket.off('quiz_question_results', handleResults);
        };
    }, [quizSocket]);

    useEffect(() => {
        if (!quizSocket) return;
        const handleClosed = (data: { leaderboard: { pseudo: string; avatar: string; score: number }[]; correctAnswers: number[] }) => {
            logger.info('[Projection] Received quiz_question_closed', data);
            setLeaderboard(data.leaderboard || []);
            debugSetCorrectAnswers(data.correctAnswers || [], 'quiz_question_closed');
        };
        quizSocket.on('quiz_question_closed', handleClosed);
        return () => {
            quizSocket.off('quiz_question_closed', handleClosed);
        };
    }, [quizSocket]);

    // Listen for stats updates
    useEffect(() => {
        if (!quizSocket) return;
        const handleStatsUpdate = (data: { questionUid: string; stats: number[]; totalAnswers: number }) => {
            setQuestionStats(prev => ({ ...prev, [data.questionUid]: { stats: data.stats, totalAnswers: data.totalAnswers } }));
        };
        quizSocket.on('quiz_answer_stats_update', handleStatsUpdate);
        return () => {
            quizSocket.off('quiz_answer_stats_update', handleStatsUpdate);
        };
    }, [quizSocket]);

    // Listen for show/hide stats toggle
    useEffect(() => {
        if (!quizSocket) return;
        const handleToggleStats = (data: { quizId: string; questionUid: string; show: boolean }) => {
            setShowStats(prev => ({ ...prev, [data.questionUid]: data.show }));
        };
        quizSocket.on('quiz_toggle_stats', handleToggleStats);
        return () => {
            quizSocket.off('quiz_toggle_stats', handleToggleStats);
        };
    }, [quizSocket]);

    // Clear correctAnswers when a new question is set
    const lastQuestionIdRef = useRef<string | null>(null);
    useEffect(() => {
        if (!quizState || !timerQuestionId) return;
        if (lastQuestionIdRef.current !== timerQuestionId) {
            debugSetCorrectAnswers([], 'new question');
            lastQuestionIdRef.current = timerQuestionId;
        }
    }, [quizState, timerQuestionId]);

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

    // State vars for TournamentQuestionCard - won't be used for interaction but needed for props
    // const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    // const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);

    // Teacher authentication check
    useEffect(() => {
        const checkTeacherAuth = async () => {
            setLoading(true);
            setError(null);

            try {
                const teacherId = localStorage.getItem('mathquest_teacher_id');
                if (!teacherId) {
                    logger.warn('No teacher ID found, redirecting to login');
                    router.push('/teacher/login');
                    return;
                }

                // Fetch quiz name and tournament code
                const quizListRes = await fetch(`/api/quiz?enseignant_id=${teacherId}`);
                if (!quizListRes.ok) throw new Error("Erreur lors du chargement des quiz");

                const quizzes: { id: string; nom: string }[] = await quizListRes.json();
                const found = Array.isArray(quizzes) ? quizzes.find((q) => q.id === quizId) : null;

                if (!found) {
                    setError("Quiz non trouvé ou vous n'avez pas les droits d'accès.");
                    return;
                }

                // Remove setQuizName, as it is not defined or used.
                // setQuizName(found.nom || "Quiz");

                // Fetch tournament code
                const codeRes = await fetch(`/api/quiz/${quizId}/tournament-code`);
                if (codeRes.ok) {
                    const codeData = await codeRes.json();
                    if (codeData && codeData.tournament_code) {
                        setCurrentTournamentCode(codeData.tournament_code);
                    }
                }

                setLoading(false);
            } catch (err: unknown) {
                logger.error("Error authenticating teacher:", err);
                setError((err as Error).message || "Erreur d'authentification");
                setLoading(false);
            }
        };

        checkTeacherAuth();
    }, [quizId, router]);

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

    // Get current question from quiz state
    const getCurrentQuestion = (): Question | null => { // Explicit return type Question
        if (!quizState || !timerQuestionId) return null;
        return quizState.questions.find(q => q.uid === timerQuestionId) || null;
    };

    // Empty handler functions (needed for props but won't be used because of readonly mode)
    const noopHandler = () => { };
    const noopSetState = () => { };

    // Données fictives pour le classement (à remplacer par les vraies données plus tard)
    // const fakeTop3 = [...];
    // const fakeOthers = [...];

    // Defensive: Only render grid if layout is defined and not empty
    if (loading) return <div className="p-8">Chargement de la vue projection...</div>;
    if (error) return <div className="p-8 text-red-600">Erreur: {error}</div>;
    if (!quizId) return <div className="p-8 text-orange-600">Aucun ID de quiz fourni.</div>;
    if (!quizState) return <div className="p-8">Connexion au serveur...</div>;
    if (!layout || layout.length === 0) return <div className="p-8 text-orange-600">Aucun layout défini pour la projection.</div>;

    const currentQuestion = getCurrentQuestion();
    // Map to TournamentQuestionCard's expected format
    const currentTournamentQuestion: TournamentQuestion | null = currentQuestion
        ? {
            uid: currentQuestion.uid,
            question: currentQuestion.question,
            type: currentQuestion.type,
            answers: Array.isArray(currentQuestion.reponses)
                ? currentQuestion.reponses.map(r => r.texte)
                : [],
        }
        : null;
    const currentQuestionUid = currentTournamentQuestion?.uid;
    const statsToShow = currentQuestionUid && showStats[currentQuestionUid] ? questionStats[currentQuestionUid] : undefined;
    const showStatsFlag = !!(currentQuestionUid && showStats[currentQuestionUid]);

    // Generate the full tournament URL for the QR code
    const tournamentUrl = currentTournamentCode ? `${baseUrl}/live/${currentTournamentCode}` : '';

    return (
        // Ne plus envelopper toute la page avec MathJaxWrapper
        <div className="main-content w-full max-w-none px-0">
            {!currentTournamentCode ? (
                <div className="alert alert-warning justify-center m-4">
                    Ce quiz n&apos;a pas encore de code de tournoi. Générez un code depuis le tableau de bord.
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
                // Suppression des props resizeHandles et resizeHandle
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
                                        <TournamentQuestionCard
                                            key={questionKey}
                                            currentQuestion={currentTournamentQuestion}
                                            questionIndex={quizState?.questions.findIndex(q => q.uid === currentTournamentQuestion?.uid) ?? 0}
                                            totalQuestions={quizState?.questions.length ?? 0}
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
                                        name: entry.pseudo,
                                        avatarUrl: entry.avatar,
                                        score: entry.score,
                                    }))}
                                    others={leaderboard.slice(3).map((entry) => ({
                                        name: entry.pseudo,
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