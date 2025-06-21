/**
 * Teacher Projection Page Component
 *
 * This page provides a full-screen projection view for teachers to display
 * quiz content on a larger screen (projector, interactive whiteboard, etc.)
 * Features:
 * - Draggable and resizable components
 * - Real-time updates via socket connection
 * - Same authentication as the dashboard
 * - Components can be arranged freely and can overlap
 */

"use client";

import React, { useEffect, useState } from "react";
import AccessErrorPage from '@/components/AccessErrorPage';
import TeacherProjectionClient from '@/components/TeacherProjectionClient';
import { useParams } from "next/navigation";

export default function TeacherProjectionPage() {
    const params = useParams();
    const code = typeof params.gameCode === "string" ? params.gameCode : Array.isArray(params.gameCode) ? params.gameCode[0] : "";
    const [result, setResult] = useState<{ valid: boolean; reason: string; gameId?: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!code || code === 'undefined') {
            setResult({ valid: false, reason: 'INVALID_CODE' });
            setLoading(false);
            return;
        }
        fetch(`/api/validate-dashboard-access`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pageType: 'projection', accessCode: code }),
            credentials: 'include',
            cache: 'no-store',
        })
            .then(async (res) => {
                if (!res.ok) {
                    let reason = 'UNKNOWN';
                    try { reason = (await res.json()).reason; } catch { }
                    setResult({ valid: false, reason });
                } else {
                    const data = await res.json();
                    setResult({ valid: data.valid, gameId: data.gameId, reason: data.reason });
                }
            })
            .catch(() => setResult({ valid: false, reason: 'FETCH_ERROR' }))
            .finally(() => setLoading(false));
    }, [code]);

    if (loading) return <div>Chargement...</div>;
    if (!result || !result.valid) {
        let message = 'Accès refusé.';
        if (result?.reason === 'NOT_AUTHENTICATED') message = 'Vous devez être connecté pour accéder à la projection.';
        if (result?.reason === 'NOT_QUIZ_MODE') message = 'Seuls les quiz sont accessibles en mode projection. Ce code ne correspond pas à un quiz.';
        if (result?.reason === 'NOT_CREATOR') message = 'Seul le créateur du quiz peut accéder à la projection.';
        if (result?.reason === 'INVALID_CODE') message = 'Code d\'accès invalide ou inexistant.';
        if (result?.reason === 'NOT_FOUND') message = 'Quiz introuvable ou supprimé.';
        if (result?.reason === 'UNKNOWN') message = 'Erreur inconnue lors de la validation de l\'accès. Veuillez réessayer ou contacter le support.';
        if (result?.reason === 'NO_BACKEND_URL') message = 'Configuration serveur manquante : NEXT_PUBLIC_BACKEND_URL non défini.';
        if (result?.reason === 'FETCH_ERROR') message = 'Erreur réseau lors de la validation de l\'accès. Vérifiez votre connexion ou contactez le support.';
        return <AccessErrorPage message={message} />;
    }
    if (!result.gameId) {
        return <AccessErrorPage message="Erreur interne : identifiant du quiz manquant. Veuillez réessayer ou contacter le support." />;
    }
    return <TeacherProjectionClient code={code} gameId={result.gameId} />;
}