/**
 * computeLeaderboard.ts - Compute Game Leaderboard
 *
 * This module provides functions for computing game leaderboards
 * based on participant scores.
 * 
 * Previously known as computeLeaderboard.ts in tournamentUtils, 
 * now moved to gameUtils to reflect the new GameInstance model.
 */

import { GameState, LeaderboardEntry } from '@sockets/types/gameTypes';

/**
 * Compute the leaderboard for a game
 * 
 * @param state - The game state containing participants and scores
 * @returns Array of leaderboard entries sorted by score (highest first)
 */
export function computeLeaderboard(state: GameState): LeaderboardEntry[] {
    if (!state.participants || state.participants.length === 0) {
        return [];
    }

    // Create a leaderboard entry for each participant
    const leaderboard: LeaderboardEntry[] = state.participants.map(participant => ({
        id: participant.id,
        username: participant.username,
        avatar: participant.avatar,
        score: participant.score || 0,
        answers: participant.answers?.length || 0,
        rank: 0  // Will be assigned below
    }));

    // Sort by score (highest first)
    leaderboard.sort((a, b) => b.score - a.score);

    // Assign ranks, handling ties
    let currentRank = 1;
    let previousScore: number | undefined = undefined;
    let tieCount = 0;

    leaderboard.forEach((entry, index) => {
        if (previousScore !== undefined && entry.score < previousScore) {
            // New score, new rank (accounting for ties)
            currentRank += tieCount;
            tieCount = 1;
        } else if (previousScore !== undefined && entry.score === previousScore) {
            // Same score, same rank, increment tie count
            tieCount++;
        } else {
            // First entry
            tieCount = 1;
        }

        entry.rank = currentRank;
        previousScore = entry.score;
    });

    return leaderboard;
}
