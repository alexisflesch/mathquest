import React from 'react';
import Image from 'next/image';

// TODO: Replace with real tournament lobby logic and props
export default function TournamentLobby({ players = [], code = '', onStart }: { players?: { pseudo: string; avatar?: string }[]; code?: string; onStart?: () => void }) {
    return (
        <div className="bg-white rounded shadow p-4">
            <h2 className="text-xl font-bold mb-2">Lobby du Tournoi</h2>
            <div className="mb-2">Code du tournoi : <span className="font-mono bg-gray-100 px-2 py-1 rounded">{code || '------'}</span></div>
            <div className="mb-4">Joueurs connect&eacute;s :</div>
            <ul className="flex flex-wrap gap-4 mb-4">
                {players.length === 0 && <li className="text-gray-500">Aucun joueur pour l&apos;instant.</li>}
                {players.map((p) => (
                    <li key={p.pseudo} className="flex flex-col items-center">
                        {p.avatar && <Image src={`/avatars/${p.avatar}`} alt={p.avatar} width={32} height={32} className="w-8 h-8 rounded-full" />}
                        <span>{p.pseudo}</span>
                    </li>
                ))}
            </ul>
            {onStart && (
                <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded" onClick={onStart}>
                    D&eacute;marrer le tournoi
                </button>
            )}
        </div>
    );
}
