/**
 * Tournament Questions API Route
 * 
 * This API route retrieves all questions for a specific tournament:
 * - Accepts a tournament code as a query parameter
 * - Verifies the tournament exists in the database
 * - Returns questions ordered by grade level (niveau) and theme
 * 
 * Used by the tournament interface to fetch the question set when
 * a player joins a tournament or when resuming a tournament in progress.
 * 
 * Includes detailed logging to aid in debugging tournament question retrieval.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
// Import the server-side logger from the root directory
const createLogger = require('@logger');
const logger = createLogger('API:TournamentQuestions');

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    logger.debug('Tournament questions requested:', { code });
    if (!code) {
        return NextResponse.json({ message: 'Code manquant.' }, { status: 400 });
    }
    // Find the tournament by code
    const tournoi = await prisma.tournoi.findUnique({ where: { code } });
    logger.debug('Tournament found:', {
        id: tournoi?.id,
        code: tournoi?.code,
        status: tournoi?.statut,
        questionCount: tournoi?.questions_ids?.length
    });
    if (!tournoi) {
        return NextResponse.json({ message: 'Tournoi introuvable.' }, { status: 404 });
    }
    // Get the questions for this tournament
    const questions = await prisma.question.findMany({
        where: { uid: { in: tournoi.questions_ids } },
        orderBy: [
            { niveau: 'asc' },
            { theme: 'asc' },
        ],
    });
    logger.info('Tournament questions retrieved:', {
        tournamentId: tournoi.id,
        tournamentCode: code,
        questionCount: questions.length
    });
    return NextResponse.json(questions);
}
