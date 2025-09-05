'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import InfinitySpin from '@/components/InfinitySpin';
import { createLogger } from '@/clientLogger';
import { useAuth } from '@/components/AuthProvider';

const logger = createLogger('EmailVerify');

// Global cache to prevent duplicate verification attempts across component instances
const verificationCache = new Set<string>();

export default function VerifyEmailPage() {
    const params = useParams();
    const router = useRouter();
    const { refreshAuth } = useAuth();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Vérification de votre email en cours...');

    const token = params.token as string;

    const verifyEmail = useCallback(async () => {
        if (!token) {
            setStatus('error');
            setMessage('Token de vérification manquant');
            return;
        }

        // Check global cache to prevent duplicate verification attempts
        if (verificationCache.has(token)) {
            logger.debug('Skipping verification - token already processed', { token: token.substring(0, 10) + '...' });
            return;
        }

        // Add token to cache immediately to prevent duplicates
        verificationCache.add(token);
        logger.info('Starting email verification', { token: token.substring(0, 10) + '...' });

        try {
            // Add a small delay to prevent any flash of error content
            await new Promise(resolve => setTimeout(resolve, 100));

            logger.debug('Making verification request');

            const response = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });

            logger.debug('Fetch completed');

            const data = await response.json();
            logger.info('Verification response received', {
                status: response.status,
                ok: response.ok,
                success: data.success,
                message: data.message
            });

            if (response.ok && data.success) {
                logger.info('Email verification successful');

                // Update UI state first
                setStatus('success');
                setMessage(data.message || 'Email vérifié avec succès !');
                logger.debug('Status updated to success, message set');

                // Show success message for 1.5 seconds, then refresh auth and redirect
                setTimeout(async () => {
                    try {
                        // Refresh auth state just before redirect to ensure AppNav updates
                        logger.debug('Refreshing auth state before redirect');
                        await refreshAuth(true);
                        logger.debug('Auth refresh completed, redirecting now');
                    } catch (authError) {
                        logger.error('Auth refresh failed, but redirecting anyway', { authError });
                    } finally {
                        // Always redirect, even if auth refresh fails
                        logger.info('Redirecting to home page');
                        router.push('/');
                    }
                }, 1500); // Show success message for 1.5 seconds
            } else {
                logger.error('Email verification failed', { data });
                setStatus('error');
                setMessage(data.error || data.message || 'Erreur lors de la vérification');
                // Remove from cache on failure so it can be retried
                verificationCache.delete(token);
            }
        } catch (error) {
            logger.error('Verification request failed', { error });
            setStatus('error');
            setMessage('Erreur de connexion');
            // Remove from cache on error so it can be retried
            verificationCache.delete(token);
        }
    }, [token, router, refreshAuth]);

    useEffect(() => {
        verifyEmail();
    }, []); // Empty dependency array to only run once on mount

    const handleReturnHome = () => {
        router.push('/');
    };

    const handleGoToHome = () => {
        router.push('/');
    };

    return (
        <main className="main-content">
            <div className="card w-full max-w-lg bg-base-100">
                <div className="text-center p-8">
                    <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
                        {status === 'loading' && '⏳ Vérification en cours...'}
                        {status === 'success' && '✅ Email vérifié !'}
                        {status === 'error' && '❌ Erreur de vérification'}
                    </h1>

                    {status === 'loading' && (
                        <div className="flex items-center justify-center mb-6">
                            <InfinitySpin size={48} />
                        </div>
                    )}

                    <p className="text-lg mb-6" style={{
                        color: status === 'success' ? 'var(--success)' :
                            status === 'error' ? 'var(--destructive)' :
                                'var(--muted-foreground)'
                    }}>
                        {message}
                    </p>

                    {status === 'success' && (
                        <div className="space-y-4">
                            <button
                                onClick={handleGoToHome}
                                className="w-full py-3 px-6 rounded-lg font-medium transition-colors"
                                style={{
                                    backgroundColor: 'var(--primary)',
                                    color: 'var(--primary-foreground)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = '0.9';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = '1';
                                }}
                            >
                                Retour à l&apos;accueil
                            </button>
                            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                                Redirection en cours...
                            </p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="space-y-3">
                            <button
                                onClick={handleReturnHome}
                                className="w-full py-3 px-6 rounded-lg font-medium transition-colors"
                                style={{
                                    backgroundColor: 'var(--secondary)',
                                    color: 'var(--secondary-foreground)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = '0.9';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = '1';
                                }}
                            >
                                Retour à l&apos;accueil
                            </button>
                            <button
                                onClick={() => router.push('/login')}
                                className="w-full py-3 px-6 rounded-lg font-medium transition-colors"
                                style={{
                                    border: '1px solid var(--border)',
                                    backgroundColor: 'transparent',
                                    color: 'var(--foreground)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--muted)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                Aller à la page de connexion
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
