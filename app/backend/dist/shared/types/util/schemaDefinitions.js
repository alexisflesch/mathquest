"use strict";
/**
 * Schema Definitions
 *
 * This file contains schema definitions for common types used in the application.
 * These can be used with the schema validation utility for runtime validation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAnswer = exports.answerSchema = void 0;
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
// Create validators for common types
exports.validateAnswer = (0, schemaValidation_1.createValidator)(exports.answerSchema);
