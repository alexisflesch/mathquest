import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

/**
 * Middleware for route protection and authentication-based redirects
 * 
 * This middleware implements the 4-state authentication system:
 * - anonymous: No username/avatar set
 * - guest: Username/avatar set via localStorage, no account
 * - student: Full student account with email/password
 * - teacher: Teacher account with admin privileges (can access all routes)
 * 
 * Important: This middleware only checks for token presence, not validity.
 * Token validation (expiration, signature) is handled by the AuthProvider
 * via backend API calls to prevent UX deadlocks with expired tokens.
 */

function getUserState(request: NextRequest): 'anonymous' | 'guest' | 'student' | 'teacher' {
    // Check for JWT tokens to identify users with potential authentication
    // Note: This only checks for token presence, not validity/expiration
    // The AuthProvider handles proper token validation via API calls
    const authToken = request.cookies.get('authToken');
    const teacherToken = request.cookies.get('teacherToken');

    // Debug log in dev environment - helpful to diagnose cookie issues
    if (process.env.NODE_ENV !== 'production') {
        console.log('[Middleware] Cookies detected:', {
            authToken: authToken ? { name: authToken.name, value: '(hidden)' } : null,
            teacherToken: teacherToken ? { name: teacherToken.name, value: '(hidden)' } : null,
            allCookies: request.cookies.getAll().map(c => ({ name: c.name })),
            url: request.url,
            pathname: request.nextUrl.pathname
        });
    }

    if (teacherToken) {
        return 'teacher';
    }

    if (authToken) {
        return 'student';
    }

    // Note: We can't directly check localStorage in middleware (server-side)
    // So guest vs anonymous distinction will be handled client-side
    return 'anonymous';
}

export function middleware(request: NextRequest) {
    const userState = getUserState(request);
    const { pathname } = request.nextUrl;

    // Protected routes that require authentication
    const teacherRoutes = ['/teacher/dashboard', '/teacher/quiz', '/teacher/results'];
    const authenticatedRoutes = ['/my-tournaments'];

    // Check if current path requires specific authentication level
    const requiresTeacher = teacherRoutes.some(route => pathname.startsWith(route));
    const requiresAuth = authenticatedRoutes.some(route => pathname.startsWith(route));

    // Redirect unauthenticated users trying to access protected routes
    if (requiresTeacher && userState !== 'teacher') {
        return NextResponse.redirect(new URL('/login?mode=teacher', request.url));
    }

    if (requiresAuth && userState === 'anonymous') {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Allow access to login page for all users
    // The AuthProvider will handle proper authentication validation and redirects
    // This prevents the UX issue where users with expired tokens get locked out
    if (pathname === '/login') {
        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/student/:path*',
        '/teacher/:path*',
        '/my-tournaments',
        '/login'
        // debug page is intentionally excluded to ensure it's always accessible
    ],
};