/**
 * Type Error Helpers
 * 
 * This file contains utilities for handling type-related errors consistently.
 */

/**
 * Creates a standard type error message with predefined structure
 */
export function createTypeError(
    expectedType: string,
    receivedValue: unknown,
    context?: string
): Error {
    const actualType = typeof receivedValue;
    const value = JSON.stringify(receivedValue, null, 2).substring(0, 100);
    const message = `Type Error: Expected ${expectedType}, received ${actualType}${context ? ` in ${context}` : ""}.\nValue: ${value}${value.length > 100 ? "..." : ""}`;

    return new Error(message);
}

/**
 * Throws if value doesn't match expected type (simple typeof check)
 * @returns The original value if type check passes
 */
export function assertType<T>(
    value: unknown,
    expectedType: string,
    context?: string
): T {
    if (typeof value !== expectedType) {
        throw createTypeError(expectedType, value, context);
    }
    return value as T;
}

/**
 * Throws if value is null or undefined
 * @returns The original value if defined
 */
export function assertDefined<T>(
    value: T | undefined | null,
    context?: string
): T {
    if (value === undefined || value === null) {
        throw createTypeError("defined value", value, context);
    }
    return value;
}

/**
 * Provides a default value if the input is null or undefined
 */
export function withDefault<T>(value: T | undefined | null, defaultValue: T): T {
    return value === undefined || value === null ? defaultValue : value;
}

/**
 * Safely access a property that might be undefined
 */
export function safeGet<T, K extends keyof T>(
    obj: T | undefined | null,
    key: K,
    defaultValue: T[K]
): T[K] {
    return obj ? withDefault(obj[key], defaultValue) : defaultValue;
}
