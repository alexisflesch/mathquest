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
import "@/app/ribbon.css";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Share2, QrCode } from "lucide-react";
import InfoModal from '@/components/SharedModal';
import QrCodeWithLogo from '@/components/QrCodeWithLogo';
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
    const [gameInstance, setGameInstance] = useState<any>(null);
    const [canPlayDiffered, setCanPlayDiffered] = useState(false);
    const [showReplayNotification, setShowReplayNotification] = useState(false);
    const [showQrModal, setShowQrModal] = useState(false);

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

                // Store the game instance data
                setGameInstance(gameResponse.gameInstance);

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
    // Split leaderboard into live and deferred
    const currentUserId = getCurrentUserId();
    const liveEntries = leaderboard.filter(e => e.participationType === 'LIVE');
    const deferredEntries = leaderboard.filter(e => e.participationType === 'DEFERRED');

    // Sort and re-rank live entries
    const sortedLive = [...liveEntries].sort((a, b) => b.score - a.score);
    const rankedLive = sortedLive.map((e, i) => ({ ...e, rank: i + 1 }));

    // Sort and re-rank deferred entries
    const sortedDeferred = [...deferredEntries].sort((a, b) => b.score - a.score);
    const rankedDeferred = sortedDeferred.map((e, i) => ({ ...e, rank: i + 1 }));

    // Custom ribbon style for current user
    // Ribbon should be positioned relative to the card (li)
    const cardStyle: React.CSSProperties = {
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--border)',
        color: 'var(--text)',
        position: 'relative' as const
    };
    // Ribbon overlays the card

    return (
        <div className="main-content">
            <div className="card w-full max-w-4xl bg-base-100 rounded-lg shadow-xl my-6">
                <div className="card-body items-center gap-8">
                    {/* Row: share/QR button group */}
                    <div className="w-full flex justify-between items-center mb-2">
                        <div className="flex gap-0 items-center ml-auto">
                            <button
                                className="p-2 rounded hover:bg-[color:var(--muted)] transition-colors"
                                title="Partager le lien"
                                onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({
                                            title: 'Classement du tournoi Mathquest',
                                            text: `Voici le classement du tournoi : ${code}`,
                                            url: window.location.href
                                        }).catch(() => { });
                                    } else {
                                        navigator.clipboard.writeText(window.location.href);
                                        alert("Lien du classement copié dans le presse-papier !");
                                    }
                                }}
                            >
                                <span className="sr-only">Partager</span>
                                <Share2 size={20} />
                            </button>
                            <button
                                className="p-2 rounded hover:bg-[color:var(--muted)] transition-colors"
                                title="QR Code"
                                onClick={() => setShowQrModal(true)}
                            >
                                <span className="sr-only">QR Code</span>
                                <QrCode size={20} />
                            </button>
                        </div>
                    </div>
                    {/* QR Modal for leaderboard (copied from live page) */}
                    <InfoModal
                        isOpen={showQrModal}
                        onClose={() => setShowQrModal(false)}
                        title={null}
                        size="sm"
                        showCloseButton={false}
                    >
                        <div className="flex flex-col items-center justify-center gap-0 p-0">
                            <div className="flex items-center justify-center w-full" style={{ minWidth: 220, minHeight: 220 }}>
                                <QrCodeWithLogo
                                    value={typeof window !== 'undefined' ? window.location.href : ''}
                                    size={220}
                                    logoWidth={45}
                                    logoHeight={45}
                                    responsive={false}
                                    style={{ width: 220, height: 220 }}
                                />
                            </div>
                            <div className="flex justify-end w-full mt-4">
                                <button
                                    className="px-4 py-2 border border-[color:var(--border)] rounded-lg hover:bg-[color:var(--muted)] transition min-w-[100px]"
                                    onClick={() => setShowQrModal(false)}
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </InfoModal>
                    <h1 className="card-title text-3xl mb-6 text-center">Tournoi terminé</h1>
                    <div className="w-full text-left text-base mb-4">
                        {/* Only show deferred play option for tournament games */}
                        {gameInstance?.playMode === 'tournament' && canPlayDiffered && (
                            <>
                                Vous pouvez rejouer ce tournoi en mode asynchrone, dans les mêmes conditions que le direct.
                                Pour ce faire,&nbsp;
                                <Link href={`/live/${code}`} className="text-primary underline hover:text-primary/80 font-semibold" >cliquez ici.</Link>
                            </>
                        )}
                        {/* Show message for quiz games */}
                        {gameInstance?.playMode === 'quiz' && (
                            <>
                                Ce quiz est terminé. Les quiz ne peuvent pas être rejoués en mode différé.
                            </>
                        )}
                    </div>
                    <hr className="w-full border-base-300 my-2" />
                    {/* Live Scores Section */}
                    {rankedLive.length > 0 && (
                        <div className="w-full mb-2">
                            <h2 className="text-lg font-bold mb-2"><span role="img" aria-label="live">⚡</span> Scores en direct</h2>
                            <ol className="w-full flex flex-col gap-2">
                                {rankedLive.map((p, idx) => {
                                    const isCurrent = currentUserId && p.userId === currentUserId;
                                    const uniqueKey = p.participationId || `${p.userId}-live-${idx}`;
                                    return (
                                        <li
                                            key={uniqueKey}
                                            className="flex items-center p-3 rounded-lg border transition-colors"
                                            style={cardStyle}
                                        >
                                            {/* Ribbon for current user, overlays card */}
                                            {isCurrent && (
                                                <span className="ribbon-diagonal"></span>
                                            )}
                                            {/* Rank Number + point */}
                                            <div className="flex-shrink-0 mr-2 w-8 h-8 flex items-center justify-center">
                                                <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                                                    {p.rank + '.'}
                                                </span>
                                            </div>
                                            {/* Avatar */}
                                            <div className="flex-shrink-0 mr-2">
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                                                    style={{
                                                        backgroundColor: 'var(--input-bg)',
                                                        color: 'var(--text)'
                                                    }}
                                                >
                                                    {p.avatarEmoji}
                                                </div>
                                            </div>
                                            {/* Username */}
                                            <div className="flex-1 min-w-0">
                                                <span className={`text-sm truncate ${isCurrent ? 'font-semibold' : 'font-medium'}`} style={{ color: 'var(--text)' }}>
                                                    {p.username || 'Joueur'}
                                                </span>
                                            </div>
                                            {/* Score */}
                                            <div className="flex-shrink-0">
                                                <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                                                    {Math.round(p.score)} pts
                                                </span>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>
                    )}
                    {/* Deferred Scores Section */}
                    {rankedDeferred.length > 0 && (
                        <div className="w-full mt-4">
                            <h2 className="text-lg font-bold mb-2"><span role="img" aria-label="deferred">🕒</span> Scores différés</h2>
                            <ol className="w-full flex flex-col gap-2">
                                {rankedDeferred.map((p, idx) => {
                                    const isCurrent = currentUserId && p.userId === currentUserId;
                                    const uniqueKey = p.participationId || `${p.userId}-deferred-${idx}`;
                                    return (
                                        <li
                                            key={uniqueKey}
                                            className="flex items-center p-3 rounded-lg border transition-colors"
                                            style={cardStyle}
                                        >
                                            {/* Ribbon for current user, overlays card */}
                                            {isCurrent && (
                                                <span className="ribbon-diagonal"></span>
                                            )}
                                            {/* Rank Number + point */}
                                            <div className="flex-shrink-0 mr-2 w-8 h-8 flex items-center justify-center">
                                                <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                                                    {p.rank + '.'}
                                                </span>
                                            </div>
                                            {/* Avatar */}
                                            <div className="flex-shrink-0 mr-2">
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                                                    style={{
                                                        backgroundColor: 'var(--input-bg)',
                                                        color: 'var(--text)'
                                                    }}
                                                >
                                                    {p.avatarEmoji}
                                                </div>
                                            </div>
                                            {/* Username + attempt count */}
                                            <div className="flex-1 min-w-0">
                                                <span className={`text-sm truncate ${isCurrent ? 'font-semibold' : 'font-medium'}`} style={{ color: 'var(--text)' }}>
                                                    {p.username || 'Joueur'}
                                                    {p.attemptCount && p.attemptCount > 1 && (
                                                        <span className="ml-1 text-xs opacity-75">
                                                            ({p.attemptCount} essai{p.attemptCount > 1 ? 's' : ''})
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                            {/* Score */}
                                            <div className="flex-shrink-0">
                                                <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                                                    {Math.round(p.score)} pts
                                                </span>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
