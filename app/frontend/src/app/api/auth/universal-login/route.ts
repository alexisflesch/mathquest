import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '@/config/api';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import {
    LoginRequestSchema,
    UniversalLoginResponseSchema,
    ErrorResponseSchema,
    type LoginRequest,
    type UniversalLoginResponse,
    type ErrorResponse
} from '@shared/types/api/schemas';

/**
 * Next.js API route that proxies universal login requests to the backend
 * and properly sets cookies for the same domain (localhost:3008)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate the request body
        const validatedRequest: LoginRequest = LoginRequestSchema.parse(body);

        // Forward the request to the backend universal login endpoint
        const backendResponse = await fetch(`${BACKEND_API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(validatedRequest),
        });

        if (!backendResponse.ok) {
            const errorData = await backendResponse.json().catch(() => ({ error: 'Authentication failed' }));
            const validatedError: ErrorResponse = ErrorResponseSchema.parse(errorData);
            return NextResponse.json(validatedError, { status: backendResponse.status });
        }

        const responseData = await backendResponse.json();

        // Validate the response from backend
        const validatedResponse: UniversalLoginResponse = UniversalLoginResponseSchema.parse(responseData);
        const response = NextResponse.json(validatedResponse);

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

        const errorResponse: ErrorResponse = {
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? String(error) : undefined
        };

        return NextResponse.json(errorResponse, { status: 500 });
    }
}
