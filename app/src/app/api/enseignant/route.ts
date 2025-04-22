import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
        return NextResponse.json({ message: 'ID manquant.' }, { status: 400 });
    }
    const enseignant = await prisma.enseignant.findUnique({ where: { id } });
    if (!enseignant) {
        return NextResponse.json({ message: 'Enseignant introuvable.' }, { status: 404 });
    }
    return NextResponse.json({ pseudo: enseignant.pseudo, avatar: enseignant.avatar });
}
