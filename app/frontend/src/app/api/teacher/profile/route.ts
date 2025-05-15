import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
        return NextResponse.json({ message: 'Missing teacher id.' }, { status: 400 });
    }
    const enseignant = await prisma.enseignant.findUnique({ where: { id } });
    if (!enseignant) {
        return NextResponse.json({ message: 'Enseignant non trouvé.' }, { status: 404 });
    }
    return NextResponse.json({ username: enseignant.username, avatar: enseignant.avatar });
}
