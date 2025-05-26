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

export async function GET(request: NextRequest) {
    // TODO: Replace this with a call to the backend API endpoint for tournament status
    // Example: return fetch('http://localhost:PORT/api/tournament-status?...')
    return NextResponse.json({ error: 'Not implemented. Use backend API.' }, { status: 501 });
}
