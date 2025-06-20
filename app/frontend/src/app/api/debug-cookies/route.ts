import { NextRequest, NextResponse } from 'next/server';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

export async function GET(request: NextRequest) {
    // Get all cookies from the request
    const cookies = request.cookies.getAll();
    const cookieObject = cookies.reduce((acc, cookie) => {
        acc[cookie.name] = cookie.value;
        return acc;
    }, {} as Record<string, string>);

    // Also check headers
    const cookieHeader = request.headers.get('cookie');

    return NextResponse.json({
        cookies: cookieObject,
        cookieHeader,
        authToken: request.cookies.get('authToken'),
        teacherToken: request.cookies.get('teacherToken'),
        allCookieNames: cookies.map(c => c.name)
    });
}
