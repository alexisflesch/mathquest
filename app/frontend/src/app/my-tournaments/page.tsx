"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { SquareArrowRight } from "lucide-react"; // Ajout de l'icône
import { makeApiRequest } from '@/config/api';

interface Tournament {
    id: string;
    code: string;
    nom: string;
    statut: string;
    date_creation: string;
    date_debut: string | null;
    date_fin: string | null;
    leaderboard?: unknown[];
}

interface PlayedTournament extends Tournament {
    position: number;
    score: number;
}

export default function MyTournamentsPage() {
    const [loading, setLoading] = useState(true);
    const [created, setCreated] = useState<Tournament[]>([]);
    const [played, setPlayed] = useState<PlayedTournament[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Récupérer identité élève
        if (typeof window === "undefined") return;
        const cookie_id = localStorage.getItem("mathquest_cookie_id");
        if (!cookie_id) {
            setError("Identité élève introuvable.");
            setLoading(false);
            return;
        }
        // Appel API renommée my-tournaments
        makeApiRequest<{ created: Tournament[]; played: PlayedTournament[] }>(`my-tournaments?cookie_id=${cookie_id}`)
            .then((data) => {
                setCreated(data.created || []);
                setPlayed(data.played || []);
            })
            .catch(() => setError("Erreur lors du chargement des tournois."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-base-200">Chargement…</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center bg-base-200"><div className="alert alert-error">{error}</div></div>;

    return (
        <div className="main-content">
            <div className="card w-full max-w-2xl shadow-xl bg-base-100 my-6">
                <div className="card-body items-center gap-8 w-full">
                    <h1 className="card-title text-3xl text-center mb-8">Mes tournois</h1>
                    {/* Section tournois créés non lancés */}
                    {created.length > 0 && (
                        <div className="w-full text-left">
                            <h2 className="text-xl font-bold mb-4">Tournois en attente</h2>
                            <ul className="flex flex-col gap-2">
                                {created.map((t) => (
                                    <li key={t.id} className="flex items-center gap-4 pt-0 pb-0 pl-2 pr-1 rounded bg-base-200">
                                        <span className="font-mono text-lg">{t.code}</span>
                                        <span className="flex-1 truncate">{t.nom}</span>
                                        <Link href={`/lobby/${t.code}`} className="btn btn-ghost btn-sm p-2 min-h-0 flex items-center justify-center" title="Rejoindre le lobby">
                                            <SquareArrowRight style={{ width: 28, height: 28, minWidth: 0, minHeight: 0 }} color="var(--primary)" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {created.length > 0 && <hr className="w-full border-base-300 my-4" />}
                    {/* Section tournois joués */}
                    <div className="w-full text-left">
                        <h2 className="text-xl font-bold mb-4">Tournois joués</h2>
                        {played.length === 0 && <div className="text-base-content/60 mb-4">Aucun tournoi joué pour l&apos;instant.</div>}
                        <ul className="flex flex-col gap-2">
                            {played.map((t) => (
                                <li key={t.id} className="flex items-center gap-4 pt-0 pb-0 pl-2 pr-1 rounded bg-base-200">
                                    <span className="font-mono text-lg">{t.code}</span>
                                    <span className="flex-1 truncate">{t.nom}</span>
                                    <span className="badge badge-secondary text-xs px-2 py-1">#{t.position || "-"}</span>
                                    <Link href={`/leaderboard/${t.code}`} className="btn btn-ghost btn-sm p-2 min-h-0 flex items-center justify-center" title="Voir le classement">
                                        <SquareArrowRight style={{ width: 28, height: 28, minWidth: 0, minHeight: 0 }} color="var(--primary)" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}