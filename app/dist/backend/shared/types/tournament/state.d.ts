/**
 * Shared Tournament State Types
 *
 * These types represent the tournament state structure.
 */
import { Question } from '../quiz/question';
import { TournamentParticipant, TournamentAnswer } from './participant';
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
    timer: Timeout | null;
    questionStart: number | null;
    paused: boolean;
    pausedRemainingTime?: number;
    stopped: boolean;
    linkedQuizId?: string | null;
    currentQuestionDuration: number;
    socketTouserId: Record<string, string>;
    isDeferred?: boolean;
    status?: 'preparing' | 'in progress' | 'finished';
    intervalTimer?: Timeout | null;
    previousQuestionUid?: string | null;
    code?: string;
    tournamentId?: string;
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
export { };
