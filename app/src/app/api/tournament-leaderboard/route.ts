/**
 * Tournament Leaderboard API Route
 * 
 * This API route retrieves the leaderboard data for a specific tournament:
 * - Accepts a tournament code as a query parameter
 * - Returns the ranked list of participants with their scores
 * 
 * The leaderboard data is stored directly in the tournament record in the database
 * and includes both live and differed (asynchronous) participant results.
 * 
 * Used by the tournament leaderboard page to display final results and rankings.
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
    // Find the tournament by code
    const tournoi = await prisma.tournoi.findUnique({ where: { code } });
    if (!tournoi) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    // If you store the leaderboard in the DB, fetch it here. Otherwise, return a placeholder or error.
    // For now, return an empty leaderboard if not found.
    // You may want to persist the leaderboard in the future.
    return NextResponse.json({ leaderboard: tournoi.leaderboard || [] });
}
