/**
 * Teacher (Enseignant) API Route
 * 
 * This API route retrieves basic information about a specific teacher:
 * - Accepts a teacher ID as a query parameter
 * - Returns the teacher's username (display name) and avatar information
 * 
 * This route is primarily used to retrieve teacher information for displaying
 * in tournaments and lobbies, particularly for tournaments created by teachers.
 * 
 * Only returns essential information and omits sensitive teacher data.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    // TODO: Replace this with a call to the backend API endpoint for enseignant
    // Example: return fetch('http://localhost:PORT/api/enseignant?...')
    return NextResponse.json({ error: 'Not implemented. Use backend API.' }, { status: 501 });
}
