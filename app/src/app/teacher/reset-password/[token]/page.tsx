"use client";
import React, { useState } from 'react';

export default function Page() {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        if (!password || password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères.');
            return;
        }
        if (password !== confirm) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }
        setIsLoading(true);
        // TODO: call API to reset password with token (à adapter selon ton backend)
        setTimeout(() => {
            setSuccess('Mot de passe réinitialisé avec succès !');
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200">
            <div className="card w-full max-w-md shadow-xl bg-base-100">
                <div className="card-body items-center gap-8">
                    <h1 className="card-title text-3xl mb-4 text-center">Nouveau mot de passe</h1>
                    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
                        <input
                            className="input input-bordered input-lg w-full"
                            type="password"
                            placeholder="Nouveau mot de passe"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            minLength={8}
                            required
                        />
                        <input
                            className="input input-bordered input-lg w-full"
                            type="password"
                            placeholder="Confirmer le mot de passe"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            minLength={8}
                            required
                        />
                        {error && <div className="alert alert-error justify-center">{error}</div>}
                        {success && <div className="alert alert-success justify-center">{success}</div>}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary btn-lg w-full"
                        >
                            {isLoading ? 'Envoi...' : 'Réinitialiser'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}