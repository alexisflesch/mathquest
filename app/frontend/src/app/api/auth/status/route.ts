import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createApiUrl } from '@/config/api';
import { AuthStatusResponseSchema, type AuthStatusResponse } from '@shared/types/api/schemas';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

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

        // Validate the response from backend
        const validatedData = AuthStatusResponseSchema.parse(data);

        return NextResponse.json(validatedData);

    } catch (error) {
        console.error('[Frontend Auth Status] Error calling backend:', error);

        // Fallback: return basic auth state from cookies
        const cookieStore = await cookies();
        const authToken = cookieStore.get('authToken');
        const teacherToken = cookieStore.get('teacherToken');

        let authState: 'anonymous' | 'student' | 'teacher' | 'guest' = 'anonymous';
        if (teacherToken) {
            authState = 'teacher';
        } else if (authToken) {
            authState = 'student';
        }

        const fallbackResponse: AuthStatusResponse = {
            authState,
            cookiesFound: 0,
            cookieNames: [],
            hasAuthToken: !!authToken,
            hasTeacherToken: !!teacherToken,
            timestamp: new Date().toISOString(),
            user: undefined
        };

        return NextResponse.json(fallbackResponse);
    }
}
