/**
 * Tournament Status API Route
 * 
 * This API route retrieves the current status information for a specific tournament:
 * - Accepts a tournament code as a query parameter
 * - Returns the tournament status (preparation, in progress, completed)
 * - Includes start and end timestamps if available
 * 
 * Used by client components to determine appropriate navigation and UI state,
 * such as redirecting users to the lobby, tournament, or leaderboard views.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    if (!code) {
        return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }
    const tournoi = await prisma.tournoi.findUnique({ where: { code } });
    if (!tournoi) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({
        statut: tournoi.statut,
        date_debut: tournoi.date_debut,
        date_fin: tournoi.date_fin,
    });
}
