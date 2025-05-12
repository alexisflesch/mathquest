/**
 * Teacher Quiz Questions API Route
 * 
 * This API route retrieves all questions for a specific teacher-created quiz:
 * - Extracts the quizId from the URL path
 * - Verifies the quiz exists in the database
 * - Returns the full question data for all questions in the quiz
 * 
 * Used by the teacher dashboard to display and manage questions within a quiz.
 * The route includes comprehensive logging for debugging purposes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import createLogger from '@logger';
import { Logger } from '@/types';

const prisma = new PrismaClient();
const logger = createLogger('API:TeacherQuizQuestions') as Logger;

export async function GET(req: NextRequest) {
    // Extract quizId from the URL pathname
    const url = new URL(req.url);
    const quizId = url.pathname.split("/").at(-2);

    logger.debug('API route called', { quizId });

    if (!quizId) {
        logger.warn('quizId missing');
        return NextResponse.json({ error: 'quizId manquant' }, { status: 400 });
    }

    // Récupérer le quiz (enseignant)
    const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
    });
    if (!quiz) {
        logger.warn('Quiz not found', { quizId });
        return NextResponse.json({ error: 'Quiz introuvable' }, { status: 404 });
    }

    // Récupérer les questions liées à ce quiz
    const questions = await prisma.question.findMany({
        where: { uid: { in: quiz.questions_ids } },
    });
    logger.info('Quiz found', { quizId, questionCount: questions.length });

    return NextResponse.json({ questions });
}
