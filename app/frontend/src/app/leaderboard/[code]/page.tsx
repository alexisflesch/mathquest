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
import { makeApiRequest } from '@/config/api';

type LeaderboardEntry = { id: string; username: string; avatar: string; score: number; isDiffered?: boolean };

export default function TournamentLeaderboardPage() {
    const { code } = useParams();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [canPlayDiffered, setCanPlayDiffered] = useState(false);

    // Get current player username and avatar from localStorage
    let currentusername: string | null = null;
    let currentAvatar: string | null = null;
    if (typeof window !== "undefined") {
        currentusername = localStorage.getItem("mathquest_username");
        currentAvatar = localStorage.getItem("mathquest_avatar");
        if (currentAvatar && !currentAvatar.startsWith("/")) {
            currentAvatar = `/avatars/${currentAvatar}`;
        }
    }

    useEffect(() => {
        async function fetchLeaderboard() {
            try {
                const tournoi = await makeApiRequest<{ id: string }>(`tournament?code=${code}`);
                if (!tournoi || !tournoi.id) throw new Error('Tournoi introuvable');

                const lb = await makeApiRequest<{ leaderboard: LeaderboardEntry[] }>(`tournament-leaderboard?code=${code}`);
                setLeaderboard(lb.leaderboard || []);

                // Vérifier si l'utilisateur peut jouer en différé
                let userId = null;
                if (typeof window !== 'undefined') {
                    userId = localStorage.getItem('mathquest_cookie_id');
                }
                if (userId) {
                    try {
                        const { canPlay } = await makeApiRequest<{ canPlay: boolean }>(`can-play-differed?code=${code}&userId=${encodeURIComponent(userId)}`);
                        setCanPlayDiffered(!!canPlay);
                    } catch (err) {
                        console.error('Error checking differed play availability:', err);
                        setCanPlayDiffered(false);
                    }
                } else {
                    setCanPlayDiffered(false);
                }
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
                        {canPlayDiffered && (
                            <>
                                Pas encore joué ?{" "}
                                <Link
                                    href={`/live/${code}`}
                                    className="text-primary underline hover:text-primary/80 font-semibold"
                                >
                                    Tentez votre chance en différé
                                </Link>
                            </>
                        )}
                    </div>
                    <hr className="w-full border-base-300 my-2" />
                    <ol className="w-full flex flex-col gap-2">
                        {/* Legend */}
                        <div className="flex gap-4 mb-2 text-sm items-center">
                            <span><span role="img" aria-label="live">⚡</span> = Live</span>
                            <span><span role="img" aria-label="differed">🕒</span> = Différé</span>
                        </div>
                        {leaderboard.map((p, idx) => {
                            // Highlight if current player (username and avatar match)
                            const isCurrent =
                                currentusername &&
                                currentAvatar &&
                                p.username === currentusername &&
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
                                        {p.username || 'Joueur'}
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
