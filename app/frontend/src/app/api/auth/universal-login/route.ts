import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '@/config/api';

/**
 * Next.js API route that proxies universal login requests to the backend
 * and properly sets cookies for the same domain (localhost:3008)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Forward the request to the backend universal login endpoint
        const backendResponse = await fetch(`${BACKEND_API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!backendResponse.ok) {
            const errorData = await backendResponse.json().catch(() => ({ error: 'Authentication failed' }));
            return NextResponse.json(errorData, { status: backendResponse.status });
        }

        const responseData = await backendResponse.json();
        const response = NextResponse.json(responseData);

        // Extract cookies from backend response and set them for the frontend domain
        const setCookieHeader = backendResponse.headers.get('set-cookie');
        if (setCookieHeader) {
            // Parse the cookie and extract the token and attributes
            const cookieMatch = setCookieHeader.match(/^(teacherToken|authToken)=([^;]+)/);
            if (cookieMatch) {
                const [, cookieName, cookieValue] = cookieMatch;

                // Set the cookie for the local domain 
                // Using default domain (omitting explicit domain for better browser compatibility)
                response.cookies.set(cookieName, cookieValue, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
                    path: '/',
                    // Remove explicit domain setting for better browser compatibility
                    // domain: 'localhost', 
                });

                console.log(`Set ${cookieName} cookie via universal-login proxy`);
            }
        }

        return response;
    } catch (error) {
        console.error('Universal login proxy error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
