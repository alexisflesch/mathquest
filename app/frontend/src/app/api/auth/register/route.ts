import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '@/config/api';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import {
    RegisterRequestSchema,
    RegisterResponseSchema,
    ErrorResponseSchema,
    type RegisterRequest,
    type RegisterResponse,
    type ErrorResponse
} from '@shared/types/api/schemas';

/**
 * Next.js API route that proxies registration requests to the backend
 * and properly sets cookies for the same domain (localhost:3008)
 */
export async function POST(request: NextRequest) {
    try {
        let body;
        try {
            body = await request.json();
        } catch (jsonError) {
            return NextResponse.json(
                { error: 'Invalid JSON in request body' },
                { status: 400 }
            );
        }

        // Validate the request body
        let validatedRequest: RegisterRequest;
        try {
            validatedRequest = RegisterRequestSchema.parse(body);
        } catch (validationError: any) {
            return NextResponse.json(
                { error: 'Invalid request data', details: validationError.errors },
                { status: 400 }
            );
        }

        // Forward the request to the backend registration endpoint
        const backendResponse = await fetch(`${BACKEND_API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(validatedRequest),
        });

        if (!backendResponse.ok) {
            const errorData = await backendResponse.json().catch(() => ({ error: 'Registration failed' }));
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

                // Set the cookie for the frontend domain (localhost:3008)
                response.cookies.set(cookieName, cookieValue, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
                    path: '/',
                });

                console.log(`Set ${cookieName} cookie via register proxy`);
            }
        }

        return response;
    } catch (error) {
        console.error('Register proxy error:', error);
        return NextResponse.json(
            { error: 'Internal server error during registration' },
            { status: 500 }
        );
    }
}
