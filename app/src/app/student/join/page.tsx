"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

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
            const res = await fetch(`/api/tournament/status?code=${code}`);
            if (!res.ok) {
                setError("Code erroné");
                return;
            }
            const data = await res.json();
            const tournoiCode = data.code || code; // prefer code over id
            if (data.type === 'differé' || data.type === 'différé') {
                router.push(`/tournament/${tournoiCode}`);
                return;
            }
            if (data.type === 'direct') {
                if (data.statut === 'en préparation') {
                    router.push(`/lobby/${tournoiCode}`);
                    return;
                }
                if (data.statut === 'en cours') {
                    router.push(`/tournament/${tournoiCode}`);
                    return;
                }
                if (data.statut === 'terminé') {
                    setError('Tournoi terminé');
                    return;
                }
            }
            setError('Code erroné');
        } catch {
            setError("Code erroné");
        }
    };

    return (
        <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-gray-100 px-4">
            <form
                onSubmit={handleSubmit}
                className="card w-full max-w-md shadow-xl bg-base-100"
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

