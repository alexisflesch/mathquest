import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '@/config/api';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

/**
 * Next.js API route that proxies profile update requests to the backend
 * and properly maintains cookies for the same domain (localhost:3008)
 */
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();

        // Get cookies from the request to pass to backend
        const cookies = request.headers.get('cookie') || '';

        // Forward the request to the backend profile endpoint
        const backendResponse = await fetch(`${BACKEND_API_BASE_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookies, // Pass cookies to backend
            },
            body: JSON.stringify(body),
        });

        if (!backendResponse.ok) {
            const errorData = await backendResponse.json().catch(() => ({ error: 'Profile update failed' }));
            return NextResponse.json(errorData, { status: backendResponse.status });
        }

        const responseData = await backendResponse.json();
        const response = NextResponse.json(responseData);

        // Extract cookies from backend response and set them for the frontend domain if needed
        const setCookieHeader = backendResponse.headers.get('set-cookie');
        if (setCookieHeader) {
            // Parse the cookie and extract the token and attributes
            const cookieMatch = setCookieHeader.match(/^(teacherToken|authToken)=([^;]+)/);
            if (cookieMatch) {
                const [, cookieName, cookieValue] = cookieMatch;

                // Set the cookie for the frontend domain (localhost:3008)
                response.cookies.set(cookieName, cookieValue, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
                    path: '/',
                });

                console.log(`Updated ${cookieName} cookie via profile proxy`);
            }
        }

        return response;
    } catch (error) {
        console.error('Profile proxy error:', error);
        return NextResponse.json(
            { error: 'Internal server error during profile update' },
            { status: 500 }
        );
    }
}
