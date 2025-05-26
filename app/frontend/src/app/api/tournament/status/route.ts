import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';


// GET /api/tournament/status?code=XXXXXX
export async function GET(request: NextRequest) {
    // TODO: Replace this with a call to the backend API endpoint for tournament status
    // Example: return fetch('http://localhost:PORT/api/tournament/status?...')
    return NextResponse.json({ error: 'Not implemented. Use backend API.' }, { status: 501 });
}
