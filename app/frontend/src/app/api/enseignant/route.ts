/**
 * Teacher (Enseignant) API Route
 * 
 * This API route retrieves basic information about a specific teacher:
 * - Accepts a teacher ID as a query parameter
 * - Returns the teacher's username (display name) and avatar information
 * 
 * This route is primarily used to retrieve teacher information for displaying
 * in tournaments and lobbies, particularly for tournaments created by teachers.
 * 
 * Only returns essential information and omits sensitive teacher data.
 */

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
    return NextResponse.json({ username: enseignant.username, avatar: enseignant.avatar });
}
