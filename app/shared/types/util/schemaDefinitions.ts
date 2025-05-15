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
    text: { // Renamed from texte
        type: 'string' as SchemaFieldType,
        required: true
    },
    type: {
        type: 'string' as SchemaFieldType,
        required: true
    },
    responses: { // Renamed from reponses
        type: 'array' as SchemaFieldType,
        required: false,
        arrayOf: answerSchema
    },
    time: { // Renamed from temps
        type: 'number' as SchemaFieldType,
        required: false
    },
    explanation: { // Renamed from explication
        type: 'string' as SchemaFieldType,
        required: false
    }
};

// Custom validators for complex fields
const isCorrectField = (value: unknown): boolean => {
    return typeof value === 'boolean' ||
        (Array.isArray(value) && value.every(item => typeof item === 'number'));
};

const isLevelField = (value: unknown): boolean => { // Renamed from isNiveauField
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
    themes: { // Changed from singular theme
        type: 'array' as SchemaFieldType,
        required: false,
        arrayOf: 'string' as SchemaFieldType // Corrected: cast to SchemaFieldType
    },
    difficulty: { // Renamed from difficulte
        type: 'number' as SchemaFieldType,
        required: false
    },
    /* // Old level field using custom validator
    level: { // Renamed from niveau
        type: 'custom' as SchemaFieldType,
        validator: isLevelField, // Renamed from isNiveauField
        required: false
    },
    */
    gradeLevel: { // New gradeLevel field
        type: 'string' as SchemaFieldType,
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
    title: { // Standardized to 'title', removing 'titre'
        type: 'string' as SchemaFieldType,
        required: false
    }
    // Removed 'titre' field as it's covered by 'title'
};

// Create validators for common types
export const validateAnswer = createValidator(answerSchema);
export const validateBaseQuestion = createValidator(baseQuestionSchema);
export const validateQuestion = createValidator(questionSchema);
