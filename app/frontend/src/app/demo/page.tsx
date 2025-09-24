"use client";
import React, { useState } from 'react';
import ClassementPodium, { PodiumUser } from '@/components/ClassementPodium';

const initialLeaderboard: PodiumUser[] = [
    { userId: '1', name: 'Alice', avatarEmoji: '🦉', score: 100 },
    { userId: '2', name: 'Bob', avatarEmoji: '🦊', score: 95 },
    { userId: '3', name: 'Charlie', avatarEmoji: '🐻', score: 90 },
    { userId: '4', name: 'Diana', avatarEmoji: '🐸', score: 85 },
    { userId: '5', name: 'Eve', avatarEmoji: '🐧', score: 80 },
    { userId: '6', name: 'Frank', avatarEmoji: '🦄', score: 75 },
    { userId: '7', name: 'Grace', avatarEmoji: '🦋', score: 70 },
    { userId: '8', name: 'Heidi', avatarEmoji: '🦢', score: 65 },
    { userId: '9', name: 'Ivan', avatarEmoji: '🦓', score: 60 },
    { userId: '10', name: 'Judy', avatarEmoji: '🦔', score: 55 },
];

const scenarios = [
    {
        label: 'Nothing changed',
        leaderboard: [...initialLeaderboard],
    },
    {
        label: 'Only Alice score changed',
        leaderboard: [
            { userId: '1', name: 'Alice', avatarEmoji: '🦉', score: 120 },
            { userId: '2', name: 'Bob', avatarEmoji: '🦊', score: 95 },
            { userId: '3', name: 'Charlie', avatarEmoji: '🐻', score: 90 },
            { userId: '4', name: 'Diana', avatarEmoji: '🐸', score: 85 },
            { userId: '5', name: 'Eve', avatarEmoji: '🐧', score: 80 },
            { userId: '6', name: 'Frank', avatarEmoji: '🦄', score: 75 },
            { userId: '7', name: 'Grace', avatarEmoji: '🦋', score: 70 },
            { userId: '8', name: 'Heidi', avatarEmoji: '🦢', score: 65 },
            { userId: '9', name: 'Ivan', avatarEmoji: '🦓', score: 60 },
            { userId: '10', name: 'Judy', avatarEmoji: '🦔', score: 55 },
        ],
    },
    {
        label: 'Bob and Diana swapped',
        leaderboard: [
            { userId: '1', name: 'Alice', avatarEmoji: '🦉', score: 100 },
            { userId: '4', name: 'Diana', avatarEmoji: '🐸', score: 95 },
            { userId: '3', name: 'Charlie', avatarEmoji: '🐻', score: 90 },
            { userId: '2', name: 'Bob', avatarEmoji: '🦊', score: 85 },
            { userId: '5', name: 'Eve', avatarEmoji: '🐧', score: 80 },
            { userId: '6', name: 'Frank', avatarEmoji: '🦄', score: 75 },
            { userId: '7', name: 'Grace', avatarEmoji: '🦋', score: 70 },
            { userId: '8', name: 'Heidi', avatarEmoji: '🦢', score: 65 },
            { userId: '9', name: 'Ivan', avatarEmoji: '🦓', score: 60 },
            { userId: '10', name: 'Judy', avatarEmoji: '🦔', score: 55 },
        ],
    },
    {
        label: 'All scores changed',
        leaderboard: [
            { userId: '1', name: 'Alice', avatarEmoji: '🦉', score: 130 },
            { userId: '2', name: 'Bob', avatarEmoji: '🦊', score: 125 },
            { userId: '3', name: 'Charlie', avatarEmoji: '🐻', score: 120 },
            { userId: '4', name: 'Diana', avatarEmoji: '🐸', score: 115 },
            { userId: '5', name: 'Eve', avatarEmoji: '🐧', score: 110 },
            { userId: '6', name: 'Frank', avatarEmoji: '🦄', score: 105 },
            { userId: '7', name: 'Grace', avatarEmoji: '�', score: 100 },
            { userId: '8', name: 'Heidi', avatarEmoji: '�', score: 95 },
            { userId: '9', name: 'Ivan', avatarEmoji: '🦓', score: 90 },
            { userId: '10', name: 'Judy', avatarEmoji: '🦔', score: 85 },
        ],
    },
    {
        label: 'New player added',
        leaderboard: [
            ...initialLeaderboard,
            { userId: '11', name: 'Karl', avatarEmoji: '�', score: 50 },
        ],
    },
    {
        label: 'Player removed',
        leaderboard: initialLeaderboard.slice(0, 9),
    },
    {
        label: 'All players swapped',
        leaderboard: [
            { userId: '10', name: 'Judy', avatarEmoji: '�', score: 130 },
            { userId: '9', name: 'Ivan', avatarEmoji: '�', score: 125 },
            { userId: '8', name: 'Heidi', avatarEmoji: '🦢', score: 120 },
            { userId: '7', name: 'Grace', avatarEmoji: '🦋', score: 115 },
            { userId: '6', name: 'Frank', avatarEmoji: '🦄', score: 110 },
            { userId: '5', name: 'Eve', avatarEmoji: '🐧', score: 105 },
            { userId: '4', name: 'Diana', avatarEmoji: '🐸', score: 100 },
            { userId: '3', name: 'Charlie', avatarEmoji: '🐻', score: 95 },
            { userId: '2', name: 'Bob', avatarEmoji: '🦊', score: 90 },
            { userId: '1', name: 'Alice', avatarEmoji: '🦉', score: 85 },
        ],
    },
    {
        label: 'Only Eve changed',
        leaderboard: [
            { userId: '1', name: 'Alice', avatarEmoji: '🦉', score: 100 },
            { userId: '2', name: 'Bob', avatarEmoji: '🦊', score: 95 },
            { userId: '3', name: 'Charlie', avatarEmoji: '🐻', score: 90 },
            { userId: '4', name: 'Diana', avatarEmoji: '🐸', score: 85 },
            { userId: '5', name: 'Eve', avatarEmoji: '🐧', score: 120 },
            { userId: '6', name: 'Frank', avatarEmoji: '🦄', score: 75 },
            { userId: '7', name: 'Grace', avatarEmoji: '🦋', score: 70 },
            { userId: '8', name: 'Heidi', avatarEmoji: '🦢', score: 65 },
            { userId: '9', name: 'Ivan', avatarEmoji: '🦓', score: 60 },
            { userId: '10', name: 'Judy', avatarEmoji: '🦔', score: 55 },
        ],
    },
    {
        label: 'No players',
        leaderboard: [],
    },
];

export default function DemoLeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<PodiumUser[]>(initialLeaderboard);
    const [hasInteracted, setHasInteracted] = useState(false);

    // Swap player 1 and player 6
    const handleSwap = () => {
        if (leaderboard.length < 6) return;
        const newLeaderboard = [...leaderboard];
        const temp = newLeaderboard[0];
        newLeaderboard[0] = newLeaderboard[5];
        newLeaderboard[5] = temp;
        setLeaderboard(newLeaderboard);
        setHasInteracted(true);
    };

    const handleScenario = (lb: PodiumUser[]) => {
        setLeaderboard(lb);
        setHasInteracted(true);
    };

    return (
        <div className="min-h-screen bg-base-100 p-8 flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-6">Leaderboard Animation Demo</h1>
            <div className="flex flex-wrap gap-2 mb-8">
                <button
                    className="btn btn-primary btn-sm"
                    onClick={handleSwap}
                >
                    Swap player 1 and player 6
                </button>
                {scenarios.map((scenario, idx) => (
                    <button
                        key={idx}
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleScenario(scenario.leaderboard)}
                    >
                        {scenario.label}
                    </button>
                ))}
            </div>
            <div className="w-full max-w-2xl">
                <ClassementPodium leaderboard={leaderboard} animateOnInitialLoad={hasInteracted} />
            </div>
        </div>
    );
}
