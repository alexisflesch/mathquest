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
import ConfirmDialog from "@/components/ConfirmDialog";
import { createLogger } from '@/clientLogger';
import type { Question } from "@/types/api";
import { SortableQuestion } from './SortableQuestion';

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
    timerQuestionId?: string | null;
    timeLeftMs?: number;
    onTimerAction?: (info: { status: 'play' | 'pause' | 'stop'; questionId: string; timeLeftMs: number }) => void;
    onImmediateUpdateActiveTimer?: (newTime: number) => void;
    disabled?: boolean;
    onShowResults?: (uid: string) => void;
    showResultsDisabled?: (uid: string) => boolean;
    onStatsToggle?: (uid: string, show: boolean) => void; // NEW: stats toggle handler
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
    timerQuestionId,
    timeLeftMs,
    onTimerAction,
    onImmediateUpdateActiveTimer,
    disabled,
    onShowResults,
    showResultsDisabled,
    onStatsToggle,
    getStatsForQuestion,
    expandedUids,
    onToggleExpand,
}: DraggableQuestionsListProps) {
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        questionId: string;
        startTime: number;
    }>({
        isOpen: false,
        questionId: "",
        startTime: 0
    });

    // Remove excessive logging that causes re-renders
    // React.useEffect(() => {
    //     logger.debug(`Timer status: ${timerStatus}, Timer question ID: ${timerQuestionId}, Time left: ${timeLeftMs}`);
    // }, [timerStatus, timerQuestionId, timeLeftMs]);

    // Remove render check logging that causes excessive re-renders
    // React.useEffect(() => {
    //     logger.debug(`[RENDER CHECK] DraggableQuestionsList re-rendered with timeLeftMs?: ${timeLeftMs}`);
    // }, [timeLeftMs]);

    // Ensure timeLeftMs has a default value
    const effectiveTimeLeft = timeLeftMs ?? 0;

    // Memoize the pause check function to prevent unnecessary re-renders
    const isQuestionPaused = useCallback((questionId: string): boolean => {
        return (
            timerQuestionId === questionId &&
            timerStatus === 'pause' &&
            (typeof effectiveTimeLeft === 'number' && effectiveTimeLeft > 0)
        );
    }, [timerQuestionId, timerStatus, effectiveTimeLeft]);

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

    const handlePlay = useCallback((questionId: string, startTime: number) => {
        logger.info(`handlePlay called for questionId: ${questionId}, startTime: ${startTime}`);

        // Check if the current question's timer has naturally expired
        const timerHasExpired = timerQuestionId &&
            (effectiveTimeLeft === 0 || effectiveTimeLeft === null) &&
            timerStatus !== 'play';

        // If the timer for the current question has reached zero, no need for confirmation
        if (timerHasExpired) {
            logger.info(`Current question timer has expired, switching directly to: ${questionId}`);
            onSelect(questionId);
            if (onTimerAction) {
                onTimerAction({
                    status: 'play',
                    questionId,
                    timeLeftMs: startTime,
                });
            }
            return;
        }

        // If there is an active question with a running or paused timer with time left,
        // confirm the switch to avoid accidental question changes
        if (timerQuestionId &&
            timerQuestionId !== questionId &&
            ((timerStatus === 'play' && effectiveTimeLeft > 0) ||
                (timerStatus === 'pause' && effectiveTimeLeft > 0))) {

            // Open the confirmation dialog instead of using window.confirm()
            setConfirmDialog({
                isOpen: true,
                questionId: questionId,
                startTime: startTime
            });
            return;
        } else {
            // Regular scenario - no active question or same question
            if (onTimerAction) {
                // When resuming a paused question, always use the timeLeftMs from server state
                // This ensures we don't reset the timer to the full duration
                if (timerQuestionId === questionId && timerStatus === 'pause' && effectiveTimeLeft !== null) {
                    logger.info(`Resuming paused question: ${questionId}, using server timeLeftMs?: ${effectiveTimeLeft}s`);
                    onTimerAction({
                        status: 'play',
                        questionId,
                        timeLeftMs: effectiveTimeLeft, // Use the server's timeLeft value for consistency
                    });
                } else {
                    // Normal start - for non-paused questions
                    logger.info(`Starting question: ${questionId}, timeLeftMs?: ${startTime}s`);
                    onTimerAction({
                        status: 'play',
                        questionId,
                        timeLeftMs: startTime,
                    });
                }
            } else {
                logger.warn('onTimerAction is not defined. Cannot emit quiz_set_question.');
            }

            logger.info(`Setting active question in UI to: ${questionId}`);
            onSelect(questionId);

            if (timerQuestionId === questionId) {
                if (timerStatus === 'play') {
                    logger.info(`Pausing question: ${questionId}`);
                    if (onPause) onPause();
                } else if (timerStatus === 'pause') {
                    logger.info(`Resuming question: ${questionId}`);
                    // When resuming from pause, use the backend's timeLeftMs value
                    if (onPlay) onPlay(questionId, effectiveTimeLeft ?? startTime);
                } else {
                    logger.info(`Starting question: ${questionId} from stopped state, timeLeftMs?: ${startTime}s`);
                    if (onPlay) onPlay(questionId, startTime);
                }
            } else {
                logger.info(`Playing new question: ${questionId}, timeLeftMs?: ${startTime}s`);
                if (onPlay) onPlay(questionId, startTime);
            }
        }
    }, [timerQuestionId, timerStatus, effectiveTimeLeft, onPause, onPlay, onTimerAction, onSelect, quizSocket]);

    // Handler for confirmation dialog confirm action
    const handleConfirmationConfirm = useCallback(() => {
        const { questionId, startTime } = confirmDialog;

        logger.info(`User confirmed switch to question ${questionId}`);

        if (onTimerAction) {
            onTimerAction({
                status: 'play',
                questionId,
                timeLeftMs: startTime,
            });
        }

        logger.info(`Setting active question in UI to: ${questionId}`);
        onSelect(questionId);

        // Close the dialog
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    }, [confirmDialog, onTimerAction, onSelect]);

    // Handler for confirmation dialog cancel action
    const handleConfirmationCancel = useCallback(() => {
        logger.info(`User canceled switch to question ${confirmDialog.questionId}`);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    }, [confirmDialog.questionId]);

    const handlePause = useCallback(() => {
        logger.info('handlePause called');

        // Emit quiz_timer_action with status: 'pause'
        if (onTimerAction) {
            logger.info('Emitting quiz_timer_action for pause');
            onTimerAction({
                status: 'pause',
                questionId: timerQuestionId || '',
                timeLeftMs: effectiveTimeLeft || 0,
            });
        } else {
            logger.warn('onTimerAction is not defined. Cannot emit quiz_timer_action for pause.');
        }
    }, [onTimerAction, timerQuestionId, effectiveTimeLeft]);

    const handleStop = useCallback(() => {
        logger.info('handleStop called');

        // Emit quiz_timer_action with status: 'stop'
        if (onTimerAction) {
            logger.info('Emitting quiz_timer_action for stop');
            onTimerAction({
                status: 'stop',
                questionId: timerQuestionId || '',
                timeLeftMs: 0,
            });
        } else {
            logger.warn('onTimerAction is not defined. Cannot emit quiz_timer_action for stop.');
        }

        if (onStop) {
            onStop();
        } else {
            logger.warn('onStop is not defined. Cannot handle stop action.');
        }
    }, [onTimerAction, timerQuestionId, onStop]);

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

    // Centralize quiz_action_response handling for all actions
    React.useEffect(() => {
        if (!quizSocket) {
            logger.warn('quizSocket is not available. Cannot listen for quiz_action_response.');
            return;
        }

        const handleQuizActionResponse = (data: { status: string; message: string }) => {
            // Enhanced debugging for quiz_action_response handling
            logger.debug('Received quiz_action_response from quizSocket:', data);
            // No-op: removed legacy setPendingMap and pendingTimeoutsRef logic
            if (!(data.status === 'success' || data.status === 'error')) {
                logger.warn(`Unexpected quiz_action_response received: ${JSON.stringify(data)}`);
            }
        };

        quizSocket.on('quiz_action_response', handleQuizActionResponse);

        return () => {
            quizSocket.off('quiz_action_response', handleQuizActionResponse);
        };
    }, [quizSocket]);

    return (
        <>
            <ConfirmDialog
                open={confirmDialog.isOpen}
                title="Changer de question"
                message="Une question est actuellement active. Voulez-vous passer à une autre question? Le temps sera réinitialisé."
                onConfirm={handleConfirmationConfirm}
                onCancel={handleConfirmationCancel}
            />
            <ul className="space-y-4">
                {questions.length === 0 && <li key="no-questions">Aucune question pour ce quiz.</li>}
                {questions.map((q, idx) => {
                    const isActive = q.uid === questionActiveUid;
                    return (
                        <SortableQuestion
                            key={q.uid}
                            q={q}
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
                            onShowResults={onShowResults ? () => onShowResults(q.uid) : undefined}
                            showResultsDisabled={showResultsDisabled ? showResultsDisabled(q.uid) : false}
                            onStatsToggle={onStatsToggle ? (show) => onStatsToggle(q.uid, show) : undefined}
                            stats={getStatsForQuestion ? getStatsForQuestion(q.uid) : undefined}
                            quizId={quizId}
                            currentTournamentCode={currentTournamentCode}
                        />
                    );
                })}
            </ul>
        </>
    );
}
