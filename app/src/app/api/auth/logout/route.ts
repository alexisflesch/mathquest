import { NextResponse } from 'next/server';

export async function POST() {
    // Expire both cookies
    const response = NextResponse.json({ message: 'Déconnexion réussie.' });
    response.headers.append('Set-Cookie', 'mathquest_teacher=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    response.headers.append('Set-Cookie', 'mathquest_student=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    return response;
}
