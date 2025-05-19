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
import {
    Question,
    Answer,
    BaseQuizState,
    QUIZ_EVENTS,
    isQuestion,
    getQuestionText
} from '../index';
import React from 'react'; // Explicitly import React for JSX support

// Example of extending a shared type
interface EnhancedQuestion extends Question {
    isSelected?: boolean;
    userAnswer?: string;
}

// Example of a frontend component using shared types
// Note: This is a type example and not meant to be executed directly
// In a real application, you would import React and ensure proper JSX configuration
function ExampleQuestionComponent(props: { question: Question }) {
    const { question } = props;

    // Using the type guard to validate the question
    if (!isQuestion(question)) {
        return <div>Invalid question data</div>;
    }

    // Using the helper function to get the question text
    const questionText = getQuestionText(question);

    // Get answer options safely using nullish coalescing
    const answerOptions: string[] = question.answerOptions || []; // Ensure `answerOptions` is typed as a string array

    return (
        <div>
            <h2>{questionText}</h2>
            <ul>
                {answerOptions.map((option: string, index: number) => (
                    <li key={index}>{option}</li>
                ))}
            </ul>
        </div>
    );
}

/**
 * NOTE: In real application code, you would import socket types like this:
 * 
 * import type { Server, Socket } from 'socket.io';
 * import type { SetQuestionPayload } from '@shared/types';
 */
// For this example file (within the types package), we need relative imports
import type { Server, Socket } from 'socket.io';
import type { SetQuestionPayload } from '../socket/payloads';

// Example of a backend handler using shared types
function exampleSocketHandler(io: Server, socket: Socket, payload: Partial<SetQuestionPayload>) {
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
