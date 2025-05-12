// filepath: /home/aflesch/mathquest/app/sockets/quizTriggers.js
/**
 * quizTriggers.js - ES Module bridge to TypeScript module
 *
 * This file re-exports functionalities from the TypeScript quizTriggers.ts module
 * for consumption in JavaScript files or by loaders that expect ES module syntax.
 */

// Re-export named exports from the TypeScript module.
// The .ts extension will be handled by ts-node/esm loader or a similar mechanism.
export {
    sendQuestionToTournament,
    triggerQuizTimerAction,
    triggerQuizSetTimer
} from './quizTriggers.ts';

// If there's a default export in quizTriggers.ts, re-export it as well.
// export { default } from './quizTriggers.ts';
