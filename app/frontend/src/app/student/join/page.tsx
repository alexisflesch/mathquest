/**
 * Student Universal Join Page
 * 
 * This page provides the interface for students to join any type of session:
 * - Quiz/Tournament games → Lobby or Live interface
 * - Practice sessions → Direct practice interface
 * - Simple numeric code entry with validation
 * - Smart routing based on game type and status
 * - Error handling for invalid codes
 * 
 * The component implements intelligent routing logic that directs students
 * to the appropriate experience based on the session type and state:
 * - Practice sessions → Direct practice interface
 * - Games in preparation → Lobby
 * - Games in progress → Live interface
 * - Games that are finished → Live interface in differed mode
 * - Differed games → Live interface directly
 */

"use client";
import React, { useState } from "react";
import InfoModal from '@/components/SharedModal';
import { useRouter } from "next/navigation";
import { makeApiRequest } from '@/config/api';
import { GameJoinResponse } from '@/types/api';
import { useAuthState } from '@/hooks/useAuthState';
import type { GameStatus } from '@shared/types/core/game';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

export default function StudentJoinPage() {
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [modal, setModal] = useState<null | { type: 'notfound' | 'differed' | 'expired', message: string }>(null);
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

            // First, get the game instance to check playMode
            const gameData = await makeApiRequest<{ gameInstance: any }>(`/api/games/${code}`);
            const gameInstance = gameData.gameInstance;

            if (!gameInstance) {
                setModal({ type: 'notfound', message: "Ce code de tournoi n'existe pas." });
                return;
            }

            if (gameInstance.playMode === 'practice') {
                router.push(`/student/practice/${code}`);
                return;
            }

            // For quiz/tournament games, proceed with join logic
            const data = await makeApiRequest<GameJoinResponse>(`/api/games/${code}/join`, {
                method: 'POST',
                body: JSON.stringify({ userId: userProfile.userId }),
            });
            const game = data.gameInstance;
            const status = game.status;
            const accessCode = game.accessCode || code;

            // A game is deferred when it's completed but still available for replay
            if (game.status === 'completed' && game.differedAvailableTo) {
                const now = new Date();
                const availableUntil = new Date(game.differedAvailableTo);
                if (availableUntil > now) {
                    setModal({
                        type: 'differed',
                        message: "Ce tournoi est terminé. Vous pouvez le jouer en différé si vous le souhaitez."
                    });
                    return;
                }
            }
            if (status === 'pending' || status === 'active') {
                router.push(`/live/${accessCode}`);
                return;
            }
            if (status === 'completed' || status === 'ended') {
                setModal({
                    type: 'differed',
                    message: "Ce tournoi est terminé. Vous pouvez le jouer en différé si vous le souhaitez."
                });
                return;
            }
            setError(`Code erroné (status: ${status})`);
        } catch (err: any) {
            const msg = err?.message || "Code erroné";
            if (msg.includes('Tournament no longer available') || msg.includes('plus disponible')) {
                setModal({ type: 'expired', message: "Ce tournoi différé n'est plus disponible." });
            } else {
                setModal({ type: 'notfound', message: msg });
            }
        }
    };

    return (
        <div className="main-content">
            <form
                onSubmit={handleSubmit}
                className="card w-full max-w-md shadow-xl bg-base-100 my-6"
            >
                <div className="card-body items-center gap-8">
                    <h1 className="card-title text-2xl mb-4">Rejoindre une activité</h1>
                    <input
                        className="input input-bordered input-lg w-full text-center tracking-widest"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={8}
                        minLength={4}
                        placeholder="Code de l'activité"
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

            {/* Modal for not found, differed, or expired mode */}
            <InfoModal
                isOpen={!!modal}
                onClose={() => setModal(null)}
                title={
                    modal?.type === 'notfound'
                        ? 'Code invalide'
                        : modal?.type === 'expired'
                            ? 'Tournoi différé expiré'
                            : 'Tournoi terminé'
                }
                showCloseButton={false}
                size="sm"
            >
                {modal?.type === 'notfound' && (
                    <div className="dialog-modal-content gap-4">
                        <span>Le code que vous avez saisi n'existe pas.</span>
                        <div className="dialog-modal-actions">
                            <button
                                className="dialog-modal-btn"
                                onClick={() => setModal(null)}
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                )}
                {modal?.type === 'expired' && (
                    <div className="dialog-modal-content gap-4">
                        <span>{modal?.message}</span>
                        <div className="dialog-modal-actions">
                            <button
                                className="dialog-modal-btn"
                                onClick={() => setModal(null)}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                )}
                {modal?.type === 'differed' && (
                    <div className="dialog-modal-content gap-4">
                        <span>{modal?.message}</span>
                        <div className="dialog-modal-actions">
                            <button
                                className="dialog-modal-btn"
                                onClick={() => setModal(null)}
                            >
                                Annuler
                            </button>
                            <button
                                className="dialog-modal-btn"
                                onClick={() => {
                                    setModal(null);
                                    router.push(`/live/${code}?differed=1`);
                                }}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                )}
            </InfoModal>
        </div>
    );
}

