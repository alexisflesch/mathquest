import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/questions/list?gradeLevel=...&discipline=...&themes=...&limit=...
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const gradeLevel = searchParams.get('gradeLevel') || searchParams.get('niveau'); // Allow fallback for niveau
    const discipline = searchParams.get('discipline');
    const themesParam = searchParams.get('themes');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!gradeLevel || !discipline || !themesParam) {
        return NextResponse.json({ message: 'Paramètres manquants (gradeLevel, discipline, themes obligatoires).' }, { status: 400 });
    }

    const themesArray = themesParam.split(',').map(t => t.trim()).filter(Boolean);

    try {
        const questions = await prisma.question.findMany({
            where: {
                gradeLevel, // Changed from niveau
                discipline,
                themes: { hasSome: themesArray }, // Changed from theme: { in: themes }
            },
            take: limit,
            select: { uid: true },
        });
        return NextResponse.json(questions);
    } catch (error) {
        return NextResponse.json({ message: 'Erreur serveur.', error: String(error) }, { status: 500 });
    }
}
