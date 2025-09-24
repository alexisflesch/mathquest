/**
 * Authentication Error Banner Component
 *
 * Displays user-friendly error messages when authentication fails,
 * providing clear feedback and recovery options.
 */

import React from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function AuthErrorBanner() {
    const { authError } = useAuth();
    const router = useRouter();

    if (!authError) {
        return null;
    }

    const handleRetry = () => {
        // Clear the error and retry authentication
        window.location.reload();
    };

    const handleGoToLogin = () => {
        router.push('/login');
    };

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div>
                            <p className="font-medium">{authError}</p>
                            <p className="text-sm text-red-100 mt-1">
                                Vous pouvez réessayer ou vous reconnecter.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleRetry}
                            className="px-3 py-1 bg-red-700 hover:bg-red-800 rounded text-sm font-medium transition-colors"
                        >
                            Réessayer
                        </button>
                        <button
                            onClick={handleGoToLogin}
                            className="px-3 py-1 bg-white text-red-600 hover:bg-red-50 rounded text-sm font-medium transition-colors"
                        >
                            Se connecter
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="ml-2 p-1 hover:bg-red-700 rounded transition-colors"
                            aria-label="Fermer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}