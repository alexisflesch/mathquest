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

export async function GET(request: NextRequest) {
    // TODO: Replace this with a call to the backend API endpoint for tournament leaderboard
    // Example: return fetch('http://localhost:PORT/api/tournament-leaderboard?...')
    return NextResponse.json({ error: 'Not implemented. Use backend API.' }, { status: 501 });
}
