import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '@/config/api';

export async function GET(request: NextRequest) {
    try {
        // Extract JWT token from cookies (teacherToken or authToken)
        const cookieHeader = request.headers.get('cookie');
        let token = null;

        if (cookieHeader) {
            const cookies = cookieHeader.split(';').map(c => c.trim());
            const teacherTokenCookie = cookies.find(c => c.startsWith('teacherToken='));
            const authTokenCookie = cookies.find(c => c.startsWith('authToken='));

            if (teacherTokenCookie) {
                token = teacherTokenCookie.split('=')[1];
            } else if (authTokenCookie) {
                token = authTokenCookie.split('=')[1];
            }
        }

        // Forward request to backend
        const backendResponse = await fetch(`${BACKEND_API_BASE_URL}/game-templates`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        });

        const data = await backendResponse.json();

        if (!backendResponse.ok) {
            return NextResponse.json(data, { status: backendResponse.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Frontend API route error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Extract JWT token from cookies (teacherToken or authToken)
        const cookieHeader = request.headers.get('cookie');
        let token = null;

        if (cookieHeader) {
            const cookies = cookieHeader.split(';').map(c => c.trim());
            const teacherTokenCookie = cookies.find(c => c.startsWith('teacherToken='));
            const authTokenCookie = cookies.find(c => c.startsWith('authToken='));

            if (teacherTokenCookie) {
                token = teacherTokenCookie.split('=')[1];
            } else if (authTokenCookie) {
                token = authTokenCookie.split('=')[1];
            }
        }

        // Forward request to backend
        const backendResponse = await fetch(`${BACKEND_API_BASE_URL}/game-templates`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify(body)
        });

        const data = await backendResponse.json();

        if (!backendResponse.ok) {
            return NextResponse.json(data, { status: backendResponse.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Frontend API route error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
