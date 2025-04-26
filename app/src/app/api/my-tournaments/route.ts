/**
 * My Tournaments API Route
 * 
 * This API route retrieves tournaments associated with a specific student:
 * - Accepts a cookie_id as a query parameter to identify the student
 * - Returns two collections:
 *   1. created: Tournaments created by the student that are still in preparation
 *   2. played: Tournaments the student has participated in, with score and ranking
 * 
 * For played tournaments, the route calculates the student's ranking position
 * by comparing their score with all other participants in each tournament.
 * 
 * Used by the student dashboard to display personal tournament history.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const cookie_id = searchParams.get('cookie_id');
    if (!cookie_id) {
        return NextResponse.json({ error: 'cookie_id requis' }, { status: 400 });
    }
    // Trouver l'id du joueur
    const joueur = await prisma.joueur.findUnique({ where: { cookie_id } });
    if (!joueur) {
        return NextResponse.json({ created: [], played: [] });
    }
    // Tournois créés par l'élève et non lancés
    const created = await prisma.tournoi.findMany({
        where: {
            cree_par_joueur_id: joueur.id,
            statut: 'en préparation',
        },
        orderBy: { date_creation: 'desc' },
    });
    // Tournois joués (score existe pour ce joueur)
    const scores = await prisma.score.findMany({
        where: { joueur_id: joueur.id },
        include: { tournoi: true },
        orderBy: { date_score: 'desc' },
    });
    // Calcul dynamique de la position pour chaque tournoi joué
    const played = await Promise.all(scores.map(async (s) => {
        // Récupérer tous les scores de ce tournoi
        const allScores = await prisma.score.findMany({
            where: { tournoi_id: s.tournoi_id },
            orderBy: [
                { score: 'desc' },
                { temps: 'asc' }, // départager à temps égal
            ],
        });
        // Trouver la position du joueur (1-based)
        const sorted = allScores.map(sc => sc.joueur_id);
        const position = sorted.indexOf(s.joueur_id) + 1;
        return {
            ...s.tournoi,
            position,
            score: s.score,
        };
    }));
    return NextResponse.json({ created, played });
}
