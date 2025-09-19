/**
 * Schema Definitions
 *
 * This file contains schema definitions for common types used in the application.
 * These can be used with the schema validation utility for runtime validation.
 */
import { SchemaFieldType } from './schemaValidation';
export declare const answerSchema: {
    texte: {
        defaultMode: SchemaFieldType;
        required: boolean;
    };
    correct: {
        defaultMode: SchemaFieldType;
        required: boolean;
    };
};
export declare const validateAnswer: (data: unknown) => import("./schemaValidation").ValidationResult & {
    value: Record<string, unknown>;
};
