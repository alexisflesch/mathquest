"use strict";
/**
 * Schema Definitions
 *
 * This file contains schema definitions for common types used in the application.
 * These can be used with the schema validation utility for runtime validation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuestion = exports.validateBaseQuestion = exports.validateAnswer = exports.questionSchema = exports.baseQuestionSchema = exports.answerSchema = void 0;
const schemaValidation_1 = require("./schemaValidation");
// Answer schema
exports.answerSchema = {
    texte: {
        defaultMode: 'string',
        required: true
    },
    correct: {
        defaultMode: 'boolean',
        required: true
    }
};
// BaseQuestion schema
exports.baseQuestionSchema = {
    uid: {
        defaultMode: 'string',
        required: true
    },
    text: {
        defaultMode: 'string',
        required: true
    },
    defaultMode: {
        defaultMode: 'string',
        required: true
    },
    responses: {
        defaultMode: 'array',
        required: false,
        arrayOf: exports.answerSchema
    },
    time: {
        defaultMode: 'number',
        required: false
    },
    explanation: {
        defaultMode: 'string',
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
exports.questionSchema = {
    ...exports.baseQuestionSchema,
    correct: {
        defaultMode: 'custom',
        validator: isCorrectField,
        required: false
    },
    themes: {
        defaultMode: 'array',
        required: false,
        arrayOf: 'string' // Corrected: cast to SchemaFieldType
    },
    difficulty: {
        defaultMode: 'number',
        required: false
    },
    /* // Old level field using custom validator
    level: { // Renamed from niveau
        defaultMode: 'custom' as SchemaFieldType,
        validator: isLevelField, // Renamed from isNiveauField
        required: false
    },
    */
    gradeLevel: {
        defaultMode: 'string',
        required: false
    },
    discipline: {
        defaultMode: 'string',
        required: false
    },
    question: {
        defaultMode: 'string',
        required: false
    },
    answers: {
        defaultMode: 'array',
        required: false,
        arrayOf: exports.answerSchema
    },
    hidden: {
        defaultMode: 'boolean',
        required: false
    },
    title: {
        defaultMode: 'string',
        required: false
    }
    // Removed 'titre' field as it's covered by 'title'
};
// Create validators for common types
exports.validateAnswer = (0, schemaValidation_1.createValidator)(exports.answerSchema);
exports.validateBaseQuestion = (0, schemaValidation_1.createValidator)(exports.baseQuestionSchema);
exports.validateQuestion = (0, schemaValidation_1.createValidator)(exports.questionSchema);
