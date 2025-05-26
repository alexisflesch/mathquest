/**
 * Quiz Tournament Code API
 * 
 * This API route manages the association between a quiz and a tournament.
 * It allows:
 * - GET: Retrieve the current tournament code for a quiz
 * - POST: Generate a new tournament from a quiz with a unique code
 * 
 * The POST endpoint handles:
 * 1. Unique code generation with collision detection
 * 2. Creation of a new tournament based on quiz settings
 * 3. Cleanup of any existing tournament linked to this quiz
 * 4. Updating the quiz with the new tournament code
 */

import { NextRequest, NextResponse } from 'next/server';
import createLogger from '@logger';
import { Logger } from '@/types';

const logger = createLogger('API:QuizTournamentCode') as Logger;

export async function GET(req: NextRequest) {
    // TODO: Replace this with a call to the backend API endpoint for quiz tournament code
    // Example: return fetch('http://localhost:PORT/api/quiz/[quizId]/tournament-code?...')
    return NextResponse.json({ error: 'Not implemented. Use backend API.' }, { status: 501 });
}

export async function POST(req: NextRequest) {
    // TODO: Replace this with a call to the backend API endpoint for quiz tournament code creation
    // Example: return fetch('http://localhost:PORT/api/quiz/[quizId]/tournament-code', { method: 'POST', ... })
    return NextResponse.json({ error: 'Not implemented. Use backend API.' }, { status: 501 });
}
