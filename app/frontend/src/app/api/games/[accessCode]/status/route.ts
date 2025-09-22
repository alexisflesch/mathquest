import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '@/config/api';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ accessCode: string }> }
) {
    try {
        const { accessCode } = await params;

        // Get authentication token from cookies
        const teacherToken = request.cookies.get('teacherToken')?.value;
        const authToken = request.cookies.get('authToken')?.value;

        const token = teacherToken || authToken;

        if (!token) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const body = await request.json();

        // Forward request to backend
        const backendResponse = await fetch(`${BACKEND_API_BASE_URL}/games/${accessCode}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await backendResponse.json();

        if (!backendResponse.ok) {
            return NextResponse.json(
                { error: data.error || 'Failed to update game status' },
                { status: backendResponse.status }
            );
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
