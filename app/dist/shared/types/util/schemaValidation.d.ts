/**
 * Schema Validation Utility
 *
 * A lightweight schema validation utility for runtime type checking
 * without external dependencies.
 */
export type SchemaFieldType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'custom';
export interface SchemaField {
    defaultMode: SchemaFieldType;
    required?: boolean;
    arrayOf?: SchemaFieldType | Schema;
    properties?: Schema;
    default?: unknown;
    validator?: (value: unknown) => boolean;
}
export interface Schema {
    [key: string]: SchemaField;
}
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    value: Record<string, unknown>;
}
/**
 * Validates an object against a schema
 */
export declare function validateSchema(data: unknown, schema: Schema): ValidationResult;
/**
 * Creates a schema validator function for a specific schema
 */
export declare function createValidator<T extends Record<string, unknown>>(schema: Schema): (data: unknown) => ValidationResult & {
    value: T;
};
