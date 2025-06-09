import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '@/config/api';

export async function GET(request: NextRequest) {
    try {
        // Get authentication token from cookies
        const teacherToken = request.cookies.get('teacherToken')?.value;
        const authToken = request.cookies.get('authToken')?.value;

        const token = teacherToken || authToken;

        if (!token) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        // Get query parameters from the request URL
        const { searchParams } = new URL(request.url);

        // All quiz requests should be mapped to quiz-templates endpoint
        // Remove enseignant_id from query params since backend uses auth token to identify teacher
        const filteredParams = new URLSearchParams();
        for (const [key, value] of searchParams.entries()) {
            if (key !== 'enseignant_id') {
                filteredParams.append(key, value);
            }
        }

        const queryString = filteredParams.toString();
        const backendUrl = `${BACKEND_API_BASE_URL}/quiz-templates${queryString ? `?${queryString}` : ''}`;

        console.log('[Frontend API] Making request to backend:', backendUrl);

        const backendResponse = await fetch(backendUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('[Frontend API] Backend response status:', backendResponse.status);
        console.log('[Frontend API] Backend response headers:', Object.fromEntries(backendResponse.headers.entries()));

        // Check if response is JSON before parsing
        const contentType = backendResponse.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await backendResponse.json();
        } else {
            const textResponse = await backendResponse.text();
            console.log('[Frontend API] Non-JSON response from backend:', textResponse.substring(0, 200));
            throw new Error(`Backend returned non-JSON response: ${backendResponse.status} ${backendResponse.statusText}`);
        }

        if (!backendResponse.ok) {
            console.log('[Frontend API] Backend error response:', data);
            return NextResponse.json(
                { error: data.error || 'Failed to fetch quiz data' },
                { status: backendResponse.status }
            );
        }

        console.log('[Frontend API] Backend response data:', data);

        // Transform response if it's from quiz-templates endpoint
        let transformedData = data;
        if (data.quizTemplates && Array.isArray(data.quizTemplates)) {
            // Backend returned quiz-templates format, transform to legacy format
            transformedData = data.quizTemplates.map((template: any) => ({
                id: template.id,
                nom: template.name,
                enseignant_id: template.creatorId,
                questions_ids: template.questions?.map((q: any) => q.questionUid || q.uid) || [],
                themes: template.themes || [],
                niveaux: template.gradeLevel ? [template.gradeLevel] : [],
                categories: template.discipline ? [template.discipline] : [],
                date_creation: template.createdAt,
                type: template.defaultMode || 'standard'
            }));
            console.log('[Frontend API] Transformed data:', transformedData);
        }

        return NextResponse.json(transformedData);
    } catch (error) {
        console.error('Quiz API route error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        // Get authentication token from cookies
        const teacherToken = request.cookies.get('teacherToken')?.value;
        const authToken = request.cookies.get('authToken')?.value;

        const token = teacherToken || authToken;

        if (!token) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        // Get request body
        const body = await request.json();

        // Forward request to backend quiz-templates endpoint
        const backendResponse = await fetch(`${BACKEND_API_BASE_URL}/quiz-templates`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await backendResponse.json();

        console.log('[Frontend API] POST Backend response data:', data);

        if (!backendResponse.ok) {
            return NextResponse.json(
                { error: data.error || 'Failed to create quiz' },
                { status: backendResponse.status }
            );
        }

        // Transform response if needed - POST typically returns { gameTemplate: {...} }
        let transformedData = data;
        if (data.gameTemplate) {
            // Transform gameTemplate to quiz format
            transformedData = {
                id: data.gameTemplate.id,
                message: 'Quiz template created successfully'
            };
        }

        return NextResponse.json(transformedData);
    } catch (error) {
        console.error('Quiz API route error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
