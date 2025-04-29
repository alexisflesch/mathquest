/**
 * Questions API Route
 * 
 * This API route retrieves questions for quiz and tournament creation:
 * - Supports filtering by discipline, niveau (grade level), and theme
 * - Returns a randomized subset of questions based on the provided limit
 * - Default limit is 10 questions if not specified
 * 
 * Used by both teacher quiz creation and student tournament creation flows
 * to generate question sets based on selected criteria.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import createLogger from '@logger';
import { Logger } from '@/types';

const logger = createLogger('API:Questions') as Logger;

const prisma = new PrismaClient();

// Define type for where clause
type QuestionWhereInput = Prisma.QuestionWhereInput;

// GET: List all questions for quiz creation
export async function GET(request: NextRequest) {
    try {
        // Optionally, add filters (discipline, niveau, etc.) via query params
        const { searchParams } = new URL(request.url);
        const discipline = searchParams.get('discipline');
        const niveau = searchParams.get('niveau');
        const theme = searchParams.get('theme');
        const themesParam = searchParams.get('themes');
        const limit = parseInt(searchParams.get('limit') || '10', 10);

        const where: QuestionWhereInput = {};
        if (discipline) where.discipline = discipline;
        if (niveau) where.niveau = niveau;

        // Handle both single theme and multiple themes
        if (themesParam) {
            const themes = themesParam.split(',').map(t => t.trim()).filter(Boolean);
            if (themes.length > 0) {
                where.theme = { in: themes };
            }
        } else if (theme) {
            where.theme = theme;
        }

        logger.debug('Question filtering criteria:', where);

        // Get all matching questions
        const all = await prisma.question.findMany({ where });
        logger.debug(`Found ${all.length} questions matching criteria`);

        // Shuffle and take 'limit' questions
        const shuffled = all.sort(() => Math.random() - 0.5).slice(0, limit);
        return NextResponse.json(shuffled);
    } catch (error: unknown) {
        logger.error('API /api/questions error:', error);
        return NextResponse.json({ message: 'Erreur serveur.', error: String(error) }, { status: 500 });
    }
}
