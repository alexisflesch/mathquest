import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Auth status API endpoint - Returns the current auth state based on cookies
 * This is a debug endpoint to help with authentication troubleshooting
 */
export async function GET() {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    // Check for authentication cookies
    const authToken = cookieStore.get('authToken');
    const teacherToken = cookieStore.get('teacherToken');

    // Determine auth state from cookies
    let authState = 'anonymous';
    if (teacherToken) {
        authState = 'teacher';
    } else if (authToken) {
        authState = 'student';
    }

    return NextResponse.json({
        authState,
        cookiesFound: allCookies.length,
        cookieNames: allCookies.map(c => c.name),
        hasAuthToken: !!authToken,
        hasTeacherToken: !!teacherToken,
        timestamp: new Date().toISOString()
    });
}
