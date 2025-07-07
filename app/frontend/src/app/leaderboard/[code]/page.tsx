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
import { useAuth } from '@/components/AuthProvider';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Share2 } from "lucide-react";
import { makeApiRequest } from '@/config/api';
import { TournamentLeaderboardResponseSchema, CanPlayDifferedResponseSchema, type TournamentLeaderboardResponse, type CanPlayDifferedResponse } from '@/types/api';
import type { LeaderboardEntry, ParticipationType } from '@shared/types/core/participant';
import { logger, getCurrentLogLevel, setLogLevel, LogLevel } from '@/clientLogger';

// Use the shared LeaderboardEntry type directly
type TournamentLeaderboardEntry = LeaderboardEntry;

export default function TournamentLeaderboardPage() {
    const { code } = useParams();
    const [leaderboard, setLeaderboard] = useState<TournamentLeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [canPlayDiffered, setCanPlayDiffered] = useState(false);
    const [showReplayNotification, setShowReplayNotification] = useState(false);

    // Check if user was redirected here due to replay attempt
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('already_played') === '1') {
                setShowReplayNotification(true);
                // Clean URL by removing the parameter
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);
                // Auto-hide notification after 5 seconds
                setTimeout(() => setShowReplayNotification(false), 5000);
            }
        }
    }, []);

    // Use AuthProvider to get the canonical userId
    const { getCurrentUserId } = useAuth();

    useEffect(() => {
        async function fetchLeaderboard() {
            try {
                const gameResponse = await makeApiRequest<{ gameInstance: unknown }>(`games/${code}`, {}, undefined, undefined);
                logger.info('[Leaderboard] gameResponse', gameResponse);
                if (!gameResponse || !gameResponse.gameInstance) throw new Error('Tournoi introuvable');

                const lb = await makeApiRequest<TournamentLeaderboardResponse>(`games/${code}/leaderboard`, {}, undefined, TournamentLeaderboardResponseSchema);
                logger.info('[Leaderboard] leaderboard API response', lb);
                setLeaderboard(lb.leaderboard || []);

                // Vérifier si l'utilisateur peut jouer en différé
                let userId = null;
                if (typeof window !== 'undefined') {
                    userId = localStorage.getItem('mathquest_cookie_id');
                }
                if (userId) {
                    try {
                        const differedResponse = await makeApiRequest<CanPlayDifferedResponse>(`games/${code}/can-play-differed?userId=${encodeURIComponent(userId)}`, {}, undefined, CanPlayDifferedResponseSchema);
                        logger.info('[Leaderboard] can-play-differed API response', differedResponse);
                        setCanPlayDiffered(!!differedResponse.canPlay);
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
                    {/* Subtle notification for tournament replay attempts */}
                    {showReplayNotification && (
                        <div className="alert alert-info w-full mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span>Vous avez déjà participé à ce tournoi. Voici vos résultats !</span>
                        </div>
                    )}
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
                            <span><span role="img" aria-label="deferred">🕒</span> = Différé</span>
                        </div>
                        {leaderboard.map((p, idx) => {
                            // Highlight if current player (userId matches canonical id from AuthProvider)
                            const currentUserId = getCurrentUserId();
                            const isCurrent = currentUserId && p.userId === currentUserId;

                            // Determine if this is a deferred participation
                            const isDeferred = p.participationType === 'DEFERRED';

                            // Use participationId as key if available, otherwise fallback to userId + index
                            const uniqueKey = p.participationId || `${p.userId}-${idx}`;

                            return (
                                <li
                                    key={uniqueKey}
                                    className={
                                        "flex items-center gap-4 p-2 rounded " +
                                        (isCurrent ? "font-bold" : "")
                                    }
                                    style={isCurrent ? { backgroundColor: "var(--primary)", color: "white" } : undefined}
                                >
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                                        style={{
                                            boxShadow: "0 0 0 2px var(--border), 0 1px 2px 0 rgba(0,0,0,0.07)"
                                        }}
                                    >
                                        {p.avatarEmoji}
                                    </div>
                                    <span className="w-8 text-center">#{idx + 1}</span>
                                    <span className="flex-1 flex items-baseline gap-2">
                                        {isDeferred ? (
                                            <span title="Différé" role="img" aria-label="deferred">🕒</span>
                                        ) : (
                                            <span title="Live" role="img" aria-label="live">⚡</span>
                                        )}
                                        {p.username || 'Joueur'}
                                        {/* Show attempt count for multiple attempts */}
                                        {p.attemptCount && p.attemptCount > 1 && (
                                            <span className="text-xs opacity-75 ml-1">
                                                ({p.attemptCount} tentative{p.attemptCount > 1 ? 's' : ''})
                                            </span>
                                        )}
                                    </span>
                                    <span className="font-mono text-lg">{Math.round(p.score)}</span>
                                </li>
                            );
                        })}
                    </ol>
                </div>
            </div>
        </div>
    );
}
