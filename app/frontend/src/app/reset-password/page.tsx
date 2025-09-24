"use client";
import React, { useState } from 'react';
import { makeApiRequest } from '@/config/api';
import { FRONTEND_AUTH_ENDPOINTS } from '@/constants/api';

export default function TeacherResetPasswordRequestPage() {
    const [email, setEmail] = useState('');
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsLoading(true);
        try {
            const result = await makeApiRequest<{ message?: string }>(FRONTEND_AUTH_ENDPOINTS.RESET_PASSWORD, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            setSuccess('Un email de réinitialisation a été envoyé si ce compte existe.');
        } catch (err: unknown) {
            setError((err as Error).message || 'Erreur lors de la demande.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="main-content">
            <div className="card w-full max-w-md shadow-xl bg-base-100 my-6">
                <div className="card-body items-center gap-8">
                    <h1 className="card-title text-3xl mb-4 text-center">Réinitialiser le mot de passe</h1>
                    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
                        <div>
                            <label className="block text-lg font-bold mb-2" htmlFor="email">
                                Email
                            </label>
                            <input
                                className="input input-bordered input-lg w-full"
                                id="email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                placeholder="Votre email"
                                autoComplete="email"
                            />
                        </div>
                        {error && <div className="alert alert-error justify-center">{error}</div>}
                        {success && <div className="alert alert-success justify-center">{success}</div>}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary btn-lg w-full"
                        >
                            {isLoading ? 'Envoi...' : 'Envoyer le lien'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}