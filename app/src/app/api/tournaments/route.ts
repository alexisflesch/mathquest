/**
 * Tournaments API Route
 * 
 * This API route handles tournament creation operations:
 * - POST: Creates a new tournament with specified properties
 * 
 * Key features of this route include:
 * - Generation of a unique 6-digit tournament code
 * - Setting of expiration date (24 hours after creation)
 * - Support for both student and teacher tournament creation
 * - Storage of tournament parameters (level, category, themes)
 * 
 * Tournaments start in "en préparation" status and can be later
 * updated to "en cours" and "terminé" via other API routes.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const createLogger = require('@logger');
const logger = createLogger('API:Tournaments');

const prisma = new PrismaClient();

// POST /api/tournaments
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            nom,
            niveau,
            categorie,
            themes,
            questions_ids,
            type, // 'direct' or 'différé'
            cree_par, // UUID (élève ou enseignant)
            questions_generees = true // boolean
        } = body;

        // Generate a 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const now = new Date();
        // Tournament expires in 24h
        const date_fin = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Determine creator type
        let cree_par_joueur_id = null;
        let cree_par_enseignant_id = null;
        if (cree_par) {
            if (cree_par.startsWith && cree_par.startsWith('enseignant')) {
                cree_par_enseignant_id = cree_par;
            } else {
                cree_par_joueur_id = cree_par;
            }
        }

        const tournoi = await prisma.tournoi.create({
            data: {
                nom: nom || `Tournoi ${code}`,
                date_creation: now,
                date_debut: null,
                date_fin,
                statut: 'en préparation',
                enseignant_id: null, // Set if created by enseignant, else null
                questions_ids,
                type,
                niveau,
                categorie,
                themes,
                cree_par_joueur_id,
                cree_par_enseignant_id,
                questions_generées: questions_generees,
                code,
            },
        });
        return NextResponse.json({ tournoi });
    } catch (error: unknown) {
        logger.error('API /api/tournaments POST error:', error);
        return NextResponse.json({ message: 'Erreur serveur.', error: String(error) }, { status: 500 });
    }
}
