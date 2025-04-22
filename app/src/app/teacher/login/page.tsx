"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

export default function TeacherLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { refreshAuth } = useAuth() || {}; // Import and use refreshAuth

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'teacher_login', email, password }),
            });
            const result = await response.json();
            if (!response.ok) {
                setError(result.message || 'Erreur lors de la connexion.');
                setIsLoading(false);
                return;
            }
            // Store teacher id in localStorage for frontend profile fetch
            if (result.enseignantId) {
                localStorage.setItem('mathquest_teacher_id', result.enseignantId);
            }
            if (refreshAuth) refreshAuth(); // Trigger refreshAuth after successful login
            router.push('/teacher/dashboard'); // Redirect to dashboard
        } catch (err: unknown) {
            setError((err as Error).message || 'Une erreur est survenue.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-[calc(100vh-56px)] flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4 pt-14 md:h-screen md:pt-0">
            <div className="card w-full max-w-md shadow-xl bg-base-100">
                <div className="card-body items-center gap-8">
                    <h1 className="card-title text-3xl mb-4">Connexion Enseignant</h1>
                    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6" autoComplete="on">
                        <div>
                            <label className="block text-lg font-bold mb-2" htmlFor="email">
                                Email
                            </label>
                            <input
                                className="input input-bordered input-lg w-full"
                                id="email"
                                type="email"
                                name="email"
                                required
                                placeholder="Votre email"
                                autoComplete="username"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-lg font-bold mb-2" htmlFor="password">
                                Mot de passe
                            </label>
                            <input
                                className="input input-bordered input-lg w-full"
                                id="password"
                                type="password"
                                name="password"
                                required
                                placeholder="Votre mot de passe"
                                autoComplete="current-password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                        {error && <div className="alert alert-error justify-center">{error}</div>}
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Connexion...' : 'Se connecter'}
                        </button>
                    </form>
                    <p className="text-center text-sm mt-4">
                        Pas encore de compte ?{' '}
                        <Link href="/teacher/signup" className="link link-primary">
                            Créer un compte enseignant
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}