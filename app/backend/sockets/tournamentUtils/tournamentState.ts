/**
 * tournamentState.ts - Tournament State Management
 *
 * This module provides a centralized in-memory state store for all active tournaments.
 */

import { TournamentStateContainer } from '../types/tournamentTypes';

const tournamentState: TournamentStateContainer = {};

export { tournamentState };

// For CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { tournamentState };
}
