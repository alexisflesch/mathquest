/**
 * Backend API Configuration
 * 
 * Centralized configuration for backend API integration.
 * This ensures consistent API base URLs and headers across all frontend API calls.
 */

// Backend API base URL - can be overridden via environment variable
export const BACKEND_API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3007/api/v1';

// Common headers for API requests
export const API_HEADERS = {
    'Content-Type': 'application/json',
};

/**
 * Create backend API URL for a given endpoint
 */
export function createApiUrl(endpoint: string): string {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${BACKEND_API_BASE_URL}/${cleanEndpoint}`;
}

/**
 * Create authenticated API headers with JWT token
 */
export function createAuthHeaders(token?: string): Record<string, string> {
    const headers: Record<string, string> = { ...API_HEADERS };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

/**
 * Helper function to make authenticated API requests
 */
export async function makeApiRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
): Promise<T> {
    const url = createApiUrl(endpoint);
    const headers = createAuthHeaders(token);

    const response = await fetch(url, {
        ...options,
        headers: {
            ...headers,
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
}
