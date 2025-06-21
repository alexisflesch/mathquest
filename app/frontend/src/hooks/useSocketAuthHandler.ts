/**
 * Socket Authorization Handler Hook
 * 
 * Shared hook that handles authorization errors from socket connections
 * and provides consistent error handling and redirect behavior for both
 * dashboard and projection pages.
 * 
 * Following DRY principle from modernization guidelines.
 */

import { useCallback } from 'react';
import { createLogger } from '@/clientLogger';

const logger = createLogger('useSocketAuthHandler');

interface AuthError {
    code: string;
    message?: string;
}

interface UseSocketAuthHandlerProps {
    /** Function to set error state in the component */
    setError: (error: string) => void;
    /** Function to set loading state in the component */
    setLoading: (loading: boolean) => void;
    /** Page type for logging purposes */
    pageType: 'dashboard' | 'projection';
    /** Custom redirect URL (defaults to home '/') */
    redirectTo?: string;
    /** Delay before redirect in milliseconds (defaults to 2000ms) */
    redirectDelay?: number;
}

export function useSocketAuthHandler({
    setError,
    setLoading,
    pageType,
    redirectTo = '/',
    redirectDelay = 2000
}: UseSocketAuthHandlerProps) {

    const handleAuthError = useCallback((error: AuthError) => {
        logger.error(`${pageType} authorization error:`, error);

        // Handle authorization errors by redirecting to specified page
        if (error.code === 'NOT_AUTHORIZED' || error.code === 'GAME_NOT_FOUND') {
            logger.warn(`Access denied to ${pageType}, redirecting to ${redirectTo}:`, error);
            setError(`Accès refusé: ${error.message || `Vous n'êtes pas autorisé à accéder à ce ${pageType === 'dashboard' ? 'tableau de bord' : 'mode projection'}`}`);
            setLoading(false);

            // Redirect after showing error briefly
            setTimeout(() => {
                window.location.href = redirectTo;
            }, redirectDelay);

            return true; // Indicates auth error was handled
        }

        return false; // Not an auth error, let caller handle
    }, [setError, setLoading, pageType, redirectTo, redirectDelay]);

    const handleGenericError = useCallback((error: AuthError, errorPrefix?: string) => {
        const wasAuthError = handleAuthError(error);

        if (!wasAuthError) {
            // Handle other errors normally
            const prefix = errorPrefix || `Erreur du ${pageType === 'dashboard' ? 'tableau de bord' : 'mode projection'}`;
            setError(`${prefix}: ${error.message || 'Erreur inconnue'}`);
            setLoading(false);
        }
    }, [handleAuthError, setError, setLoading, pageType]);

    return {
        handleAuthError,
        handleGenericError
    };
}
