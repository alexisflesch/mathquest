import { NextRequest, NextResponse } from 'next/server';
import { QuestionsFiltersResponseSchema } from '@shared/types/api/schemas';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Extract current filter selections from query parameters
        const currentSelections = {
            gradeLevel: searchParams.getAll('gradeLevel'),
            disciplines: searchParams.getAll('disciplines'),
            themes: searchParams.getAll('themes'),
            tags: searchParams.getAll('tags')
        };

        console.log('Current filter selections:', currentSelections);

        // Backend URL - use environment variable with fallback
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3007/api/v1';

        // Fetch all options (without filters)
        const allOptionsUrl = `${backendUrl}/questions/filters`;
        console.log('Fetching all options from backend:', allOptionsUrl);

        const allOptionsResponse = await fetch(allOptionsUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
        });

        if (!allOptionsResponse.ok) {
            throw new Error(`Backend API error: ${allOptionsResponse.status}`);
        }

        const allOptions = await allOptionsResponse.json();

        // If no filters are selected, all options are compatible
        if (currentSelections.gradeLevel.length === 0 && currentSelections.disciplines.length === 0 && currentSelections.themes.length === 0 && currentSelections.tags.length === 0) {
            const transformToFilterOptions = (stringArray: string[]): Array<{ value: string, isCompatible: boolean }> => {
                return (stringArray || []).map(value => ({
                    value,
                    isCompatible: true
                }));
            };

            const result = {
                gradeLevel: transformToFilterOptions(allOptions.gradeLevel || []),
                disciplines: transformToFilterOptions(allOptions.disciplines || []),
                themes: transformToFilterOptions(allOptions.themes || []),
                tags: transformToFilterOptions(allOptions.tags || [])
            };

            const validatedResult = QuestionsFiltersResponseSchema.parse(result);
            return NextResponse.json(validatedResult);
        }

        // Fetch compatible options with current selections
        const compatibleParams = new URLSearchParams();
        currentSelections.gradeLevel.forEach((level: string) => compatibleParams.append('gradeLevel', level));
        currentSelections.disciplines.forEach((discipline: string) => compatibleParams.append('discipline', discipline));
        currentSelections.themes.forEach((theme: string) => compatibleParams.append('theme', theme));
        currentSelections.tags.forEach((tag: string) => compatibleParams.append('tag', tag));

        const compatibleUrl = `${backendUrl}/questions/filters?${compatibleParams.toString()}`;
        console.log('Fetching compatible options from backend:', compatibleUrl);

        const compatibleResponse = await fetch(compatibleUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
        });

        if (!compatibleResponse.ok) {
            throw new Error(`Backend API error: ${compatibleResponse.status}`);
        }

        const compatibleOptions = await compatibleResponse.json();

        // Transform to FilterOption arrays with incompatibility detection
        const transformWithCompatibility = (allItems: string[], compatibleItems: string[]): Array<{ value: string, isCompatible: boolean }> => {
            const compatibleSet = new Set(compatibleItems || []);
            return (allItems || []).map(value => ({
                value,
                isCompatible: compatibleSet.has(value)
            }));
        };

        const result = {
            gradeLevel: transformWithCompatibility(allOptions.gradeLevel || [], compatibleOptions.gradeLevel || []),
            disciplines: transformWithCompatibility(allOptions.disciplines || [], compatibleOptions.disciplines || []),
            themes: transformWithCompatibility(allOptions.themes || [], compatibleOptions.themes || []),
            tags: transformWithCompatibility(allOptions.tags || [], compatibleOptions.tags || [])
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
