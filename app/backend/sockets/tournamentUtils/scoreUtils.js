// filepath: /home/aflesch/mathquest/app/sockets/tournamentUtils/scoreUtils.js
/**
 * scoreUtils.js - ES Module bridge to TypeScript module
 *
 * This file re-exports functionalities from the TypeScript scoreUtils.ts module
 * for consumption in JavaScript files or by loaders that expect ES module syntax.
 */

// Re-export named exports from the TypeScript module.
// The .ts extension will be handled by ts-node/esm loader or a similar mechanism.
export {
    calculateScore,
    saveParticipantScore,
    scaleScoresForQuiz
} from './scoreUtils.ts';

// Re-export the default export from the TypeScript module.
export { default } from './scoreUtils.ts';
