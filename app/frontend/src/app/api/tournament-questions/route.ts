/**
 * Game Questions API Route
 * 
 * This API route retrieves all questions for a specific game instance:
 * - Accepts a game access code as a query parameter
 * - Verifies the game instance exists in the database
 * - Returns questions ordered by grade level and discipline
 * 
 * Used by the game interface to fetch the question set when
 * a player joins a game or when resuming a game in progress.
 * 
 * Includes detailed logging to aid in debugging question retrieval.
 */

import { NextRequest, NextResponse } from 'next/server';
// Import the server-side logger from the root directory
import createLogger from '@logger';
import { Logger } from '@/types';
import { Question } from '@shared/types/quiz/question';

const logger = createLogger('API:GameQuestions') as Logger;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    logger.debug('Game questions requested:', { code });
    if (!code) {
        return NextResponse.json({ message: 'Code manquant.' }, { status: 400 });
    }

    // TODO: Replace this with a call to the backend API endpoint for tournament questions
    // Example: return fetch('http://localhost:PORT/api/tournament-questions?...')
    return NextResponse.json({ error: 'Not implemented. Use backend API.' }, { status: 501 });

    // REMOVE: const gameInstance = await prisma.gameInstance.findUnique({
    //     where: { accessCode: code },
    //     include: {
    //         quizTemplate: {
    //             include: {
    //                 questions: {
    //                     include: {
    //                         question: true
    //                     },
    //                     orderBy: {
    //                         sequence: 'asc'
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // });

    // logger.debug('Game instance found:', {
    //     id: gameInstance?.id,
    //     code: gameInstance?.accessCode,
    //     status: gameInstance?.status,
    //     questionCount: gameInstance?.quizTemplate?.questions?.length || 0
    // });

    // if (!gameInstance) {
    //     return NextResponse.json({ message: 'Instance de jeu introuvable.' }, { status: 404 });
    // }

    // Extract questions from the QuizTemplate in the correct order
    // const questions = gameInstance.quizTemplate.questions.map((q: { question: Question }) => q.question);

    // logger.info('Game questions retrieved:', {
    //     gameInstanceId: gameInstance.id,
    //     accessCode: code,
    //     questionCount: questions.length
    // });

    // return NextResponse.json(questions);
}
