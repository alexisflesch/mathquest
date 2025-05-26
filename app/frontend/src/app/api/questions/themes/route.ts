import { NextRequest, NextResponse } from 'next/server';
import { Question } from '@shared/types/quiz/question';

// GET /api/questions/themes?gradeLevel=CE2&discipline=maths
export async function GET(req: NextRequest) {
    // TODO: Replace this with a call to the backend API endpoint for question themes
    // Example: return fetch('http://localhost:PORT/api/questions/themes?...')
    return NextResponse.json({ error: 'Not implemented. Use backend API.' }, { status: 501 });
}
