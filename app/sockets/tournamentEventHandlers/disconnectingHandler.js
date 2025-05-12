// filepath: /home/aflesch/mathquest/app/sockets/tournamentEventHandlers/disconnectingHandler.js
/**
 * disconnectingHandler.js - JavaScript bridge to TypeScript handler
 * 
 * This file serves as a bridge between JavaScript and TypeScript modules
 * to ensure compatibility when TypeScript transpilation is not available.
 */

// Import the TypeScript module with fallback options
let tsModule;
try {
    // Try direct import with delayed fallback for circular dependencies
    try {
        // Use direct require first
        tsModule = require('./disconnectingHandler');

        // Try both named exports and default exports patterns
        if (typeof tsModule === 'function') {
            // Function export pattern works, keep as is
        } else if (tsModule.default && typeof tsModule.default === 'function') {
            // Default export pattern works
            tsModule = tsModule.default;
        } else {
            // Neither pattern worked initially
            console.warn('Could not find disconnectingHandler function directly, trying delayed import');
            // Give time for circular dependency resolution
            setTimeout(() => {
                try {
                    const reloadedModule = require('./disconnectingHandler');
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

        // Fallback implementation
        tsModule = function (io, socket) {
            console.error('Using fallback disconnectingHandler - TypeScript module could not be loaded');
            // No response for disconnecting since the connection is already closing
        };
    }
} catch (error) {
    console.error('Error setting up disconnectingHandler:', error);

    // Final fallback
    tsModule = function (io, socket) {
        console.error('Using emergency fallback disconnectingHandler');
    };
}

// Export the handler function
module.exports = tsModule;
