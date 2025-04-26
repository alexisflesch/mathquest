import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/questions/disciplines?niveau=CE2
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const niveau = searchParams.get('niveau');
    if (!niveau) {
        return NextResponse.json({ error: 'Missing niveau parameter' }, { status: 400 });
    }
    const disciplines = await prisma.question.findMany({
        where: { niveau },
        select: { discipline: true },
        distinct: ['discipline'],
    });
    const disciplineList = disciplines.map(d => d.discipline).filter(Boolean);
    return NextResponse.json({ disciplines: disciplineList });
}
