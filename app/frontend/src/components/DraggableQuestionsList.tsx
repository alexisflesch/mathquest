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
import type { Question } from "@/types/api";
import { createLogger } from '@/clientLogger';
import { SortableQuestion } from './SortableQuestion';
import { Socket } from 'socket.io-client';
import ConfirmDialog from "@/components/ConfirmDialog";

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
    // Change: onEditTimer now takes uid instead of idx
    onEditTimer: (uid: string, newTime: number) => void;
    onReorder?: (newQuestions: Question[]) => void;
    timerStatus?: 'play' | 'pause' | 'stop';
    timerQuestionId?: string | null;
    timeLeft?: number;
    onTimerAction?: (info: { status: 'play' | 'pause' | 'stop'; questionId: string; timeLeft: number }) => void;
    onImmediateUpdateActiveTimer?: (newTime: number) => void;
    disabled?: boolean;
    onShowResults?: (uid: string) => void;
    showResultsDisabled?: (uid: string) => boolean;
    onStatsToggle?: (uid: string, show: boolean) => void; // NEW: stats toggle handler
    getStatsForQuestion?: (uid: string) => number[] | undefined; // Provide stats for each question
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
    timeLeft,
    onTimerAction,
    onImmediateUpdateActiveTimer,
    disabled,
    onShowResults,
    showResultsDisabled,
    onStatsToggle,
    getStatsForQuestion,
}: DraggableQuestionsListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );
    const [openUid, setOpenUid] = useState<string | null>(null);
    // Add the missing state variable for tracking pending status
    const [isPendingMap, setPendingMap] = useState<Record<string, boolean>>({});
    // Add the missing ref for tracking timeout IDs
    const pendingTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

    // Add state for confirmation dialog
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        questionId: string;
        startTime: number;
    }>({
        isOpen: false,
        questionId: "",
        startTime: 0
    });

    React.useEffect(() => {
        logger.debug(`Timer status: ${timerStatus}, Timer question ID: ${timerQuestionId}, Time left: ${timeLeft}`);
    }, [timerStatus, timerQuestionId, timeLeft]);

    // Add logging to confirm re-renders
    React.useEffect(() => {
        logger.debug(`[RENDER CHECK] DraggableQuestionsList re-rendered with timeLeft: ${timeLeft}`);
    }, [timeLeft]);

    // Ensure timeLeft has a default value
    const effectiveTimeLeft = timeLeft ?? 0;

    // Helper pour savoir si la question est en pause
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
                    timeLeft: startTime,
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
                // When resuming a paused question, always use the timeLeft from server state
                // This ensures we don't reset the timer to the full duration
                if (timerQuestionId === questionId && timerStatus === 'pause' && effectiveTimeLeft !== null) {
                    logger.info(`Resuming paused question: ${questionId}, using server timeLeft: ${effectiveTimeLeft}s`);
                    onTimerAction({
                        status: 'play',
                        questionId,
                        timeLeft: effectiveTimeLeft, // Use the server's timeLeft value for consistency
                    });
                } else {
                    // Normal start - for non-paused questions
                    logger.info(`Starting question: ${questionId}, timeLeft: ${startTime}s`);
                    onTimerAction({
                        status: 'play',
                        questionId,
                        timeLeft: startTime,
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
                    // When resuming from pause, use the backend's timeLeft value
                    if (onPlay) onPlay(questionId, effectiveTimeLeft ?? startTime);
                } else {
                    logger.info(`Starting question: ${questionId} from stopped state, timeLeft: ${startTime}s`);
                    if (onPlay) onPlay(questionId, startTime);
                }
            } else {
                logger.info(`Playing new question: ${questionId}, timeLeft: ${startTime}s`);
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
                timeLeft: startTime,
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
                timeLeft: effectiveTimeLeft || 0,
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
                timeLeft: 0,
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
        // Suppression de l'ancien état local du timer
        // setLocalTimeLeft(newTime);
    }, []);

    // Create a ref to store stable callback functions by question UID
    const stableCallbacksRef = useRef<Map<string, {
        setOpen: () => void;
        onPlay: (uid: string, timerValue: number) => void;
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
                onPlay: (uid: string, timerValue: number) => {
                    handlePlay(uid, timerValue);
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

    // Ajouter un effet pour surveiller les changements de questionActiveUid
    React.useEffect(() => {
        logger.debug(`questionActiveUid changed to: ${questionActiveUid}`);

        // Vérifier si la question est bien dans la liste
        if (questionActiveUid) {
            const question = questions.find(q => q.uid === questionActiveUid);
            if (question) {
                // Use question.text as per the shared BaseQuestion type
                logger.debug(`Question active found: ${question.text.substring(0, 20)}...`);
            } else {
                logger.warn(`Question active ${questionActiveUid} NOT found in questions array!`);
            }
        }
    }, [questionActiveUid, questions]);

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
            if (data.status === 'success' || data.status === 'error') {
                logger.debug(`Resetting isPending to false for response: ${JSON.stringify(data)}`);

                // Reset all pending questions to false
                setPendingMap({});

                // Clear all pending timeouts
                Object.keys(pendingTimeoutsRef.current).forEach(questionId => {
                    clearTimeout(pendingTimeoutsRef.current[questionId]);
                    delete pendingTimeoutsRef.current[questionId];
                });

                // Clear any existing fallback timeout to prevent unnecessary warnings
                if (fallbackResetTimeoutRef.current) {
                    logger.debug('Clearing fallback timeout after receiving valid response');
                    clearTimeout(fallbackResetTimeoutRef.current);
                    fallbackResetTimeoutRef.current = null;
                }
            } else {
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
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd} // Use memoized handler
            >
                <SortableContext items={questions.map(q => String(q.uid))} strategy={verticalListSortingStrategy}>
                    <ul className="space-y-4">
                        {questions.length === 0 && <li key="no-questions">Aucune question pour ce quiz.</li>}
                        {questions.map((q, idx) => {
                            const isActive = q.uid === questionActiveUid;

                            // Get stable callbacks for this question from the ref
                            const stableCallbacks = stableCallbacksRef.current.get(q.uid) || {
                                setOpen: () => setOpenUid(openUid === q.uid ? null : q.uid),
                                onPlay: (uid: string, timerValue: number) => handlePlay(uid, timerValue),
                                onSelect: () => onSelect(q.uid),
                                onEditTimer: (newTime: number) => {
                                    if (onEditTimer) onEditTimer(q.uid, newTime);
                                }
                            };

                            return (
                                <SortableQuestion
                                    key={q.uid}
                                    q={q}
                                    isActive={isActive}
                                    open={openUid === q.uid}
                                    setOpen={stableCallbacks.setOpen}
                                    onPlay={stableCallbacks.onPlay}
                                    onEditTimer={stableCallbacks.onEditTimer}
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
                </SortableContext>
            </DndContext>
        </>
    );
}
