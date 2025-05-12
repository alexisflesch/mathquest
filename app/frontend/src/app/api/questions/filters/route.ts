import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import createLogger from '@logger';
import { Logger } from '@/types';

const logger = createLogger('API:QuestionsFilters') as Logger;

const prisma = new PrismaClient();

export async function GET() {
    try {
        const disciplines = await prisma.question.groupBy({
            by: ['discipline'],
            where: { discipline: { not: '' } },
            orderBy: { discipline: 'asc' },
        });
        const niveaux = await prisma.question.groupBy({
            by: ['niveau'],
            where: { niveau: { not: '' } },
            orderBy: { niveau: 'asc' },
        });
        const themes = await prisma.question.groupBy({
            by: ['theme'],
            where: { theme: { not: '' } },
            orderBy: { theme: 'asc' },
        });
        return NextResponse.json({
            disciplines: disciplines.map((d: { discipline: string }) => d.discipline).filter(Boolean),
            niveaux: niveaux.map((n: { niveau: string | null }) => n.niveau).filter(Boolean),
            themes: themes.map((t: { theme: string }) => t.theme).filter(Boolean),
        });
    } catch (e) {
        logger.error('API /api/questions/filters error', e);
        return NextResponse.json({ disciplines: [], niveaux: [], themes: [] });
    }
}
