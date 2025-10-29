/**
 * Tests for metadata utility functions
 * 
 * These functions are CRITICAL for ensuring grade-level validation works correctly
 * in autocomplete suggestions.
 */

import {
    getDisciplinesForGradeLevel,
    getThemesForDiscipline,
    getTagsForThemes,
} from '../utils/metadata';
import { ParsedMetadata } from '../types/metadata';

const mockMetadata: ParsedMetadata = {
    gradeLevels: ['CP', 'CE1', 'CE2', 'L1'],
    metadata: {
        CP: {
            niveau: 'CP',
            disciplines: [
                {
                    nom: 'Mathématiques',
                    themes: [
                        {
                            nom: 'Nombres et calculs',
                            tags: ['Addition', 'Soustraction'],
                        },
                    ],
                },
            ],
        },
        CE1: {
            niveau: 'CE1',
            disciplines: [
                {
                    nom: 'Mathématiques',
                    themes: [
                        {
                            nom: 'Géométrie',
                            tags: ['Cercles', 'Triangles'],
                        },
                        {
                            nom: 'Calcul mental',
                            tags: ['Multiplication', 'Division'],
                        },
                    ],
                },
                {
                    nom: 'Français',
                    themes: [
                        {
                            nom: 'Grammaire',
                            tags: ['Verbes', 'Noms'],
                        },
                    ],
                },
            ],
        },
        CE2: {
            niveau: 'CE2',
            disciplines: [
                {
                    nom: 'Mathématiques',
                    themes: [
                        {
                            nom: 'Fractions',
                            tags: ['Numérateur', 'Dénominateur'],
                        },
                    ],
                },
            ],
        },
        L1: {
            niveau: 'L1',
            disciplines: [
                {
                    nom: 'Mathématiques',
                    themes: [
                        {
                            nom: 'Applications linéaires',
                            tags: ['Noyau', 'Image', 'Rang'],
                        },
                        {
                            nom: 'Ensembles et applications',
                            tags: ['Injection', 'Surjection', 'Bijection'],
                        },
                    ],
                },
                {
                    nom: 'Analyse',
                    themes: [
                        {
                            nom: 'Suites',
                            tags: ['Convergence', 'Limite'],
                        },
                    ],
                },
            ],
        },
    },
};

describe('Metadata Utilities', () => {
    describe('getDisciplinesForGradeLevel', () => {
        it('should return disciplines for CP', () => {
            const disciplines = getDisciplinesForGradeLevel(mockMetadata, 'CP');
            expect(disciplines).toEqual(['Mathématiques']);
        });

        it('should return disciplines for CE1', () => {
            const disciplines = getDisciplinesForGradeLevel(mockMetadata, 'CE1');
            expect(disciplines).toEqual(['Mathématiques', 'Français']);
        });

        it('should return disciplines for L1', () => {
            const disciplines = getDisciplinesForGradeLevel(mockMetadata, 'L1');
            expect(disciplines).toEqual(['Mathématiques', 'Analyse']);
        });

        it('should return empty array for unknown grade level', () => {
            const disciplines = getDisciplinesForGradeLevel(mockMetadata, 'Unknown');
            expect(disciplines).toEqual([]);
        });

        it('should NOT mix disciplines from different grade levels', () => {
            const disciplinesCP = getDisciplinesForGradeLevel(mockMetadata, 'CP');
            const disciplinesCE1 = getDisciplinesForGradeLevel(mockMetadata, 'CE1');
            const disciplinesL1 = getDisciplinesForGradeLevel(mockMetadata, 'L1');

            // CP only has Mathématiques (no Français)
            expect(disciplinesCP).not.toContain('Français');
            expect(disciplinesCP).not.toContain('Analyse');

            // CE1 has Mathématiques and Français (no Analyse)
            expect(disciplinesCE1).toContain('Mathématiques');
            expect(disciplinesCE1).toContain('Français');
            expect(disciplinesCE1).not.toContain('Analyse');

            // L1 has Mathématiques and Analyse (no Français)
            expect(disciplinesL1).toContain('Mathématiques');
            expect(disciplinesL1).toContain('Analyse');
            expect(disciplinesL1).not.toContain('Français');
        });
    });

    describe('getThemesForDiscipline', () => {
        it('should return themes for CE1 Mathématiques', () => {
            const themes = getThemesForDiscipline(mockMetadata, 'CE1', 'Mathématiques');
            expect(themes).toEqual(['Géométrie', 'Calcul mental']);
        });

        it('should return themes for L1 Mathématiques', () => {
            const themes = getThemesForDiscipline(mockMetadata, 'L1', 'Mathématiques');
            expect(themes).toEqual(['Applications linéaires', 'Ensembles et applications']);
        });

        it('should return empty array for unknown discipline', () => {
            const themes = getThemesForDiscipline(mockMetadata, 'CE1', 'Unknown');
            expect(themes).toEqual([]);
        });

        it('should return empty array for unknown grade level', () => {
            const themes = getThemesForDiscipline(mockMetadata, 'Unknown', 'Mathématiques');
            expect(themes).toEqual([]);
        });

        it('should NOT mix themes from different grade levels - CRITICAL', () => {
            const themesCE1 = getThemesForDiscipline(mockMetadata, 'CE1', 'Mathématiques');
            const themesL1 = getThemesForDiscipline(mockMetadata, 'L1', 'Mathématiques');

            // CE1 should NOT have L1 themes
            expect(themesCE1).not.toContain('Applications linéaires');
            expect(themesCE1).not.toContain('Ensembles et applications');

            // L1 should NOT have CE1 themes
            expect(themesL1).not.toContain('Géométrie');
            expect(themesL1).not.toContain('Calcul mental');
        });

        it('should handle same discipline name across different grade levels', () => {
            // Mathématiques exists in CP, CE1, CE2, and L1 but with different themes
            const themesCP = getThemesForDiscipline(mockMetadata, 'CP', 'Mathématiques');
            const themesCE1 = getThemesForDiscipline(mockMetadata, 'CE1', 'Mathématiques');
            const themesCE2 = getThemesForDiscipline(mockMetadata, 'CE2', 'Mathématiques');
            const themesL1 = getThemesForDiscipline(mockMetadata, 'L1', 'Mathématiques');

            expect(themesCP).toEqual(['Nombres et calculs']);
            expect(themesCE1).toEqual(['Géométrie', 'Calcul mental']);
            expect(themesCE2).toEqual(['Fractions']);
            expect(themesL1).toEqual(['Applications linéaires', 'Ensembles et applications']);

            // Verify no cross-contamination
            expect(themesCE1).not.toContain('Nombres et calculs'); // CP theme
            expect(themesCE1).not.toContain('Fractions'); // CE2 theme
            expect(themesCE1).not.toContain('Applications linéaires'); // L1 theme
        });
    });

    describe('getTagsForThemes', () => {
        it('should return tags for single theme', () => {
            const tags = getTagsForThemes(mockMetadata, 'CE1', 'Mathématiques', ['Géométrie']);
            expect(tags).toEqual(['Cercles', 'Triangles']);
        });

        it('should return union of tags for multiple themes', () => {
            const tags = getTagsForThemes(mockMetadata, 'CE1', 'Mathématiques', [
                'Géométrie',
                'Calcul mental',
            ]);
            expect(tags.sort()).toEqual([
                'Cercles',
                'Division',
                'Multiplication',
                'Triangles',
            ]);
        });

        it('should return tags for L1 themes', () => {
            const tags = getTagsForThemes(mockMetadata, 'L1', 'Mathématiques', [
                'Applications linéaires',
            ]);
            expect(tags.sort()).toEqual(['Image', 'Noyau', 'Rang']);
        });

        it('should return empty array for unknown theme', () => {
            const tags = getTagsForThemes(mockMetadata, 'CE1', 'Mathématiques', ['Unknown']);
            expect(tags).toEqual([]);
        });

        it('should return empty array for unknown discipline', () => {
            const tags = getTagsForThemes(mockMetadata, 'CE1', 'Unknown', ['Géométrie']);
            expect(tags).toEqual([]);
        });

        it('should return empty array for unknown grade level', () => {
            const tags = getTagsForThemes(mockMetadata, 'Unknown', 'Mathématiques', ['Géométrie']);
            expect(tags).toEqual([]);
        });

        it('should NOT mix tags from different grade levels - CRITICAL', () => {
            const tagsCE1 = getTagsForThemes(mockMetadata, 'CE1', 'Mathématiques', ['Géométrie']);
            const tagsL1 = getTagsForThemes(mockMetadata, 'L1', 'Mathématiques', [
                'Applications linéaires',
            ]);

            // CE1 tags should NOT contain L1 tags
            expect(tagsCE1).not.toContain('Noyau');
            expect(tagsCE1).not.toContain('Image');
            expect(tagsCE1).not.toContain('Rang');

            // L1 tags should NOT contain CE1 tags
            expect(tagsL1).not.toContain('Cercles');
            expect(tagsL1).not.toContain('Triangles');
        });

        it('should handle empty themes array', () => {
            const tags = getTagsForThemes(mockMetadata, 'CE1', 'Mathématiques', []);
            expect(tags).toEqual([]);
        });

        it('should filter out tags from themes not in the selected array', () => {
            // Request only Géométrie tags, should not include Calcul mental tags
            const tags = getTagsForThemes(mockMetadata, 'CE1', 'Mathématiques', ['Géométrie']);
            
            expect(tags).toContain('Cercles');
            expect(tags).toContain('Triangles');
            expect(tags).not.toContain('Multiplication'); // From Calcul mental
            expect(tags).not.toContain('Division'); // From Calcul mental
        });

        it('should deduplicate tags if same tag appears in multiple themes', () => {
            // Create metadata where same tag appears in multiple themes
            const metadataWithDuplicates: ParsedMetadata = {
                gradeLevels: ['CE1'],
                metadata: {
                    CE1: {
                        niveau: 'CE1',
                        disciplines: [
                            {
                                nom: 'Mathématiques',
                                themes: [
                                    {
                                        nom: 'Theme1',
                                        tags: ['CommonTag', 'Tag1'],
                                    },
                                    {
                                        nom: 'Theme2',
                                        tags: ['CommonTag', 'Tag2'],
                                    },
                                ],
                            },
                        ],
                    },
                },
            };

            const tags = getTagsForThemes(metadataWithDuplicates, 'CE1', 'Mathématiques', [
                'Theme1',
                'Theme2',
            ]);

            // CommonTag should appear only once
            expect(tags.filter(t => t === 'CommonTag')).toHaveLength(1);
            expect(tags.sort()).toEqual(['CommonTag', 'Tag1', 'Tag2']);
        });
    });

    describe('Integration - Grade Level Cascade', () => {
        it('should properly cascade from grade level -> discipline -> theme -> tag', () => {
            const gradeLevel = 'CE1';

            // Step 1: Get disciplines for CE1
            const disciplines = getDisciplinesForGradeLevel(mockMetadata, gradeLevel);
            expect(disciplines).toContain('Mathématiques');
            expect(disciplines).toContain('Français');

            // Step 2: Get themes for Mathématiques in CE1
            const themes = getThemesForDiscipline(mockMetadata, gradeLevel, 'Mathématiques');
            expect(themes).toContain('Géométrie');
            expect(themes).toContain('Calcul mental');

            // Step 3: Get tags for Géométrie in CE1 Mathématiques
            const tags = getTagsForThemes(mockMetadata, gradeLevel, 'Mathématiques', ['Géométrie']);
            expect(tags).toContain('Cercles');
            expect(tags).toContain('Triangles');

            // Step 4: Verify isolation - changing grade level changes everything
            const themesL1 = getThemesForDiscipline(mockMetadata, 'L1', 'Mathématiques');
            expect(themesL1).not.toContain('Géométrie'); // CE1 theme
            expect(themesL1).toContain('Applications linéaires'); // L1 theme
        });

        it('should enforce strict hierarchy: wrong grade level = no results', () => {
            // Try to get CE1 themes with L1 grade level - should fail
            const tags = getTagsForThemes(mockMetadata, 'L1', 'Mathématiques', ['Géométrie']);
            expect(tags).toEqual([]); // Géométrie doesn't exist in L1
        });

        it('should handle discipline change within same grade level', () => {
            const gradeLevel = 'CE1';

            // Mathématiques themes
            const mathThemes = getThemesForDiscipline(mockMetadata, gradeLevel, 'Mathématiques');
            expect(mathThemes).toEqual(['Géométrie', 'Calcul mental']);

            // Français themes (different discipline, same grade level)
            const frenchThemes = getThemesForDiscipline(mockMetadata, gradeLevel, 'Français');
            expect(frenchThemes).toEqual(['Grammaire']);

            // Should NOT overlap
            expect(mathThemes).not.toContain('Grammaire');
            expect(frenchThemes).not.toContain('Géométrie');
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty metadata gracefully', () => {
            const emptyMetadata: ParsedMetadata = {
                gradeLevels: [],
                metadata: {},
            };

            expect(getDisciplinesForGradeLevel(emptyMetadata, 'CE1')).toEqual([]);
            expect(getThemesForDiscipline(emptyMetadata, 'CE1', 'Mathématiques')).toEqual([]);
            expect(getTagsForThemes(emptyMetadata, 'CE1', 'Mathématiques', ['Theme'])).toEqual([]);
        });

        it('should handle grade level with no disciplines', () => {
            const sparseMetadata: ParsedMetadata = {
                gradeLevels: ['CE1'],
                metadata: {
                    CE1: {
                        niveau: 'CE1',
                        disciplines: [],
                    },
                },
            };

            expect(getDisciplinesForGradeLevel(sparseMetadata, 'CE1')).toEqual([]);
        });

        it('should handle discipline with no themes', () => {
            const sparseMetadata: ParsedMetadata = {
                gradeLevels: ['CE1'],
                metadata: {
                    CE1: {
                        niveau: 'CE1',
                        disciplines: [
                            {
                                nom: 'Mathématiques',
                                themes: [],
                            },
                        ],
                    },
                },
            };

            expect(getThemesForDiscipline(sparseMetadata, 'CE1', 'Mathématiques')).toEqual([]);
        });

        it('should handle theme with no tags', () => {
            const sparseMetadata: ParsedMetadata = {
                gradeLevels: ['CE1'],
                metadata: {
                    CE1: {
                        niveau: 'CE1',
                        disciplines: [
                            {
                                nom: 'Mathématiques',
                                themes: [
                                    {
                                        nom: 'Géométrie',
                                        tags: [],
                                    },
                                ],
                            },
                        ],
                    },
                },
            };

            expect(getTagsForThemes(sparseMetadata, 'CE1', 'Mathématiques', ['Géométrie'])).toEqual(
                []
            );
        });

        it('should handle case-sensitive matching', () => {
            // Grade level case mismatch
            expect(getDisciplinesForGradeLevel(mockMetadata, 'ce1')).toEqual([]);

            // Discipline case mismatch
            expect(getThemesForDiscipline(mockMetadata, 'CE1', 'mathématiques')).toEqual([]);

            // Theme case mismatch
            expect(getTagsForThemes(mockMetadata, 'CE1', 'Mathématiques', ['géométrie'])).toEqual(
                []
            );
        });
    });
});
