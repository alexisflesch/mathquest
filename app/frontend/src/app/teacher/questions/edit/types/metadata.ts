/**
 * Types for question metadata structure from YAML files
 */

export interface MetadataTag {
    name: string;
}

export interface MetadataTheme {
    nom: string;
    tags: string[];
}

export interface MetadataDiscipline {
    nom: string;
    themes: MetadataTheme[];
}

export interface GradeLevelMetadata {
    niveau: string;
    disciplines: MetadataDiscipline[];
}

/**
 * Parsed metadata for all grade levels
 */
export interface ParsedMetadata {
    gradeLevels: string[];
    metadata: Record<string, GradeLevelMetadata>;
}
