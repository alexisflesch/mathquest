import { NextResponse } from 'next/server';
import createLogger from '@logger';
import { Logger } from '@/types';
import { Question } from '@shared/types/quiz/question';

const logger = createLogger('API:QuestionsFilters') as Logger;

export async function GET() {
    // TODO: Replace this with a call to the backend API endpoint for question filters
    // Example: return fetch('http://localhost:PORT/api/questions/filters?...')
    return NextResponse.json({ error: 'Not implemented. Use backend API.' }, { status: 501 });
}
