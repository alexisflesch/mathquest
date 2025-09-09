import fs from 'fs';
import path from 'path';

// Cache for the prenoms list to avoid reading the file multiple times
let prenomsCache: string[] | null = null;

/**
 * Load the list of valid first names from prenoms.json
 */
function loadPrenoms(): string[] {
    if (prenomsCache !== null) {
        return prenomsCache;
    }

    try {
        // Use require with relative path from the compiled location
        const prenomsPath = path.join(__dirname, '../../../../../shared/prenoms.json');
        console.log('Loading prenoms from:', prenomsPath);
        const prenomsData = require(prenomsPath);
        console.log('Loaded prenoms count:', Array.isArray(prenomsData) ? prenomsData.length : 'Not an array');
        prenomsCache = prenomsData as string[];
        return prenomsCache;
    } catch (error) {
        console.error('Error loading prenoms.json:', error);
        // Return empty array as fallback - validation will fail
        prenomsCache = [];
        return prenomsCache;
    }
}

/**
 * Validate that a username follows the pattern: FirstName [optionalChar]
 * @param username - The username to validate
 * @returns object with isValid boolean and error message if invalid
 */
export function validateUsername(username: string): { isValid: boolean; error?: string } {
    if (!username || typeof username !== 'string') {
        return { isValid: false, error: 'Username is required' };
    }

    const trimmedUsername = username.trim();

    if (trimmedUsername.length === 0) {
        return { isValid: false, error: 'Username cannot be empty' };
    }

    // Load valid first names
    const validPrenoms = loadPrenoms();
    if (validPrenoms.length === 0) {
        // If we can't load prenoms, reject all usernames for security
        console.error('Could not load prenoms.json, rejecting all usernames for security');
        return {
            isValid: false,
            error: 'Username validation service is temporarily unavailable'
        };
    }

    // Parse the username - should be "FirstName" or "FirstName X" where X is a single character
    const parts = trimmedUsername.split(' ');

    if (parts.length === 1) {
        // Just a first name
        const firstname = parts[0];

        // Check if the firstname exists in our list (case-insensitive)
        const isValidFirstname = validPrenoms.some(prenom =>
            prenom.toLowerCase() === firstname.toLowerCase()
        );

        if (!isValidFirstname) {
            return {
                isValid: false,
                error: 'Username must be a valid French first name from the approved list'
            };
        }

        return { isValid: true };
    } else if (parts.length === 2) {
        // First name + optional character
        const [firstname, suffix] = parts;

        // Check if the firstname exists in our list (case-insensitive)
        const isValidFirstname = validPrenoms.some(prenom =>
            prenom.toLowerCase() === firstname.toLowerCase()
        );

        if (!isValidFirstname) {
            return {
                isValid: false,
                error: 'Username must start with a valid French first name from the approved list'
            };
        }

        // Check if suffix is a single character
        if (suffix.length !== 1) {
            return {
                isValid: false,
                error: 'Username suffix must be a single character (e.g., "Marie A")'
            };
        }

        // Check if suffix is alphanumeric
        if (!/^[a-zA-Z0-9]$/.test(suffix)) {
            return {
                isValid: false,
                error: 'Username suffix must be a letter or number (e.g., "Marie A" or "Pierre 2")'
            };
        }

        return { isValid: true };
    } else {
        // Too many parts
        return {
            isValid: false,
            error: 'Username format must be "FirstName" or "FirstName X" where X is a single character'
        };
    }
}

/**
 * Get the list of valid first names (for testing or other purposes)
 */
export function getValidPrenoms(): string[] {
    return loadPrenoms();
}

/**
 * Format a username according to our standards (proper casing)
 * @param username - The username to format
 * @returns Formatted username or null if invalid
 */
export function formatUsername(username: string): string | null {
    const validation = validateUsername(username);
    if (!validation.isValid) {
        return null;
    }

    const parts = username.trim().split(' ');

    if (parts.length === 1) {
        // Just capitalize first letter
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
    } else if (parts.length === 2) {
        // Capitalize first name and keep suffix as-is
        const firstname = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
        const suffix = parts[1]; // Keep suffix exactly as entered
        return `${firstname} ${suffix}`;
    }

    return null;
}
