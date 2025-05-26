/**
 * Student API Route
 * 
 * This API route handles student-specific operations:
 * - POST with "join" action: Registers a student for a tournament
 * - POST with "answer" action: Records a student's answer to a tournament question
 * - GET: Retrieves a student's current tournament state (questions, score, leaderboard)
 * 
 * Key features include:
 * - Student creation or retrieval based on cookie_id
 * - Answer validation against question data
 * - Score calculation and persistence
 * - Real-time score updates via server-sent events
 * 
 * Used by the tournament interface to manage student participation and scoring.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import createLogger from '@logger';
import { Logger } from '@/types';
import Filter from 'bad-words-next';
import fs from 'fs';
import path from 'path';
import { checkusernameWithSubstrings } from '@/app/utils/usernameFilter';
import frenchBadwordsList from 'french-badwords-list';

const zacangerWords = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'dictionaries', 'words.json'), 'utf-8'));
// Charger le dictionnaire fr.txt personnalisé
const frTxtWords = fs.readFileSync(path.join(process.cwd(), 'dictionaries', 'fr.txt'), 'utf-8')
    .split('\n')
    .map(w => w.trim())
    .filter(Boolean);
// Fusionne toutes les listes (fr.txt + french-badwords-list + zacanger)
const allBadWords = [
    ...frTxtWords,
    ...frenchBadwordsList.array,
    ...zacangerWords
];
const data = {
    id: 'custom',
    words: allBadWords,
    lookalike: {} // Provide an empty object or a valid Lookalike map if needed
};
const filter = new Filter({ data });

const logger = createLogger('API:Questions') as Logger;


export async function POST(request: NextRequest) {
    // TODO: Replace this with a call to the backend API endpoint for student
    // Example: return fetch('http://localhost:PORT/api/student', { method: 'POST', ... })
    return NextResponse.json({ error: 'Not implemented. Use backend API.' }, { status: 501 });
}

export async function GET(request: NextRequest) {
    // TODO: Replace this with a call to the backend API endpoint for student
    // Example: return fetch('http://localhost:PORT/api/student?...')
    return NextResponse.json({ error: 'Not implemented. Use backend API.' }, { status: 501 });
}
