/**
 * Shared Tournament State Types
 * 
 * These types represent the tournament state structure.
 */
import { Question } from '../quiz/question';
import { TournamentParticipant, TournamentAnswer } from './participant';
// Define a generic Timeout type that works in both Node.js and browser environments
type Timeout = ReturnType<typeof setTimeout>;

/**
 * Question timer state structure for tournaments
 */
export interface QuestionTimerState {
    timeLeft: number;
    initialTime: number;
    lastUpdateTime: number;
    status: 'play' | 'pause' | 'stop';
}

/**
 * Question state structure within a tournament
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
    timer: Timeout | null; // Using our custom Timeout type for better compatibility
    questionStart: number | null;
    paused: boolean;
    pausedRemainingTime?: number;
    stopped: boolean;
    linkedQuizId?: string | null;
    currentQuestionDuration: number;
    socketToPlayerId: Record<string, string>; // Renamed from socketToJoueur
    isDeferred?: boolean; // Renamed from isDiffered
    status?: 'preparing' | 'in progress' | 'finished'; // Renamed from statut and translated values
    intervalTimer?: Timeout | null; // Using our custom Timeout type for better compatibility
    previousQuestionUid?: string | null;
    code?: string;
    tournamentId?: string; // Renamed from tournoiId
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
