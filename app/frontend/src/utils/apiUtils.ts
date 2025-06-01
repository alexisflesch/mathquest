/**
 * API utility functions for constructing query parameters
 */

/**
 * Constructs URL query parameters for themes
 * @param themes Array of theme strings
 * @returns URL query string for themes (e.g., "themes=arithmetic&themes=multiplication")
 */
export function buildThemesParams(themes: string[]): string {
    return themes.map(theme => `themes=${encodeURIComponent(theme)}`).join('&');
}

/**
 * Constructs a complete questions API URL with filters
 * @param params Object containing filter parameters
 * @returns Complete URL for questions API
 */
export function buildQuestionsUrl(params: {
    gradeLevel?: string;
    discipline?: string;
    themes?: string[];
    pageSize?: number;
    page?: number;
}): string {
    const urlParams = new URLSearchParams();

    if (params.gradeLevel) {
        urlParams.append('gradeLevel', params.gradeLevel);
    }

    if (params.discipline) {
        urlParams.append('discipline', params.discipline);
    }

    if (params.themes && params.themes.length > 0) {
        params.themes.forEach(theme => {
            urlParams.append('themes', theme);
        });
    }

    if (params.pageSize) {
        urlParams.append('pageSize', params.pageSize.toString());
    }

    if (params.page) {
        urlParams.append('page', params.page.toString());
    }

    return `questions?${urlParams.toString()}`;
}
