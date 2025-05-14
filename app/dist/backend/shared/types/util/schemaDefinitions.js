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
        type: 'string',
        required: true
    },
    correct: {
        type: 'boolean',
        required: true
    }
};
// BaseQuestion schema
exports.baseQuestionSchema = {
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
        arrayOf: exports.answerSchema
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
exports.questionSchema = Object.assign(Object.assign({}, exports.baseQuestionSchema), { correct: {
        type: 'custom',
        validator: isCorrectField,
        required: false
    }, theme: {
        type: 'string',
        required: false
    }, difficulty: {
        type: 'number',
        required: false
    }, level: {
        type: 'custom',
        validator: isLevelField, // Renamed from isNiveauField
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
        arrayOf: exports.answerSchema
    }, hidden: {
        type: 'boolean',
        required: false
    }, title: {
        type: 'string',
        required: false
    } });
// Create validators for common types
exports.validateAnswer = (0, schemaValidation_1.createValidator)(exports.answerSchema);
exports.validateBaseQuestion = (0, schemaValidation_1.createValidator)(exports.baseQuestionSchema);
exports.validateQuestion = (0, schemaValidation_1.createValidator)(exports.questionSchema);
