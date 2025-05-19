/**
 * Schema Definitions
 *
 * This file contains schema definitions for common types used in the application.
 * These can be used with the schema validation utility for runtime validation.
 */
import { createValidator } from './schemaValidation';
// Answer schema
export const answerSchema = {
    texte: {
        type: 'string',
        required: true
    },
    correct: {
        type: 'boolean',
        required: true
    }
};
// BaseQuestion schema
export const baseQuestionSchema = {
    uid: {
        type: 'string',
        required: true
    },
    text: {
        type: 'string',
        required: true
    },
    type: {
        type: 'string',
        required: true
    },
    responses: {
        type: 'array',
        required: false,
        arrayOf: answerSchema
    },
    time: {
        type: 'number',
        required: false
    },
    explanation: {
        type: 'string',
        required: false
    }
};
// Custom validators for complex fields
const isCorrectField = (value) => {
    return typeof value === 'boolean' ||
        (Array.isArray(value) && value.every(item => typeof item === 'number'));
};
const isLevelField = (value) => {
    return typeof value === 'string' ||
        (Array.isArray(value) && value.every(item => typeof item === 'string'));
};
// Question schema (extends BaseQuestion)
export const questionSchema = Object.assign(Object.assign({}, baseQuestionSchema), { correct: {
        type: 'custom',
        validator: isCorrectField,
        required: false
    }, themes: {
        type: 'array',
        required: false,
        arrayOf: 'string' // Corrected: cast to SchemaFieldType
    }, difficulty: {
        type: 'number',
        required: false
    }, 
    /* // Old level field using custom validator
    level: { // Renamed from niveau
        type: 'custom' as SchemaFieldType,
        validator: isLevelField, // Renamed from isNiveauField
        required: false
    },
    */
    gradeLevel: {
        type: 'string',
        required: false
    }, discipline: {
        type: 'string',
        required: false
    }, question: {
        type: 'string',
        required: false
    }, answers: {
        type: 'array',
        required: false,
        arrayOf: answerSchema
    }, hidden: {
        type: 'boolean',
        required: false
    }, title: {
        type: 'string',
        required: false
    } });
// Create validators for common types
export const validateAnswer = createValidator(answerSchema);
export const validateBaseQuestion = createValidator(baseQuestionSchema);
export const validateQuestion = createValidator(questionSchema);
