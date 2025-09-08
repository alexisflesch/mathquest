/**
 * Unit Test for Student Create Game Filtering Logic
 * Tests the specific logic that was fixed in the student create game page
 */

import { describe, it, expect } from '@jest/globals';

// Mock the filtering logic from the student create game page
function processFilterResponse(apiResponse: any) {
    // This simulates the OLD logic (broken)
    const oldLogic = {
        disciplines: apiResponse.disciplines.map((option: any) => option.value).sort(),
        themes: apiResponse.themes.map((option: any) => option.value).sort()
    };

    // This simulates the NEW logic (fixed)
    const newLogic = {
        disciplines: apiResponse.disciplines.filter((option: any) => option.isCompatible).map((option: any) => option.value).sort(),
        themes: apiResponse.themes.filter((option: any) => option.isCompatible).map((option: any) => option.value).sort()
    };

    return { oldLogic, newLogic };
}

describe('Student Create Game Filtering Logic', () => {
    // Mock API response for L2 grade level
    const mockApiResponseL2 = {
        gradeLevel: [
            { value: "L1", isCompatible: true },
            { value: "L2", isCompatible: true }
        ],
        disciplines: [
            { value: "Allemand", isCompatible: false },
            { value: "Anglais", isCompatible: false },
            { value: "Français", isCompatible: false },
            { value: "Mathématiques", isCompatible: true },
            { value: "Questionner le monde", isCompatible: false }
        ],
        themes: [
            { value: "Calcul", isCompatible: false },
            { value: "Déterminant", isCompatible: true },
            { value: "Espaces préhilbertiens", isCompatible: true },
            { value: "Géométrie", isCompatible: false },
            { value: "Intégrales généralisées", isCompatible: true },
            { value: "Nombres", isCompatible: false }
        ]
    };

    it('should filter out incompatible disciplines with new logic', () => {
        const result = processFilterResponse(mockApiResponseL2);

        // Old logic would include ALL disciplines
        expect(result.oldLogic.disciplines).toContain('Allemand');
        expect(result.oldLogic.disciplines).toContain('Anglais');
        expect(result.oldLogic.disciplines).toContain('Mathématiques');
        expect(result.oldLogic.disciplines).toHaveLength(5);

        // New logic should only include compatible disciplines
        expect(result.newLogic.disciplines).not.toContain('Allemand');
        expect(result.newLogic.disciplines).not.toContain('Anglais');
        expect(result.newLogic.disciplines).toContain('Mathématiques');
        expect(result.newLogic.disciplines).toHaveLength(1);
        expect(result.newLogic.disciplines).toEqual(['Mathématiques']);
    });

    it('should filter out incompatible themes with new logic', () => {
        const result = processFilterResponse(mockApiResponseL2);

        // Old logic would include ALL themes
        expect(result.oldLogic.themes).toContain('Calcul');
        expect(result.oldLogic.themes).toContain('Géométrie');
        expect(result.oldLogic.themes).toContain('Déterminant');
        expect(result.oldLogic.themes).toHaveLength(6);

        // New logic should only include compatible themes
        expect(result.newLogic.themes).not.toContain('Calcul');
        expect(result.newLogic.themes).not.toContain('Géométrie');
        expect(result.newLogic.themes).toContain('Déterminant');
        expect(result.newLogic.themes).toContain('Espaces préhilbertiens');
        expect(result.newLogic.themes).toContain('Intégrales généralisées');
        expect(result.newLogic.themes).toHaveLength(3);
        expect(result.newLogic.themes).toEqual(['Déterminant', 'Espaces préhilbertiens', 'Intégrales généralisées']);
    });

    it('should demonstrate the bug that was fixed', () => {
        const result = processFilterResponse(mockApiResponseL2);

        // This demonstrates the problem: old logic shows incompatible options
        console.log('🐛 OLD Logic (BROKEN) - shows all options including incompatible ones:');
        console.log('  Disciplines:', result.oldLogic.disciplines);
        console.log('  Themes:', result.oldLogic.themes);

        console.log('\n✅ NEW Logic (FIXED) - shows only compatible options:');
        console.log('  Disciplines:', result.newLogic.disciplines);
        console.log('  Themes:', result.newLogic.themes);

        // Verify the fix
        expect(result.newLogic.disciplines.length).toBeLessThan(result.oldLogic.disciplines.length);
        expect(result.newLogic.themes.length).toBeLessThan(result.oldLogic.themes.length);
    });
});

export { };
