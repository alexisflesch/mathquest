"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
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
const index_1 = require("../index");
// Example of a frontend component using shared types
// Note: This is a type example and not meant to be executed directly
// In a real application, you would import React and ensure proper JSX configuration
function ExampleQuestionComponent(props) {
    const { question } = props;
    // Using the type guard to validate the question
    if (!(0, index_1.isQuestion)(question)) {
        return (0, jsx_runtime_1.jsx)("div", { children: "Invalid question data" });
    }
    // Using the helper function to get the question text
    const questionText = (0, index_1.getQuestionText)(question);
    // Get answer options safely using nullish coalescing
    const answerOptions = question.answerOptions || []; // Ensure `answerOptions` is typed as a string array
    return ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { children: questionText }), (0, jsx_runtime_1.jsx)("ul", { children: answerOptions.map((option, index) => ((0, jsx_runtime_1.jsx)("li", { children: option }, index))) })] }));
}
// Example of a backend handler using shared types
function exampleSocketHandler(io, socket, payload) {
    // Using type guard to validate payload
    if (!payload || typeof payload !== 'object' || !payload.accessCode) {
        socket.emit('error', { message: 'Invalid payload' });
        return;
    }
    // Using event constants for consistency
    socket.emit(index_1.TEACHER_EVENTS.GAME_CONTROL_STATE, {
    // State update data
    });
}
