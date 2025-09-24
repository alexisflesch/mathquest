import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '@/config/api';

/**
 * Next.js API route that proxies password reset requests to the backend
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Forward the request to the backend reset password endpoint
        const backendResponse = await fetch(`${BACKEND_API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!backendResponse.ok) {
            const errorData = await backendResponse.json().catch(() => ({ error: 'Password reset failed' }));
            return NextResponse.json(errorData, { status: backendResponse.status });
        }

        const responseData = await backendResponse.json();
        return NextResponse.json(responseData);
    } catch (error) {
        console.error('Error in reset password proxy:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}