import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createApiUrl } from '@/config/api';

/**
 * Auth status API endpoint - Proxies to backend to get complete auth state with user profile
 */
export async function GET() {
    try {
        // Get cookies to forward to backend
        const cookieStore = await cookies();
        const allCookies = cookieStore.getAll();

        // Create cookie header for backend request
        const cookieHeader = allCookies
            .map(cookie => `${cookie.name}=${cookie.value}`)
            .join('; ');

        // Call backend auth status endpoint
        const response = await fetch(createApiUrl('auth/status'), {
            method: 'GET',
            headers: {
                'Cookie': cookieHeader,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Backend returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('[Frontend Auth Status] Error calling backend:', error);

        // Fallback: return basic auth state from cookies
        const cookieStore = await cookies();
        const authToken = cookieStore.get('authToken');
        const teacherToken = cookieStore.get('teacherToken');

        let authState = 'anonymous';
        if (teacherToken) {
            authState = 'teacher';
        } else if (authToken) {
            authState = 'student';
        }

        return NextResponse.json({
            authState,
            hasAuthToken: !!authToken,
            hasTeacherToken: !!teacherToken,
            user: null,
            error: 'Backend unavailable'
        });
    }
}
