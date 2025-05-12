/**
 * setTimerHandler.js - JavaScript bridge to TypeScript module
 * 
 * This file serves as a bridge between JavaScript and TypeScript modules
 * to ensure compatibility when TypeScript transpilation is not available.
 */

// Import the TypeScript module with fallback options
let tsModule;
try {
    // Try direct import with delayed fallback for circular dependencies
    try {
        // Use direct require first - without .ts extension
        tsModule = require('./setTimerHandler');

        // Try both named exports and default exports patterns
        if (typeof tsModule === 'function') {
            // Function export pattern works, keep as is
        } else if (tsModule.default && typeof tsModule.default === 'function') {
            // Default export pattern works
            tsModule = tsModule.default;
        } else {
            // Neither pattern worked initially
            console.warn('Could not find handler function directly, trying delayed import');
            // Give time for circular dependency resolution
            setTimeout(() => {
                try {
                    const reloadedModule = require('./setTimerHandler');
                    if (typeof reloadedModule === 'function') {
                        module.exports = reloadedModule;
                    } else if (reloadedModule.default && typeof reloadedModule.default === 'function') {
                        module.exports = reloadedModule.default;
                    }
                } catch (e) {
                    console.error('Delayed import also failed:', e);
                }
            }, 100);
        }
    } catch (error) {
        console.error('Failed to load TypeScript handler directly, falling back to legacy:', error);

        // If the TypeScript version fails to load, we'll create a dummy implementation
        // that logs the error and does nothing else
        tsModule = function (io, socket, prisma, payload) {
            console.error('Using fallback setTimerHandler - TypeScript module could not be loaded');
            socket.emit('quiz_action_response', {
                status: 'error',
                message: 'Internal server error: Timer handler not available'
            });
        };
    }
} catch (error) {
    console.error('Error setting up setTimerHandler:', error);

    // Final fallback
    tsModule = function (io, socket, prisma, payload) {
        console.error('Using emergency fallback setTimerHandler');
        socket.emit('quiz_action_response', {
            status: 'error',
            message: 'Internal server error: Timer handler not available'
        });
    };
}

// Export the handler function
module.exports = tsModule;
