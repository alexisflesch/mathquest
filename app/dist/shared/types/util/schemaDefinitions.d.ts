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
export declare const baseQuestionSchema: {
    uid: {
        defaultMode: SchemaFieldType;
        required: boolean;
    };
    text: {
        defaultMode: SchemaFieldType;
        required: boolean;
    };
    defaultMode: {
        defaultMode: SchemaFieldType;
        required: boolean;
    };
    responses: {
        defaultMode: SchemaFieldType;
        required: boolean;
        arrayOf: {
            texte: {
                defaultMode: SchemaFieldType;
                required: boolean;
            };
            correct: {
                defaultMode: SchemaFieldType;
                required: boolean;
            };
        };
    };
    time: {
        defaultMode: SchemaFieldType;
        required: boolean;
    };
    explanation: {
        defaultMode: SchemaFieldType;
        required: boolean;
    };
};
export declare const questionSchema: {
    correct: {
        defaultMode: SchemaFieldType;
        validator: (value: unknown) => boolean;
        required: boolean;
    };
    themes: {
        defaultMode: SchemaFieldType;
        required: boolean;
        arrayOf: SchemaFieldType;
    };
    difficulty: {
        defaultMode: SchemaFieldType;
        required: boolean;
    };
    gradeLevel: {
        defaultMode: SchemaFieldType;
        required: boolean;
    };
    discipline: {
        defaultMode: SchemaFieldType;
        required: boolean;
    };
    question: {
        defaultMode: SchemaFieldType;
        required: boolean;
    };
    answers: {
        defaultMode: SchemaFieldType;
        required: boolean;
        arrayOf: {
            texte: {
                defaultMode: SchemaFieldType;
                required: boolean;
            };
            correct: {
                defaultMode: SchemaFieldType;
                required: boolean;
            };
        };
    };
    hidden: {
        defaultMode: SchemaFieldType;
        required: boolean;
    };
    title: {
        defaultMode: SchemaFieldType;
        required: boolean;
    };
    uid: {
        defaultMode: SchemaFieldType;
        required: boolean;
    };
    text: {
        defaultMode: SchemaFieldType;
        required: boolean;
    };
    defaultMode: {
        defaultMode: SchemaFieldType;
        required: boolean;
    };
    responses: {
        defaultMode: SchemaFieldType;
        required: boolean;
        arrayOf: {
            texte: {
                defaultMode: SchemaFieldType;
                required: boolean;
            };
            correct: {
                defaultMode: SchemaFieldType;
                required: boolean;
            };
        };
    };
    time: {
        defaultMode: SchemaFieldType;
        required: boolean;
    };
    explanation: {
        defaultMode: SchemaFieldType;
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
