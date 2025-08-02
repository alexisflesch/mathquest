"use client";
import React, { useEffect, useState, useRef } from "react";
import { Layout, Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "@/app/globals.css";
import { createLogger } from '@/clientLogger';
import { useProjectionQuizSocket } from '@/hooks/useProjectionQuizSocket';
import QuestionCard from '@/components/QuestionCard';
import { Timer } from 'lucide-react';
import QRCode from 'react-qr-code';
import ClassementPodium from '@/components/ClassementPodium';
import ZoomControls from '@/components/ZoomControls';
import type { TournamentQuestion } from '@shared/types';
import { questionDataForStudentSchema } from '@shared/types/socketEvents.zod';
import type { z } from 'zod';
type QuestionDataForStudent = z.infer<typeof questionDataForStudentSchema>;
import { QUESTION_TYPES } from '@shared/types';
// Remove legacy Question type usage

const ResponsiveGridLayout = WidthProvider(Responsive);
const logger = createLogger('ProjectionPage');

function formatTimer(val: number | null) {
    if (val === null) return '-';
    if (val >= 60) {
        const m = Math.floor(val / 60);
        const s = val % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }
    return val.toString();
}
function formatTimerMs(timeLeftMs: number | null) {
    if (timeLeftMs === null || timeLeftMs === undefined) return '-';
    const seconds = Math.floor(timeLeftMs / 1000);
    return formatTimer(seconds);
}

type StatsData = { stats: number[]; totalAnswers: number };

// Helper function to extract stats from the new union type
function extractMultipleChoiceStats(currentStats: any): Record<string, number> {
    if (!currentStats || typeof currentStats !== 'object') {
        return {};
    }

    // If it's the new format with type discrimination
    if (currentStats.type === 'multipleChoice') {
        return currentStats.stats || {};
    }

    // If it's the legacy format (plain object) or new numeric format, return as-is for legacy compatibility
    if (currentStats.type === 'numeric') {
        return {}; // Numeric questions don't have option-based stats
    }

    // Legacy format - return as-is
    return currentStats;
}

export default function TeacherProjectionClient({ code, gameId }: { code: string, gameId: string }) {
    // Use the canonical projection quiz socket hook
    const {
        gameState,
        timerStatus,
        timerQuestionUid,
        timeLeftMs,
        connectedCount,
        leaderboard: hookLeaderboard,
        showStats,
        currentStats,
        correctAnswersData,
        currentQuestion: rawCurrentQuestion // <-- MODERN: canonical current question from socket event
    } = useProjectionQuizSocket(code, gameId);
    // Fix typing: currentQuestion is Question | null
    // Use canonical type directly: QuestionDataForStudent | null
    const currentQuestion: QuestionDataForStudent | null = (rawCurrentQuestion && typeof rawCurrentQuestion === 'object')
        ? (rawCurrentQuestion as QuestionDataForStudent)
        : null;

    // Responsive layout state
    const [layout, setLayout] = useState<Layout[]>([
        { i: "live-timer", x: 0, y: 0, w: 6, h: 4, static: false },
        { i: "question", x: 12, y: 0, w: 16, h: 24, static: false },
        { i: "qrcode", x: 0, y: 6, w: 10, h: 10, static: false },
        { i: "classement", x: 30, y: 2, w: 18, h: 22, static: false },
    ]);
    const [zIndexes, setZIndexes] = useState({ "live-timer": 1, question: 2, qrcode: 3, classement: 4 });
    const [highestZ, setHighestZ] = useState(4);
    const gridRef = useRef(null);
    const [podiumKey, setPodiumKey] = useState(0);
    const [questionKey, setQuestionKey] = useState(0);
    const [zoomFactors, setZoomFactors] = useState({ question: 1, classement: 1 });
    const [baseUrl, setBaseUrl] = useState<string>("");
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const protocol = window.location.protocol;
            const host = window.location.host;
            setBaseUrl(`${protocol}//${host}`);
        }
    }, []);

    // --- LEGACY: Old logic for deriving current question (now obsolete, kept for reference) ---
    /*
    const getCurrentQuestion = (): QuestionData | null => {
        if (!gameState || !timerQuestionUid) return null;
        if (gameState.questionData && gameState.questionData.uid === timerQuestionUid) {
            return gameState.questionData as QuestionData;
        }
        return null;
    };
    const currentQuestion =
    const currentTournamentQuestion: TournamentQuestion | null = currentQuestion
        ? { question: currentQuestion }
        : null;
    const currentQuestionUid = currentQuestion?.uid;
    */
    // --- END LEGACY ---

    // MODERN: Use canonical currentQuestion (FilteredQuestion) from the socket hook
    // For projection, just use the canonical student payload directly
    // Pass the canonical QuestionDataForStudent directly to QuestionCard
    const currentTournamentQuestion: QuestionDataForStudent | null = currentQuestion;
    const currentQuestionUid = currentQuestion?.uid;
    const tournamentUrl = code ? `${baseUrl}/live/${code}` : '';
    // Canonical: Only show QR code if there is no current question (like live/student page)
    const shouldShowQRCode = {
        timer: false, // Always show timer if timer state is present (unified with live page)
        question: !currentTournamentQuestion,
        classement: !hookLeaderboard || hookLeaderboard.length === 0,
    };
    const bringToFront = (id: string) => {
        setHighestZ(prev => prev + 1);
        setZIndexes(prev => ({ ...prev, [id]: highestZ + 1 }));
    };
    const handleZoom = (id: string, direction: 'in' | 'out') => {
        setZoomFactors(prev => {
            if (!(id in prev)) return prev;
            const currentZoom = prev[id as keyof typeof prev] || 1;
            let newZoom;
            if (direction === 'in') {
                newZoom = Math.min(currentZoom + 0.1, 3);
            } else {
                newZoom = Math.max(currentZoom - 0.1, 0.5);
            }
            newZoom = Math.max(0.1, newZoom);
            if (id === 'question') {
                setQuestionKey(k => k + 1);
            } else if (id === 'classement') {
                setPodiumKey(k => k + 1);
            }
            return { ...prev, [id]: newZoom };
        });
    };
    // Canonical: build stats array exactly as in TeacherDashboardClient
    // Canonical: build stats array exactly as in TeacherDashboardClient
    let statsArray: number[] = [];
    let totalAnswers = 0;
    let numOptions = 0;
    if (currentTournamentQuestion && Array.isArray(currentTournamentQuestion.answerOptions)) {
        numOptions = currentTournamentQuestion.answerOptions.length;
        if (numOptions > 0) {
            const extractedStats = extractMultipleChoiceStats(currentStats);
            for (let i = 0; i < numOptions; i++) {
                const count = extractedStats[i.toString()] || 0;
                statsArray.push(count);
                totalAnswers += count;
            }
            // Convert to percentages
            if (totalAnswers > 0) {
                statsArray = statsArray.map(count => (count / totalAnswers) * 100);
            } else {
                statsArray = Array(numOptions).fill(0);
            }
        }
    }
    const statsToShow: StatsData = {
        stats: statsArray,
        totalAnswers
    };
    return (
        <div className="main-content w-full max-w-none px-0">
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
                {/* Live-timer (unified with live/student page: always show timer if timer state is present) */}
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
                        <Timer className="w-8 h-8 block flex-shrink-0" style={{ color: 'var(--light-foreground)' }} />
                        <span className="font-bold text-3xl" style={{ color: 'var(--light-foreground)', lineHeight: '1' }}>
                            {formatTimerMs(timeLeftMs ?? null)}
                        </span>
                    </div>
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
                        {/* Canonical: Only show QR code if there is no current question (unified with live/student page) */}
                        {!currentTournamentQuestion ? (
                            <div className="w-full h-full flex flex-col items-center justify-center">
                                <QRCode value={tournamentUrl} size={192} style={{ width: '100%', height: '100%' }} />
                                <div className="font-mono text-center mt-2 break-all text-base">{code}</div>
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
                                    <QuestionCard
                                        key={questionKey}
                                        currentQuestion={currentTournamentQuestion}
                                        questionIndex={currentQuestionUid ? gameState?.questionUids.findIndex(uid => uid === currentQuestionUid) ?? 0 : 0}
                                        totalQuestions={gameState?.questionUids.length ?? 0}
                                        isMultipleChoice={currentQuestion?.questionType === QUESTION_TYPES.MULTIPLE_CHOICE}
                                        selectedAnswer={null}
                                        setSelectedAnswer={() => { }}
                                        selectedAnswers={[]}
                                        setSelectedAnswers={() => { }}
                                        handleSingleChoice={() => { }}
                                        handleSubmitMultiple={() => { }}
                                        answered={false}
                                        isQuizMode={true}
                                        readonly={true}
                                        correctAnswers={correctAnswersData?.correctAnswers || []}
                                        stats={showStats ? statsToShow : undefined}
                                        showStats={showStats}
                                    />
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
                                <div className="font-mono font-bold text-xl">{code}</div>
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
                                <div className="font-mono text-center mt-2 break-all text-base">{code}</div>
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
                                    correctAnswers={correctAnswersData?.correctAnswers || []}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </ResponsiveGridLayout>
        </div>
    );
}
