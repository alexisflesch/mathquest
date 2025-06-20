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
    // Get socket connection
    const { socket } = useGameSocket(
        role as any,  // Cast to TimerRole
        gameId,
        { autoConnect: true }
    );

    // Use our new simple timer hook
    const timer = useSimpleTimer({
        gameId,
        accessCode,
        socket,
        role
    });

    // Format time for display
    const formatTime = (ms: number) => {
        const seconds = Math.ceil(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Sample questions for testing
    const sampleQuestions = [
        { uid: 'test-question-1', title: 'Question 1', duration: 30000 },
        { uid: 'test-question-2', title: 'Question 2', duration: 45000 },
        { uid: 'test-question-3', title: 'Question 3', duration: 60000 }
    ];

    return (
        <div className="p-6 border rounded-lg bg-white shadow-lg max-w-md">
            <h3 className="text-lg font-bold mb-4">Simple Timer Test ({role})</h3>

            {/* Connection Status */}
            <div className="mb-4">
                <span className={`px-2 py-1 rounded text-sm ${timer.isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {timer.isConnected ? 'Connected' : 'Disconnected'}
                </span>
            </div>

            {/* Timer Display */}
            <div className="mb-6 p-4 bg-gray-50 rounded">
                <div className="text-2xl font-mono font-bold">
                    {formatTime(timer.timeLeftMs)}
                </div>
                <div className="text-sm text-gray-600">
                    Status: <span className="font-semibold">{timer.status}</span>
                </div>
                {timer.questionUid && (
                    <div className="text-sm text-gray-600">
                        Question: <span className="font-semibold">{timer.questionUid}</span>
                    </div>
                )}
                <div className="text-sm text-gray-600">
                    Active: <span className="font-semibold">{timer.isActive ? 'Yes' : 'No'}</span>
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

                    {/* Timer Controls */}
                    <div>
                        <h4 className="font-semibold mb-2">Timer Controls:</h4>
                        <div className="flex gap-2">
                            <button
                                onClick={timer.pauseTimer}
                                disabled={!timer.isConnected || timer.status !== 'play'}
                                className="px-3 py-1 bg-yellow-500 text-white rounded disabled:opacity-50"
                            >
                                Pause
                            </button>
                            <button
                                onClick={timer.resumeTimer}
                                disabled={!timer.isConnected || timer.status !== 'pause'}
                                className="px-3 py-1 bg-green-500 text-white rounded disabled:opacity-50"
                            >
                                Resume
                            </button>
                            <button
                                onClick={timer.stopTimer}
                                disabled={!timer.isConnected || timer.status === 'stop'}
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
