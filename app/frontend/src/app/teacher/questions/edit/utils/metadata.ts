import { GradeLevelMetadata, ParsedMetadata } from '../types/metadata';
import { createApiUrl } from '@/config/api';

/**
 * Load all metadata from the backend taxonomy API
 * This function fetches the taxonomy data from /api/v1/questions/taxonomy
 */
export async function loadMetadata(): Promise<ParsedMetadata> {
    try {
        const response = await fetch(createApiUrl('/questions/taxonomy'), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`Failed to load taxonomy: ${response.status}`);
        }

        const data = await response.json();
        return data as ParsedMetadata;
    } catch (error) {
        console.error('Failed to load metadata from API:', error);
        // Return empty metadata as fallback
        return {
            gradeLevels: [],
            metadata: {},
        };
    }
}

/**
 * Get available disciplines for a specific grade level
 */
export function getDisciplinesForGradeLevel(
    metadata: ParsedMetadata,
    gradeLevel: string
): string[] {
    const levelData = metadata.metadata[gradeLevel];
    if (!levelData) return [];
    return levelData.disciplines.map(d => d.nom);
}

/**
 * Get available themes for a specific grade level and discipline
 */
export function getThemesForDiscipline(
    metadata: ParsedMetadata,
    gradeLevel: string,
    discipline: string
): string[] {
    const levelData = metadata.metadata[gradeLevel];
    if (!levelData) return [];

    const disciplineData = levelData.disciplines.find(d => d.nom === discipline);
    if (!disciplineData) return [];

    return disciplineData.themes.map(t => t.nom);
}

/**
 * Get available tags for a specific grade level, discipline, and theme(s)
 * If multiple themes are selected, returns union of all their tags
 */
export function getTagsForThemes(
    metadata: ParsedMetadata,
    gradeLevel: string,
    discipline: string,
    themes: string[]
): string[] {
    const levelData = metadata.metadata[gradeLevel];
    if (!levelData) return [];

    const disciplineData = levelData.disciplines.find(d => d.nom === discipline);
    if (!disciplineData) return [];

    const allTags = new Set<string>();

    for (const themeName of themes) {
        const themeData = disciplineData.themes.find(t => t.nom === themeName);
        if (themeData) {
            themeData.tags.forEach(tag => allTags.add(tag));
        }
    }

    return Array.from(allTags).sort();
}
