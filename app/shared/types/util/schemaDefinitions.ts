/**
 * Schema Definitions
 * 
 * This file contains schema definitions for common types used in the application.
 * These can be used with the schema validation utility for runtime validation.
 */

import { createValidator, SchemaFieldType } from './schemaValidation';

// Answer schema
export const answerSchema = {
    texte: {
        defaultMode: 'string' as SchemaFieldType,
        required: true
    },
    correct: {
        defaultMode: 'boolean' as SchemaFieldType,
        required: true
    }
};

// Create validators for common types
export const validateAnswer = createValidator(answerSchema);
