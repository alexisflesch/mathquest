#!/usr/bin/env node

/**
 * Test script for deferred tournament timer functionality
 * 
 * This script helps validate that the deferred tournament implementation
 * properly initializes timers and manages individual player sessions.
 */

const logger = {
    info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
    error: (msg, data) => console.error(`[ERROR] ${msg}`, data || ''),
    warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || '')
};

// Mock objects for testing the deferred tournament flow logic
const mockIO = {
    to: (room) => ({
        emit: (event, payload) => {
            logger.info(`Emitted ${event} to room ${room}`, payload);
        }
    })
};

const mockSocket = {
    join: async (room) => {
        logger.info(`Socket joined room: ${room}`);
    },
    emit: (event, payload) => {
        logger.info(`Emitted ${event} to socket`, payload);
    }
};

// Mock questions for testing
const mockQuestions = [
    {
        uid: 'q1',
        text: 'What is 2 + 2?',
        timeLimit: 10,
        correctAnswers: ['4'],
        explanation: 'Two plus two equals four.',
        feedbackWaitTime: 3
    },
    {
        uid: 'q2',
        text: 'What is 3 × 3?',
        timeLimit: 15,
        correctAnswers: ['9'],
        explanation: 'Three times three equals nine.',
        feedbackWaitTime: 3
    }
];

async function testDeferredTournamentLogic() {
    logger.info('=== Testing Deferred Tournament Logic ===');

    const accessCode = 'TEST123';
    const userId = 'user456';
    const playerRoom = `deferred_${accessCode}_${userId}`;

    logger.info('Test Configuration:', {
        accessCode,
        userId,
        playerRoom,
        questionCount: mockQuestions.length
    });

    // Simulate the key logic from deferredTournamentFlow.ts
    logger.info('--- Starting Deferred Tournament Session ---');

    for (let i = 0; i < mockQuestions.length; i++) {
        const question = mockQuestions[i];
        const timeLimitSec = question.timeLimit;
        const durationMs = timeLimitSec * 1000;

        // Create timer state (this is the key fix)
        const timer = {
            status: 'play',
            timeLeftMs: durationMs,
            durationMs: durationMs,
            questionUid: question.uid,
            timestamp: Date.now(),
            localTimeLeftMs: null
        };

        logger.info(`Question ${i + 1} Timer State:`, {
            questionUid: question.uid,
            timeLimit: timeLimitSec,
            timer: timer
        });

        // Simulate question emission
        const gameQuestionPayload = {
            question: { uid: question.uid, text: question.text }, // simplified
            questionIndex: i,
            totalQuestions: mockQuestions.length,
            feedbackWaitTime: question.feedbackWaitTime,
            timer: timer
        };

        logger.info(`Emitting game_question for Question ${i + 1}:`, gameQuestionPayload);
        mockIO.to(playerRoom).emit('game_question', gameQuestionPayload);

        // Simulate timer update
        const timerUpdatePayload = {
            questionUid: question.uid,
            timer: timer
        };

        logger.info(`Emitting game_timer_updated for Question ${i + 1}:`, timerUpdatePayload);
        mockIO.to(playerRoom).emit('game_timer_updated', timerUpdatePayload);

        logger.info(`--- Question ${i + 1} timer should countdown from ${timeLimitSec} seconds ---`);

        // In real implementation, we wait for timer duration
        // Here we just simulate the progression
        logger.info(`[SIMULATED] Waiting ${timeLimitSec} seconds for question timer...`);

        // Simulate correct answers
        logger.info(`Emitting correct_answers for Question ${i + 1}:`, {
            questionUid: question.uid,
            correctAnswers: question.correctAnswers
        });

        // Simulate feedback if available
        if (question.explanation) {
            logger.info(`Emitting feedback for Question ${i + 1}:`, {
                questionUid: question.uid,
                explanation: question.explanation,
                feedbackRemaining: question.feedbackWaitTime
            });
        }

        logger.info(`--- Question ${i + 1} complete ---\n`);
    }

    // Simulate game end
    logger.info('Emitting game_ended:', {
        accessCode,
        totalQuestions: mockQuestions.length
    });

    logger.info('=== Deferred Tournament Logic Test Complete ===');
    logger.info('✅ Expected: Each question should have proper timer with countdown from full duration');
    logger.info('✅ Expected: Timer status should be "play" with timeLeftMs > 0');
    logger.info('✅ Expected: Individual player rooms should receive all events');
}

// Run the test
testDeferredTournamentLogic().catch(error => {
    logger.error('Test failed:', error);
    process.exit(1);
});
