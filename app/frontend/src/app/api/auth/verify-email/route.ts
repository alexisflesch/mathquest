import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '@/config/api';

/**
 * Next.js API route that proxies email verification requests to the backend
 * and properly handles cookies for authentication after verification
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Forward the request to the backend
        const backendResponse = await fetch(`${BACKEND_API_BASE_URL}/auth/verify-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!backendResponse.ok) {
            const errorData = await backendResponse.json().catch(() => ({ error: 'Email verification failed' }));
            return NextResponse.json(errorData, { status: backendResponse.status });
        }

        const responseData = await backendResponse.json();
        const response = NextResponse.json(responseData);

        // Extract cookies from backend response and set them for the frontend domain
        const setCookieHeaders = backendResponse.headers.get('set-cookie');
        if (setCookieHeaders) {
            // Parse multiple cookies if present
            const cookies = setCookieHeaders.split(',').map(cookie => cookie.trim());

            cookies.forEach(cookie => {
                // Extract cookie name and value
                const [nameValue, ...attributes] = cookie.split(';');
                const [name, value] = nameValue.split('=');

                if (name && value) {
                    // Set cookie for the frontend domain
                    response.cookies.set({
                        name: name.trim(),
                        value: value.trim(),
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        maxAge: 7 * 24 * 60 * 60 // 7 days
                    });
                }
            });
        }

        return response;
    } catch (error) {
        console.error('Email verification proxy error:', error);
        return NextResponse.json(
            { error: 'Internal server error during email verification' },
            { status: 500 }
        );
    }
}
