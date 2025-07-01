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

import React, { useEffect, useState, useRef } from "react"; // Import use
import { Layout, Responsive, WidthProvider } from "react-grid-layout"; // Import Layout type
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "@/app/globals.css";
import { createLogger } from '@/clientLogger';
import { useProjectionQuizSocket } from '@/hooks/useProjectionQuizSocket';
import { useSocketAuthHandler } from '@/hooks/useSocketAuthHandler';
import { useRouter } from 'next/navigation';
import AccessErrorPage from '@/components/AccessErrorPage';
import TeacherProjectionClient from '@/components/TeacherProjectionClient';
import type { QuizQuestion, TournamentQuestion } from '@shared/types';
import type { QuestionData } from '@shared/types/socketEvents';
import type { QuizState } from '@/hooks/useTeacherQuizSocket';
import { QUESTION_TYPES } from '@shared/types';
import { z } from 'zod';
import { joinDashboardPayloadSchema } from '@shared/types/socketEvents.zod';

const ResponsiveGridLayout = WidthProvider(Responsive);
const logger = createLogger('ProjectionPage');
// Helper function to format timer display
function formatTimer(val: number | null) {
    if (val === null) return '-';
    if (val >= 60) {
        const m = Math.floor(val / 60);
        const s = val % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }
    return val.toString();
}

// Helper function to convert milliseconds to seconds for timer display
function formatTimerMs(timeLeftMs: number | null) {
    if (timeLeftMs === null || timeLeftMs === undefined) return '-';
    const seconds = Math.ceil(timeLeftMs / 1000); // Convert ms to seconds, round up
    return formatTimer(seconds);
}

async function validateProjectionAccess(code: string) {
    if (!code || code === 'undefined') {
        return { valid: false, reason: 'INVALID_CODE' };
    }
    // Call backend API for access validation
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/validate-dashboard-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: code }),
        credentials: 'include',
        cache: 'no-store',
    });
    if (!res.ok) {
        let reason = 'UNKNOWN';
        try { reason = (await res.json()).reason; } catch { }
        return { valid: false, reason };
    }
    const data = await res.json();
    return { valid: data.valid, gameId: data.gameId };
}

export default async function ProjectionPage({ params }: { params: Promise<{ gameCode: string }> }) {
    const { gameCode: code } = await params;
    if (!code || code === 'undefined') {
        return <AccessErrorPage message="Code d'accès manquant ou invalide." />;
    }
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
    if (!backendUrl) {
        return <AccessErrorPage message="Configuration serveur manquante : NEXT_PUBLIC_BACKEND_API_URL non défini." />;
    }
    const result = await validateProjectionAccess(code);
    if (!result.valid) {
        let message = 'Accès refusé.';
        if (result.reason === 'NOT_AUTHENTICATED') message = 'Vous devez être connecté pour accéder à la projection.';
        if (result.reason === 'NOT_QUIZ_MODE') message = 'Seuls les quiz sont accessibles en mode projection. Ce code ne correspond pas à un quiz.';
        if (result.reason === 'NOT_CREATOR') message = 'Seul le créateur du quiz peut accéder à la projection.';
        if (result.reason === 'INVALID_CODE') message = 'Code d\'accès invalide ou inexistant.';
        if (result.reason === 'NOT_FOUND') message = 'Quiz introuvable ou supprimé.';
        if (result.reason === 'UNKNOWN') message = 'Erreur inconnue lors de la validation de l\'accès. Veuillez réessayer ou contacter le support.';
        return <AccessErrorPage message={message} />;
    }
    return <TeacherProjectionClient code={code} gameId={result.gameId} />;
}