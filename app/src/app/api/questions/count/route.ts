import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/questions/count?niveau=...&discipline=...&themes=theme1,theme2
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const niveau = searchParams.get('niveau');
        const discipline = searchParams.get('discipline');
        const themesParam = searchParams.get('themes');
        let themes: string[] = [];
        if (themesParam) {
            themes = themesParam.split(',').map(t => t.trim()).filter(Boolean);
        }
        if (!niveau || !discipline || themes.length === 0) {
            return NextResponse.json({ count: 0, error: 'Missing parameters' }, { status: 400 });
        }
        const count = await prisma.question.count({
            where: {
                niveau,
                discipline,
                theme: { in: themes },
            },
        });
        return NextResponse.json({ count });
    } catch (error: unknown) {
        console.error('API /api/questions/count error:', error);
        return NextResponse.json({ message: 'Erreur serveur.', error: String(error) }, { status: 500 });
    }
}
