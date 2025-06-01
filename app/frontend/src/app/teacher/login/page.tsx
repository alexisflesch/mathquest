/**
 * Teacher Login Page
 * 
 * This page provides the authentication interface for teachers accessing the MathQuest platform:
 * - Email and password authentication with field validation
 * - Error handling for failed authentication attempts
 * - Loading state management during authentication process
 * - Storage of teacher identity for subsequent API calls
 * - Creation of necessary local storage entries for teacher participation in student activities
 * 
 * The page implements secure teacher authentication using server-side validation,
 * while also establishing the necessary client-side state for teachers to access
 * student areas for testing and demonstration purposes. After successful authentication,
 * teachers are redirected to their dashboard with full access to teaching tools.
 */

"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { createLogger } from '@/clientLogger';
import { makeApiRequest } from '@/config/api';

// Create a logger for this component
const logger = createLogger('TeacherLogin');

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
            const result = await makeApiRequest<{
                message?: string;
                enseignant?: { id: string; username: string };
                enseignantId?: string;
                cookie_id?: string;
                username?: string;
                avatar?: string;
            }>('auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'teacher_login', email, password }),
            });
            logger.debug('Login response', result);
            // Store teacher id in localStorage for frontend profile fetch
            if (result.enseignantId) {
                localStorage.setItem('mathquest_teacher_id', result.enseignantId);
            }
            // Ensure mathquest_cookie_id is set for teacher gameplay/leaderboard
            if (typeof window !== 'undefined') {
                let cookie_id = result.cookie_id;
                if (cookie_id) {
                    localStorage.setItem('mathquest_cookie_id', cookie_id);
                    logger.debug('Set mathquest_cookie_id', { cookie_id });
                } else {
                    // fallback for legacy/old backend
                    cookie_id = localStorage.getItem('mathquest_cookie_id') || undefined;
                    if (!cookie_id) {
                        cookie_id = Math.random().toString(36).substring(2) + Date.now();
                        localStorage.setItem('mathquest_cookie_id', cookie_id);
                        logger.debug('Set new mathquest_cookie_id', { cookie_id });
                    } else {
                        logger.debug('Using existing mathquest_cookie_id', { cookie_id });
                    }
                }
                // Set username and avatar for gameplay/leaderboard
                if (result.username) {
                    localStorage.setItem('mathquest_username', result.username);
                    logger.debug('Set mathquest_username', { username: result.username });
                }
                if (result.avatar) {
                    localStorage.setItem('mathquest_avatar', result.avatar);
                    logger.debug('Set mathquest_avatar', { avatar: result.avatar });
                }
                // Log all values after setting
                logger.info('Teacher login successful', {
                    cookie_id: localStorage.getItem('mathquest_cookie_id'),
                    username: localStorage.getItem('mathquest_username'),
                    avatar: localStorage.getItem('mathquest_avatar'),
                });
            }
            if (refreshAuth) refreshAuth(); // Trigger refreshAuth after successful login
            router.push('/teacher/home'); // Redirect to home
        } catch (err: unknown) {
            logger.error('Login error', err);
            setError((err as Error).message || 'Une erreur est survenue.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="main-content">
            <div className="card w-full max-w-md shadow-xl bg-base-100">
                <div className="card-body items-center gap-8">
                    <h1 className="card-title text-center text-3xl mb-6">Connexion Enseignant</h1>
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