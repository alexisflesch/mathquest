"use client";
import React, { useState } from 'react';

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
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || 'Erreur');
            setSuccess('Un email de réinitialisation a été envoyé si ce compte existe.');
        } catch (err: unknown) {
            setError((err as Error).message || 'Erreur lors de la demande.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center gap-8">
                <h1 className="text-3xl font-extrabold text-indigo-700 mb-4 text-center tracking-wide drop-shadow">Réinitialiser le mot de passe</h1>
                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
                    <div>
                        <label className="block text-lg font-bold text-sky-700 mb-2" htmlFor="email">
                            Email
                        </label>
                        <input
                            className="w-full py-3 px-4 rounded-full border-2 border-sky-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-200 text-lg font-semibold text-gray-700 bg-sky-50 placeholder:text-sky-300 transition"
                            id="email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            placeholder="Votre email"
                            autoComplete="email"
                        />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    {success && <p className="text-sm text-green-600">{success}</p>}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-gradient-to-r from-indigo-400 via-sky-400 to-violet-400 text-white font-extrabold py-3 px-8 rounded-full shadow-lg hover:scale-105 hover:shadow-xl focus:ring-4 focus:ring-indigo-200 focus:outline-none transition text-2xl tracking-wide mt-2"
                    >
                        {isLoading ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
                    </button>
                </form>
            </div>
        </div>
    );
}