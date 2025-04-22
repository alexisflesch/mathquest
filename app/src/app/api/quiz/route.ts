import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: List all quizzes (quizz = list of questions saved by a teacher)
export async function GET() {
    // Return all quizzes with new array fields
    const quizzes = await prisma.tournoiSauvegarde.findMany({
        select: {
            id: true,
            nom: true,
            questions_ids: true,
            enseignant_id: true,
            date_creation: true,
            niveaux: true,      // <-- now array
            categories: true,   // <-- now array
            themes: true,       // <-- array
            type: true,
        },
        orderBy: { date_creation: 'desc' },
    });
    return NextResponse.json(quizzes);
}

// POST: Save a new quiz (for future use)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { nom, questions_ids, enseignant_id, niveaux, categories, themes, type } = body;
        if (!nom || !questions_ids || !enseignant_id) {
            return NextResponse.json({ message: 'Champs manquants.' }, { status: 400 });
        }
        const quiz = await prisma.tournoiSauvegarde.create({
            data: {
                nom,
                questions_ids,
                enseignant_id,
                niveaux,
                categories,
                themes,
                type: type || 'direct',
            },
        });
        return NextResponse.json({ message: 'Quiz sauvegardé.', quizId: quiz.id }, { status: 201 });
    } catch (error) {
        console.error('POST /api/quiz error:', error);
        let errorMessage = 'Erreur serveur.';
        if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message?: string }).message === 'string') {
            errorMessage = (error as { message: string }).message;
        } else {
            errorMessage = String(error);
        }
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
