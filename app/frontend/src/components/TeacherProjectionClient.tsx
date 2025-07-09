"use client";
import React, { useEffect, useState } from "react";
import { DndContext, useDraggable } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { Resizable } from 're-resizable';
import { createLogger } from '@/clientLogger';
import { useProjectionQuizSocket } from '@/hooks/useProjectionQuizSocket';
import QuestionCard from '@/components/QuestionCard';
import { Timer, ChevronDown, ChevronRight } from 'lucide-react';
import QRCode from 'react-qr-code';
import ClassementPodium from '@/components/ClassementPodium';
import ZoomControls from '@/components/ZoomControls';
import type { TournamentQuestion } from '@shared/types';
import { questionDataForStudentSchema } from '@shared/types/socketEvents.zod';
import type { z } from 'zod';
type QuestionDataForStudent = z.infer<typeof questionDataForStudentSchema>;
import { QUESTION_TYPES } from '@shared/types';

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
    // Track animation state for podium
    const [shouldAnimatePodium, setShouldAnimatePodium] = useState(false);
    useEffect(() => {
        if (leaderboardUpdateTrigger > 0) {
            setShouldAnimatePodium(true);
            // Optionally reset after animation duration (e.g. 2s)
            const timeout = setTimeout(() => setShouldAnimatePodium(false), 2000);
            return () => { clearTimeout(timeout); };
        }
        return undefined;
    }, [leaderboardUpdateTrigger]);
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

    // Bring element to front (highest z)
    const bringToFront = (id: string) => {
        setElements(prev => {
            const maxZ = Math.max(...prev.map(e => e.z || 1), 1);
            return prev.map(e => e.id === id ? { ...e, z: maxZ + 1 } : e);
        });
    };

    // Helper to update element position/size
    const updateElement = (id: string, update: Partial<{ x: number; y: number; w: number; h: number; z: number }>) => {
        setElements(prev => prev.map(e => e.id === id ? { ...e, ...update } : e));
    };

    // DnD-kit drag logic
    function DraggableResizable({ id, children }: { id: string; children: React.ReactNode }) {
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
            zIndex: element?.z ?? 1,
            touchAction: 'none',
            transform: dragTransform,
            transition: isDragging ? 'none' : 'transform 0.2s',
            background: 'transparent',
        };
        // Only allow resizing from the bottom-right corner, add a resize icon
        return (
            <Resizable
                size={{ width: element?.w ?? 200, height: element?.h ?? 100 }}
                onResizeStop={(_e, dir, ref, d) => {
                    // Only bottom-right, so no x/y update needed
                    updateElement(id, {
                        w: (element?.w ?? 200) + d.width,
                        h: (element?.h ?? 100) + d.height,
                    });
                }}
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
                            {/* ChevronRight rotated 45deg for resize handle */}
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
    }

    // Canonical: Only show QR code if there is no current question (like live/student page)
    const currentTournamentQuestion: QuestionDataForStudent | null = currentQuestion;
    const currentQuestionUid = currentQuestion?.uid;
    const tournamentUrl = code ? `${baseUrl}/live/${code}` : '';
    const shouldShowQRCode = {
        timer: false,
        question: !currentTournamentQuestion,
        classement: !hookLeaderboard || hookLeaderboard.length === 0,
    };

    // Canonical: build stats array exactly as in TeacherDashboardClient
    let statsArray: number[] = [];
    let totalAnswers = 0;
    let numOptions = 0;
    if (currentTournamentQuestion && Array.isArray(currentTournamentQuestion.answerOptions)) {
        numOptions = currentTournamentQuestion.answerOptions.length;
        if (numOptions > 0 && currentStats && typeof currentStats === 'object') {
            for (let i = 0; i < numOptions; i++) {
                const count = currentStats[i.toString()] || 0;
                statsArray.push(count);
                totalAnswers += count;
            }
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
                <DraggableResizable id="live-timer">
                    <div
                        className="rounded-full shadow-lg border border-primary flex items-center justify-center overflow-hidden relative"
                        style={{
                            background: 'var(--navbar)',
                            color: 'var(--primary-foreground)',
                            width: '100%',
                            height: '100%',
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
                </DraggableResizable>
                <DraggableResizable id="question">
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
                        <div className="card-body w-full h-full p-4 overflow-auto">
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
                </DraggableResizable>
                <DraggableResizable id="qrcode">
                    <div
                        className="card bg-base-100 rounded-lg shadow-xl flex flex-col items-center justify-center overflow-hidden relative"
                        style={{ width: '100%', height: '100%' }}
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
                </DraggableResizable>
                <DraggableResizable id="classement">
                    <div
                        className="card bg-base-100 rounded-lg shadow-xl flex flex-col items-center justify-center relative"
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
                                        key="leaderboard-podium"
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
                                        animate={shouldAnimatePodium}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </DraggableResizable>
            </DndContext>
        </div>
    );
}
