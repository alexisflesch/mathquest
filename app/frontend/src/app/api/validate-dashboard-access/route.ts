// This file must NOT import any backend or next-auth code. It should proxy to the backend API if needed, or return a stub error.
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // This is a frontend API route. It cannot access backend DB or next-auth directly.
  // Instead, proxy the request to the backend API, or return an error if not configured.
  return NextResponse.json({
    valid: false,
    reason: 'NOT_IMPLEMENTED_FRONTEND_API',
    message: 'This API route is a stub. All validation must be done via backend API.'
  }, { status: 501 });
}
