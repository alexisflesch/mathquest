import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/questions/themes?gradeLevel=CE2&discipline=maths
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const gradeLevel = searchParams.get('gradeLevel') || searchParams.get('niveau'); // Allow fallback for niveau
    const discipline = searchParams.get('discipline');
    if (!gradeLevel || !discipline) {
        return NextResponse.json({ error: 'Missing gradeLevel or discipline parameter' }, { status: 400 });
    }
    // Fetch questions matching the gradeLevel and discipline
    const questions = await prisma.question.findMany({
        where: { gradeLevel, discipline },
        select: { themes: true }, // Select the themes array
    });

    // Extract unique themes from the themes arrays of the fetched questions
    const uniqueThemes = new Set<string>();
    questions.forEach(question => {
        if (question.themes && Array.isArray(question.themes)) {
            question.themes.forEach(theme => {
                if (theme) uniqueThemes.add(theme);
            });
        }
    });
    const sortedThemes = Array.from(uniqueThemes).sort();

    return NextResponse.json({ themes: sortedThemes });
}
