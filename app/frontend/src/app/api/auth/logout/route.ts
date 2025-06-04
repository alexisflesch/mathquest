import { NextResponse } from 'next/server';

/**
 * Logout API route that clears authentication cookies
 */
export async function POST() {
    const response = NextResponse.json({ message: 'Logged out successfully' });

    // Clear both authentication cookies
    response.cookies.set('teacherToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0, // Expire immediately
        path: '/',
        // Remove explicit domain for better browser compatibility
        // domain: 'localhost',
    });

    response.cookies.set('authToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0, // Expire immediately
        path: '/',
        // Remove explicit domain for better browser compatibility
        // domain: 'localhost',
    });

    return response;
}
