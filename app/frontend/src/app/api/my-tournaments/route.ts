/**
 * My Tournaments API Route
 * 
 * This API route retrieves tournaments associated with a specific student:
 * - Accepts a cookie_id as a query parameter to identify the student
 * - Returns two collections:
 *   1. created: Tournaments created by the student that are still in preparation
 *   2. played: Tournaments the student has participated in, with score and ranking
 * 
 * For played tournaments, the route calculates the student's ranking position
 * by comparing their score with all other participants in each tournament.
 * 
 * Used by the student dashboard to display personal tournament history.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    // TODO: Replace this with a call to the backend API endpoint for my-tournaments
    // Example: return fetch('http://localhost:PORT/api/my-tournaments?...')
    return NextResponse.json({ error: 'Not implemented. Use backend API.' }, { status: 501 });
}
