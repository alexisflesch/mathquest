/**
 * Student Game Join Page
 * 
 * This page provides the interface for students to join games (quiz, tournament, or practice):
 * - Simple numeric code entry with validation
 * - Smart routing based on game type and status
 * - Error handling for invalid codes
 * 
 * The component implements intelligent routing logic that directs students
 * to the appropriate experience based on the game's current state:
 * - Games in preparation → Lobby
 * - Games in progress → Live interface
 * - Games that are finished → Live interface in differed mode
 * - Differed games → Live interface directly
 */

"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { makeApiRequest } from '@/config/api';
import { GameJoinResponse } from '@/types/api';
import { useAuthState } from '@/hooks/useAuthState';
import type { GameStatus } from '@shared/types/core/game';

export default function StudentJoinPage() {
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { userProfile } = useAuthState();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!code || code.length < 4) {
            setError("Veuillez entrer un code valide.");
            return;
        }
        try {
            if (!userProfile.userId) {
                setError("Impossible de récupérer l'identifiant utilisateur. Veuillez vous reconnecter.");
                return;
            }
            const data = await makeApiRequest<GameJoinResponse>('/api/games/' + code + '/join', {
                method: 'POST',
                body: JSON.stringify({ userId: userProfile.userId }),
            });
            const game = data.gameInstance;
            const status = game.status;
            const accessCode = game.accessCode || code;

            // Strict naming: use only canonical GameStatus values
            // Backend and frontend must use: 'pending', 'active', 'paused', 'completed', 'archived'
            if (game.isDiffered) {
                router.push(`/live/${accessCode}`);
                return;
            }
            if (status === 'pending') {
                router.push(`/lobby/${accessCode}`);
                return;
            }
            if (status === 'active') {
                router.push(`/live/${accessCode}`);
                return;
            }
            if (status === 'completed') {
                router.push(`/live/${accessCode}?differed=1`);
                return;
            }
            setError(`Code erroné (status: ${status})`);
        } catch (err: any) {
            setError(err?.message || "Code erroné");
        }
    };

    return (
        <div className="main-content">
            <form
                onSubmit={handleSubmit}
                className="card w-full max-w-md shadow-xl bg-base-100 my-6"
            >
                <div className="card-body items-center gap-8">
                    <h1 className="card-title text-3xl mb-4">Rejoindre un jeu</h1>
                    <input
                        className="input input-bordered input-lg w-full text-center tracking-widest"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={8}
                        minLength={4}
                        placeholder="Code du jeu"
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

