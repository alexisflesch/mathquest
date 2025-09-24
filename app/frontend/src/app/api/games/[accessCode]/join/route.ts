import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

// Proxy POST /api/games/[accessCode]/join to backend /api/v1/games/:accessCode/join
export async function POST(req: NextRequest, { params }: { params: Promise<{ accessCode: string }> }) {
    const { accessCode } = await params;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3007/api/v1';
    let body = {};
    try {
        body = await req.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    // Validate that the body is an object (not a primitive like string from malformed JSON)
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return NextResponse.json({ error: 'Request body must be a JSON object' }, { status: 400 });
    }
    // Forward the request to the backend
    const response = await fetch(`${backendUrl}/games/${accessCode}/join`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        credentials: 'include',
    });
    let data;
    try {
        data = await response.json();
    } catch (parseError) {
        // If backend returns non-JSON, return a proper error
        const textResponse = await response.text();
        return NextResponse.json(
            { error: 'Backend returned invalid response', details: textResponse.substring(0, 200) },
            { status: 502 }
        );
    }
    return new NextResponse(JSON.stringify(data), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
    });
}
