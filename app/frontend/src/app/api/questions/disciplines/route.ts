import { NextRequest, NextResponse } from 'next/server';


// GET /api/questions/disciplines?gradeLevel=CE2 or /api/questions/disciplines?niveau=CE2
export async function GET(req: NextRequest) {
    // TODO: Replace this with a call to the backend API endpoint for question disciplines
    // Example: return fetch('http://localhost:PORT/api/questions/disciplines?...')
    return NextResponse.json({ error: 'Not implemented. Use backend API.' }, { status: 501 });
}
