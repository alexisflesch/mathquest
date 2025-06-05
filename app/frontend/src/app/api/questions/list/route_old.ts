import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Define the response schema for question IDs only
const QuestionIdOnlySchema = z.object({
    uid: z.string()
});

const QuestionsListResponseSchema = z.array(QuestionIdOnlySchema);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Forward all query parameters to the backend
        const queryParams = new URLSearchParams();
        searchParams.forEach((value, key) => {
            queryParams.append(key, value);
        });

        // Call the backend API to get questions
        const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/questions?${queryParams.toString()}`;

        const response = await fetch(backendUrl, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Backend API error: ${response.status}`);
        }

        const data = await response.json();
        const questions = data.questions || [];

        // Return only question IDs for security
        const result = questions.map((q: any) => ({ uid: q.uid }));

        // Validate the response
        const validatedResult = QuestionsListResponseSchema.parse(result);

        return NextResponse.json(validatedResult);
    } catch (error) {
        console.error('Error in questions list API:', error);
        return NextResponse.json(
            { error: 'Failed to fetch question list' },
            { status: 500 }
        );
    }
}
