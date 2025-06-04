/**
 * Scoreboard Component
 * 
 * This component displays the current ranking of participants in a tournament or quiz,
 * showing their avatars, names, and scores in descending order by score.
 * 
 * Key features:
 * - Sorted display of participants by score (highest first)
 * - Visual integration of player avatars
 * - Empty state handling when no scores are available
 * - Clean, list-based presentation with consistent styling
 * 
 * Used in tournament interfaces and teacher dashboards to display real-time
 * or final rankings in competitive activities.
 */

import React from 'react';

// TODO: Replace with real scoreboard logic and props
export default function Scoreboard({ scores = [] }: { scores?: { username: string; score: number; avatar?: string }[] }) {
    return (
        <div className="bg-white rounded shadow p-4">
            <h2 className="text-xl font-bold mb-2">Classement</h2>
            <ol className="list-decimal list-inside space-y-1">
                {scores.length === 0 && <li className="text-gray-500">Aucun score pour l&apos;instant.</li>}
                {scores.sort((a, b) => b.score - a.score).map((s) => (
                    <li key={s.username} className="flex items-center gap-2">
                        {s.avatar && (
                            <div className="w-8 h-8 text-lg rounded-full flex items-center justify-center emoji-avatar bg-[color:var(--muted)] border border-[color:var(--primary)]">
                                {s.avatar}
                            </div>
                        )} {s.username} - {s.score} pts
                    </li>
                ))}
            </ol>
        </div>
    );
}
