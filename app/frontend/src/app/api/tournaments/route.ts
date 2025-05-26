/**
 * Tournaments API Route
 * 
 * This API route handles tournament creation operations:
 * - POST: Creates a new tournament with specified properties
 * 
 * Key features of this route include:
 * - Generation of a unique 6-digit tournament code
 * - Setting of expiration date (24 hours after creation)
 * - Support for both student and teacher tournament creation
 * - Storage of tournament parameters (level, category, themes)
 * 
 * Tournaments start in "en préparation" status and can be later
 * updated to "en cours" and "terminé" via other API routes.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createLogger from '@logger';
import { Logger } from '@/types';

const logger = createLogger('API:Tournaments') as Logger;

// POST /api/tournaments
export async function POST(request: NextRequest) {
    // TODO: Replace this with a call to the backend API endpoint for tournaments
    // Example: return fetch('http://localhost:PORT/api/tournaments', { method: 'POST', ... })
    return NextResponse.json({ error: 'Not implemented. Use backend API.' }, { status: 501 });
}
