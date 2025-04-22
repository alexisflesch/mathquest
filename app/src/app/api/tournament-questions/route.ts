import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    if (!code) {
        return NextResponse.json({ message: 'Code manquant.' }, { status: 400 });
    }
    // Find the tournament by code
    const tournoi = await prisma.tournoi.findUnique({ where: { code } });
    if (!tournoi) {
        return NextResponse.json({ message: 'Tournoi introuvable.' }, { status: 404 });
    }
    // Get the questions for this tournament
    const questions = await prisma.question.findMany({
        where: { uid: { in: tournoi.questions_ids } },
        orderBy: [
            { niveau: 'asc' },
            { theme: 'asc' },
        ],
    });
    return NextResponse.json(questions);
}
