import { z } from 'zod';

// Shared TypeScript types + Zod schema for taxonomy (grade-level metadata)

export const MetadataThemeSchema = z.object({
    nom: z.string(),
    tags: z.array(z.string()).optional().default([]),
});

export const MetadataDisciplineSchema = z.object({
    nom: z.string(),
    themes: z.array(MetadataThemeSchema).optional().default([]),
});

export const GradeLevelMetadataSchema = z.object({
    niveau: z.string(),
    disciplines: z.array(MetadataDisciplineSchema).optional().default([]),
});

export const ParsedMetadataSchema = z.object({
    gradeLevels: z.array(z.string()),
    metadata: z.record(GradeLevelMetadataSchema),
});

export type MetadataTheme = z.infer<typeof MetadataThemeSchema>;
export type MetadataDiscipline = z.infer<typeof MetadataDisciplineSchema>;
export type GradeLevelMetadata = z.infer<typeof GradeLevelMetadataSchema>;
export type ParsedMetadata = z.infer<typeof ParsedMetadataSchema>;

export default ParsedMetadataSchema;
