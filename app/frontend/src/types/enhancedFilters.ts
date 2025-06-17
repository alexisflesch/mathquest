/**
 * Enhanced Filter Types
 * 
 * Types for the advanced multi-filter system with incompatible option handling
 */

export interface FilterOption {
    value: string;
    label?: string;
    isCompatible: boolean;
}

export interface EnhancedFiltersResponse {
    gradeLevel: FilterOption[];
    disciplines: FilterOption[];
    themes: FilterOption[];
    authors: FilterOption[];
}

export interface EnhancedFilters {
    levels: FilterOption[];
    disciplines: FilterOption[];
    themes: FilterOption[];
    authors: FilterOption[];
}
