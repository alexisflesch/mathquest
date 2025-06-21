"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { SquareArrowRight, BarChart3 } from "lucide-react";
import { makeApiRequest } from '@/config/api';
import { TournamentListItem, MyTournamentsResponse, MyTournamentsResponseSchema } from '@shared/types/api/schemas';
import { useAuth } from '@/components/AuthProvider';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

type GameMode = 'tournament' | 'quiz' | 'practice';

interface GameModeToggleProps {
    currentMode: GameMode;
    onModeChange: (mode: GameMode) => void;
    className?: string;
}

function GameModeToggle({ currentMode, onModeChange, className = "" }: GameModeToggleProps) {
    const modes = [
        { key: 'tournament' as const, label: 'Tournois', icon: '🏆' },
        { key: 'quiz' as const, label: 'Quiz (en classe)', icon: '📝' },
        { key: 'practice' as const, label: 'Entraînement', icon: '🎯' }
    ];

    return (
        <div className={`bg-[color:var(--muted)] p-1 rounded-lg flex justify-between gap-1 ${className}`}>
            {modes.map(({ key, label, icon }) => (
                <button
                    key={key}
                    onClick={() => onModeChange(key)}
                    className={`
                        flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2
                        ${currentMode === key
                            ? 'bg-[color:var(--card)] text-[color:var(--primary)] shadow-sm'
                            : 'text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--muted)]'
                        }
                    `}
                >
                    <span className="mr-2">{icon}</span>
                    {label}
                </button>
            ))}
        </div>
    );
}

// Helper function to format dates for display
const formatActivityDate = (game: TournamentListItem): string => {
    let dateToFormat: string;

    // First try date_debut if available
    if (game.date_debut) {
        dateToFormat = game.date_debut;
    } else {
        // Fallback to createdAt
        dateToFormat = game.createdAt;
    }

    const formattedDate = new Date(dateToFormat).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    return `${formattedDate} - ${game.creatorUsername}`;
};

export default function MyTournamentsPage() {
    const [loading, setLoading] = useState(true);
    const [gameMode, setGameMode] = useState<GameMode>('tournament');
    const [pending, setPending] = useState<TournamentListItem[]>([]);
    const [active, setActive] = useState<TournamentListItem[]>([]);
    const [ended, setEnded] = useState<TournamentListItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const { userState, userProfile, isAuthenticated, isLoading } = useAuth();

    const loadGames = async (mode: GameMode) => {
        setLoading(true);
        setError(null);

        // Get appropriate identifier based on user type
        let apiUrl = '';

        if (userState === 'teacher') {
            if (!userProfile.userId) {
                setError("Identité enseignant introuvable.");
                setLoading(false);
                return;
            }
            apiUrl = `my-tournaments?mode=${mode}`;
        } else if (userState === 'student' || userState === 'guest') {
            const cookie_id = typeof window !== "undefined" ? localStorage.getItem("mathquest_cookie_id") : null;
            if (!cookie_id && !userProfile.userId) {
                setError("Identité utilisateur introuvable.");
                setLoading(false);
                return;
            }
            apiUrl = cookie_id ? `my-tournaments?mode=${mode}&cookie_id=${cookie_id}` : `my-tournaments?mode=${mode}`;
        } else {
            setError("Type d'utilisateur non supporté.");
            setLoading(false);
            return;
        }

        try {
            const data = await makeApiRequest<MyTournamentsResponse>(apiUrl, {}, undefined, MyTournamentsResponseSchema);
            setPending(data.pending || []);
            setActive(data.active || []);
            setEnded(data.ended || []);
        } catch (error) {
            console.error('Error loading games:', error);
            setError("Erreur lors du chargement des données.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Wait for auth to finish loading
        if (isLoading) return;

        // Check if user is authenticated
        if (!isAuthenticated) {
            setError("Vous devez être connecté pour voir vos données.");
            setLoading(false);
            return;
        }

        loadGames(gameMode);
    }, [isLoading, isAuthenticated, userState, userProfile.userId, gameMode]);

    if (isLoading || loading) return <div className="min-h-screen flex items-center justify-center bg-base-200">Chargement…</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center bg-base-200"><div className="alert alert-error">{error}</div></div>;

    // Add filtering by playMode for each mode
    const filteredPending = pending.filter(t => t.playMode === gameMode);
    const filteredActive = active.filter(t => t.playMode === gameMode);
    const filteredEnded = ended.filter(t => t.playMode === gameMode);

    const renderGameList = (games: TournamentListItem[], showScores: boolean = true, showDate: boolean = false, isPractice: boolean = false, isQuiz: boolean = false) => {
        if (games.length === 0) {
            return <div className="text-base-content/60 mb-4">Aucune activité pour l&apos;instant.</div>;
        }

        return (
            <ul className="flex flex-col gap-2">
                {games.map((game) => {
                    const isCompleted = game.statut === 'completed' || game.statut === 'ended';

                    return (
                        <li key={game.id} className="flex items-center gap-4 pt-0 pb-0 pl-2 pr-1 rounded bg-base-200">
                            <span className="font-mono text-lg">{game.code}</span>
                            <span className="flex-1 truncate">
                                {showDate ? formatActivityDate(game) : game.name}
                            </span>
                            {game.position && (
                                <span className="badge badge-secondary text-xs px-2 py-1">#{game.position}</span>
                            )}
                            {isPractice ? (
                                <Link
                                    href={`/student/practice/${game.code}`}
                                    className="btn btn-ghost btn-sm p-2 min-h-0 flex items-center justify-center"
                                    title="Rejouer la session"
                                >
                                    <SquareArrowRight style={{ width: 28, height: 28, minWidth: 0, minHeight: 0 }} color="var(--primary)" />
                                </Link>
                            ) : isQuiz ? (
                                <Link
                                    href={isCompleted ? `/leaderboard/${game.code}` : `/lobby/${game.code}`}
                                    className="btn btn-ghost btn-sm p-2 min-h-0 flex items-center justify-center"
                                    title={isCompleted ? "Voir les statistiques" : "Rejoindre le lobby"}
                                >
                                    {isCompleted ? (
                                        <BarChart3 style={{ width: 28, height: 28, minWidth: 0, minHeight: 0 }} color="var(--primary)" />
                                    ) : (
                                        <SquareArrowRight style={{ width: 28, height: 28, minWidth: 0, minHeight: 0 }} color="var(--primary)" />
                                    )}
                                </Link>
                            ) : showScores ? (
                                <Link
                                    href={`/leaderboard/${game.code}`}
                                    className="btn btn-ghost btn-sm p-2 min-h-0 flex items-center justify-center"
                                    title={isCompleted ? "Voir les statistiques" : "Voir le classement"}
                                >
                                    {isCompleted ? (
                                        <BarChart3 style={{ width: 28, height: 28, minWidth: 0, minHeight: 0 }} color="var(--primary)" />
                                    ) : (
                                        <SquareArrowRight style={{ width: 28, height: 28, minWidth: 0, minHeight: 0 }} color="var(--primary)" />
                                    )}
                                </Link>
                            ) : (
                                <div className="btn btn-ghost btn-sm p-2 min-h-0 flex items-center justify-center opacity-0 pointer-events-none" style={{ width: 44, height: 44 }}>
                                    <span style={{ width: 28, height: 28 }}></span>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        );
    };

    const renderTournamentSections = () => (
        <>
            {/* Section tournois en attente */}
            {filteredPending.length > 0 && (
                <div className="w-full text-left">
                    <h2 className="text-xl font-bold mb-4">En attente</h2>
                    <ul className="flex flex-col gap-2">
                        {filteredPending.map((t) => (
                            <li key={t.id} className="flex items-center gap-4 pt-0 pb-0 pl-2 pr-1 rounded bg-base-200">
                                <span className="font-mono text-lg">{t.code}</span>
                                <span className="flex-1 truncate">{formatActivityDate(t)}</span>
                                <Link href={`/lobby/${t.code}`} className="btn btn-ghost btn-sm p-2 min-h-0 flex items-center justify-center" title="Rejoindre le lobby">
                                    <SquareArrowRight style={{ width: 28, height: 28, minWidth: 0, minHeight: 0 }} color="var(--primary)" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {filteredPending.length > 0 && <hr className="w-full border-base-300 my-4" />}

            {/* Section tournois actifs */}
            {filteredActive.length > 0 && (
                <div className="w-full text-left">
                    <h2 className="text-xl font-bold mb-4">Actifs</h2>
                    <ul className="flex flex-col gap-2">
                        {filteredActive.map((t) => (
                            <li key={t.id} className="flex items-center gap-4 pt-0 pb-0 pl-2 pr-1 rounded bg-base-200">
                                <span className="font-mono text-lg">{t.code}</span>
                                <span className="flex-1 truncate">{formatActivityDate(t)}</span>
                                {t.position && <span className="badge badge-secondary text-xs px-2 py-1">#{t.position}</span>}
                                <Link href={`/game/${t.code}`} className="btn btn-ghost btn-sm p-2 min-h-0 flex items-center justify-center" title="Jouer en différé">
                                    <SquareArrowRight style={{ width: 28, height: 28, minWidth: 0, minHeight: 0 }} color="var(--primary)" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {filteredActive.length > 0 && <hr className="w-full border-base-300 my-4" />}

            {/* Section tournois terminés */}
            <div className="w-full text-left">
                <h2 className="text-xl font-bold mb-4">Terminés</h2>
                {filteredEnded.length === 0 && <div className="text-base-content/60 mb-4">Aucun tournoi terminé pour l&apos;instant.</div>}
                <ul className="flex flex-col gap-2">
                    {filteredEnded.map((t) => (
                        <li key={t.id} className="flex items-center gap-4 pt-0 pb-0 pl-2 pr-1 rounded bg-base-200">
                            <span className="font-mono text-lg">{t.code}</span>
                            <span className="flex-1 truncate">{formatActivityDate(t)}</span>
                            {t.position && <span className="badge badge-secondary text-xs px-2 py-1">#{t.position}</span>}
                            <Link href={`/leaderboard/${t.code}`} className="btn btn-ghost btn-sm p-2 min-h-0 flex items-center justify-center" title="Voir les statistiques">
                                <BarChart3 style={{ width: 28, height: 28, minWidth: 0, minHeight: 0 }} color="var(--primary)" />
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );

    return (
        <div className="main-content">
            <div className="card w-full max-w-2xl shadow-xl bg-base-100 my-6">
                <div className="card-body items-center gap-8 w-full">
                    <h1 className="card-title text-3xl text-center mb-8">Mes activités</h1>

                    {/* Tab Navigation */}
                    <GameModeToggle
                        currentMode={gameMode}
                        onModeChange={setGameMode}
                        className="w-full mb-4"
                    />

                    {/* Content based on selected tab */}
                    {gameMode === 'tournament' && renderTournamentSections()}

                    {gameMode === 'quiz' && (
                        <div className="w-full text-left">
                            <h2 className="text-xl font-bold mb-4">Quiz en classe</h2>
                            {renderGameList([...pending, ...active, ...ended], true, true, false, true)}
                        </div>
                    )}

                    {gameMode === 'practice' && (
                        <div className="w-full text-left">
                            <h2 className="text-xl font-bold mb-4">Sessions d&apos;entraînement</h2>
                            {renderGameList([...pending, ...active, ...ended], false, true, true, false)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}