import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

function generateTournamentCode(length = 6) {
    return randomBytes(length).toString('base64').replace(/[^A-Z0-9]/gi, '').slice(0, length).toUpperCase();
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, ...data } = body;

        if (action === 'create') {
            const { nom, questions_ids, enseignant_id, type, niveau, categorie, themes } = data;
            if (!nom || !questions_ids || !enseignant_id || !type) {
                return NextResponse.json({ message: 'Champs manquants.' }, { status: 400 });
            }
            const code = generateTournamentCode();
            const tournoi = await prisma.tournoi.create({
                data: {
                    nom,
                    questions_ids,
                    enseignant_id,
                    type,
                    niveau,
                    categorie,
                    themes,
                    statut: 'en préparation',
                    cree_par_id: enseignant_id,
                    questions_generées: true,
                    code,
                },
            });
            return NextResponse.json({ message: 'Tournoi créé.', tournoiId: tournoi.id, code }, { status: 201 });
        }

        if (action === 'start') {
            const { tournoiId } = data;
            if (!tournoiId) return NextResponse.json({ message: 'ID manquant.' }, { status: 400 });
            const tournoi = await prisma.tournoi.update({
                where: { id: tournoiId },
                data: { statut: 'en cours', date_debut: new Date() },
            });
            return NextResponse.json({ message: 'Tournoi démarré.', tournoi }, { status: 200 });
        }

        if (action === 'end') {
            const { tournoiId } = data;
            if (!tournoiId) return NextResponse.json({ message: 'ID manquant.' }, { status: 400 });
            const tournoi = await prisma.tournoi.update({
                where: { id: tournoiId },
                data: { statut: 'terminé', date_fin: new Date() },
            });
            return NextResponse.json({ message: 'Tournoi terminé.', tournoi }, { status: 200 });
        }

        return NextResponse.json({ message: 'Action inconnue.' }, { status: 400 });
    } catch (error: unknown) {
        console.error('API /api/tournament error:', error);
        return NextResponse.json({ message: 'Erreur serveur.', error: String(error) }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const id = searchParams.get('id');

    if (code) {
        const tournoi = await prisma.tournoi.findUnique({ where: { code } });
        if (!tournoi) return NextResponse.json({ message: 'Tournoi introuvable.' }, { status: 404 });
        return NextResponse.json(tournoi);
    }
    if (id) {
        const tournoi = await prisma.tournoi.findUnique({ where: { id } });
        if (!tournoi) return NextResponse.json({ message: 'Tournoi introuvable.' }, { status: 404 });
        return NextResponse.json(tournoi);
    }
    // List all tournois (for teacher dashboard)
    const tournois = await prisma.tournoi.findMany();
    return NextResponse.json(tournois);
}
