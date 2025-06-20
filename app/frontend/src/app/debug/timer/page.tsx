/**
 * Timer Debug Page
 * 
 * Simple page to test timer functionality in isolation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { createLogger } from '@/clientLogger';
import { useTeacherQuizSocket } from '@/hooks/useTeacherQuizSocket';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

const logger = createLogger('TimerDebugPage');

export default function TimerDebugPage() {
    const [gameId, setGameId] = useState<string>('test-game-id');
    const [accessCode, setAccessCode] = useState<string>('379CCT');
    const [token] = useState<string>('mock-token');
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (message: string) => {
        const timestamp = new Date().toISOString();
        setLogs(prev => [...prev.slice(-20), `[${timestamp}] ${message}`]);
        logger.info(message);
    };

    const {
        quizSocket,
        quizState,
        timerStatus,
        timerQuestionUid,
        timeLeftMs,
        localTimeLeftMs,
        connectedCount,
        emitTimerAction,
        emitSetQuestion
    } = useTeacherQuizSocket(accessCode, token, gameId);

    // Log timer changes
    useEffect(() => {
        addLog(`Timer Status: ${timerStatus}, TimeLeftMs: ${timeLeftMs}, LocalTimeLeftMs: ${localTimeLeftMs}, QuestionUid: ${timerQuestionUid}`);
    }, [timerStatus, timeLeftMs, localTimeLeftMs, timerQuestionUid]);

    // Log socket connection changes
    useEffect(() => {
        addLog(`Socket Connected: ${!!quizSocket?.connected}, Connected Count: ${connectedCount}`);
    }, [quizSocket?.connected, connectedCount]);

    const handleStartTimer = () => {
        addLog('BUTTON: Starting timer for 30 seconds');
        emitTimerAction({
            status: 'play',
            questionUid: 'debug-question-1',
            timeLeftMs: 30000
        });
    };

    const handlePauseTimer = () => {
        addLog('BUTTON: Pausing timer');
        emitTimerAction({
            status: 'pause',
            questionUid: timerQuestionUid || 'debug-question-1',
            timeLeftMs: timeLeftMs || 0
        });
    };

    const handleStopTimer = () => {
        addLog('BUTTON: Stopping timer');
        emitTimerAction({
            status: 'stop',
            questionUid: timerQuestionUid || 'debug-question-1',
            timeLeftMs: 0
        });
    };

    const handleSetQuestion = () => {
        addLog('BUTTON: Setting question with 20 second timer');
        emitSetQuestion('debug-question-1', 20);
    };

    const formatTime = (milliseconds: number | null) => {
        if (milliseconds === null || milliseconds === undefined) return 'null';
        const seconds = Math.ceil(milliseconds / 1000);
        return `${seconds}s (${milliseconds}ms)`;
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Timer Debug Page</h1>

            {/* Configuration */}
            <div className="mb-6 p-4 border rounded bg-gray-50">
                <h2 className="text-xl font-semibold mb-4">Configuration</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Access Code</label>
                        <input
                            type="text"
                            value={accessCode}
                            onChange={(e) => setAccessCode(e.target.value)}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Game ID</label>
                        <input
                            type="text"
                            value={gameId}
                            onChange={(e) => setGameId(e.target.value)}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Socket Status</label>
                        <div className={`p-2 rounded text-center ${quizSocket?.connected ? 'bg-green-200' : 'bg-red-200'}`}>
                            {quizSocket?.connected ? 'Connected' : 'Disconnected'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Timer Display */}
            <div className="mb-6 p-4 border rounded bg-blue-50">
                <h2 className="text-xl font-semibold mb-4">Timer State</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                        <div className="text-sm font-medium">Status</div>
                        <div className={`text-2xl font-bold ${timerStatus === 'play' ? 'text-green-600' :
                                timerStatus === 'pause' ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                            {timerStatus}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm font-medium">Time Left</div>
                        <div className="text-2xl font-bold text-blue-600">
                            {formatTime(timeLeftMs)}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm font-medium">Local Time Left</div>
                        <div className="text-2xl font-bold text-purple-600">
                            {formatTime(localTimeLeftMs)}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm font-medium">Question ID</div>
                        <div className="text-lg font-mono">
                            {timerQuestionUid || 'none'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="mb-6 p-4 border rounded bg-yellow-50">
                <h2 className="text-xl font-semibold mb-4">Timer Controls</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                        onClick={handleSetQuestion}
                        className="p-3 bg-blue-500 text-white rounded hover:bg-blue-600"
                        disabled={!quizSocket?.connected}
                    >
                        Set Question (20s)
                    </button>
                    <button
                        onClick={handleStartTimer}
                        className="p-3 bg-green-500 text-white rounded hover:bg-green-600"
                        disabled={!quizSocket?.connected}
                    >
                        Start Timer (30s)
                    </button>
                    <button
                        onClick={handlePauseTimer}
                        className="p-3 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                        disabled={!quizSocket?.connected || timerStatus !== 'play'}
                    >
                        Pause Timer
                    </button>
                    <button
                        onClick={handleStopTimer}
                        className="p-3 bg-red-500 text-white rounded hover:bg-red-600"
                        disabled={!quizSocket?.connected}
                    >
                        Stop Timer
                    </button>
                </div>
            </div>

            {/* Quiz State Debug */}
            <div className="mb-6 p-4 border rounded bg-green-50">
                <h2 className="text-xl font-semibold mb-4">Quiz State Debug</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <div className="text-sm font-medium mb-2">Connected Count</div>
                        <div className="text-lg">{connectedCount}</div>
                    </div>
                    <div>
                        <div className="text-sm font-medium mb-2">Quiz Ended</div>
                        <div className="text-lg">{quizState?.ended ? 'Yes' : 'No'}</div>
                    </div>
                </div>
                <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Raw Quiz State</div>
                    <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(quizState, null, 2)}
                    </pre>
                </div>
            </div>

            {/* Debug Logs */}
            <div className="p-4 border rounded bg-gray-50">
                <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
                <div className="bg-black text-green-400 p-4 rounded text-sm font-mono max-h-64 overflow-y-auto">
                    {logs.map((log, index) => (
                        <div key={index}>{log}</div>
                    ))}
                </div>
                <button
                    onClick={() => setLogs([])}
                    className="mt-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                    Clear Logs
                </button>
            </div>
        </div>
    );
}
