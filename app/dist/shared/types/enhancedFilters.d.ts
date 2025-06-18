/**
 * Enhanced Filters Types
 * Types for advanced filtering functionality
 */
export interface FilterOption {
    value: string;
    label: string;
    count?: number;
    isCompatible: boolean;
}
export interface EnhancedFilters {
    disciplines?: FilterOption[];
    gradeLevel?: FilterOption[];
    themes?: FilterOption[];
    difficulty?: FilterOption[];
    questionType?: FilterOption[];
    levels?: FilterOption[];
    authors?: FilterOption[];
}
export interface EnhancedFiltersResponse {
    success: boolean;
    filters?: EnhancedFilters;
    message?: string;
    disciplines?: FilterOption[];
    gradeLevel?: FilterOption[];
    themes?: FilterOption[];
    authors?: FilterOption[];
}
