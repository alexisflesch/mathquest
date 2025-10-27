/**
 * NOTE: This middleware file appears unused by Next.js.
 * - The actual bundled middleware is `src/middleware.ts` (see Next build traces).
 * - Keeping this file can cause confusion when debugging auth/redirect issues.
 * - It should be safe to remove, but we’re intentionally leaving it here with this comment
 *   to document that it’s effectively a no-op and can be deleted in a future cleanup.
 */
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
    const { pathname, origin, search } = request.nextUrl;

    // Early allow-list for static assets and PWA files
    if (
        pathname === '/sw.js' ||
        /^\/(workbox|fallback)-.+\.js$/i.test(pathname) ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.startsWith('/api') ||
        pathname === '/favicon.ico' ||
        pathname.startsWith('/favicon') ||
        pathname === '/manifest.json' ||
        pathname === '/site.webmanifest' ||
        pathname === '/robots.txt' ||
        pathname === '/sitemap.xml' ||
        /^\/icon-.*\.png$/.test(pathname) ||
        /^\/screenshot-.*\.png$/.test(pathname) ||
        /\.(png|jpg|jpeg|gif|webp|svg|ico|txt|webmanifest)$/i.test(pathname)
    ) {
        return NextResponse.next();
    }

    // Allow home, login, email verification, password reset, and join page for everyone
    if (
        pathname === '/' ||
        pathname === '/login' ||
        pathname.startsWith('/verify-email') ||
        pathname.startsWith('/reset-password') ||
        pathname === '/student/join'
    ) {
        return NextResponse.next();
    }

    // Restrict /teacher/* to teachers only
    if (pathname.startsWith('/teacher')) {
        if (userState !== 'teacher') {
            // Redirect non-teachers to home
            return NextResponse.redirect(new URL('/', origin));
        }
        return NextResponse.next();
    }

    // All other routes: must be authenticated (guest, student, teacher)
    if (userState === 'anonymous') {
        // Bypass: allow anonymous access during E2E when flagged via query/header/cookie
        const e2eQuery = request.nextUrl.searchParams.get('e2e');
        const e2eHeader = request.headers.get('x-e2e') || request.headers.get('x-test-seed');
        const e2eCookie = request.cookies.get('e2e')?.value;
        if (e2eQuery === '1' || e2eHeader === '1' || e2eCookie === '1') {
            return NextResponse.next();
        }
        // Redirect to login with returnTo param
        const returnTo = pathname + (search || '');
        return NextResponse.redirect(new URL(`/login?returnTo=${encodeURIComponent(returnTo)}`, origin));
    }

    // Allow access
    return NextResponse.next();
}

export const config = {
    matcher: [
        // Keep matcher simple and handle precise exclusions in code above
        '/((?!_next|api|static|sw\\.js|workbox-|fallback-).*)',
    ],
};
