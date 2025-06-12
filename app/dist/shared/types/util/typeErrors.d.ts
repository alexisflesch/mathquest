/**
 * Type Error Helpers
 *
 * This file contains utilities for handling type-related errors consistently.
 */
/**
 * Creates a standard type error message with predefined structure
 */
export declare function createTypeError(expectedType: string, receivedValue: unknown, context?: string): Error;
/**
 * Throws if value doesn't match expected type (simple typeof check)
 * @returns The original value if type check passes
 */
export declare function assertType<T>(value: unknown, expectedType: string, context?: string): T;
/**
 * Throws if value is null or undefined
 * @returns The original value if defined
 */
export declare function assertDefined<T>(value: T | undefined | null, context?: string): T;
/**
 * Provides a default value if the input is null or undefined
 */
export declare function withDefault<T>(value: T | undefined | null, defaultValue: T): T;
/**
 * Safely access a property that might be undefined
 */
export declare function safeGet<T, K extends keyof T>(obj: T | undefined | null, key: K, defaultValue: T[K]): T[K];
