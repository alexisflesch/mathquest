/**
 * Simple Timer Test Component
 * 
 * This component demonstrates the new simple timer hook in action
 * and can be used to test the timer functionality manually.
 */

'use client';

import React from 'react';
import { useSimpleTimer } from '@/hooks/useSimpleTimer';
import { useGameSocket } from '@/hooks/useGameSocket';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

interface SimpleTimerTestProps {
    gameId: string;
    accessCode: string;
    role: 'teacher' | 'student' | 'projection';
}

export function SimpleTimerTest({ gameId, accessCode, role }: SimpleTimerTestProps) {
    // Sample questions for testing
    const sampleQuestions = [
        { uid: 'test-question-1', title: 'Question 1', duration: 30000 },
        { uid: 'test-question-2', title: 'Question 2', duration: 45000 },
        { uid: 'test-question-3', title: 'Question 3', duration: 60000 }
    ];

    // Get socket connection
    const { socket } = useGameSocket(
        role as any,  // Cast to TimerRole
        gameId,
        { autoConnect: true }
    );

    // Use canonical per-question timer state
    const timer = useSimpleTimer({
        gameId,
        accessCode,
        socket,
        role
    });

    // For demo: select the first sample question
    const currentQuestionUid = sampleQuestions[0].uid;
    const timerState = timer.getTimerState(currentQuestionUid);

    // Format time for display
    const formatTime = (ms: number | undefined) => {
        if (typeof ms !== 'number') return '--:--';
        const seconds = Math.ceil(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="p-6 border rounded-lg bg-white shadow-lg max-w-md">
            <h3 className="text-lg font-bold mb-4">Simple Timer Test ({role})</h3>

            {/* Connection Status */}
            <div className="mb-4">
                <span className={`px-2 py-1 rounded text-sm ${timer.isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {timer.isConnected ? 'Connected' : 'Disconnected'}
                </span>
            </div>

            {/* Timer Display (canonical per-question) */}
            <div className="mb-6 p-4 bg-gray-50 rounded">
                <div className="text-2xl font-mono font-bold">
                    {formatTime(timerState?.timeLeftMs)}
                </div>
                <div className="text-sm text-gray-600">
                    Status: <span className="font-semibold">{timerState?.status ?? '--'}</span>
                </div>
                {timerState?.questionUid && (
                    <div className="text-sm text-gray-600">
                        Question: <span className="font-semibold">{timerState.questionUid}</span>
                    </div>
                )}
                <div className="text-sm text-gray-600">
                    Active: <span className="font-semibold">{timerState?.isActive ? 'Yes' : 'No'}</span>
                </div>
            </div>

            {/* Teacher Controls */}
            {role === 'teacher' && (
                <div className="space-y-4">
                    {/* Question Selection */}
                    <div>
                        <h4 className="font-semibold mb-2">Start Timer for Question:</h4>
                        <div className="space-y-2">
                            {sampleQuestions.map((q) => (
                                <button
                                    key={q.uid}
                                    onClick={() => timer.startTimer(q.uid, q.duration)}
                                    disabled={!timer.isConnected}
                                    className="block w-full text-left p-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                                >
                                    {q.title} ({Math.floor(q.duration / 1000)}s)
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Timer Controls (canonical per-question) */}
                    <div>
                        <h4 className="font-semibold mb-2">Timer Controls:</h4>
                        <div className="flex gap-2">
                            <button
                                onClick={timer.pauseTimer}
                                disabled={!timer.isConnected || timerState?.status !== 'run'}
                                className="px-3 py-1 bg-yellow-500 text-white rounded disabled:opacity-50"
                            >
                                Pause
                            </button>
                            <button
                                onClick={() => {
                                    // Canonical resume: re-run timer with current question and time left
                                    if (timerState?.status === 'pause' && timerState?.questionUid) {
                                        timer.startTimer(timerState.questionUid, timerState.timeLeftMs ?? 0);
                                    }
                                }}
                                disabled={!timer.isConnected || timerState?.status !== 'pause'}
                                className="px-3 py-1 bg-green-500 text-white rounded disabled:opacity-50"
                            >
                                Resume
                            </button>
                            <button
                                onClick={timer.stopTimer}
                                disabled={!timer.isConnected || timerState?.status === 'stop'}
                                className="px-3 py-1 bg-red-500 text-white rounded disabled:opacity-50"
                            >
                                Stop
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Non-teacher view */}
            {role !== 'teacher' && (
                <div className="text-gray-600 text-center">
                    <p>Timer display only</p>
                    <p className="text-sm">({role} role cannot control timer)</p>
                </div>
            )}
        </div>
    );
}
