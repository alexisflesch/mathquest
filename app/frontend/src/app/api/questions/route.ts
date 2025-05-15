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
        // Optionally, add filters (discipline, gradeLevel, etc.) via query params
        const { searchParams } = new URL(request.url);
        const discipline = searchParams.get('discipline');
        // Allow for gradeLevel, level, or an older niveau param for compatibility during transition
        const gradeLevelParam = searchParams.get('gradeLevel') || searchParams.get('level') || searchParams.get('niveau');
        const themeParam = searchParams.get('theme'); // Singular theme param
        const themesParam = searchParams.get('themes'); // Plural themes (comma-separated) param
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const offset = parseInt(searchParams.get('offset') || '0', 10);
        const shuffle = searchParams.get('shuffle') !== 'false'; // default true, but allow ?shuffle=false

        const where: QuestionWhereInput = {};
        if (discipline) where.discipline = discipline;
        if (gradeLevelParam) where.gradeLevel = gradeLevelParam; // Changed from where.niveau

        // Handle both single theme and multiple themes
        if (themesParam) {
            const themesArray = themesParam.split(',').map(t => t.trim()).filter(Boolean);
            if (themesArray.length > 0) {
                where.themes = { hasSome: themesArray }; // Changed from where.theme = { in: themes }
            }
        } else if (themeParam) { // if only a single 'theme' is provided
            where.themes = { has: themeParam }; // Changed from where.theme = themeParam
        }

        logger.debug('Question filtering criteria:', where);
        logger.debug('themesParam (plural):', themesParam);
        logger.debug('themeParam (singular):', themeParam);
        logger.debug('gradeLevelParam:', gradeLevelParam);
        // Get all matching questions
        let all;
        if (shuffle) {
            all = await prisma.question.findMany({ where });
        } else {
            all = await prisma.question.findMany({ where, orderBy: { uid: 'asc' } });
        }
        logger.debug(`Found ${all.length} questions matching criteria`);

        // Shuffle and take 'limit' questions with offset for pagination
        let result: typeof all;
        if (shuffle) {
            result = all.sort(() => Math.random() - 0.5).slice(offset, offset + limit);
        } else {
            result = all.slice(offset, offset + limit);
        }
        return NextResponse.json(result);
    } catch (error: unknown) {
        logger.error('API /api/questions error:', error);
        return NextResponse.json({ message: 'Erreur serveur.', error: String(error) }, { status: 500 });
    }
}
