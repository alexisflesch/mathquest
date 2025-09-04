/**
 * Utility function to sort grade levels in their natural educational order
 * 
 * Order: CP, CE1, CE2, CM1, Sixème, Cinquième, Quatrième, Troisième, Seconde, Première, Terminal, L1, L2, L3, M1, M2
 */

const GRADE_LEVEL_ORDER = [
    'CP',
    'CE1',
    'CE2',
    'CM1',
    'Sixème',
    'Cinquième',
    'Quatrième',
    'Troisième',
    'Seconde',
    'Première',
    'Terminal',
    'L1',
    'L2',
    'L3',
    'M1',
    'M2'
];

/**
 * Sort an array of grade levels in their natural educational order
 */
export function sortGradeLevels(gradeLevels: string[]): string[] {
    return [...gradeLevels].sort((a, b) => {
        const indexA = GRADE_LEVEL_ORDER.indexOf(a);
        const indexB = GRADE_LEVEL_ORDER.indexOf(b);

        // If both grades are in the defined order, use that order
        if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
        }

        // If only one grade is in the defined order, it comes first
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;

        // If neither grade is in the defined order, fall back to alphabetical
        return a.localeCompare(b);
    });
}

/**
 * Get the position/index of a grade level in the natural educational order
 * Returns -1 if the grade level is not in the defined order
 */
export function getGradeLevelIndex(gradeLevel: string): number {
    return GRADE_LEVEL_ORDER.indexOf(gradeLevel);
}
