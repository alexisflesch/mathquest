import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const isAuthenticated = request.cookies.get('authToken'); // Check for an auth token in cookies

    if (isAuthenticated && request.nextUrl.pathname === '/student') {
        // Redirect authenticated users away from the avatar selection page
        return NextResponse.redirect(new URL('/student/menu', request.url));
    }

    return NextResponse.next(); // Allow the request to proceed
}

export const config = {
    matcher: ['/student'], // Apply middleware only to the "espace élève" page
};