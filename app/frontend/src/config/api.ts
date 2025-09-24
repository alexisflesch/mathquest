/**
 * Backend API Configuration
 * 
 * Centralized configuration for backend API integration.
 * This ensures consistent API base URLs and headers across all frontend API calls.
 */

import { z } from 'zod';

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
 * Helper function to make authenticated API requests with optional response validation
 * Supports both backend API calls and Next.js API routes
 */
export async function makeApiRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string,
    schema?: z.ZodSchema<T>
): Promise<T> {
    // Determine if this is a Next.js API route or backend API call
    const isNextJsRoute = endpoint.startsWith('/api/');
    const url = isNextJsRoute ? endpoint : createApiUrl(endpoint);

    // Automatically get JWT token from localStorage if not provided
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('mathquest_jwt_token') : null);

    // For Next.js routes, use simpler headers; for backend, use full auth headers
    const headers = isNextJsRoute
        ? { 'Content-Type': 'application/json', ...options.headers }
        : { ...createAuthHeaders(authToken || undefined), ...options.headers };

    try {
        const response = await fetch(url, {
            ...options,
            credentials: 'include', // Include cookies for authentication
            headers,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            // Handle structured error responses from backend
            const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;

            // Include status code in error for better error detection
            const enhancedError = new Error(`${response.status}: ${errorMessage}`);
            (enhancedError as any).statusCode = response.status;

            console.error('[makeApiRequest] response error', { url, status: response.status, message: errorMessage });

            throw enhancedError;
        }

        // Handle 204 No Content responses (successful deletion with no body)
        if (response.status === 204) {
            return {} as T; // Return empty object for 204 responses
        }

        const data = await response.json();

        // Validate response using Zod schema if provided
        if (schema) {
            try {
                return schema.parse(data);
            } catch (error) {
                if (error instanceof z.ZodError) {
                    console.error('API Response validation failed:', {
                        endpoint: url,
                        errors: error.errors,
                        receivedData: data
                    });
                    throw new Error(`API response validation failed for ${url}: ${error.errors.map(e => e.message).join(', ')}`);
                }
                throw error;
            }
        }

        return data;
    } catch (err) {
        // Network-level errors (fetch failed) end up here.
        console.error('[makeApiRequest] network error', { url, error: err });
        throw err;
    }

    // Handle 204 No Content responses (successful deletion with no body)
    // (previous logic moved into try/catch above)
}

/**
 * Wrapper specifically for Next.js API routes with validation
 */
export async function makeNextApiRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    schema?: z.ZodSchema<T>
): Promise<T> {
    // Ensure endpoint starts with /api/
    const apiEndpoint = endpoint.startsWith('/api/') ? endpoint : `/api/${endpoint}`;
    return makeApiRequest(apiEndpoint, options, undefined, schema);
}
