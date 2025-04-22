import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/tournament/status?code=XXXXXX
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    if (!code) {
        return NextResponse.json({ message: 'Code requis.' }, { status: 400 });
    }
    const tournoi = await prisma.tournoi.findUnique({ where: { code } });
    if (!tournoi) {
        return NextResponse.json({ message: 'Tournoi introuvable.' }, { status: 404 });
    }
    return NextResponse.json({
        id: tournoi.id,
        type: tournoi.type,
        statut: tournoi.statut,
        nom: tournoi.nom,
        niveau: tournoi.niveau,
        categorie: tournoi.categorie,
        themes: tournoi.themes
    });
}
