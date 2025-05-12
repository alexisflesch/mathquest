// bridge file for timerActionHandler
/**
 * sockets/quizEventHandlers/timerActionHandler.js - JavaScript bridge to legacy handler
 * 
 * This file serves as a bridge between JavaScript and TypeScript modules
 * to ensure compatibility when TypeScript transpilation is not available.
 */

// Simply use the legacy handler unconditionally for now
const legacyHandler = require('./timerActionHandler.legacy.js');
module.exports = legacyHandler;
