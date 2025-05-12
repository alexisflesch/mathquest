import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/questions/themes?niveau=CE2&discipline=maths
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const niveau = searchParams.get('niveau');
    const discipline = searchParams.get('discipline');
    if (!niveau || !discipline) {
        return NextResponse.json({ error: 'Missing niveau or discipline parameter' }, { status: 400 });
    }
    const themes = await prisma.question.findMany({
        where: { niveau, discipline },
        select: { theme: true },
        distinct: ['theme'],
    });
    const themeList = themes.map((t: { theme: string }) => t.theme).filter(Boolean);
    return NextResponse.json({ themes: themeList });
}
