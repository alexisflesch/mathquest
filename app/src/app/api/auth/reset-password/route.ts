import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import createLogger from '@logger';
import { Logger } from '@/types';

const logger = createLogger('API:ResetPassword') as Logger;

const prisma = new PrismaClient();

// Helper: send email (mock)
async function sendResetEmail(email: string, token: string) {
    // In production, use a real email service
    logger.debug(`Password reset link for ${email}: http://localhost:3000/teacher/reset-password/${token}`);
}

export async function POST(req: Request) {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ message: 'Email requis.' }, { status: 400 });
    const enseignant = await prisma.enseignant.findUnique({ where: { email } });
    if (!enseignant) {
        // Always respond success to avoid leaking user existence
        return NextResponse.json({ message: 'Si ce compte existe, un email a été envoyé.' });
    }
    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1h
    await prisma.enseignant.update({
        where: { email },
        data: {
            reset_token: token,
            reset_token_expires: expires,
        },
    });
    await sendResetEmail(email, token);
    return NextResponse.json({ message: 'Si ce compte existe, un email a été envoyé.' });
}

export async function PUT(req: Request) {
    const { token, password } = await req.json();
    if (!token || !password) return NextResponse.json({ message: 'Token et mot de passe requis.' }, { status: 400 });
    const enseignant = await prisma.enseignant.findFirst({ where: { reset_token: token, reset_token_expires: { gt: new Date() } } });
    if (!enseignant) return NextResponse.json({ message: 'Lien invalide ou expiré.' }, { status: 400 });
    const hash = await bcrypt.hash(password, 10);
    await prisma.enseignant.update({
        where: { id: enseignant.id },
        data: {
            mot_de_passe: hash,
            reset_token: undefined,
            reset_token_expires: undefined,
        },
    });
    return NextResponse.json({ message: 'Mot de passe réinitialisé.' });
}