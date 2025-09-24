'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for localStorage with error handling and type safety
 */
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
    // Get initial value
    const [value, setValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return defaultValue;
        }

        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return defaultValue;
        }
    });

    // Set value function
    const setStoredValue = useCallback((newValue: T) => {
        try {
            setValue(newValue);
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(newValue));
            }
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
            throw error;
        }
    }, [key]);

    // Listen for changes from other tabs
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key && e.storageArea === window.localStorage) {
                try {
                    const newValue = e.newValue ? JSON.parse(e.newValue) : defaultValue;
                    setValue(newValue);
                } catch (error) {
                    console.warn(`Error parsing localStorage value for key "${key}":`, error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key, defaultValue]);

    return [value, setStoredValue];
}

/**
 * Custom hook for sessionStorage with error handling and type safety
 */
export function useSessionStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
    // Get initial value
    const [value, setValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return defaultValue;
        }

        try {
            const item = window.sessionStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn(`Error reading sessionStorage key "${key}":`, error);
            return defaultValue;
        }
    });

    // Set value function
    const setStoredValue = useCallback((newValue: T) => {
        try {
            setValue(newValue);
            if (typeof window !== 'undefined') {
                window.sessionStorage.setItem(key, JSON.stringify(newValue));
            }
        } catch (error) {
            console.error(`Error setting sessionStorage key "${key}":`, error);
            throw error;
        }
    }, [key]);

    // Listen for changes from other tabs/windows
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key && e.storageArea === window.sessionStorage) {
                try {
                    const newValue = e.newValue ? JSON.parse(e.newValue) : defaultValue;
                    setValue(newValue);
                } catch (error) {
                    console.warn(`Error parsing sessionStorage value for key "${key}":`, error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key, defaultValue]);

    return [value, setStoredValue];
}

/**
 * Utility function to safely get a value from localStorage
 */
export function getLocalStorageItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') {
        return defaultValue;
    }

    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.warn(`Error reading localStorage key "${key}":`, error);
        return defaultValue;
    }
}

/**
 * Utility function to safely set a value in localStorage
 */
export function setLocalStorageItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
        throw error;
    }
}

/**
 * Utility function to safely get a value from sessionStorage
 */
export function getSessionStorageItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') {
        return defaultValue;
    }

    try {
        const item = window.sessionStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.warn(`Error reading sessionStorage key "${key}":`, error);
        return defaultValue;
    }
}

/**
 * Utility function to safely set a value in sessionStorage
 */
export function setSessionStorageItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error setting sessionStorage key "${key}":`, error);
        throw error;
    }
}