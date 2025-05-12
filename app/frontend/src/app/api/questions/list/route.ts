import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/questions/list?niveau=...&discipline=...&themes=...&limit=...
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const niveau = searchParams.get('niveau');
    const discipline = searchParams.get('discipline');
    const themesParam = searchParams.get('themes');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!niveau || !discipline || !themesParam) {
        return NextResponse.json({ message: 'Paramètres manquants.' }, { status: 400 });
    }

    const themes = themesParam.split(',').map(t => t.trim()).filter(Boolean);

    try {
        const questions = await prisma.question.findMany({
            where: {
                niveau,
                discipline,
                theme: { in: themes },
            },
            take: limit,
            select: { uid: true },
        });
        return NextResponse.json(questions);
    } catch (error) {
        return NextResponse.json({ message: 'Erreur serveur.', error: String(error) }, { status: 500 });
    }
}
