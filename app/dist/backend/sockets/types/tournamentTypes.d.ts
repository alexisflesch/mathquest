/**
 * TypeScript definitions for Tournament-related data structures
 */
import { Question } from './quizTypes';
/**
 * Tournament participant structure
 */
export interface Participant {
    id: string;
    username: string;
    avatar: string;
    score: number;
    isDiffered?: boolean;
    socketId?: string;
    scoredQuestions?: Record<string, number>;
}
/**
 * Enhanced tournament participant structure with answers
 */
export interface TournamentParticipant extends Participant {
    answers?: TournamentAnswer[];
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
 * Leaderboard entry structure
 */
export interface LeaderboardEntry {
    id: string;
    username: string;
    avatar?: string;
    score: number;
}
/**
 * Question timer state structure
 */
export interface QuestionTimerState {
    timeLeft: number;
    initialTime: number;
    lastUpdateTime: number;
    status: 'play' | 'pause' | 'stop';
}
/**
 * Question state structure
 */
export interface QuestionState {
    uid: string;
    totalTime: number;
    correctAnswers: number | number[];
}
/**
 * Tournament state structure
 */
export interface TournamentState {
    participants: TournamentParticipant[];
    questions: Question[];
    currentIndex: number;
    currentQuestionIndex?: number;
    currentQuestionUid?: string;
    answers: Record<string, Record<string, TournamentAnswer>>;
    timer: NodeJS.Timeout | null;
    questionStart: number | null;
    paused: boolean;
    pausedRemainingTime?: number;
    stopped: boolean;
    linkedQuizId?: string | null;
    currentQuestionDuration: number;
    socketToJoueur: Record<string, string>;
    isDiffered?: boolean;
    statut?: 'en préparation' | 'en cours' | 'terminé';
    intervalTimer?: NodeJS.Timeout | null;
    previousQuestionUid?: string | null;
    code?: string;
    tournoiId?: string;
    settings?: {
        timer?: number;
        autoProgress?: boolean;
        accessCode?: string;
        maxParticipants?: number;
    };
    askedQuestions: Set<string>;
    questionTimers?: Record<string, QuestionTimerState>;
}
/**
 * Global tournament state container
 */
export interface TournamentStateContainer {
    [tournamentCode: string]: TournamentState;
}
