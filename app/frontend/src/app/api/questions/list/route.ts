import { NextRequest, NextResponse } from 'next/server';
import { QuestionsListResponseSchema } from '@shared/types/api/schemas';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Forward all query parameters to the backend
        const queryParams = new URLSearchParams();
        searchParams.forEach((value, key) => {
            queryParams.append(key, value);
        });

        // Call the secure backend list endpoint
        // Use server-side environment variable for API routes
        const backendUrl = `${process.env.BACKEND_API_URL || 'http://localhost:3007/api/v1'}/questions/list?${queryParams.toString()}`;

        const response = await fetch(backendUrl, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Backend API error: ${response.status}`);
        }

        const data = await response.json();

        // Validate the response
        const validatedResult = QuestionsListResponseSchema.parse(data);

        return NextResponse.json(validatedResult);
    } catch (error) {
        console.error('Error in questions list API:', error);
        return NextResponse.json(
            { error: 'Failed to fetch question list' },
            { status: 500 }
        );
    }
}
