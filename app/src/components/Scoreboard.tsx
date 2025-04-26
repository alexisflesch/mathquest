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
import Image from 'next/image';

// TODO: Replace with real scoreboard logic and props
export default function Scoreboard({ scores = [] }: { scores?: { pseudo: string; score: number; avatar?: string }[] }) {
    return (
        <div className="bg-white rounded shadow p-4">
            <h2 className="text-xl font-bold mb-2">Classement</h2>
            <ol className="list-decimal list-inside space-y-1">
                {scores.length === 0 && <li className="text-gray-500">Aucun score pour l&apos;instant.</li>}
                {scores.sort((a, b) => b.score - a.score).map((s) => (
                    <li key={s.pseudo} className="flex items-center gap-2">
                        {s.avatar && <Image src={`/avatars/${s.avatar}`} alt={s.avatar} width={32} height={32} className="w-8 h-8 rounded-full" />} {s.pseudo} - {s.score} pts
                    </li>
                ))}
            </ol>
        </div>
    );
}
