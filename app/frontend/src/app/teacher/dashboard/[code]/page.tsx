/**
 * Teacher Dashboard Page - Following Working Teacher Page Pattern
 * 
 * Uses socket connection for data fetching, like projection page and other working teacher pages.
 * No direct API calls - everything through socket events.
 */

import React from "react";
import AccessErrorPage from '@/components/AccessErrorPage';
import TeacherDashboardClient from '@/components/TeacherDashboardClient';

// New server-side access validation function
async function validateDashboardAccess(code: string) {
    if (!code || code === 'undefined') {
        return { valid: false, reason: 'INVALID_CODE' };
    }
    // Call unified backend API for access validation
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/validate-page-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageType: 'dashboard', accessCode: code }),
        credentials: 'include', // send cookies if needed
        cache: 'no-store',
    });
    if (!res.ok) {
        let reason = 'UNKNOWN';
        try { reason = (await res.json()).reason; } catch { }
        return { valid: false, reason };
    }
    const data = await res.json();
    return { valid: data.valid, gameId: data.gameId, reason: data.reason };
}

export default async function TeacherDashboardPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;
    if (!code || code === 'undefined') {
        return <AccessErrorPage message="Code d'accès manquant ou invalide." />;
    }
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
        return <AccessErrorPage message="Configuration serveur manquante : NEXT_PUBLIC_BACKEND_URL non défini." />;
    }
    const result = await validateDashboardAccess(code);
    if (!result.valid) {
        let message = 'Accès refusé.';
        if (result.reason === 'NOT_AUTHENTICATED') message = 'Vous devez être connecté pour accéder à ce dashboard.';
        if (result.reason === 'NOT_QUIZ_MODE') message = 'Seuls les quiz sont accessibles en mode dashboard. Ce code ne correspond pas à un quiz.';
        if (result.reason === 'NOT_CREATOR') message = 'Seul le créateur du quiz peut accéder au dashboard.';
        if (result.reason === 'INVALID_CODE') message = 'Code d\'accès invalide ou inexistant.';
        if (result.reason === 'NOT_FOUND') message = 'Quiz introuvable ou supprimé.';
        if (result.reason === 'UNKNOWN') message = 'Erreur inconnue lors de la validation de l\'accès. Veuillez réessayer ou contacter le support.';
        return <AccessErrorPage message={message} />;
    }
    return <TeacherDashboardClient code={code} gameId={result.gameId} />;
}
