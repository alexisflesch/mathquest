/**
 * computeLeaderboard.ts - Utility to compute the leaderboard from tournament participants
 *
 * This module computes a sorted leaderboard based on participant scores in a tournament.
 */
import { TournamentState, QuestionState, LeaderboardEntry } from '../types/tournamentTypes';
/**
 * Compute a sorted leaderboard from tournament participants
 *
 * @param tState - The tournament state object
 * @param questionStates - Optional states for questions in the tournament
 * @param totalQuestions - Optional total number of questions
 * @returns Array of leaderboard entries sorted by score (highest first)
 */
declare function computeLeaderboard(tState: TournamentState | undefined, questionStates?: Record<string, QuestionState>, totalQuestions?: number): LeaderboardEntry[];
export { computeLeaderboard };
export default computeLeaderboard;
