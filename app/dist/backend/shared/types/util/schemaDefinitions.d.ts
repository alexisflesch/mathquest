/**
 * Schema Definitions
 *
 * This file contains schema definitions for common types used in the application.
 * These can be used with the schema validation utility for runtime validation.
 */
import { SchemaFieldType } from './schemaValidation';
export declare const answerSchema: {
    texte: {
        type: SchemaFieldType;
        required: boolean;
    };
    correct: {
        type: SchemaFieldType;
        required: boolean;
    };
};
export declare const baseQuestionSchema: {
    uid: {
        type: SchemaFieldType;
        required: boolean;
    };
    text: {
        type: SchemaFieldType;
        required: boolean;
    };
    type: {
        type: SchemaFieldType;
        required: boolean;
    };
    responses: {
        type: SchemaFieldType;
        required: boolean;
        arrayOf: {
            texte: {
                type: SchemaFieldType;
                required: boolean;
            };
            correct: {
                type: SchemaFieldType;
                required: boolean;
            };
        };
    };
    time: {
        type: SchemaFieldType;
        required: boolean;
    };
    explanation: {
        type: SchemaFieldType;
        required: boolean;
    };
};
export declare const questionSchema: {
    correct: {
        type: SchemaFieldType;
        validator: (value: unknown) => boolean;
        required: boolean;
    };
    theme: {
        type: SchemaFieldType;
        required: boolean;
    };
    difficulty: {
        type: SchemaFieldType;
        required: boolean;
    };
    level: {
        type: SchemaFieldType;
        validator: (value: unknown) => boolean;
        required: boolean;
    };
    discipline: {
        type: SchemaFieldType;
        required: boolean;
    };
    question: {
        type: SchemaFieldType;
        required: boolean;
    };
    answers: {
        type: SchemaFieldType;
        required: boolean;
        arrayOf: {
            texte: {
                type: SchemaFieldType;
                required: boolean;
            };
            correct: {
                type: SchemaFieldType;
                required: boolean;
            };
        };
    };
    hidden: {
        type: SchemaFieldType;
        required: boolean;
    };
    title: {
        type: SchemaFieldType;
        required: boolean;
    };
    uid: {
        type: SchemaFieldType;
        required: boolean;
    };
    text: {
        type: SchemaFieldType;
        required: boolean;
    };
    type: {
        type: SchemaFieldType;
        required: boolean;
    };
    responses: {
        type: SchemaFieldType;
        required: boolean;
        arrayOf: {
            texte: {
                type: SchemaFieldType;
                required: boolean;
            };
            correct: {
                type: SchemaFieldType;
                required: boolean;
            };
        };
    };
    time: {
        type: SchemaFieldType;
        required: boolean;
    };
    explanation: {
        type: SchemaFieldType;
        required: boolean;
    };
};
export declare const validateAnswer: (data: unknown) => import("./schemaValidation").ValidationResult & {
    value: Record<string, unknown>;
};
export declare const validateBaseQuestion: (data: unknown) => import("./schemaValidation").ValidationResult & {
    value: Record<string, unknown>;
};
export declare const validateQuestion: (data: unknown) => import("./schemaValidation").ValidationResult & {
    value: Record<string, unknown>;
};
