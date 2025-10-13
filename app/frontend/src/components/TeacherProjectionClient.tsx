"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { DndContext, useDraggable } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { Resizable } from 're-resizable';
import { createLogger } from '@/clientLogger';
import { useProjectionQuizSocket } from '@/hooks/useProjectionQuizSocket';
import QuestionCard from '@/components/QuestionCard';
// import StatisticsChart from '@/components/StatisticsChart'; // Lazy loaded below
import { Timer, ChevronDown, ChevronRight } from 'lucide-react';
import QRCode from 'react-qr-code';
import QrCodeWithLogo from "@components/QrCodeWithLogo";
import ClassementPodium from '@/components/ClassementPodium';
import ZoomControls from '@/components/ZoomControls';
import type { TournamentQuestion } from '@shared/types';
import { questionDataForStudentSchema } from '@shared/types/socketEvents.zod';
import type { z } from 'zod';
type QuestionDataForStudent = z.infer<typeof questionDataForStudentSchema>;
import { QUESTION_TYPES } from '@shared/types';
const logger = createLogger('ProjectionPage');

// Memoized timer display component to prevent unnecessary re-renders
const TimerDisplay = React.memo(({ timeLeftMs }: { timeLeftMs: number | null }) => {
    return (
        <span
            className="font-bold text-3xl"
            style={{
                color: 'var(--light-foreground)',
                lineHeight: '1',
                willChange: 'contents', // Optimize for content changes
                transform: 'translateZ(0)', // Force GPU acceleration
            }}
        >
            {formatTimerMs(timeLeftMs ?? null)}
        </span>
    );
});
TimerDisplay.displayName = 'TimerDisplay';

// Question component with optimized re-rendering
const QuestionDisplay = React.memo(({
    currentTournamentQuestion,
    currentQuestionUid,
    gameState,
    questionKey,
    zoomFactors,
    setZoomFactors,
    correctAnswersData,
    showStats,
    currentStats,
    tournamentUrl,
    code,
    bringToFront
}: {
    currentTournamentQuestion: QuestionDataForStudent | null;
    currentQuestionUid: string | undefined;
    gameState: any;
    questionKey: number;
    zoomFactors: { question: number; classement: number };
    setZoomFactors: React.Dispatch<React.SetStateAction<{ question: number; classement: number }>>;
    correctAnswersData: any;
    showStats: boolean;
    currentStats: any;
    tournamentUrl: string;
    code: string;
    bringToFront: (id: string) => void;
}) => {
    // Preload StatisticsChart for teachers (immediate loading)
    const [StatisticsChart, setStatisticsChart] = useState<React.ComponentType<any> | null>(null);

    useEffect(() => {
        // Preload StatisticsChart immediately for teachers
        const loadChart = async () => {
            const { default: ChartComponent } = await import('@/components/StatisticsChart');
            setStatisticsChart(() => ChartComponent);
        };

        // Load immediately for teachers
        loadChart();
    }, []);

    // Remove debugging logs - issue was memoization blocking React re-renders
    // console.log('🔍 QuestionDisplay render with props:', {
    //     showStats,
    //     currentStats,
    //     currentStatsStringified: JSON.stringify(currentStats),
    //     currentStatsReference: currentStats,
    //     isNumericQuestion: currentTournamentQuestion?.questionType === QUESTION_TYPES.NUMERIC
    // });

    const currentQuestion = currentTournamentQuestion;
    const isNumericQuestion = currentQuestion?.questionType === QUESTION_TYPES.NUMERIC;

    // Extract stats for multiple choice questions using useMemo to handle updates
    const statsToShow = useMemo(() => {
        if (!showStats || !currentQuestion?.multipleChoiceQuestion?.answerOptions) {
            return undefined;
        }

        const answerOptions = currentQuestion.multipleChoiceQuestion.answerOptions;
        const numOptions = answerOptions.length;
        if (numOptions > 0) {
            const extractedStats = extractMultipleChoiceStats(currentStats);
            const statsArray: number[] = [];
            for (let i = 0; i < numOptions; i++) {
                const value = extractedStats[i.toString()] || 0;
                statsArray.push(value);
            }
            // Backend already sends percentage values, no need to scale
            return { stats: statsArray, totalAnswers: currentStats?.totalUsers || 0 };
        }
        return undefined;
    }, [showStats, currentQuestion?.multipleChoiceQuestion?.answerOptions, currentStats]);

    return (
        <div
            className="card bg-base-100 rounded-lg shadow-xl flex flex-col items-center justify-center overflow-hidden relative"
            style={{ width: '100%', height: '100%' }}
            onClick={() => bringToFront("question")}
        >
            <div onPointerDown={e => e.stopPropagation()}>
                <ZoomControls
                    zoomFactor={zoomFactors.question}
                    onZoomIn={() => setZoomFactors(z => ({ ...z, question: Math.min(z.question + 0.1, 3) }))}
                    onZoomOut={() => setZoomFactors(z => ({ ...z, question: Math.max(z.question - 0.1, 0.5) }))}
                />
            </div>
            <div className="card-body w-full h-full p-4 overflow-hidden">
                {!currentTournamentQuestion ? (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                        <QrCodeWithLogo
                            value={tournamentUrl}
                            responsive={true}
                        />
                        <div className="font-mono text-center mt-2 break-all text-base">{code}</div>
                    </div>
                ) : (
                    <div
                        className={`w-full h-full flex flex-col items-start justify-start ${isNumericQuestion && showStats && currentStats?.type === 'numeric' && currentStats.values ? '' : 'overflow-y-auto'}`}
                        style={{ position: 'relative', minHeight: 0 }}
                    >
                        <div
                            style={{
                                // Use font-size (em) based zoom: container keeps same physical size but text scales
                                fontSize: `${zoomFactors.question}em`,
                                // Child cards should keep their own physical sizes; use rem/em for fonts inside
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                width: '100%'
                            }}
                        >
                            <div style={{ flex: '0 0 auto', width: '100%' }}>
                                <QuestionCard
                                    key={`${questionKey}-${currentQuestionUid}-${showStats ? 'stats' : 'nostats'}`}
                                    currentQuestion={currentTournamentQuestion}
                                    questionIndex={currentQuestionUid ? gameState?.questionUids.findIndex((uid: string) => uid === currentQuestionUid) ?? 0 : 0}
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
                                    stats={showStats && !isNumericQuestion ? statsToShow : undefined}
                                    showStats={showStats && !isNumericQuestion}
                                    projectionMode={true} // Add this prop to hide input fields in projection
                                    zoomFactor={zoomFactors.question}
                                />
                            </div>

                            {/* Show StatisticsChart for numeric questions when stats should be shown */}
                            {isNumericQuestion && showStats && currentStats?.type === 'numeric' && currentStats.values && StatisticsChart && (
                                <div style={{
                                    flex: '1 1 0', // Take remaining space for numeric questions
                                    width: '100%',
                                    minHeight: '300px', // Minimum height for usability
                                    marginTop: '20px',
                                    overflow: 'hidden',
                                    pointerEvents: 'auto' // Enable pointer events for chart interactions
                                }}
                                    onPointerDown={e => e.stopPropagation()} // Prevent drag when interacting with chart
                                >
                                    <StatisticsChart data={currentStats.values} preload={true} />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison: only re-render if meaningful props change
    // This prevents re-rendering when only object references change but content is the same
    return (
        prevProps.currentTournamentQuestion === nextProps.currentTournamentQuestion &&
        prevProps.currentQuestionUid === nextProps.currentQuestionUid &&
        prevProps.questionKey === nextProps.questionKey &&
        prevProps.showStats === nextProps.showStats &&
        prevProps.zoomFactors.question === nextProps.zoomFactors.question &&
        prevProps.correctAnswersData === nextProps.correctAnswersData &&
        prevProps.tournamentUrl === nextProps.tournamentUrl &&
        prevProps.code === nextProps.code &&
        // Deep compare currentStats to avoid unnecessary re-renders
        JSON.stringify(prevProps.currentStats) === JSON.stringify(nextProps.currentStats)
    );
});
QuestionDisplay.displayName = 'QuestionDisplay';

// Memoized Leaderboard component
const LeaderboardDisplay = React.memo(({
    hookLeaderboard,
    correctAnswersData,
    shouldShowQRCode,
    tournamentUrl,
    code,
    zoomFactors,
    setZoomFactors,
    bringToFront
}: {
    hookLeaderboard: any[];
    correctAnswersData: any;
    shouldShowQRCode: boolean;
    tournamentUrl: string;
    code: string;
    zoomFactors: { question: number; classement: number };
    setZoomFactors: React.Dispatch<React.SetStateAction<{ question: number; classement: number }>>;
    bringToFront: (id: string) => void;
}) => {
    return (
        <div
            className="card bg-base-100 rounded-lg shadow-xl flex flex-col items-center justify-center overflow-hidden relative"
            style={{ width: '100%', height: '100%' }}
            onClick={() => bringToFront("classement")}
        >
            <div onPointerDown={e => e.stopPropagation()}>
                <ZoomControls
                    zoomFactor={zoomFactors.classement}
                    onZoomIn={() => setZoomFactors(z => ({ ...z, classement: Math.min(z.classement + 0.1, 3) }))}
                    onZoomOut={() => setZoomFactors(z => ({ ...z, classement: Math.max(z.classement - 0.1, 0.5) }))}
                />
            </div>
            <div className="card-body w-full h-full p-4 flex flex-col items-start justify-start overflow-visible">
                {shouldShowQRCode ? (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                        <QrCodeWithLogo
                            value={tournamentUrl}
                            responsive={true}
                        />
                        <div className="font-mono text-center mt-2 break-all text-base">{code}</div>
                    </div>
                ) : (
                    <div
                        style={{
                            fontSize: `${zoomFactors.classement}em`,
                            width: '100%',
                            height: `calc(100% / ${zoomFactors.classement})`,
                            position: 'relative',
                        }}
                    >
                        <ClassementPodium
                            leaderboard={hookLeaderboard.map((entry) => ({
                                userId: entry.userId,
                                name: entry.username || 'Unknown Player',
                                avatarEmoji: entry.avatarEmoji || '👤',
                                score: entry.score,
                            }))}
                            correctAnswers={correctAnswersData?.correctAnswers || []}
                        />
                    </div>
                )}
            </div>
        </div>
    );
});
LeaderboardDisplay.displayName = 'LeaderboardDisplay';

// Extract DraggableResizable as a separate component to prevent re-creation on every render
const DraggableResizable = React.memo(({
    id,
    elements,
    updateElement,
    bringToFront,
    children
}: {
    id: string;
    elements: Array<{ id: string; x: number; y: number; w: number; h: number; z: number }>;
    updateElement: (id: string, update: Partial<{ x: number; y: number; w: number; h: number; z: number }>) => void;
    bringToFront: (id: string) => void;
    children: React.ReactNode;
}) => {
    const element = elements.find(e => e.id === id);
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

    // Calculate transform for live dragging
    let dragTransform = '';
    if (transform) {
        dragTransform = `translate3d(${transform.x}px, ${transform.y}px, 0)`;
    }

    const style = {
        position: 'absolute' as const,
        left: element?.x ?? 0,
        top: element?.y ?? 0,
        width: element?.w ?? 200,
        height: element?.h ?? 100,
        touchAction: 'none',
        transform: dragTransform,
        zIndex: element?.z ?? 1,
        // Remove transition to prevent jump-back effect during drag end
        background: 'transparent',
    };

    const handleResizeStop = useCallback((_e: any, _dir: any, _ref: any, d: { width: number; height: number }) => {
        if (!element) return;
        updateElement(id, {
            w: (element.w ?? 200) + d.width,
            h: (element.h ?? 100) + d.height,
        });
    }, [id, element, updateElement]);

    return (
        <Resizable
            size={{ width: element?.w ?? 200, height: element?.h ?? 100 }}
            onResizeStop={handleResizeStop}
            minWidth={120}
            minHeight={60}
            enable={{
                top: false,
                right: false,
                bottom: false,
                left: false,
                topRight: false,
                bottomRight: true,
                bottomLeft: false,
                topLeft: false,
            }}
            style={style}
            handleWrapperStyle={{ zIndex: 10000 }}
            handleComponent={{
                bottomRight: (
                    <div
                        style={{
                            width: 28,
                            height: 28,
                            position: 'absolute',
                            right: 4,
                            bottom: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'se-resize',
                            zIndex: 10001,
                            pointerEvents: 'auto',
                            background: 'transparent',
                            borderTopLeftRadius: 8,
                        }}
                    >
                        <ChevronRight size={18} color="#888" strokeWidth={2} style={{ transform: 'rotate(45deg)' }} />
                    </div>
                ),
            }}
        >
            <div
                ref={setNodeRef}
                {...attributes}
                {...listeners}
                style={{ width: '100%', height: '100%', cursor: isDragging ? 'grabbing' : 'grab' }}
            >
                {children}
            </div>
        </Resizable>
    );
});
DraggableResizable.displayName = 'DraggableResizable';

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
    const {
        gameState,
        timerStatus,
        timerQuestionUid,
        timeLeftMs,
        connectedCount,
        leaderboard: hookLeaderboard,
        leaderboardUpdateTrigger,
        showStats,
        currentStats,
        correctAnswersData,
        currentQuestion: rawCurrentQuestion
    } = useProjectionQuizSocket(code, gameId);

    // ...existing code...
    const currentQuestion: QuestionDataForStudent | null = (rawCurrentQuestion && typeof rawCurrentQuestion === 'object')
        ? (rawCurrentQuestion as QuestionDataForStudent)
        : null;

    // Layout state for each element
    const defaultElements = [
        { id: 'live-timer', x: 40, y: 40, w: 220, h: 80 },
        { id: 'question', x: 300, y: 40, w: 600, h: 400 },
        { id: 'qrcode', x: 40, y: 160, w: 220, h: 220 },
        { id: 'classement', x: 940, y: 40, w: 320, h: 400 },
    ];
    // Key for localStorage
    const LS_KEY = `projection-layout-v1`;
    // Load from localStorage if available
    const [elements, setElements] = useState(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = window.localStorage.getItem(LS_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.every(e => e.id && typeof e.x === 'number' && typeof e.y === 'number')) {
                        return parsed;
                    }
                }
            } catch (e) {
                // ignore
            }
        }
        return defaultElements.map(e => ({ ...e, z: 1 }));
    });

    // Save to localStorage on change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(LS_KEY, JSON.stringify(elements));
        }
    }, [elements]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [zoomFactors, setZoomFactors] = useState({ question: 1, classement: 1 });
    const [podiumKey, setPodiumKey] = useState(0);
    const [questionKey, setQuestionKey] = useState(0);
    const [baseUrl, setBaseUrl] = useState<string>("");
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const protocol = window.location.protocol;
            const host = window.location.host;
            setBaseUrl(`${protocol}//${host}`);
        }
    }, []);

    // Helper to update element position/size
    const updateElement = useCallback((id: string, update: Partial<{ x: number; y: number; w: number; h: number; z: number }>) => {
        setElements(prev => prev.map(e => e.id === id ? { ...e, ...update } : e));
    }, []);

    // Bring element to front (highest z)
    const bringToFront = useCallback((id: string) => {
        setElements(prev => {
            const maxZ = Math.max(...prev.map(e => e.z || 1), 1);
            return prev.map(e => e.id === id ? { ...e, z: maxZ + 1 } : e);
        });
    }, []);

    // Canonical: Only show QR code if there is no current question (like live/student page)
    const currentTournamentQuestion: QuestionDataForStudent | null = currentQuestion;
    const currentQuestionUid = currentQuestion?.uid;
    const tournamentUrl = code ? `${baseUrl}/live/${code}` : '';
    const shouldShowQRCode = {
        timer: false,
        question: !currentTournamentQuestion,
        classement: !hookLeaderboard || hookLeaderboard.length === 0,
    };

    return (
        <div className="main-content w-full max-w-none px-0" style={{ position: 'relative' }}>
            <DndContext
                modifiers={[restrictToWindowEdges]}
                onDragStart={event => {
                    const id = event.active.id as string;
                    setActiveId(id);
                    bringToFront(id);
                }}
                onDragEnd={event => {
                    const { active, delta } = event;
                    if (!active || !delta) return;
                    const id = active.id as string;
                    const element = elements.find(e => e.id === id);
                    if (!element) return;
                    updateElement(id, {
                        x: element.x + delta.x,
                        y: element.y + delta.y,
                    });
                    setActiveId(null);
                }}
            >
                <DraggableResizable
                    id="live-timer"
                    elements={elements}
                    updateElement={updateElement}
                    bringToFront={bringToFront}
                >
                    <div
                        className="rounded-full shadow-lg border border-primary flex items-center justify-center overflow-hidden relative"
                        style={{
                            background: 'var(--navbar)',
                            color: 'var(--primary-foreground)',
                            width: '100%',
                            height: '100%',
                            willChange: 'transform', // Optimize for frequent updates
                            transform: 'translateZ(0)', // Force GPU acceleration
                        }}
                        onClick={() => bringToFront("live-timer")}
                    >
                        <div className="flex items-center gap-2 w-full h-full justify-center">
                            <Timer className="w-8 h-8 block flex-shrink-0" style={{ color: 'var(--light-foreground)' }} />
                            <TimerDisplay timeLeftMs={timeLeftMs ?? null} />
                        </div>
                    </div>
                </DraggableResizable>
                <DraggableResizable
                    id="question"
                    elements={elements}
                    updateElement={updateElement}
                    bringToFront={bringToFront}
                >
                    <QuestionDisplay
                        currentTournamentQuestion={currentTournamentQuestion}
                        currentQuestionUid={currentQuestionUid}
                        gameState={gameState}
                        questionKey={questionKey}
                        zoomFactors={zoomFactors}
                        setZoomFactors={setZoomFactors}
                        correctAnswersData={correctAnswersData}
                        showStats={showStats}
                        currentStats={currentStats}
                        tournamentUrl={tournamentUrl}
                        code={code}
                        bringToFront={bringToFront}
                    />
                </DraggableResizable>
                <DraggableResizable
                    id="qrcode"
                    elements={elements}
                    updateElement={updateElement}
                    bringToFront={bringToFront}
                >
                    <div
                        className="card bg-base-100 rounded-lg shadow-xl flex flex-col items-center justify-center overflow-hidden relative"
                        style={{ width: '100%', height: '100%' }}
                        onClick={() => bringToFront("qrcode")}
                    >
                        <div className="card-body w-full h-full p-0 flex flex-col items-center justify-center">
                            <div className="w-full h-full flex flex-col items-center justify-center p-0">
                                <div className="bg-white p-0 rounded-lg w-full flex items-center justify-center" style={{ maxHeight: '85%', aspectRatio: '1/1' }}>
                                    <QrCodeWithLogo
                                        value={tournamentUrl}
                                        responsive={true}
                                    />
                                </div>
                                <div className="text-center mt-2" style={{ maxHeight: '15%' }}>
                                    <div className="font-mono font-bold text-xl">{code}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </DraggableResizable>
                <DraggableResizable
                    id="classement"
                    elements={elements}
                    updateElement={updateElement}
                    bringToFront={bringToFront}
                >
                    <LeaderboardDisplay
                        hookLeaderboard={hookLeaderboard}
                        correctAnswersData={correctAnswersData}
                        shouldShowQRCode={shouldShowQRCode.classement}
                        tournamentUrl={tournamentUrl}
                        code={code}
                        zoomFactors={zoomFactors}
                        setZoomFactors={setZoomFactors}
                        bringToFront={bringToFront}
                    />
                </DraggableResizable>
            </DndContext>
        </div>
    );
}
