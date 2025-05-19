"use strict";
/**
 * Shared Types Usage Examples
 *
 * This file contains examples of how to use the shared types.
 * It is not meant to be imported, but rather to serve as a reference.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * NOTE: In real application code outside the shared/types package, you would import like this:
 *
 * import {
 *   Question,
 *   Answer,
 *   BaseQuizState,
 *   QUIZ_EVENTS,
 *   isQuestion,
 *   getQuestionText
 * } from '@shared/types';
 */
// For this example file (within the types package), we need a relative import
const index_1 = require("../index");
const react_1 = __importDefault(require("react")); // Explicitly import React for JSX support
// Example of a frontend component using shared types
// Note: This is a type example and not meant to be executed directly
// In a real application, you would import React and ensure proper JSX configuration
function ExampleQuestionComponent(props) {
    const { question } = props;
    // Using the type guard to validate the question
    if (!(0, index_1.isQuestion)(question)) {
        return <div>Invalid question data</div>;
    }
    // Using the helper function to get the question text
    const questionText = (0, index_1.getQuestionText)(question);
    // Get answer options safely using nullish coalescing
    const answerOptions = question.answerOptions || []; // Ensure `answerOptions` is typed as a string array
    return (<div>
            <h2>{questionText}</h2>
            <ul>
                {answerOptions.map((option, index) => (<li key={index}>{option}</li>))}
            </ul>
        </div>);
}
// Example of a backend handler using shared types
function exampleSocketHandler(io, socket, payload) {
    // Using type guard to validate payload
    if (!payload || typeof payload !== 'object' || !payload.quizId) {
        socket.emit('error', { message: 'Invalid payload' });
        return;
    }
    // Using event constants for consistency
    socket.emit(index_1.QUIZ_EVENTS.STATE_UPDATE, {
    // State update data
    });
}
/**
 * These examples demonstrate how to:
 * 1. Import shared types
 * 2. Extend shared types for specific needs
 * 3. Use type guards to validate data
 * 4. Use helper functions to work with data safely
 * 5. Use event constants for socket communications
 */
