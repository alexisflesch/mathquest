import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '@/config/api';

// TEST-ONLY endpoint to create a guest user in the backend and return its id + cookieId.
// This does not set client-side localStorage; tests should set it after calling this route.
// Route is only available when NODE_ENV === 'test'.

export async function POST(req: NextRequest) {
    // Guard: Only allow in test or explicitly authorized non-production environments.
    // - Always disabled in production.
    // - Enabled when NODE_ENV === 'test'.
    // - In development, requires header 'x-test-seed: 1' to reduce accidental exposure.
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (process.env.NODE_ENV !== 'test') {
        const allowHeader = req.headers.get('x-test-seed');
        if (!(allowHeader === '1' || (allowHeader ?? '').toLowerCase() === 'true')) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
    }
    try {
        const body = await req.json().catch(() => null) as { username?: string; avatar?: string } | null;
        if (!body || !body.username) {
            return NextResponse.json({ error: 'username is required' }, { status: 400 });
        }
        const username = body.username;
        const avatar = body.avatar || '🐼';
        const cookieId = `guest_${Math.random().toString(36).slice(2)}_${Date.now()}`;

        const backendResp = await fetch(`${BACKEND_API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                avatar,
                cookieId,
                role: 'GUEST'
            })
        });

        const text = await backendResp.text();
        let data: any = null;
        try { data = JSON.parse(text); } catch { /* ignore */ }
        if (!backendResp.ok) {
            return NextResponse.json({ error: 'backend register failed', details: data || text }, { status: backendResp.status });
        }

        return NextResponse.json({ success: true, user: data?.user || null, cookieId });
    } catch (e: any) {
        return NextResponse.json({ error: 'seed-guest failed', details: e?.message || String(e) }, { status: 500 });
    }
}
