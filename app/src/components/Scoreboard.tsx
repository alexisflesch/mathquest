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
