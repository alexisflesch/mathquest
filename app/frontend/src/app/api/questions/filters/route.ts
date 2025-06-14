import { NextRequest, NextResponse } from 'next/server';
import { QuestionsFiltersResponseSchema } from '@shared/types/api/schemas';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Forward all query parameters to the backend
        const queryParams = new URLSearchParams();
        searchParams.forEach((value, key) => {
            queryParams.append(key, value);
        });

        // Call the secure backend filters endpoint
        // Use server-side environment variable for API routes
        const backendUrl = `${process.env.BACKEND_API_URL || 'http://localhost:3007/api/v1'}/questions/filters?${queryParams.toString()}`;

        const response = await fetch(backendUrl, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Backend API error: ${response.status}`);
        }

        const data = await response.json();

        // The backend returns filters data directly, but we need to transform field names
        // Backend returns: niveaux, disciplines, themes
        // Frontend expects: niveaux, disciplines, themes (same structure)
        const result = {
            gradeLevel: data.levels || [],
            disciplines: data.disciplines || [],
            themes: data.themes || []
        };

        // Validate the response
        const validatedResult = QuestionsFiltersResponseSchema.parse(result);

        return NextResponse.json(validatedResult);
    } catch (error) {
        console.error('Error in questions filters API:', error);
        return NextResponse.json(
            { error: 'Failed to fetch question filters' },
            { status: 500 }
        );
    }
}
