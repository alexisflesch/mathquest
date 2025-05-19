/**
 * Type Error Helpers
 *
 * This file contains utilities for handling type-related errors consistently.
 */
/**
 * Creates a standard type error message with predefined structure
 */
export function createTypeError(expectedType, receivedValue, context) {
    const type = typeof receivedValue;
    const value = JSON.stringify(receivedValue, null, 2).substring(0, 100);
    const message = `Type Error: Expected ${expectedType}, received ${type}${context ? ` in ${context}` : ""}.\nValue: ${value}${value.length > 100 ? "..." : ""}`;
    return new Error(message);
}
/**
 * Throws if value doesn't match expected type (simple typeof check)
 * @returns The original value if type check passes
 */
export function assertType(value, expectedType, context) {
    if (typeof value !== expectedType) {
        throw createTypeError(expectedType, value, context);
    }
    return value;
}
/**
 * Throws if value is null or undefined
 * @returns The original value if defined
 */
export function assertDefined(value, context) {
    if (value === undefined || value === null) {
        throw createTypeError("defined value", value, context);
    }
    return value;
}
/**
 * Provides a default value if the input is null or undefined
 */
export function withDefault(value, defaultValue) {
    return value === undefined || value === null ? defaultValue : value;
}
/**
 * Safely access a property that might be undefined
 */
export function safeGet(obj, key, defaultValue) {
    return obj ? withDefault(obj[key], defaultValue) : defaultValue;
}
