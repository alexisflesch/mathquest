import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '@/config/api';

/**
 * Next.js API route that proxies send email verification requests to the backend
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Forward the request to the backend send email verification endpoint
        const backendResponse = await fetch(`${BACKEND_API_BASE_URL}/auth/send-email-verification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!backendResponse.ok) {
            const errorData = await backendResponse.json().catch(() => ({ error: 'Send email verification failed' }));
            return NextResponse.json(errorData, { status: backendResponse.status });
        }

        const responseData = await backendResponse.json();
        return NextResponse.json(responseData);
    } catch (error) {
        console.error('Error in send email verification proxy:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}