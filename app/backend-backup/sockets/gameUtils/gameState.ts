/**
 * gameState.ts - Game State Management
 *
 * This module provides a centralized in-memory state store for all active games.
 * 
 * Previously known as tournamentState.ts, now renamed to reflect the new
 * GameInstance model in the schema.
 */

import { GameStateContainer } from '@sockets/types/gameTypes';

const gameState: GameStateContainer = {};

export { gameState };

// For CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { gameState };
}
