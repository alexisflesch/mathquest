/**
 * Tournament API Route
 * 
 * This API route handles all tournament-related operations:
 * - Creating new tournaments
 * - Starting and ending tournaments
 * - Retrieving tournament data by code, ID, or teacher/questions
 * 
 * The route supports:
 * - POST: For creating/updating tournaments with various actions (create, start, end)
 * - GET: For retrieving tournament data with different filtering options
 * 
 * Tournament creation handles both teacher-created and student-created tournaments
 * with appropriate data attribution and unique code generation.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createLogger from '@logger';
import { Logger } from '@/types';

const logger = createLogger('API:Tournament') as Logger;

// Generate a unique 6-digit numeric code for the tournament
async function generateUniqueTournamentCode() {
    let code;
    let exists = true;
    while (exists) {
        code = Math.floor(100000 + Math.random() * 900000).toString();
        // const found = await prisma.tournoi.findUnique({ where: { code } });
        exists = false; // TODO: Replace with actual check
    }
    return code;
}

export async function POST(request: NextRequest) {
    // TODO: Replace this with a call to the backend API endpoint for tournament
    // Example: return fetch('http://localhost:PORT/api/tournament', { method: 'POST', ... })
    return NextResponse.json({ error: 'Not implemented. Use backend API.' }, { status: 501 });
}

export async function GET(request: NextRequest) {
    // TODO: Replace this with a call to the backend API endpoint for tournament
    // Example: return fetch('http://localhost:PORT/api/tournament?...')
    return NextResponse.json({ error: 'Not implemented. Use backend API.' }, { status: 501 });
}
