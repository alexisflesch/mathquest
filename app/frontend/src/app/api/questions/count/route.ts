import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Define the response schema for count
const QuestionsCountResponseSchema = z.object({
    count: z.number()
});

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Forward all query parameters to the backend
        const queryParams = new URLSearchParams();
        searchParams.forEach((value, key) => {
            queryParams.append(key, value);
        });

        // Call the secure backend count endpoint
        // Use server-side environment variable for API routes
        const backendUrl = `${process.env.BACKEND_API_URL || 'http://localhost:3007/api/v1'}/questions/count?${queryParams.toString()}`;

        const response = await fetch(backendUrl, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Backend API error: ${response.status}`);
        }

        const data = await response.json();

        const result = {
            count: data.count || 0
        };

        // Validate the response
        const validatedResult = QuestionsCountResponseSchema.parse(result);

        return NextResponse.json(validatedResult);
    } catch (error) {
        console.error('Error in questions count API:', error);
        return NextResponse.json(
            { error: 'Failed to count questions' },
            { status: 500 }
        );
    }
}
