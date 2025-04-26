import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const createLogger = require('@logger');
const logger = createLogger('API:QuestionsFilters');

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
            disciplines: disciplines.map(d => d.discipline).filter(Boolean),
            niveaux: niveaux.map(n => n.niveau).filter(Boolean),
            themes: themes.map(t => t.theme).filter(Boolean),
        });
    } catch (e) {
        logger.error('API /api/questions/filters error', e);
        return NextResponse.json({ disciplines: [], niveaux: [], themes: [] });
    }
}
