import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '@/config/api';

export async function GET(request: NextRequest, { params }: { params: Promise<{ quizId: string }> }) {
    try {
        // Get authentication token from cookies
        const teacherToken = request.cookies.get('teacherToken')?.value;
        const authToken = request.cookies.get('authToken')?.value;

        const token = teacherToken || authToken;

        if (!token) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        // Extract the quizId from params
        const { quizId } = await params;

        console.log('[Tournament Code API] GET request for quiz:', quizId);

        // This endpoint doesn't exist in the new backend architecture.
        // The backend uses game instances with auto-generated access codes.
        // Return an error to inform the frontend that this feature is not available.
        return NextResponse.json(
            {
                error: 'Tournament code generation not supported',
                message: 'The backend uses game instances with auto-generated access codes. Use POST /api/games to create a new game instance instead.'
            },
            { status: 501 }
        );
    } catch (error) {
        console.error('Tournament code API route error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ quizId: string }> }) {
    try {
        // Get authentication token from cookies
        const teacherToken = request.cookies.get('teacherToken')?.value;
        const authToken = request.cookies.get('authToken')?.value;

        const token = teacherToken || authToken;

        if (!token) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        // Extract the quizId from params
        const { quizId } = await params;

        console.log('[Tournament Code API] POST request to create tournament for quiz:', quizId);

        // Create a new game instance using the quiz template ID
        const gameCreatePayload = {
            name: `Tournament from Quiz ${quizId}`,
            gameTemplateId: quizId,
            playMode: 'tournament',
            settings: {
                timeMultiplier: 1.0,
                showLeaderboard: true
            }
        };

        console.log('[Tournament Code API] Creating game instance:', gameCreatePayload);

        const backendResponse = await fetch(`${BACKEND_API_BASE_URL}/games`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(gameCreatePayload)
        });

        // Check if response is JSON before parsing
        const contentType = backendResponse.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await backendResponse.json();
        } else {
            const textResponse = await backendResponse.text();
            console.log('[Tournament Code API] Non-JSON response from backend:', textResponse.substring(0, 200));
            throw new Error(`Backend returned non-JSON response: ${backendResponse.status} ${backendResponse.statusText}`);
        }

        if (!backendResponse.ok) {
            console.log('[Tournament Code API] Backend error response:', data);
            return NextResponse.json(
                { error: data.error || 'Failed to create tournament' },
                { status: backendResponse.status }
            );
        }

        console.log('[Tournament Code API] Backend response:', data);

        // Transform the response to match the expected tournament code format
        if (data.gameInstance && data.gameInstance.accessCode) {
            return NextResponse.json({
                tournament_code: data.gameInstance.accessCode,
                gameInstanceId: data.gameInstance.id,
                message: 'Tournament created successfully'
            });
        } else {
            console.log('[Tournament Code API] Unexpected response structure:', data);
            return NextResponse.json(
                { error: 'Invalid response from backend - no access code received' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Tournament code creation API route error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
