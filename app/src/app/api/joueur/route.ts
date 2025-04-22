import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    console.log('[API/joueur] Requested id:', id);
    if (!id) {
        console.log('[API/joueur] No id provided');
        return NextResponse.json({ message: 'ID manquant.' }, { status: 400 });
    }
    const joueur = await prisma.joueur.findUnique({ where: { id } });
    console.log('[API/joueur] Found joueur:', joueur);
    if (!joueur) {
        return NextResponse.json({ message: 'Joueur introuvable.' }, { status: 404 });
    }
    return NextResponse.json({ pseudo: joueur.pseudo, avatar: joueur.avatar });
}
