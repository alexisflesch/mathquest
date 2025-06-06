/**
 * Shared Tournament Participant Types
 * 
 * These types represent participant structures used in tournament functionality.
 * This file now re-exports consolidated types from the core module.
 */

// Re-export core types directly
export type {
    BaseParticipant as Participant,
    TournamentParticipant,
    TournamentAnswer,
    LeaderboardEntry
} from '../core';
