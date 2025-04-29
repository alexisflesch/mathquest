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
import { PrismaClient } from '@prisma/client';
import createLogger from '@logger';
import { Logger } from '@/types';

const logger = createLogger('API:QuizTournamentCode') as Logger;
const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const quizId = url.pathname.split("/").at(-2);

        logger.debug(`GET /quiz/${quizId}/tournament-code`);

        if (!quizId) {
            logger.warn('Error: quizId required');
            return NextResponse.json({ error: 'quizId requis' }, { status: 400 });
        }

        const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });

        if (!quiz) {
            logger.warn(`Error: Quiz with ID ${quizId} not found`);
            return NextResponse.json({ error: 'Quiz introuvable' }, { status: 404 });
        }

        if (!quiz.tournament_code) {
            logger.debug(`No tournament_code found for quiz ${quizId}`);
            return NextResponse.json({ tournament_code: null });
        }

        logger.debug(`Found tournament_code for quiz ${quizId}: ${quiz.tournament_code || 'none'}`);
        return NextResponse.json({ tournament_code: quiz.tournament_code });
    } catch (error) {
        logger.error('Error in GET /quiz/[quizId]/tournament-code:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const quizId = url.pathname.split("/").at(-2);

        logger.info(`POST /quiz/${quizId}/tournament-code - Creating new tournament`);

        if (!quizId) {
            logger.warn('Error: quizId required');
            return NextResponse.json({ error: 'quizId requis' }, { status: 400 });
        }

        const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });

        if (!quiz) {
            logger.warn(`Error: Quiz with ID ${quizId} not found`);
            return NextResponse.json({ error: 'Quiz introuvable' }, { status: 404 });
        }

        if (!quiz.questions_ids || !Array.isArray(quiz.questions_ids) || quiz.questions_ids.length === 0) {
            logger.warn(`Error: Quiz ${quizId} has no questions`);
            return NextResponse.json({ error: 'Quiz sans questions' }, { status: 400 });
        }

        // Always generate a new code and create a new tournament
        let code = "";
        let exists = true;
        let attempts = 0;

        // Generate unique code with collision detection
        while (exists && attempts < 10) {
            code = Math.floor(100000 + Math.random() * 900000).toString();
            const found = await prisma.tournoi.findUnique({ where: { code } });
            exists = !!found;
            attempts++;
        }

        if (exists) {
            logger.error(`Error: Could not generate unique tournament code after ${attempts} attempts`);
            return NextResponse.json({ error: 'Impossible de générer un code unique' }, { status: 500 });
        }

        // If quiz already has a tournament, clean it up
        if (quiz.tournament_code) {
            logger.info(`Cleaning up existing tournament ${quiz.tournament_code} for quiz ${quizId}`);
            // Delete scores first if not cascading
            await prisma.score.deleteMany({ where: { tournoi: { code: quiz.tournament_code } } });
            await prisma.tournoi.deleteMany({ where: { code: quiz.tournament_code } });
        }

        // Create new tournament
        await prisma.tournoi.create({
            data: {
                nom: quiz.nom,
                questions_ids: quiz.questions_ids,
                enseignant_id: quiz.enseignant_id,
                type: quiz.type,
                niveau: Array.isArray(quiz.niveaux) ? quiz.niveaux[0] || null : null,
                categorie: Array.isArray(quiz.categories) ? quiz.categories[0] || null : null,
                themes: quiz.themes,
                statut: 'en préparation',
                cree_par_enseignant_id: quiz.enseignant_id,
                questions_generées: true,
                code,
            },
        });

        // Update quiz with new tournament code
        await prisma.quiz.update({ where: { id: quizId }, data: { tournament_code: code } });

        logger.info(`Successfully created tournament with code ${code} for quiz ${quizId}`);
        return NextResponse.json({ tournament_code: code });
    } catch (error) {
        logger.error('Error in POST /quiz/[quizId]/tournament-code:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
