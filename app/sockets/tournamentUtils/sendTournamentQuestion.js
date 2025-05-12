/**
 * sendTournamentQuestion.js - JavaScript bridge to TypeScript module
 *
 * This file serves as a bridge between JavaScript and TypeScript modules
 * to ensure compatibility when TypeScript transpilation is not available.
 * 
 * Usage (legacy format):
 *   const { sendTournamentQuestion } = require('./tournamentUtils/sendTournamentQuestion');
 *   sendTournamentQuestion(socketOrIo, target, questionObj, index, total, remainingTime, questionState, isQuizMode);
 */

const createLogger = require('@logger'); // Use path alias
const logger = createLogger('SendTQBridge');

let tsModuleExports = {}; // Default to empty object

try {
    const loadedModule = require('./sendTournamentQuestion'); // Expects compiled .js from sendTournamentQuestion.ts

    if (loadedModule && typeof loadedModule.sendTournamentQuestion === 'function') {
        tsModuleExports = loadedModule;
        logger.info('[Bridge] Successfully loaded TypeScript module for sendTournamentQuestion.');
    } else {
        const moduleType = typeof loadedModule;
        const keys = loadedModule ? Object.keys(loadedModule).join(', ') : 'undefined/null';
        logger.error(`[Bridge] Failed to load sendTournamentQuestion.ts correctly. Expected 'sendTournamentQuestion' function. Found type '${moduleType}' with keys: [${keys}]. Using stub implementations.`);
        tsModuleExports = {
            sendTournamentQuestion: (...args) => logger.error('[Bridge-Stub] sendTournamentQuestion called on empty/failed module.', { args }),
            legacySendTournamentQuestion: (...args) => logger.error('[Bridge-Stub] legacySendTournamentQuestion called on empty/failed module.', { args }),
            createFilteredQuestionData: (...args) => {
                logger.error('[Bridge-Stub] createFilteredQuestionData called on empty/failed module.', { args });
                return {}; // Return a default/empty object
            }
        };
    }
} catch (error) {
    logger.error('[Bridge] Error loading TypeScript module for sendTournamentQuestion. Using stub implementations:', error);
    tsModuleExports = { // Fallback stubs in case of error
        sendTournamentQuestion: (...args) => logger.error('[Bridge-Stub] sendTournamentQuestion called on error-fallback module.', { args }),
        legacySendTournamentQuestion: (...args) => logger.error('[Bridge-Stub] legacySendTournamentQuestion called on error-fallback module.', { args }),
        createFilteredQuestionData: (...args) => {
            logger.error('[Bridge-Stub] createFilteredQuestionData called on error-fallback module.', { args });
            return {};
        }
    };
}

module.exports = tsModuleExports;
