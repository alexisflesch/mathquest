import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '@/config/api';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ templateId: string }> }
) {
    try {
        const { templateId } = await params;

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

        if (!token) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Forward request to backend
        const backendResponse = await fetch(
            `${BACKEND_API_BASE_URL}/games/template/${templateId}/instances`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        // Check if response is JSON
        const contentType = backendResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error('Backend returned non-JSON response:', {
                status: backendResponse.status,
                statusText: backendResponse.statusText,
                contentType,
                url: `${BACKEND_API_BASE_URL}/games/template/${templateId}/instances`
            });
            return NextResponse.json(
                { error: 'Backend service unavailable' },
                { status: 502 }
            );
        }

        const data = await backendResponse.json();

        if (!backendResponse.ok) {
            return NextResponse.json(data, { status: backendResponse.status });
        }

        // Convert date strings to Date objects for frontend compatibility
        if (data.gameInstances) {
            data.gameInstances = data.gameInstances.map((instance: any) => ({
                ...instance,
                createdAt: new Date(instance.createdAt),
                updatedAt: new Date(instance.updatedAt)
            }));
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
