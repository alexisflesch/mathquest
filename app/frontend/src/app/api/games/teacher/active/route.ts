import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '@/config/api';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

export async function GET(request: NextRequest) {
    try {
        // Get authentication token from cookies
        const teacherToken = request.cookies.get('teacherToken')?.value;
        const authToken = request.cookies.get('authToken')?.value;

        const token = teacherToken || authToken;

        if (!token) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        // Forward request to backend
        const backendResponse = await fetch(`${BACKEND_API_BASE_URL}/games/teacher/active`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await backendResponse.json();

        if (!backendResponse.ok) {
            return NextResponse.json(
                { error: data.error || 'Failed to fetch active games' },
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
