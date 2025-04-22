"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

type LeaderboardEntry = { id: string; pseudo: string; avatar: string; score: number };

export default function TournamentLeaderboardPage() {
    const { code } = useParams();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchLeaderboard() {
            try {
                const res = await fetch(`/api/tournament?code=${code}`);
                if (!res.ok) throw new Error('Tournoi introuvable');
                const tournoi = await res.json();
                if (!tournoi || !tournoi.id) throw new Error('Tournoi introuvable');
                const lbRes = await fetch(`/api/tournament-leaderboard?code=${code}`);
                if (!lbRes.ok) throw new Error('Impossible de charger le classement');
                const lb = await lbRes.json();
                setLeaderboard(lb.leaderboard || []);
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
                setError(errorMsg);
            } finally {
                setLoading(false);
            }
        }
        fetchLeaderboard();
    }, [code]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-base-200"><div>Chargement…</div></div>;
    }
    if (error) {
        return <div className="min-h-screen flex items-center justify-center bg-base-200"><div className="alert alert-error">{error}</div></div>;
    }
    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200">
            <div className="card w-full max-w-xl shadow-xl bg-base-100">
                <div className="card-body items-center gap-8">
                    <div className="w-full flex justify-start mb-2">
                        <Link href="/" className="text-primary underline hover:text-primary/80 font-semibold">&larr; Retour à l&apos;accueil</Link>
                    </div>
                    <h1 className="card-title text-3xl mb-2 text-center">Tournoi terminé</h1>
                    <h2 className="text-xl font-semibold mb-4 text-center">Classement final</h2>
                    <ol className="w-full flex flex-col gap-2">
                        {leaderboard.map((p, idx) => (
                            <li key={p.id} className={`flex items-center gap-4 p-2 rounded ${idx === 0 ? 'bg-yellow-100 font-bold' : ''}`}>
                                <Image src={p.avatar?.startsWith('/') ? p.avatar : `/avatars/${p.avatar}`} alt="avatar" width={32} height={32} className="w-8 h-8 rounded-full border border-base-300" />
                                <span className="w-8 text-center">#{idx + 1}</span>
                                <span className="flex-1">{p.pseudo || 'Joueur'}</span>
                                <span className="font-mono text-lg">{p.score}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </div>
    );
}
