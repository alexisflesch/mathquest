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
import { STORAGE_KEYS } from '@/constants/auth';
import { UniversalLoginResponseSchema, ErrorResponseSchema, type UniversalLoginResponse } from '@/types/api';

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
            const responseData = await makeApiRequest<UniversalLoginResponse>(
                '/api/auth',
                {
                    method: 'POST',
                    body: JSON.stringify({ action: 'teacher_login', email, password }),
                },
                undefined,
                UniversalLoginResponseSchema
            );

            // Store JWT token for authentication
            if (responseData.token) {
                localStorage.setItem('mathquest_jwt_token', responseData.token);
                logger.debug('Stored JWT token');
            }

            // Handle teacher login response format
            if ('enseignantId' in responseData) {
                // Teacher login response
                const teacherResponse = responseData;

                // Store teacher id in localStorage for frontend profile fetch
                if (teacherResponse.enseignantId) {
                    localStorage.setItem(STORAGE_KEYS.TEACHER_ID, teacherResponse.enseignantId);
                }

                // Set username and avatar for gameplay/leaderboard
                if (teacherResponse.username) {
                    localStorage.setItem(STORAGE_KEYS.USERNAME, teacherResponse.username);
                    logger.debug('Set mathquest_username', { username: teacherResponse.username });
                }
                if (teacherResponse.avatar) {
                    localStorage.setItem(STORAGE_KEYS.AVATAR, teacherResponse.avatar);
                    logger.debug('Set mathquest_avatar', { avatar: teacherResponse.avatar });
                }
            }

            // Ensure mathquest_cookie_id is set for teacher gameplay/leaderboard
            if (typeof window !== 'undefined') {
                let cookie_id = localStorage.getItem(STORAGE_KEYS.COOKIE_ID);
                if (!cookie_id) {
                    cookie_id = Math.random().toString(36).substring(2) + Date.now();
                    localStorage.setItem(STORAGE_KEYS.COOKIE_ID, cookie_id);
                    logger.debug('Set new mathquest_cookie_id', { cookie_id });
                } else {
                    logger.debug('Using existing mathquest_cookie_id', { cookie_id });
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