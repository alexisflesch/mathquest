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
        body = {};
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
    const data = await response.json();
    return new NextResponse(JSON.stringify(data), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
    });
}
