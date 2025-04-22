import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, ...data } = body;

        if (action === 'join') {
            const { pseudo, code, avatar, cookie_id } = data;
            if (!pseudo || !code || !cookie_id) {
                return NextResponse.json({ message: 'Champs manquants.' }, { status: 400 });
            }
            const tournoi = await prisma.tournoi.findUnique({ where: { code } });
            if (!tournoi) return NextResponse.json({ message: 'Tournoi introuvable.' }, { status: 404 });
            let joueur = await prisma.joueur.findUnique({ where: { cookie_id } });
            if (!joueur) {
                joueur = await prisma.joueur.create({
                    data: { pseudo, cookie_id, avatar },
                });
                console.log('[API/student] Created new Joueur:', joueur);
            } else {
                console.log('[API/student] Found existing Joueur:', joueur);
            }
            // Optionally: add to a join table if needed
            return NextResponse.json({ message: 'Joueur connecté.', joueurId: joueur.id, tournoiId: tournoi.id }, { status: 200 });
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
            const scores: { pseudo: string; score: number; avatar: string | null }[] = allScores.map(s => ({ pseudo: s.joueur.pseudo, score: s.score, avatar: s.joueur.avatar }));
            // Update the SSE state
            await fetch('http://localhost:3000/api/tournament/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scores }),
            });
            return NextResponse.json({ message: 'Réponse enregistrée', correct, score: newScore }, { status: 200 });
        }

        return NextResponse.json({ message: 'Action inconnue.' }, { status: 400 });
    } catch (error: unknown) {
        console.error('API /api/student error:', error);
        return NextResponse.json({ message: 'Erreur serveur.', error: String(error) }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const tournoiId = searchParams.get('tournoiId');
    const joueurId = searchParams.get('joueurId');
    // TODO: Fetch current question, score, leaderboard for this player
    return NextResponse.json({
        tournoiId,
        joueurId,
        currentQuestion: null,
        score: 0,
        leaderboard: [],
    });
}
