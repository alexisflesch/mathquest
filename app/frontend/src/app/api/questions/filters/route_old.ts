import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Define the response schema for filters
const QuestionsFiltersResponseSchema = z.object({
    niveaux: z.array(z.string()),
    disciplines: z.array(z.string()),
    themes: z.array(z.string())
});

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const niveau = searchParams.get('niveau');
        const discipline = searchParams.get('discipline');

        // Build query parameters for the backend API
        const queryParams = new URLSearchParams();
        if (niveau) queryParams.append('gradeLevel', niveau);
        if (discipline) queryParams.append('discipline', discipline);

        // Call the backend API to get questions and extract unique filters
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

        // Extract unique values for filters
        const niveaux = [...new Set(questions.map((q: any) => q.gradeLevel).filter(Boolean))];
        const disciplines = [...new Set(questions.map((q: any) => q.discipline).filter(Boolean))];
        const themes = [...new Set(questions.flatMap((q: any) => q.themes || []).filter(Boolean))];

        const result = {
            niveaux: niveaux.sort(),
            disciplines: disciplines.sort(),
            themes: themes.sort()
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
