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
