import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '@/config/api';

/**
 * Next.js API route that proxies teacher upgrade requests to the backend
 * and properly sets cookies for the same domain (localhost:3008)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Forward the request to the backend upgrade-to-teacher endpoint
        const backendResponse = await fetch(`${BACKEND_API_BASE_URL}/auth/upgrade-to-teacher`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Forward cookies from the request
                'Cookie': request.headers.get('cookie') || '',
            },
            body: JSON.stringify(body),
        });

        if (!backendResponse.ok) {
            const errorData = await backendResponse.json().catch(() => ({ error: 'Teacher upgrade failed' }));
            return NextResponse.json(errorData, { status: backendResponse.status });
        }

        const responseData = await backendResponse.json();
        const response = NextResponse.json(responseData);

        // Extract cookies from backend response and set them for the frontend domain
        const setCookieHeader = backendResponse.headers.get('set-cookie');
        if (setCookieHeader) {
            // Parse the cookie and extract the token and attributes
            const cookieMatches = setCookieHeader.match(/teacherToken=([^;]+)/);
            if (cookieMatches && cookieMatches[1]) {
                const token = cookieMatches[1];

                // Set the teacher token cookie for the frontend domain
                response.cookies.set('teacherToken', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 24 * 60 * 60 * 1000, // 24 hours
                    path: '/'
                });

                // Clear any existing auth token
                response.cookies.delete('authToken');
            }
        }

        return response;
    } catch (error) {
        console.error('Teacher upgrade proxy error:', error);
        return NextResponse.json(
            { error: 'Internal server error during teacher upgrade' },
            { status: 500 }
        );
    }
}
