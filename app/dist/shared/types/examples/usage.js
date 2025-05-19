/**
 * Shared Types Usage Examples
 *
 * This file contains examples of how to use the shared types.
 * It is not meant to be imported, but rather to serve as a reference.
 */
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
import { QUIZ_EVENTS, isQuestion, getQuestionText } from '../index';
import React from 'react'; // Explicitly import React for JSX support
// Example of a frontend component using shared types
// Note: This is a type example and not meant to be executed directly
// In a real application, you would import React and ensure proper JSX configuration
function ExampleQuestionComponent(props) {
    const { question } = props;
    // Using the type guard to validate the question
    if (!isQuestion(question)) {
        return React.createElement("div", null, "Invalid question data");
    }
    // Using the helper function to get the question text
    const questionText = getQuestionText(question);
    // Get answer options safely using nullish coalescing
    const answerOptions = question.answerOptions || []; // Ensure `answerOptions` is typed as a string array
    return (React.createElement("div", null,
        React.createElement("h2", null, questionText),
        React.createElement("ul", null, answerOptions.map((option, index) => (React.createElement("li", { key: index }, option))))));
}
// Example of a backend handler using shared types
function exampleSocketHandler(io, socket, payload) {
    // Using type guard to validate payload
    if (!payload || typeof payload !== 'object' || !payload.quizId) {
        socket.emit('error', { message: 'Invalid payload' });
        return;
    }
    // Using event constants for consistency
    socket.emit(QUIZ_EVENTS.STATE_UPDATE, {
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
