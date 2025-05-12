// filepath: /home/aflesch/mathquest/app/sockets/tournamentUtils/tournamentHelpers.js
// This file is a bridge for the compiled TypeScript module.

// Import the compiled TypeScript module
const compiledModule = require('../../dist/sockets/tournamentUtils/tournamentHelpers');

// Re-export the necessary functions
module.exports = {
    getEmitTarget: compiledModule.getEmitTarget,
    handleTimerExpiration: compiledModule.handleTimerExpiration,
    sendQuestionWithState: compiledModule.sendQuestionWithState,
};
