import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/questions/disciplines?gradeLevel=CE2 or /api/questions/disciplines?niveau=CE2
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const gradeLevel = searchParams.get('gradeLevel') || searchParams.get('niveau'); // Use gradeLevel, fallback to niveau
    if (!gradeLevel) {
        return NextResponse.json({ error: 'Missing gradeLevel (or niveau) parameter' }, { status: 400 });
    }
    const disciplines = await prisma.question.findMany({
        where: { gradeLevel }, // Changed from niveau to gradeLevel
        select: { discipline: true },
        distinct: ['discipline'],
    });
    const disciplineList = disciplines.map((d: { discipline: string | null }) => d.discipline).filter(Boolean);
    return NextResponse.json({ disciplines: disciplineList });
}
