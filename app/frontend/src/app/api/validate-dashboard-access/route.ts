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
    let backendRes: Response;
    let data: any = null;
    try {
        backendRes = await fetch(`${backendUrl}/api/v1/validate-page-access`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'cookie': cookie,
            },
            body: JSON.stringify(body),
            credentials: 'include',
        });
        // Try to parse JSON if possible
        const text = await backendRes.text();
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = { error: 'Invalid JSON from backend', raw: text };
        }
    } catch (err: any) {
        return NextResponse.json({ valid: false, reason: 'BACKEND_FETCH_ERROR', error: err?.message || String(err) }, { status: 502 });
    }
    // Forward backend status and data
    return NextResponse.json(data ?? { error: 'No data from backend' }, { status: backendRes.status });
}
