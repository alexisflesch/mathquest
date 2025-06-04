import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for route protection and authentication-based redirects
 * 
 * This middleware implements the 4-state authentication system:
 * - anonymous: No username/avatar set
 * - guest: Username/avatar set via localStorage, no account
 * - student: Full student account with email/password
 * - teacher: Teacher account with admin privileges (can access all routes)
 */

function getUserState(request: NextRequest): 'anonymous' | 'guest' | 'student' | 'teacher' {
    // Check for JWT tokens to identify authenticated users
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

    // Redirect authenticated users away from login page
    // This prevents the issue where users briefly see login form before client-side redirect
    if (pathname === '/login' && (userState === 'teacher' || userState === 'student')) {
        // Create a new URL object for the home page based on the current request
        const url = new URL('/', request.url);

        // Use the URL object directly in the redirect for reliable redirection
        return NextResponse.redirect(url);
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