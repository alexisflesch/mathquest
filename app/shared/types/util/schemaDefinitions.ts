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
        type: 'string' as SchemaFieldType,
        required: true
    },
    correct: {
        type: 'boolean' as SchemaFieldType,
        required: true
    }
};

// BaseQuestion schema
export const baseQuestionSchema = {
    uid: {
        type: 'string' as SchemaFieldType,
        required: true
    },
    texte: {
        type: 'string' as SchemaFieldType,
        required: true
    },
    type: {
        type: 'string' as SchemaFieldType,
        required: true
    },
    reponses: {
        type: 'array' as SchemaFieldType,
        required: false,
        arrayOf: answerSchema
    },
    temps: {
        type: 'number' as SchemaFieldType,
        required: false
    },
    explication: {
        type: 'string' as SchemaFieldType,
        required: false
    }
};

// Custom validators for complex fields
const isCorrectField = (value: unknown): boolean => {
    return typeof value === 'boolean' || 
           (Array.isArray(value) && value.every(item => typeof item === 'number'));
};

const isNiveauField = (value: unknown): boolean => {
    return typeof value === 'string' || 
           (Array.isArray(value) && value.every(item => typeof item === 'string'));
};

// Question schema (extends BaseQuestion)
export const questionSchema = {
    ...baseQuestionSchema,
    correct: {
        type: 'custom' as SchemaFieldType,
        validator: isCorrectField,
        required: false
    },
    theme: {
        type: 'string' as SchemaFieldType,
        required: false
    },
    difficulte: {
        type: 'number' as SchemaFieldType,
        required: false
    },
    niveau: {
        type: 'custom' as SchemaFieldType,
        validator: isNiveauField,
        required: false
    },
    discipline: {
        type: 'string' as SchemaFieldType,
        required: false
    },
    question: {
        type: 'string' as SchemaFieldType,
        required: false
    },
    answers: {
        type: 'array' as SchemaFieldType,
        required: false,
        arrayOf: answerSchema
    },
    hidden: {
        type: 'boolean' as SchemaFieldType,
        required: false
    },
    title: {
        type: 'string' as SchemaFieldType,
        required: false
    },
    titre: {
        type: 'string' as SchemaFieldType,
        required: false
    }
};

// Create validators for common types
export const validateAnswer = createValidator(answerSchema);
export const validateBaseQuestion = createValidator(baseQuestionSchema);
export const validateQuestion = createValidator(questionSchema);
