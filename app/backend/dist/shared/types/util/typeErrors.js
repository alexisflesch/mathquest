"use strict";
/**
 * Type Error Helpers
 *
 * This file contains utilities for handling type-related errors consistently.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTypeError = createTypeError;
exports.assertType = assertType;
exports.assertDefined = assertDefined;
exports.withDefault = withDefault;
/**
 * Creates a standard type error message with predefined structure
 */
function createTypeError(expectedType, receivedValue, context) {
    const actualType = typeof receivedValue;
    const value = JSON.stringify(receivedValue, null, 2).substring(0, 100);
    const message = `Type Error: Expected ${expectedType}, received ${actualType}${context ? ` in ${context}` : ""}.\nValue: ${value}${value.length > 100 ? "..." : ""}`;
    return new Error(message);
}
/**
 * Throws if value doesn't match expected type (simple typeof check)
 * @returns The original value if type check passes
 */
function assertType(value, expectedType, context) {
    if (typeof value !== expectedType) {
        throw createTypeError(expectedType, value, context);
    }
    return value;
}
/**
 * Throws if value is null or undefined
 * @returns The original value if defined
 */
function assertDefined(value, context) {
    if (value === undefined || value === null) {
        throw createTypeError("defined value", value, context);
    }
    return value;
}
/**
 * Provides a default value if the input is null or undefined
 */
function withDefault(value, defaultValue) {
    return value === undefined || value === null ? defaultValue : value;
}
