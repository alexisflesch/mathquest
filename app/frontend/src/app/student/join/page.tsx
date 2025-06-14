/**
 * Student Tournament Join Page
 * 
 * This page provides the interface for students to join tournaments:
 * - Simple numeric code entry with validation
 * - Smart routing based on tournament type and status
 * - Error handling for invalid codes
 * 
 * The component implements intelligent routing logic that directs students
 * to the appropriate experience based on the tournament's current state:
 * - Direct tournaments in preparation → Lobby
 * - Direct tournaments in progress → Tournament interface
 * - Direct tournaments that are finished → Tournament in differed mode
 * - Differed tournaments → Tournament interface directly
 */

"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { makeApiRequest } from '@/config/api';
import { TournamentStatusResponseSchema, type TournamentStatusResponse } from '@/types/api';

export default function StudentJoinPage() {
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!code || code.length < 4) {
            setError("Veuillez entrer un code valide.");
            return;
        }
        try {
            const data = await makeApiRequest<TournamentStatusResponse>(`tournament/status?code=${code}`, {}, undefined, TournamentStatusResponseSchema);
            const tournoiCode = data.code || code; // prefer code over id
            if (data.defaultMode === 'differé' || data.defaultMode === 'différé') {
                router.push(`/live/${tournoiCode}`);
                return;
            }
            if (data.defaultMode === 'direct') {
                if (data.statut === 'en préparation') {
                    router.push(`/lobby/${tournoiCode}`);
                    return;
                }
                if (data.statut === 'en cours') {
                    router.push(`/live/${tournoiCode}`);
                    return;
                }
                if (data.statut === 'terminé') {
                    // Allow differed play for finished tournaments
                    router.push(`/live/${tournoiCode}?differed=1`);
                    return;
                }
            }
            setError('Code erroné');
        } catch {
            setError("Code erroné");
        }
    };

    return (
        <div className="main-content">
            <form
                onSubmit={handleSubmit}
                className="card w-full max-w-md shadow-xl bg-base-100 my-6"
            >
                <div className="card-body items-center gap-8">
                    <h1 className="card-title text-3xl mb-4">Rejoindre un tournoi</h1>
                    <input
                        className="input input-bordered input-lg w-full text-center tracking-widest"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={8}
                        minLength={4}
                        placeholder="Code du tournoi"
                        value={code}
                        onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                        autoFocus
                    />
                    {error && (
                        <div className="alert alert-error w-full justify-center">
                            {error}
                        </div>
                    )}
                    <button
                        type="submit"
                        className="btn btn-primary btn-lg w-full mt-4"
                        disabled={!code || code.length < 4}
                    >
                        Rejoindre
                    </button>
                </div>
            </form>
        </div>
    );
}

