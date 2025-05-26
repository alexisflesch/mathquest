/**
 * Questions API Route
 * 
 * This API route retrieves questions for quiz and tournament creation:
 * - Supports filtering by discipline, niveau (grade level), and theme
 * - Returns a randomized subset of questions based on the provided limit
 * - Default limit is 10 questions if not specified
 * 
 * Used by both teacher quiz creation and student tournament creation flows
 * to generate question sets based on selected criteria.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createLogger from '@logger';
import { Logger } from '@/types';
import { Question } from '@shared/types/quiz/question';

const logger = createLogger('API:Questions') as Logger;

// GET: List all questions for quiz creation
export async function GET(request: NextRequest) {
    // TODO: Replace this with a call to the backend API endpoint for questions
    // Example: return fetch('http://localhost:PORT/api/questions?...')
    return NextResponse.json({ error: 'Not implemented. Use backend API.' }, { status: 501 });
}
