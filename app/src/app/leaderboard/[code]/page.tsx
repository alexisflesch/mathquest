/**
 * Leaderboard Page Component
 * 
 * This component displays the results and rankings of a completed tournament.
 * Key features include:
 * 
 * - Display of participant scores in descending order
 * - Visual distinction between live and differed (asynchronous) participants
 * - Highlighting of the current user in the leaderboard
 * - Sharing functionality for the leaderboard
 * - Link to play the tournament in differed mode if not yet attempted
 */

"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Share2 } from "lucide-react";

type LeaderboardEntry = { id: string; pseudo: string; avatar: string; score: number; isDiffered?: boolean };

export default function TournamentLeaderboardPage() {
    const { code } = useParams();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get current player pseudo and avatar from localStorage
    let currentPseudo: string | null = null;
    let currentAvatar: string | null = null;
    if (typeof window !== "undefined") {
        currentPseudo = localStorage.getItem("mathquest_pseudo");
        currentAvatar = localStorage.getItem("mathquest_avatar");
        if (currentAvatar && !currentAvatar.startsWith("/")) {
            currentAvatar = `/avatars/${currentAvatar}`;
        }
    }

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

    // Share handler for leaderboard
    const handleShareLeaderboard = () => {
        if (navigator.share) {
            navigator.share({
                title: "Classement du tournoi Mathquest",
                text: `Voici le classement du tournoi : ${code}`,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Lien du classement copié dans le presse-papier !");
        }
    };

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
                    {/* Row: Retour à l'accueil + share icon */}
                    <div className="w-full flex justify-between items-center mb-2">
                        <Link href="/" className="text-primary underline hover:text-primary/80 font-semibold">
                            &larr; Retour à l&apos;accueil
                        </Link>
                        <button
                            className="btn btn-xs btn-outline flex items-center justify-center p-2 min-h-0 h-8"
                            onClick={handleShareLeaderboard}
                            aria-label="Partager le classement"
                            type="button"
                        >
                            <Share2 className="w-3 h-3" />
                        </button>
                    </div>
                    <h1 className="card-title text-3xl mb-6 text-center">Tournoi terminé</h1>
                    <div className="w-full text-left text-base mb-4">
                        Pas encore joué ?{" "}
                        <Link
                            href={`/live/${code}`}
                            className="text-primary underline hover:text-primary/80 font-semibold"
                        >
                            Tentez votre chance en différé
                        </Link>
                    </div>
                    <hr className="w-full border-base-300 my-2" />
                    <ol className="w-full flex flex-col gap-2">
                        {/* Legend */}
                        <div className="flex gap-4 mb-2 text-sm items-center">
                            <span><span role="img" aria-label="live">⚡</span> = Live</span>
                            <span><span role="img" aria-label="differed">🕒</span> = Différé</span>
                        </div>
                        {leaderboard.map((p, idx) => {
                            // Highlight if current player (pseudo and avatar match)
                            const isCurrent =
                                currentPseudo &&
                                currentAvatar &&
                                p.pseudo === currentPseudo &&
                                (p.avatar === currentAvatar ||
                                    p.avatar === currentAvatar.replace("/avatars/", ""));
                            return (
                                <li
                                    key={p.id}
                                    className={
                                        "flex items-center gap-4 p-2 rounded " +
                                        (isCurrent
                                            ? "font-bold"
                                            : "")
                                    }
                                    style={isCurrent ? { backgroundColor: "var(--primary)", color: "white" } : undefined}
                                >
                                    <Image
                                        src={p.avatar?.startsWith('/') ? p.avatar : `/avatars/${p.avatar}`}
                                        alt="avatar"
                                        width={32}
                                        height={32}
                                        className="w-8 h-8 rounded-full"
                                        style={{
                                            boxShadow: "0 0 0 2px var(--border), 0 1px 2px 0 rgba(0,0,0,0.07)"
                                        }}
                                    />
                                    <span className="w-8 text-center">#{idx + 1}</span>
                                    <span className="flex-1 flex items-center gap-2">
                                        {p.isDiffered ? (
                                            <span title="Différé" role="img" aria-label="differed">🕒</span>
                                        ) : (
                                            <span title="Live" role="img" aria-label="live">⚡</span>
                                        )}
                                        {p.pseudo || 'Joueur'}
                                    </span>
                                    <span className="font-mono text-lg">{p.score}</span>
                                </li>
                            );
                        })}
                    </ol>
                </div>
            </div>
        </div>
    );
}
