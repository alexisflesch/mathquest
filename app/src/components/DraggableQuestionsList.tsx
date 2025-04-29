/**
 * Draggable Questions List Component
 * 
 * This component displays an interactive, drag-and-drop enabled list of quiz questions
 * for the teacher dashboard interface. It supports:
 * 
 * - Question reordering via drag and drop
 * - Play/pause/stop controls for each question
 * - Editing question timers (duration)
 * - Detailed question preview with correct/incorrect answers
 * - Real-time synchronization with quiz state
 * - Visual indicators for the currently active question
 * 
 * The component manages both local timers and synchronizes with the server-side
 * quiz state to ensure consistent behavior when controlling live quizzes.
 * 
 * This is a central component of the teacher's quiz management interface.
 */

import React, { useState, useCallback, useRef } from "react";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Question } from "../types";
import { createLogger } from '@/clientLogger';
import { SortableQuestion } from './SortableQuestion';

// Create a logger for this component
const logger = createLogger('DraggableQuestions');

// --- Types ---
interface DraggableQuestionsListProps {
    questions: Question[];
    currentQuestionIdx: number | null | undefined;
    isChronoRunning: boolean | undefined;
    isQuizEnded: boolean | undefined;
    questionActiveUid: string | null;
    onSelect: (uid: string) => void;
    onPlay: (uid: string, startTime: number) => void;
    onPause: () => void;
    onStop: () => void;
    // Change: onEditTimer now takes uid instead of idx
    onEditTimer: (uid: string, newTime: number) => void;
    onReorder?: (newQuestions: Question[]) => void;
    timerStatus?: 'play' | 'pause' | 'stop';
    timerQuestionId?: string | null;
    timeLeft?: number;
    onTimerAction?: (info: { status: 'play' | 'pause' | 'stop'; questionId: string; timeLeft: number }) => void;
    onImmediateUpdateActiveTimer?: (newTime: number) => void;
    disabled?: boolean;
}

export default function DraggableQuestionsList({
    questions,
    currentQuestionIdx,
    isChronoRunning,
    isQuizEnded, // Although not directly used here, accept it if passed
    questionActiveUid,
    onSelect,
    onPlay,
    onPause,
    onStop,
    onEditTimer,
    onReorder,
    timerStatus,
    timerQuestionId,
    timeLeft,
    onTimerAction,
    onImmediateUpdateActiveTimer,
    disabled,
}: DraggableQuestionsListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );
    const [openUid, setOpenUid] = useState<string | null>(null);
    const [localStatus, setLocalStatus] = React.useState<'play' | 'pause' | 'stop'>(timerStatus || 'stop');
    const [localQuestionId, setLocalQuestionId] = React.useState<string | null>(timerQuestionId || null);
    const [localTimeLeft, setLocalTimeLeft] = React.useState<number>(timeLeft || 0);
    const timerRef = React.useRef<NodeJS.Timeout | null>(null);

    // Add a local state to track edited timers immediately
    const [localEditedTimers, setLocalEditedTimers] = useState<Record<string, number>>({});

    // Log timer prop changes for debugging
    React.useEffect(() => {
        logger.debug('Timer state updated', { timerStatus, timerQuestionId, timeLeft });
    }, [timerStatus, timerQuestionId, timeLeft]);

    // Sync local timer with props and always restart interval if needed
    React.useEffect(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setLocalStatus(timerStatus || 'stop');
        setLocalQuestionId(timerQuestionId || null);
        setLocalTimeLeft(typeof timeLeft === 'number' ? timeLeft : 0);
        if (
            timerStatus === 'play' &&
            timerQuestionId &&
            typeof timeLeft === 'number' &&
            timeLeft > 0
        ) {
            logger.debug('Starting timer interval', { timerStatus, timerQuestionId, timeLeft });
            timerRef.current = setInterval(() => {
                setLocalTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        setLocalStatus('stop');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            logger.debug('Not starting timer interval', { timerStatus, timerQuestionId, timeLeft });
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [timerStatus, timerQuestionId, timeLeft]);

    // Add back the isQuestionPaused helper function
    const isQuestionPaused = useCallback((questionId: string): boolean => {
        return (
            localQuestionId === questionId &&
            localStatus === 'pause' &&
            localTimeLeft > 0
        );
    }, [localQuestionId, localStatus, localTimeLeft]);

    // Fix the handlePlay function to properly use the timer value passed as startTime
    const handlePlay = useCallback((questionId: string, startTime: number) => {
        // Find the question in the questions array
        const idx = questions.findIndex(q => q.uid === questionId);
        if (idx === -1) return;

        const currentQuestion = questions[idx];
        logger.info(`Playing question ${questionId} - current q.temps=${currentQuestion.temps}, startTime=${startTime}`);

        const isPaused = isQuestionPaused(questionId);

        if (isPaused) {
            // Resume logic remains the same
            logger.info(`Resuming paused timer for question ${questionId}`);
            setLocalStatus('play');
            setLocalQuestionId(questionId);

            if (onTimerAction) {
                const resumeTime = localTimeLeft;
                logger.debug(`Resuming with timeLeft: ${resumeTime} (from component's localTimeLeft state)`);
                onTimerAction({ status: 'play', questionId, timeLeft: resumeTime });
            } else {
                if (onPlay) onPlay(questionId, localTimeLeft);
            }
        } else {
            // IMPORTANT: Use the startTime parameter that's passed in
            // This now contains the correct timer value from localStorage
            logger.info(`Starting new timer for question ${questionId} with time ${startTime}s (from startTime parameter)`);
            setLocalStatus('play');
            setLocalQuestionId(questionId);
            setLocalTimeLeft(startTime);

            if (onTimerAction) {
                onTimerAction({ status: 'play', questionId, timeLeft: startTime });
            } else {
                if (onPlay) onPlay(questionId, startTime);
            }
        }
    }, [questions, isQuestionPaused, onTimerAction, localTimeLeft, onPlay]);

    const handlePause = useCallback(() => {
        setLocalStatus('pause');
        if (onTimerAction) {
            onTimerAction({ status: 'pause', questionId: localQuestionId!, timeLeft: localTimeLeft });
        }
        // Assuming onPause prop doesn't need memoization here if it comes from higher up and is stable
    }, [onTimerAction, localQuestionId, localTimeLeft]); // Add dependencies

    const handleStop = useCallback(() => {
        setLocalStatus('stop');
        setLocalTimeLeft(0);
        if (onTimerAction) {
            onTimerAction({ status: 'stop', questionId: localQuestionId!, timeLeft: 0 });
        }
        // Assuming onStop prop doesn't need memoization here if it comes from higher up and is stable
    }, [onTimerAction, localQuestionId]); // Add dependencies

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = questions.findIndex(q => String(q.uid) === active.id);
        const newIndex = questions.findIndex(q => String(q.uid) === over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        const newQuestions = arrayMove(questions, oldIndex, newIndex);
        if (onReorder) onReorder(newQuestions);
    }, [questions, onReorder]); // Add dependencies

    // *** ADDED: Define the handler to immediately update the parent's localTimeLeft ***
    const handleImmediateUpdate = useCallback((newTime: number) => {
        logger.debug(`DraggableQuestionsList: Immediately setting localTimeLeft to ${newTime}`);
        setLocalTimeLeft(newTime);
    }, []);

    // Create a ref to store stable callback functions by question UID
    const stableCallbacksRef = useRef<Map<string, {
        setOpen: () => void;
        onPlay: () => void;
        onSelect: () => void;
        onEditTimer: (newTime: number) => void;
    }>>(new Map());

    // Create or update stable callbacks when questions change
    React.useEffect(() => {
        const currentCallbacks = stableCallbacksRef.current;
        const updatedCallbacks = new Map(currentCallbacks);

        // Create/update callbacks for each question
        questions.forEach((q) => {
            updatedCallbacks.set(q.uid, {
                setOpen: () => setOpenUid(prev => prev === q.uid ? null : q.uid),
                onPlay: () => {
                    // Try to get the most recent timer value from localStorage
                    let timerValue = q.temps ?? 20;
                    const storedValue = window.localStorage.getItem(`question_timer_${q.uid}`);

                    if (storedValue) {
                        const parsedValue = parseInt(storedValue, 10);
                        if (!isNaN(parsedValue)) {
                            timerValue = parsedValue;
                            logger.info(`Found timer value in localStorage: ${timerValue}s for question ${q.uid}`);
                            // Clean up after ourselves
                            window.localStorage.removeItem(`question_timer_${q.uid}`);
                        }
                    }

                    // Call handlePlay with the most accurate timer value
                    handlePlay(q.uid, timerValue);
                },
                onSelect: () => onSelect(q.uid),
                onEditTimer: (newTime: number) => {
                    logger.info(`Editing timer for question ${q.uid} to ${newTime}s`);
                    if (onEditTimer) onEditTimer(q.uid, newTime);
                }
            });
        });

        // Remove callbacks for questions that no longer exist
        Array.from(updatedCallbacks.keys()).forEach(uid => {
            if (!questions.some(q => q.uid === uid)) {
                updatedCallbacks.delete(uid);
            }
        });

        stableCallbacksRef.current = updatedCallbacks;
    }, [questions, handlePlay, openUid, setOpenUid, onSelect, onEditTimer]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd} // Use memoized handler
        >
            <SortableContext items={questions.map(q => String(q.uid))} strategy={verticalListSortingStrategy}>
                <ul className="space-y-4">
                    {questions.length === 0 && <li>Aucune question pour ce quiz.</li>}
                    {questions.map((q, idx) => {
                        const isActive = q.uid === questionActiveUid;

                        // Get stable callbacks for this question from the ref
                        const stableCallbacks = stableCallbacksRef.current.get(q.uid) || {
                            setOpen: () => setOpenUid(openUid === q.uid ? null : q.uid),
                            onPlay: () => handlePlay(q.uid, q.temps ?? 20),
                            onSelect: () => onSelect(q.uid),
                            onEditTimer: (newTime: number) => {
                                if (onEditTimer) onEditTimer(q.uid, newTime);
                            }
                        };

                        return (
                            <SortableQuestion
                                key={q.uid}
                                q={q}
                                idx={idx}
                                isActive={isActive}
                                isRunning={currentQuestionIdx === idx ? isChronoRunning : false}
                                open={openUid === q.uid}
                                setOpen={stableCallbacks.setOpen}
                                onPlay={stableCallbacks.onPlay}
                                onSelect={stableCallbacks.onSelect}
                                onEditTimer={stableCallbacks.onEditTimer}
                                onPause={handlePause}
                                onStop={handleStop}
                                liveTimeLeft={isActive ? localTimeLeft : undefined}
                                liveStatus={isActive ? localStatus : undefined}
                                onImmediateUpdateActiveTimer={handleImmediateUpdate}
                                disabled={disabled}
                            />
                        );
                    })}
                </ul>
            </SortableContext>
        </DndContext>
    );
}
