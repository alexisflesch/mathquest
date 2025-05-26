import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createLogger from '@logger';
import { Logger } from '@/types';

const logger = createLogger('API:QuestionsCount');

// GET /api/questions/count?gradeLevel=...&discipline=...&themes=theme1,theme2
export async function GET(request: NextRequest) {
    // TODO: Replace this with a call to the backend API endpoint for question count
    // Example: return fetch('http://localhost:PORT/api/questions/count?...')
    return NextResponse.json({ error: 'Not implemented. Use backend API.' }, { status: 501 });
}
