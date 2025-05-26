import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';


// GET /api/questions/list?gradeLevel=...&discipline=...&themes=...&limit=...
export async function GET(request: NextRequest) {
    // TODO: Replace this with a call to the backend API endpoint for question list
    // Example: return fetch('http://localhost:PORT/api/questions/list?...')
    return NextResponse.json({ error: 'Not implemented. Use backend API.' }, { status: 501 });
}
