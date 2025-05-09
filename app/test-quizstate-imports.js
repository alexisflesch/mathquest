// Test to verify that multiple imports of quizState point to the same object
// and changes made by one module are visible to another

// First import
const { quizState: quizState1 } = require('./sockets/quizState');

// Simulate a second module importing the same object
const { quizState: quizState2 } = require('./sockets/quizState');

// Create a test quiz state
const testQuizId = 'test-sync-id';
quizState1[testQuizId] = {
    currentQuestionUid: 'q1',
    timerStatus: 'play',
    timerQuestionId: 'q1'
};

console.log('quizState1 reference:', quizState1 === quizState2 ? 'SAME OBJECT' : 'DIFFERENT OBJECTS');
console.log('Initial state in quizState1:', quizState1[testQuizId]);
console.log('Initial state in quizState2:', quizState2[testQuizId]);

// Now update through quizState2
console.log('\nUpdating timerQuestionId through quizState2...');
quizState2[testQuizId].timerQuestionId = 'q2';
quizState2[testQuizId].timerStatus = 'play'; // Timer still playing

// Import our patching function to test synchronization
const { patchQuizStateForBroadcast } = require('./sockets/quizUtils');

// Apply the patch which should sync currentQuestionUid with timerQuestionId
console.log('\nApplying patchQuizStateForBroadcast...');
patchQuizStateForBroadcast(quizState1[testQuizId]);

// Check final state in both references
console.log('\nFinal state in quizState1:', quizState1[testQuizId]);
console.log('Final state in quizState2:', quizState2[testQuizId]);

// Verify currentQuestionUid was updated in both references
console.log('\nSynchronization check:',
    quizState1[testQuizId].currentQuestionUid === quizState2[testQuizId].currentQuestionUid &&
        quizState1[testQuizId].currentQuestionUid === 'q2' ?
        'SUCCESS: currentQuestionUid properly synchronized across all references' :
        'FAILURE: currentQuestionUid not properly synchronized'
);
