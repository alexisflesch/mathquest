import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: List all questions for quiz creation
export async function GET(request: NextRequest) {
    try {
        // Optionally, add filters (discipline, niveau, etc.) via query params
        const { searchParams } = new URL(request.url);
        const discipline = searchParams.get('discipline');
        const niveau = searchParams.get('niveau');
        const theme = searchParams.get('theme');
        const limit = parseInt(searchParams.get('limit') || '10', 10);

        const where: Record<string, string> = {};
        if (discipline) where.discipline = discipline;
        if (niveau) where.niveau = niveau;
        if (theme) where.theme = theme;

        // Get all matching questions
        const all = await prisma.question.findMany({ where });
        // Shuffle and take 'limit' questions
        const shuffled = all.sort(() => Math.random() - 0.5).slice(0, limit);
        return NextResponse.json(shuffled);
    } catch (error: unknown) {
        console.error('API /api/questions error:', error);
        return NextResponse.json({ message: 'Erreur serveur.', error: String(error) }, { status: 500 });
    }
}
