/**
 * Authentication Status API Route
 * 
 * This API route provides authentication status information for the client:
 * - Verifies teacher authentication via cookies
 * - Returns information about the authenticated teacher (if any)
 * 
 * Note: Student authentication status is managed client-side via localStorage
 * and is not checked in this server-side route.
 * 
 * Used by the AuthProvider component to determine the current user's role
 * and authentication state.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    const cookieStore = await cookies(); // Await cookies()
    const teacherCookie = cookieStore.get('mathquest_teacher');

    const isTeacher = !!teacherCookie?.value;
    // Optionally: Validate the cookie value against the database if needed

    // Check localStorage for student status (cannot be done server-side directly)
    // We will handle student status client-side

    return NextResponse.json({
        isTeacher,
        teacherId: isTeacher ? teacherCookie.value : null,
    });
}
