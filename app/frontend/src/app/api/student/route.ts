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
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import createLogger from '@logger';
import { Logger } from '@/types';
import Filter from 'bad-words-next';
import fs from 'fs';
import path from 'path';
import { checkPseudoWithSubstrings } from '@/app/utils/pseudoFilter';
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

const prisma = new PrismaClient();
const logger = createLogger('API:Questions') as Logger;


export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, ...data } = body;

        if (action === 'join') {
            const { pseudo, code, avatar, cookie_id } = data;
            if (!pseudo || !cookie_id) {
                logger.warn('Missing fields in join action', { pseudo, code, cookie_id });
                return NextResponse.json({ message: 'Champs manquants.' }, { status: 400 });
            }
            // --- PSEUDO VALIDATION ---
            if (typeof pseudo !== 'string' || pseudo.length > 15) {
                return NextResponse.json({ message: 'Le pseudo doit faire 15 caractères maximum.' }, { status: 400 });
            }
            // Active/désactive la détection par sous-chaînes ici :
            const useSubstrings = true;
            if (checkPseudoWithSubstrings(pseudo, useSubstrings)) {
                return NextResponse.json({ message: 'Le pseudo contient un mot inapproprié.' }, { status: 400 });
            }
            // --- END VALIDATION ---
            let joueur = await prisma.joueur.findUnique({ where: { cookie_id } });
            if (!joueur) {
                joueur = await prisma.joueur.create({
                    data: { pseudo, cookie_id, avatar },
                });
                logger.info('Created new Player', { id: joueur.id, pseudo, cookie_id });
            } else {
                logger.debug('Found existing Player', { id: joueur.id, pseudo: joueur.pseudo });
            }
            // Si un code tournoi est fourni, vérifier et retourner l'id du tournoi
            let tournoiId = undefined;
            if (code) {
                const tournoi = await prisma.tournoi.findUnique({ where: { code } });
                if (!tournoi) {
                    logger.warn('Tournament not found', { code });
                    return NextResponse.json({ message: 'Tournoi introuvable.' }, { status: 404 });
                }
                tournoiId = tournoi.id;
            }
            return NextResponse.json({ message: 'Joueur connecté.', joueurId: joueur.id, tournoiId }, { status: 200 });
        }

        if (action === 'answer') {
            const { joueur_id, tournoi_id, question_id, reponse, temps } = data;
            if (!joueur_id || !tournoi_id || !question_id || reponse === undefined) {
                return NextResponse.json({ message: 'Champs manquants.' }, { status: 400 });
            }
            // Fetch question
            const question = await prisma.question.findUnique({ where: { uid: question_id } });
            if (!question) {
                return NextResponse.json({ message: 'Question introuvable.' }, { status: 404 });
            }
            // Parse reponses JSON if needed
            let reponsesArr = question.reponses;
            if (typeof reponsesArr === 'string') {
                try { reponsesArr = JSON.parse(reponsesArr); } catch { reponsesArr = []; }
            }
            // Check if answer is correct
            let correct = false;
            if (Array.isArray(reponsesArr)) {
                const found = reponsesArr
                    .filter((r): r is { texte?: string; correct?: boolean } => !!r && typeof r === 'object' && 'texte' in r)
                    .find(r => r.texte === reponse);
                if (found && 'correct' in found) {
                    correct = !!found.correct;
                }
            }
            // Update or create score
            const scoreRow = await prisma.score.findFirst({ where: { tournoi_id, joueur_id } });
            const newScore = (scoreRow?.score || 0) + (correct ? 100 : 0); // 100 pts for correct answer
            if (scoreRow) {
                await prisma.score.update({ where: { id: scoreRow.id }, data: { score: newScore, temps } });
            } else {
                await prisma.score.create({ data: { id: randomUUID(), tournoi_id, joueur_id, score: newScore, temps, date_score: new Date() } });
            }
            // Update in-memory tournament state for SSE
            // Fetch all scores for this tournament
            const allScores = await prisma.score.findMany({ where: { tournoi_id }, include: { joueur: true } });
            const scores: { pseudo: string; score: number; avatar: string | null }[] = allScores.map((s: { score: number; joueur: { pseudo: string; avatar: string | null } }) => ({ pseudo: s.joueur.pseudo, score: s.score, avatar: s.joueur.avatar }));
            // Update the SSE state
            await fetch('http://localhost:3000/api/tournament/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scores }),
            });
            return NextResponse.json({ message: 'Réponse enregistrée', correct, score: newScore }, { status: 200 });
        }

        logger.warn('Unknown action', { action });
        return NextResponse.json({ message: 'Action inconnue.' }, { status: 400 });
    } catch (error: unknown) {
        logger.error('API error:', error);
        return NextResponse.json({ message: 'Erreur serveur.', error: String(error) }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const tournoiId = searchParams.get('tournoiId');
    const joueurId = searchParams.get('joueurId');
    // TODO: Fetch current question, score, leaderboard for this player
    logger.debug('GET student tournament state', { tournoiId, joueurId });
    return NextResponse.json({
        tournoiId,
        joueurId,
        currentQuestion: null,
        score: 0,
        leaderboard: [],
    });
}
