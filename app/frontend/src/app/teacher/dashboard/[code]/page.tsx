"use client";

/**
 * Teacher Dashboard Page - Following Working Teacher Page Pattern
 * 
 * Uses socket connection for data fetching, like projection page and other working teacher pages.
 * No direct API calls - everything through socket events.
 */

// Revert to a purely client-side dashboard page for static export compatibility
import React, { useEffect, useState } from "react";
import AccessErrorPage from '@/components/AccessErrorPage';
import TeacherDashboardClient from '@/components/TeacherDashboardClient';
import LoadingScreen from '@/components/LoadingScreen';
import { useParams } from "next/navigation";

export default function TeacherDashboardPage() {
    const params = useParams();
    const code = typeof params.code === "string" ? params.code : Array.isArray(params.code) ? params.code[0] : "";
    const [result, setResult] = useState<{ valid: boolean; reason: string; gameId?: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!code || code === 'undefined') {
            setResult({ valid: false, reason: 'INVALID_CODE' });
            setLoading(false);
            return;
        }
        // Directly call backend endpoint with makeApiRequest to ensure Authorization header is sent
        import('@/config/api').then(({ makeApiRequest }) => {
            makeApiRequest<{ valid: boolean; reason: string; gameId?: string }>(
                'validate-page-access',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pageType: 'dashboard', accessCode: code }),
                    cache: 'no-store',
                }
            )
                .then((data) => {
                    setResult({ valid: data.valid, gameId: data.gameId, reason: data.reason });
                })
                .catch((err) => {
                    setResult({ valid: false, reason: 'FETCH_ERROR' });
                })
                .finally(() => setLoading(false));
        });
    }, [code]);

    if (loading) return <LoadingScreen message="Chargement du dashboard..." />;
    if (!result || !result.valid) {
        let message = 'Accès refusé.';
        if (result?.reason === 'NOT_AUTHENTICATED') message = 'Vous devez être connecté pour accéder à ce dashboard.';
        if (result?.reason === 'NOT_QUIZ_MODE') message = 'Seuls les quiz sont accessibles en mode dashboard. Ce code ne correspond pas à un quiz.';
        if (result?.reason === 'NOT_CREATOR') message = 'Seul le créateur du quiz peut accéder au dashboard.';
        if (result?.reason === 'INVALID_CODE') message = 'Code d\'accès invalide ou inexistant.';
        if (result?.reason === 'NOT_FOUND') message = 'Quiz introuvable ou supprimé.';
        if (result?.reason === 'UNKNOWN') message = 'Erreur inconnue lors de la validation de l\'accès. Veuillez réessayer ou contacter le support.';
        if (result?.reason === 'NO_BACKEND_URL') message = 'Configuration serveur manquante : NEXT_PUBLIC_BACKEND_API_URL non défini.';
        if (result?.reason === 'FETCH_ERROR') message = 'Erreur réseau lors de la validation de l\'accès. Vérifiez votre connexion ou contactez le support.';
        return <AccessErrorPage message={message} />;
    }
    if (!result.gameId) {
        return <AccessErrorPage message="Erreur interne : identifiant du quiz manquant. Veuillez réessayer ou contacter le support." />;
    }
    return <TeacherDashboardClient code={code} gameId={result.gameId} />;
}
