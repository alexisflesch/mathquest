import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
    if (!backendUrl) {
        return NextResponse.json({ valid: false, reason: 'NO_BACKEND_URL' }, { status: 500 });
    }
    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ valid: false, reason: 'INVALID_REQUEST' }, { status: 400 });
    }
    // Forward cookies and headers
    const cookie = req.headers.get('cookie') || '';
    const res = await fetch(`${backendUrl}/api/v1/validate-page-access`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'cookie': cookie,
        },
        body: JSON.stringify(body),
        credentials: 'include',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
}
