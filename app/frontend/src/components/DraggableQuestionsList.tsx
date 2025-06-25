/**
 * Draggable Questions List Component
 * 
 * This component displays an interactive, drag-and-drop enabled list of quiz questions
 * for the teacher dashboard interface. It supports:
 * 
 * - Question reordering via drag and drop
 * - Play/pause/stop controls for each question
 * - Editing    // *** ADDED: Define the handler to immediately update the parent's localTimeLeftMs ***
    const handleImmediateLocalTimeUpdate = useCallback((newTime: number) => {
        logger.debug(`DraggableQuestionsList: Immediately setting localTimeLeftMs to ${newTime}`);estion timers (duration)
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
import { Socket } from 'socket.io-client';
import { createLogger } from '@/clientLogger';
import type { Question } from "@/types/api";
import { SortableQuestion } from './SortableQuestion';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

// Create a logger for this component
const logger = createLogger('DraggableQuestions');

// --- Types ---
interface DraggableQuestionsListProps {
    quizId: string;
    currentTournamentCode: string;
    quizSocket?: Socket | null; // Make quizSocket optional
    questions: Question[];
    currentQuestionIdx: number | null | undefined;
    isChronoRunning: boolean | undefined;
    isQuizEnded: boolean | undefined;
    questionActiveUid: string | null;
    onSelect: (uid: string) => void;
    onPlay: (uid: string, startTime: number) => void;
    onPause: () => void;
    onStop: () => void;
    onEditTimer: (uid: string, newTime: number) => void;
    onReorder?: (newQuestions: Question[]) => void;
    timerStatus?: 'play' | 'pause' | 'stop';
    timerQuestionUid?: string | null;
    timeLeftMs?: number;
    onTimerAction?: (info: { status: 'play' | 'pause' | 'stop'; questionUid: string; timeLeftMs: number }) => void;
    onImmediateUpdateActiveTimer?: (newTime: number) => void;
    disabled?: boolean;
    getStatsForQuestion?: (uid: string) => number[] | undefined; // Provide stats for each question
    expandedUids: Set<string>; // NEW: expanded question UIDs
    onToggleExpand: (uid: string) => void; // NEW: toggle handler
}

export default function DraggableQuestionsList({
    quizId,
    currentTournamentCode,
    quizSocket,
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
    timerQuestionUid,
    timeLeftMs,
    onTimerAction,
    onImmediateUpdateActiveTimer,
    disabled,
    getStatsForQuestion,
    expandedUids,
    onToggleExpand,
}: DraggableQuestionsListProps) {
    // Remove excessive logging that causes re-renders
    // React.useEffect(() => {
    //     logger.debug(`Timer status: ${timerStatus}, Timer question ID: ${timerQuestionUid}, Time left: ${timeLeftMs}`);
    // }, [timerStatus, timerQuestionUid, timeLeftMs]);

    // Remove render check logging that causes excessive re-renders
    // React.useEffect(() => {
    //     logger.debug(`[RENDER CHECK] DraggableQuestionsList re-rendered with timeLeftMs?: ${timeLeftMs}`);
    // }, [timeLeftMs]);

    // Ensure timeLeftMs has a default value
    const effectiveTimeLeft = timeLeftMs ?? 0;

    // Memoize the pause check function to prevent unnecessary re-renders
    const isQuestionPaused = useCallback((questionUid: string): boolean => {
        return (
            timerQuestionUid === questionUid &&
            timerStatus === 'pause' &&
            (typeof effectiveTimeLeft === 'number' && effectiveTimeLeft > 0)
        );
    }, [timerQuestionUid, timerStatus, effectiveTimeLeft]);

    // Ref to store the fallback timeout
    const fallbackResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Clear fallback timeout when the component unmounts
    React.useEffect(() => {
        return () => {
            if (fallbackResetTimeoutRef.current) {
                clearTimeout(fallbackResetTimeoutRef.current);
                fallbackResetTimeoutRef.current = null;
            }
        };
    }, []);

    const handlePlay = useCallback((questionUid: string, startTime: number) => {
        logger.info(`handlePlay called for questionUid: ${questionUid}, startTime: ${startTime}`);

        // Simply forward all play clicks to the dashboard without any filtering
        // The dashboard has the authoritative timer state and will handle all logic
        // IMPORTANT: Don't call onSelect here - let the dashboard handle selection after confirmation
        logger.info(`Forwarding to dashboard handlePlay: ${questionUid}, timeLeftMs: ${startTime}`);
        if (onPlay) onPlay(questionUid, startTime);
    }, [onPlay]);

    const handlePause = useCallback(() => {
        logger.info('handlePause called - forwarding to dashboard');
        if (onPause) onPause();
    }, [onPause]);

    const handleStop = useCallback(() => {
        logger.info('handleStop called - forwarding to dashboard');
        if (onStop) onStop();
    }, [onStop]);

    // --- Drag and drop logic is now disabled. ---
    // const sensors = useSensors(
    //     useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    // );
    // const handleDragEnd = useCallback((event: DragEndEvent) => {
    //     const { active, over } = event;
    //     if (!over || active.id === over.id) return;
    //     const oldIndex = questions.findIndex(q => String(q.uid) === active.id);
    //     const newIndex = questions.findIndex(q => String(q.uid) === over.id);
    //     if (oldIndex === -1 || newIndex === -1) return;
    //     const newQuestions = arrayMove(questions, oldIndex, newIndex);
    //     if (onReorder) onReorder(newQuestions);
    // }, [questions, onReorder]); // Add dependencies

    // *** ADDED: Define the handler to immediately update the parent's localTimeLeftMs ***
    const handleImmediateUpdate = useCallback((newTime: number) => {
        logger.debug(`DraggableQuestionsList: Immediately setting localTimeLeftMs to ${newTime}`);
        // Suppression de l'ancien état local du timer
        // setLocalTimeLeft(newTime);
    }, []);

    React.useEffect(() => {
        const handleQuizTimerUpdateStop = () => {
            logger.debug('Received quizTimerUpdateStop event, resetting isPending');
        };

        window.addEventListener('quizTimerUpdateStop', handleQuizTimerUpdateStop);

        return () => {
            window.removeEventListener('quizTimerUpdateStop', handleQuizTimerUpdateStop);
        };
    }, []);

    return (
        <>
            <ul className="space-y-4">
                {questions.length === 0 && <li key="no-questions">Aucune question pour ce quiz.</li>}
                {questions.map((q, idx) => {
                    const isActive = q.uid === questionActiveUid;
                    // Compute canonical durationMs: if this is the active question, use timeLeftMs when stopped, otherwise use q.timeLimit
                    let canonicalDurationMs = q.timeLimit;
                    if (isActive && timerStatus === 'stop' && typeof timeLeftMs === 'number' && timeLeftMs > 0) {
                        canonicalDurationMs = timeLeftMs;
                    }
                    return (
                        <SortableQuestion
                            key={q.uid}
                            q={q}
                            durationMs={canonicalDurationMs ?? 0}
                            isActive={isActive}
                            open={expandedUids.has(q.uid)}
                            setOpen={() => onToggleExpand(q.uid)}
                            onPlay={(uid, timerValue) => handlePlay(uid, timerValue)}
                            onEditTimer={(newTime) => onEditTimer(q.uid, newTime)}
                            onPause={handlePause}
                            onStop={handleStop}
                            liveTimeLeft={isActive ? effectiveTimeLeft : undefined}
                            liveStatus={isActive ? timerStatus : undefined}
                            onImmediateUpdateActiveTimer={handleImmediateUpdate}
                            disabled={disabled}
                            quizId={quizId}
                            currentTournamentCode={currentTournamentCode}
                            stats={getStatsForQuestion ? getStatsForQuestion(q.uid) : undefined}
                        />
                    );
                })}
            </ul>
        </>
    );
}
