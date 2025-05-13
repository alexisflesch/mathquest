/**
 * Shared Tournament Participant Types
 *
 * These types represent participant structures used in tournament functionality.
 */
/**
 * Base tournament participant structure
 */
export interface Participant {
    id: string;
    pseudo: string;
    avatar: string;
    score: number;
    isDiffered?: boolean;
    socketId?: string;
    scoredQuestions?: Record<string, number>;
}
/**
 * Answer data structure for tournament
 */
export interface TournamentAnswer {
    questionUid?: string;
    answerIdx?: number | number[];
    value?: any;
    timestamp?: number;
    clientTimestamp?: number;
    score?: number;
    timePenalty?: number;
    baseScore?: number;
    timeMs?: number;
    isCorrect?: boolean;
}
/**
 * Enhanced tournament participant structure with answers
 */
export interface TournamentParticipant extends Participant {
    answers?: TournamentAnswer[];
}
/**
 * Leaderboard entry structure
 */
export interface LeaderboardEntry {
    id: string;
    pseudo: string;
    avatar?: string;
    score: number;
}
