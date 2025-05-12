/**
 * resumeHandler.js - JavaScript bridge to TypeScript handler
 * 
 * This file serves as a bridge between JavaScript and TypeScript modules
 * to ensure compatibility when TypeScript transpilation is not available.
 */

try {
    // First try to load the TypeScript file directly (for use with ts-node)
    module.exports = require('./resumeHandler.ts').default;
} catch (e) {
    console.error('Failed to load TypeScript handler directly, falling back to legacy:', e.message);
    // Fallback to legacy version if TypeScript loading fails
    module.exports = require('./resumeHandler.legacy.js');
}