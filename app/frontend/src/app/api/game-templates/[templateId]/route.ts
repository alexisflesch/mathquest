import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '@/config/api';

export async function DELETE(
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

        // Check if force delete is requested
        const url = new URL(request.url);
        const forceDelete = url.searchParams.get('force') === 'true';

        // Forward request to backend
        const backendUrl = new URL(`${BACKEND_API_BASE_URL}/game-templates/${templateId}`);
        if (forceDelete) {
            backendUrl.searchParams.set('force', 'true');
        }

        const backendResponse = await fetch(
            backendUrl.toString(),
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        // Handle 204 No Content response (successful deletion)
        if (backendResponse.status === 204) {
            return new NextResponse(null, { status: 204 });
        }

        // Check if response is JSON
        const contentType = backendResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error('Backend returned non-JSON response:', {
                status: backendResponse.status,
                statusText: backendResponse.statusText,
                contentType,
                url: `${BACKEND_API_BASE_URL}/game-templates/${templateId}`
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

        return NextResponse.json(data);
    } catch (error) {
        console.error('Frontend API route error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
