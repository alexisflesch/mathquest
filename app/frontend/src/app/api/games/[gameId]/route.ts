import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '@/config/api';

// Allow GET for authenticated users (both teachers and students)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ gameId: string }> }
) {
    const { gameId } = await params;

    // Get authentication token from cookies - allow both teacher and student tokens
    const teacherToken = request.cookies.get('teacherToken')?.value;
    const authToken = request.cookies.get('authToken')?.value;

    const token = teacherToken || authToken;

    if (!token) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Forward request to backend
    const backendResponse = await fetch(`${BACKEND_API_BASE_URL}/games/${gameId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ gameId: string }> }
) {
    try {
        const { gameId } = await params;

        // Get authentication token from cookies
        const teacherToken = request.cookies.get('teacherToken')?.value;
        const authToken = request.cookies.get('authToken')?.value;

        const token = teacherToken || authToken;

        if (!token) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        // Forward request to backend
        const backendResponse = await fetch(`${BACKEND_API_BASE_URL}/games/${gameId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (backendResponse.status === 204) {
            // No content response for successful deletion
            return new NextResponse(null, { status: 204 });
        }

        // Only try to parse JSON if there's content
        let data = null;
        const contentType = backendResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            try {
                data = await backendResponse.json();
            } catch (error) {
                console.error('Failed to parse JSON response:', error);
                data = { error: 'Invalid response format' };
            }
        }

        if (!backendResponse.ok) {
            return NextResponse.json(
                { error: data?.error || 'Failed to delete game' },
                { status: backendResponse.status }
            );
        }

        return NextResponse.json(data || { success: true });
    } catch (error) {
        console.error('Frontend API route error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
