import { NextRequest, NextResponse } from 'next/server';
// import prisma from '../../../../db/index.js';
import prisma from '@db';

// GET /api/can-play-differed?code=...&userId=...
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const userId = searchParams.get('userId');

    if (!code || !userId) {
        return NextResponse.json({ error: 'Missing code or userId' }, { status: 400 });
    }

    // 1. Check if the tournament exists
    const tournoi = await prisma.tournoi.findUnique({ where: { code } });
    if (!tournoi) {
        return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // If userId is not a UUID, treat it as a cookie_id and look up the Joueur
    let joueurId = userId;
    if (!/^[0-9a-fA-F-]{36}$/.test(userId)) {
        const joueur = await prisma.joueur.findUnique({ where: { cookie_id: userId } });
        if (!joueur) {
            return NextResponse.json({ canPlay: true }); // No user, so can play
        }
        joueurId = joueur.id;
    }

    // 2. Check if the user has already played (live or differed)
    const existingScore = await prisma.score.findFirst({
        where: {
            tournoi_id: tournoi.id,
            joueur_id: joueurId,
        },
    });
    if (existingScore) {
        return NextResponse.json({ canPlay: false, reason: 'Already played' });
    }

    // 3. Otherwise, user can play
    return NextResponse.json({ canPlay: true });
}
