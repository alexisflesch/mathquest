import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Debug route to clear all cookies from the browser
 * This is a utility endpoint to help debug cookie-related issues
 */
export async function GET() {
    const cookieStore = await cookies();
    const allCookies = Array.from(cookieStore.getAll());  // Get all cookies as RequestCookie objects

    console.log('[ClearCookies API] Clearing all cookies:', allCookies.map(c => c.name));

    const response = NextResponse.json({
        message: 'All cookies cleared',
        clearedCookies: allCookies.map(c => c.name),
        count: allCookies.length
    });

    // Delete all cookies
    for (const cookie of allCookies) {
        try {
            response.cookies.delete(cookie.name);

            // Also set with expired date for maximum compatibility
            response.cookies.set(cookie.name, '', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                expires: new Date(0),
                maxAge: 0,
                path: '/',
                domain: 'localhost', // Clear cookies with the correct domain
            });
        } catch (error) {
            console.error(`[ClearCookies API] Error clearing cookie ${cookie.name}:`, error);
        }
    }

    return response;
}

/**
 * Also support POST for this utility endpoint
 */
export async function POST() {
    return GET();
}
