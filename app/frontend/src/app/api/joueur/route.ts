/**
 * Student/Player (Joueur) API Route
 * 
 * This API route retrieves basic information about a specific student/player:
 * - Accepts a player ID as a query parameter
 * - Returns the player's username (display name) and avatar information
 * 
 * This route is primarily used to retrieve player information for displaying
 * in tournaments, lobbies, and leaderboards, particularly when showing
 * tournament creators or participants.
 * 
 * Includes detailed logging to aid in debugging player lookup issues.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
// Import the server-side logger from the root directory
import createLogger from '@logger';
import { Logger } from '@/types';

const logger = createLogger('API:Joueur') as Logger;

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    logger.debug('Requested id:', id);
    if (!id) {
        logger.warn('No id provided');
        return NextResponse.json({ message: 'ID manquant.' }, { status: 400 });
    }
    const joueur = await prisma.joueur.findUnique({ where: { id } });
    logger.debug('Found joueur:', { id: joueur?.id, username: joueur?.username });
    if (!joueur) {
        return NextResponse.json({ message: 'Joueur introuvable.' }, { status: 404 });
    }
    return NextResponse.json({ username: joueur.username, avatar: joueur.avatar });
}
