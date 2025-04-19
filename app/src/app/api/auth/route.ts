import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme'; // Set this in your server env

function setAuthCookie(response: NextResponse, teacherId: string) {
    response.headers.set('Set-Cookie', `mathquest_teacher=${teacherId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`); // 1 week
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, ...data } = body;

        if (action === 'teacher_signup') {
            const { nom, prenom, email, adminPassword, password } = data;
            if (!nom || !prenom || !email || !adminPassword || !password) {
                return NextResponse.json({ message: 'Champs manquants.' }, { status: 400 });
            }
            if (adminPassword !== ADMIN_PASSWORD) {
                return NextResponse.json({ message: 'Mot de passe administrateur incorrect.' }, { status: 403 });
            }
            const existing = await prisma.enseignant.findUnique({ where: { email } });
            if (existing) {
                return NextResponse.json({ message: 'Email déjà utilisé.' }, { status: 409 });
            }
            const hash = await bcrypt.hash(password, 10);
            const enseignant = await prisma.enseignant.create({
                data: {
                    pseudo: nom + ' ' + prenom,
                    mot_de_passe: hash,
                    email,
                },
            });
            return NextResponse.json({ message: 'Compte enseignant créé.', enseignantId: enseignant.id }, { status: 201 });
        }

        if (action === 'teacher_login') {
            const { email, password } = data;
            if (!email || !password) {
                return NextResponse.json({ message: 'Champs manquants.' }, { status: 400 });
            }
            const enseignant = await prisma.enseignant.findUnique({ where: { email } });
            if (!enseignant) {
                return NextResponse.json({ message: 'Utilisateur inconnu.' }, { status: 404 });
            }
            const valid = await bcrypt.compare(password, enseignant.mot_de_passe);
            if (!valid) {
                return NextResponse.json({ message: 'Mot de passe incorrect.' }, { status: 403 });
            }
            // Set session/cookie here
            const response = NextResponse.json({ message: 'Connexion réussie.', enseignantId: enseignant.id }, { status: 200 });
            setAuthCookie(response, enseignant.id);
            return response;
        }

        return NextResponse.json({ message: 'Action inconnue.' }, { status: 400 });
    } catch (error: unknown) {
        console.error('API /api/auth error:', error);
        return NextResponse.json({ message: 'Erreur serveur.', error: String(error) }, { status: 500 });
    }
}
