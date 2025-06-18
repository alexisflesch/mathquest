/**
 * Enhanced Filters Types
 * Types for advanced filtering functionality
 */

export interface FilterOption {
    value: string;
    label: string;
    count?: number;
    isCompatible: boolean; // Required by frontend components
}

export interface EnhancedFilters {
    disciplines?: FilterOption[];
    gradeLevel?: FilterOption[];
    themes?: FilterOption[];
    difficulty?: FilterOption[];
    questionType?: FilterOption[];
    levels?: FilterOption[]; // Alias for gradeLevel for frontend compatibility
    authors?: FilterOption[]; // Additional filter option
}

export interface EnhancedFiltersResponse {
    success: boolean;
    filters?: EnhancedFilters;
    message?: string;

    // Direct properties that frontend expects
    disciplines?: FilterOption[];
    gradeLevel?: FilterOption[];
    themes?: FilterOption[];
    authors?: FilterOption[];
}
