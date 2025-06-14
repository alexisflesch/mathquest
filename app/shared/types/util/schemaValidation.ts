/**
 * Schema Validation Utility
 * 
 * A lightweight schema validation utility for runtime type checking
 * without external dependencies.
 */

// Define schema field types
export type SchemaFieldType =
    | 'string'
    | 'number'
    | 'boolean'
    | 'array'
    | 'object'
    | 'custom'; // Replace 'any' with 'custom' for better semantics

// Schema field definition
export interface SchemaField {
    defaultMode: SchemaFieldType;
    required?: boolean;
    arrayOf?: SchemaFieldType | Schema;
    properties?: Schema;
    default?: unknown;
    // Custom validator function for complex types
    validator?: (value: unknown) => boolean;
}

// Schema definition (map of field names to field definitions)
export interface Schema {
    [key: string]: SchemaField;
}

// Validation result
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    value: Record<string, unknown>;
}

/**
 * Validates an object against a schema
 */
export function validateSchema(data: unknown, schema: Schema): ValidationResult {
    const errors: string[] = [];
    const result: Record<string, unknown> = {};

    // Check for required fields and validate each field
    for (const [key, field] of Object.entries(schema)) {
        const value = data && typeof data === 'object' ? (data as Record<string, unknown>)[key] : undefined;

        // Check if required field is missing
        if (field.required && (value === undefined || value === null)) {
            errors.push(`Required field '${key}' is missing`);
            continue;
        }

        // If field is missing but not required, use default or skip
        if (value === undefined || value === null) {
            if ('default' in field) {
                result[key] = field.default;
            }
            continue;
        }

        // Validate field type
        if (!validateFieldType(value, field, key, errors)) {
            continue;
        }

        // Add valid value to result
        result[key] = value;
    }

    return {
        valid: errors.length === 0,
        errors,
        value: result
    };
}

/**
 * Validates a field's type against its schema definition
 */
function validateFieldType(
    value: any,
    field: SchemaField,
    fieldName: string,
    errors: string[]
): boolean {
    switch (field.defaultMode) {
        case 'string':
            if (typeof value !== 'string') {
                errors.push(`Field '${fieldName}' must be a string`);
                return false;
            }
            return true;

        case 'number':
            if (typeof value !== 'number' || isNaN(value)) {
                errors.push(`Field '${fieldName}' must be a number`);
                return false;
            }
            return true;

        case 'boolean':
            if (typeof value !== 'boolean') {
                errors.push(`Field '${fieldName}' must be a boolean`);
                return false;
            }
            return true;

        case 'array':
            if (!Array.isArray(value)) {
                errors.push(`Field '${fieldName}' must be an array`);
                return false;
            }

            // Validate array items if arrayOf is specified
            if (field.arrayOf) {
                for (let i = 0; i < value.length; i++) {
                    const item = value[i];

                    if (typeof field.arrayOf === 'string') {
                        // Simple type check
                        if (typeof item !== field.arrayOf && field.arrayOf !== 'custom') {
                            errors.push(`Item at index ${i} in '${fieldName}' must be a ${field.arrayOf}`);
                        }
                    } else {
                        // Object schema check
                        const itemResult = validateSchema(item, field.arrayOf);
                        if (!itemResult.valid) {
                            errors.push(...itemResult.errors.map(err => `In '${fieldName}[${i}]': ${err}`));
                        }
                    }
                }
            }
            return true;

        case 'object':
            if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                errors.push(`Field '${fieldName}' must be an object`);
                return false;
            }

            // Validate nested object if properties are specified
            if (field.properties) {
                const nestedResult = validateSchema(value, field.properties);
                if (!nestedResult.valid) {
                    errors.push(...nestedResult.errors.map(err => `In '${fieldName}': ${err}`));
                }
            }
            return true;

        case 'custom':
            // Use custom validator if provided
            if (field.validator && !field.validator(value)) {
                errors.push(`Field '${fieldName}' failed custom validation`);
                return false;
            }
            return true;

        default:
            return true;
    }
}

/**
 * Creates a schema validator function for a specific schema
 */
export function createValidator<T extends Record<string, unknown>>(schema: Schema): (data: unknown) => ValidationResult & { value: T } {
    return (data: unknown) => validateSchema(data, schema) as ValidationResult & { value: T };
}
