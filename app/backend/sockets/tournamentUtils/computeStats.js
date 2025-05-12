// filepath: /home/aflesch/mathquest/app/sockets/tournamentUtils/computeStats.js
/**
 * computeStats.js - JavaScript bridge to TypeScript module
 * 
 * This file serves as a bridge between JavaScript and TypeScript modules
 * to ensure compatibility when TypeScript transpilation is not available.
 */

// Import the TypeScript module with fallback options
let tsModule;
try {
    // Try direct import
    tsModule = require('./computeStats');

    // Check if the module is using default export or named exports
    if (tsModule.default && typeof tsModule.default.computeAnswerStats === 'function') {
        // Use the default export
        tsModule = tsModule.default;
    } else if (typeof tsModule.computeAnswerStats !== 'function') {
        // Neither format worked, throw an error
        throw new Error('Could not find computeAnswerStats function in module');
    }
} catch (error) {
    console.error('Error importing computeStats.ts module:', error);

    // Provide fallback implementation
    tsModule = {
        computeAnswerStats: function (tState, questionUid) {
            console.warn('Using fallback computeAnswerStats function');
            return { stats: [], totalAnswers: 0 };
        }
    };
}

// Export the module functions
module.exports = tsModule;
