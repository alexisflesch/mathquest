/**
 * disconnectingHandler.js - JavaScript bridge to TypeScript handler
 * 
 * This file serves as a bridge between JavaScript and TypeScript modules
 * to ensure compatibility when TypeScript transpilation is not available.
 */

// Simply use the legacy handler unconditionally for now
const legacyHandler = require('./disconnectingHandler.legacy.js');
module.exports = legacyHandler;
