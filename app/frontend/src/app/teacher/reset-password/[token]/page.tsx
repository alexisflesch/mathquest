"use client";
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { makeApiRequest } from '@/config/api';

export default function Page() {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const params = useParams();

    // Extract token from URL params
    const token = params?.token as string;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // Validation
        if (!password || password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères.');
            return;
        }
        if (password !== confirm) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }
        if (!token) {
            setError('Token de réinitialisation manquant.');
            return;
        }

        setIsLoading(true);

        try {
            const result = await makeApiRequest<{ message: string }>('/api/v1/auth/reset-password/confirm', {
                method: 'POST',
                body: JSON.stringify({
                    token: token,
                    newPassword: password
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            setSuccess('Mot de passe réinitialisé avec succès ! Redirection vers la page de connexion...');
            // Redirect to login page after 2 seconds
            setTimeout(() => {
                router.push('/teacher/login');
            }, 2000);
        } catch (error) {
            console.error('Password reset error:', error);
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Une erreur est survenue lors de la réinitialisation.');
            }
        } finally {
            setIsLoading(false);
        }
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
                            minLength={6}
                            required
                        />
                        <input
                            className="input input-bordered input-lg w-full"
                            type="password"
                            placeholder="Confirmer le mot de passe"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            minLength={6}
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