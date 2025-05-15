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
        const gradeLevels = await prisma.question.groupBy({
            by: ['gradeLevel'],
            where: { gradeLevel: { not: '' } },
            orderBy: { gradeLevel: 'asc' },
        });

        const allQuestions = await prisma.question.findMany({
            select: { themes: true }
        });
        const uniqueThemes = new Set<string>();
        allQuestions.forEach(q => {
            if (q.themes && Array.isArray(q.themes)) {
                q.themes.forEach(theme => {
                    if (theme) uniqueThemes.add(theme);
                });
            }
        });
        const sortedThemes = Array.from(uniqueThemes).sort();

        return NextResponse.json({
            disciplines: disciplines.map((d: { discipline: string }) => d.discipline).filter(Boolean),
            levels: gradeLevels.map((n: { gradeLevel: string | null }) => n.gradeLevel).filter(Boolean),
            themes: sortedThemes,
        });
    } catch (e) {
        logger.error('API /api/questions/filters error', e);
        return NextResponse.json({ disciplines: [], levels: [], themes: [] }, { status: 500 });
    }
}
