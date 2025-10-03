import yaml from 'js-yaml';
import { GradeLevelMetadata, ParsedMetadata } from '../types/metadata';
import { sortGradeLevels } from '@/utils/gradeLevelSort';

// Metadata files content - will be loaded dynamically
const metadataFiles: Record<string, string> = {};

/**
 * Parse and load all metadata from YAML files
 * This function loads the metadata files from the public directory
 */
export async function loadMetadata(): Promise<ParsedMetadata> {
    const levels = ['CP', 'CE1', 'L1', 'L2'];
    const metadata: Record<string, GradeLevelMetadata> = {};
    
    // Load all metadata files
    await Promise.all(
        levels.map(async (level) => {
            try {
                const response = await fetch(`/metadata/${level}.yaml`);
                if (response.ok) {
                    const content = await response.text();
                    const parsed = yaml.load(content) as GradeLevelMetadata;
                    metadata[level] = parsed;
                }
            } catch (error) {
                console.error(`Failed to load metadata for ${level}:`, error);
            }
        })
    );

    const gradeLevels = sortGradeLevels(Object.keys(metadata));

    return {
        gradeLevels,
        metadata,
    };
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
