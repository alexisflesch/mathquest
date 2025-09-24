/**
 * TEMPORARY DEBUG COMPONENT
 * Add this to your live page to debug answer submission
 */

import React, { useEffect, useState } from 'react';

interface AnswerDebugProps {
    socket: any;
    gameState: any;
    submitAnswer: any;
    connected: boolean;
}

export default function AnswerDebug({ socket, gameState, submitAnswer, connected }: AnswerDebugProps) {
    const [logs, setLogs] = useState<string[]>([]);
    const [receivedEvents, setReceivedEvents] = useState<string[]>([]);

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 10));
    };

    useEffect(() => {
        if (!socket) return;

        // Listen to all socket events for debugging
        const originalOn = socket.on.bind(socket);
        const originalEmit = socket.emit.bind(socket);

        // Intercept outgoing events
        socket.emit = function (event: string, ...args: any[]) {
            if (event === 'game_answer') {
                addLog(`📤 SENT: ${event} - ${JSON.stringify(args[0])}`);
            }
            return originalEmit(event, ...args);
        };

        // Listen for incoming events
        socket.on('answer_received', (data: any) => {
            addLog(`📥 RECEIVED: answer_received - ${JSON.stringify(data)}`);
            setReceivedEvents(prev => [`answer_received: ${JSON.stringify(data)}`, ...prev].slice(0, 5));
        });

        socket.on('game_error', (data: any) => {
            addLog(`❌ ERROR: game_error - ${JSON.stringify(data)}`);
        });

        return () => {
            socket.emit = originalEmit;
        };
    }, [socket]);

    const testAnswerSubmission = () => {
        if (gameState.currentQuestion) {
            addLog(`🧪 Testing answer submission for question: ${gameState.currentQuestion.uid}`);
            submitAnswer(gameState.currentQuestion.uid, 0, 5000); // Submit answer index 0, time 5 seconds
        } else {
            addLog(`❌ No current question available`);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: '10px',
            left: '10px',
            background: 'rgba(0,0,0,0.9)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            maxWidth: '400px',
            fontSize: '12px',
            zIndex: 9999
        }}>
            <h3>🐛 Answer Submission Debug</h3>
            <div>Socket Connected: {connected ? '✅' : '❌'}</div>
            <div>Socket ID: {socket?.id || 'None'}</div>
            <div>Current Question: {gameState.currentQuestion?.uid || 'None'}</div>
            <div>Game Status: {gameState.gameStatus}</div>

            <button
                onClick={testAnswerSubmission}
                style={{
                    background: 'blue',
                    color: 'white',
                    padding: '5px 10px',
                    border: 'none',
                    borderRadius: '3px',
                    margin: '5px 0',
                    cursor: 'pointer'
                }}
            >
                🧪 Test Answer Submission
            </button>

            <div>
                <strong>Recent Events:</strong>
                {receivedEvents.map((event, i) => (
                    <div key={i} style={{ color: 'lightgreen', fontSize: '10px' }}>{event}</div>
                ))}
            </div>

            <div>
                <strong>Logs:</strong>
                {logs.map((log, i) => (
                    <div key={i} style={{ fontSize: '10px', margin: '2px 0' }}>{log}</div>
                ))}
            </div>
        </div>
    );
}
