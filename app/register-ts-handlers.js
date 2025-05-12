/**
 * register-ts-handlers.js
 * 
 * This file registers ts-node to handle TypeScript files in our Node.js environment.
 * It should be required at the beginning of the entry point file (server.js)
 * to ensure TypeScript files can be properly imported.
 */

// Register ts-node (removed transpile-only for better type awareness at runtime)
require('ts-node/register');

// Log success message
console.log('[TypeScript] Successfully registered ts-node for TypeScript file handling');
