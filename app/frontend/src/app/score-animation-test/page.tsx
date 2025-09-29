"use client"
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ClassementPodium, { PodiumUser, ScoreAnimate } from '@/components/ClassementPodium';

const initialLeaderboard: PodiumUser[] = [
    { userId: '1', name: 'Alice', avatarEmoji: '🦉', score: 100 },
    { userId: '2', name: 'Bob', avatarEmoji: '🦊', score: 95 },
    { userId: '3', name: 'Charlie', avatarEmoji: '🐻', score: 90 },
    { userId: '4', name: 'Diana', avatarEmoji: '🐸', score: 85 },
    { userId: '5', name: 'Eve', avatarEmoji: '🐧', score: 80 },
];

export default function ScoreAnimationTest() {
    const [leaderboard, setLeaderboard] = useState<PodiumUser[]>(initialLeaderboard);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [animationLog, setAnimationLog] = useState<string[]>([]);
    const [testAnimate, setTestAnimate] = useState(false);

    const addLog = (message: string) => {
        setAnimationLog(prev => [...prev.slice(-4), message]); // Keep last 5 logs
    };

    useEffect(() => {
        console.log('[TEST] leaderboard state changed:', leaderboard.map(u => ({ id: u.userId, score: u.score })));
        addLog(`Leaderboard updated: ${leaderboard.map(u => `${u.name}:${u.score}`).join(', ')}`);
    }, [leaderboard]);

    const handleScoreChange = () => {
        console.log('[TEST] Before update:', leaderboard.map(u => ({ id: u.userId, score: u.score })));
        addLog('Button clicked: Alice Score +20');
        // Alice's score changes but she stays in 1st place - should trigger score animation
        const newLeaderboard = leaderboard.map(player =>
            player.userId === '1'
                ? { ...player, score: player.score + 20 }
                : player
        );
        console.log('[TEST] New leaderboard:', newLeaderboard.map(u => ({ id: u.userId, score: u.score })));
        setLeaderboard(newLeaderboard);
        setHasInteracted(true);
    };

    const handleRankChange = () => {
        // Bob and Charlie swap places - should trigger rank animations
        setLeaderboard(prev => {
            const newBoard = [...prev];
            const bobIndex = newBoard.findIndex(p => p.userId === '2');
            const charlieIndex = newBoard.findIndex(p => p.userId === '3');
            [newBoard[bobIndex], newBoard[charlieIndex]] = [newBoard[charlieIndex], newBoard[bobIndex]];
            return newBoard;
        });
        setHasInteracted(true);
    };

    const handleReset = () => {
        setLeaderboard(initialLeaderboard);
        setHasInteracted(false);
    };

    return (
        <div className="min-h-screen bg-base-100 p-8 flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-6">Score Animation Test - Full Podium</h1>

            <div className="flex flex-wrap gap-2 mb-8">
                <button
                    className="btn btn-primary"
                    onClick={handleScoreChange}
                >
                    Alice Score +20 (Same Rank)
                </button>
                <button
                    className="btn btn-secondary"
                    onClick={handleRankChange}
                >
                    Swap Bob ↔ Charlie (Rank Change)
                </button>
                <button
                    className="btn btn-accent"
                    onClick={handleReset}
                >
                    Reset
                </button>
                <button
                    className="btn btn-warning"
                    onClick={() => {
                        setTestAnimate(true);
                        setTimeout(() => setTestAnimate(false), 1000);
                    }}
                >
                    Test Animation
                </button>
            </div>

            <div className="text-sm text-gray-600 mb-4 text-center">
                <p>Click "Alice Score +20" to see the enhanced glitch animation when score changes but rank stays the same.</p>
                <p>Alice should stay in 1st place but her score will show a digital glitch effect with color shifts and subtle movement.</p>
            </div>

            {/* Debug Panel */}
            <div className="bg-gray-100 p-4 rounded-lg mb-4 text-xs font-mono">
                <h3 className="font-bold mb-2">Debug Log:</h3>
                <div className="space-y-1">
                    {animationLog.map((log, i) => (
                        <div key={i} className="text-gray-700">{log}</div>
                    ))}
                </div>
                <div className="mt-2 text-gray-600">
                    Current leaderboard: {leaderboard.map(u => `${u.name}:${u.score}`).join(', ')}
                </div>
            </div>

            <div className="w-full max-w-2xl">
                <ClassementPodium leaderboard={leaderboard} animateOnInitialLoad={hasInteracted} />
            </div>

            {/* Animation Test Component */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-bold mb-2">Direct Animation Test:</h3>
                <div className="flex items-center gap-4">
                    <span className="text-lg font-bold">Test Score:</span>
                    <ScoreAnimate score={120} zoomFactor={1} animateScore={testAnimate} />
                    <span className="text-sm text-gray-600">(Click "Test Animation" button)</span>
                </div>
            </div>
        </div>
    );
}