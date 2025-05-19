"use strict";
/**
 * Shared Types Backend Usage Examples
 *
 * This file contains examples of how to use the shared types in backend code.
 * It is not meant to be imported, but rather to serve as a reference.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * NOTE: In real application code outside the shared/types package, you would import like this:
 *
 * import {
 *   Question,
 *   Answer,
 *   QUIZ_EVENTS,
 *   TOURNAMENT_EVENTS,
 *   isQuestion,
 *   mapToStandardQuestion,
 *   validateQuestion,
 *   QuestionLike
 * } from '@shared/types';
 */
// For this example file (within the types package), we use relative imports:
const index_1 = require("../index");
// Example of a socket event handler using shared types
function exampleSocketHandler(io, socket, payload) {
    // Validate the incoming payload using schema validation
    const result = (0, index_1.validateQuestion)(payload);
    if (!result.valid) {
        socket.emit('error', {
            message: 'Invalid question data',
            errors: result.errors
        });
        return;
    }
    // Or use the type guard function
    if (!(0, index_1.isQuestion)(payload)) {
        socket.emit('error', { message: 'Invalid question data' });
        return;
    }
    // Map to standard question format to handle inconsistencies
    const question = (0, index_1.mapToStandardQuestion)(payload);
    // Use event constants for consistency
    io.to(`quiz:${question.uid}`).emit(index_1.QUIZ_EVENTS.STATE_UPDATE, {
        question,
        status: 'updated'
    });
}
/**
 * NOTE: In real application code, you would import type error helpers like this:
 * import { assertDefined, assertType } from '@shared/types';
 */
// For this example file (within the types package), we use relative imports:
const typeErrors_1 = require("../util/typeErrors");
function processQuestion(questionId, data) {
    try {
        // Assert that questionId is defined and of the right type
        (0, typeErrors_1.assertDefined)(questionId, 'questionId');
        (0, typeErrors_1.assertType)(questionId, 'string', 'questionId');
        // Use the mapToStandardQuestion utility to ensure consistent structure
        const question = (0, index_1.mapToStandardQuestion)(data);
        return {
            success: true,
            question
        };
    }
    catch (error) {
        console.error('Error processing question:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
/**
 * These examples demonstrate how to:
 * 1. Import shared types in backend code
 * 2. Validate incoming data using schema validation
 * 3. Use type guards for runtime checks
 * 4. Map data to standard formats
 * 5. Use event constants for socket communications
 * 6. Handle type errors consistently
 */
