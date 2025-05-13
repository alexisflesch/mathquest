/**
 * Shared Quiz State Types
 * 
 * These types represent the quiz state structure used across both frontend and backend.
 */
import { Question } from './question';

/**
 * Timer/Chrono state
 */
export interface Chrono {
    timeLeft: number | null;
    running: boolean;
    status?: 'play' | 'pause' | 'stop'; // Additional field sometimes used
}

/**
 * Question Timer State used in quiz management
 */
export interface QuestionTimer {
    status: 'play' | 'pause' | 'stop';
    timeLeft: number;
    initialTime: number;
    timestamp: number | null;
}

/**
 * Base QuizState with common properties between frontend and backend
 */
export interface BaseQuizState {
    questions: Question[];
    chrono: Chrono;
    locked: boolean;
    ended: boolean;
    currentQuestionIdx?: number | null;
}

/**
 * Extended Quiz State for backend use
 */
export interface ExtendedQuizState extends BaseQuizState {
    id?: string;
    quizId?: string;
    currentQuestionUid: string | null;
    stats?: Record<string, any>;
    profSocketId?: string | null;
    profTeacherId?: string;
    timerStatus?: 'play' | 'pause' | 'stop';
    timerQuestionId?: string | null;
    timerTimeLeft?: number | null;
    timerTimestamp?: number | null;
    timerInitialValue?: number | null;
    tournament_code?: string | null;
    connectedSockets?: Set<string>;
    questionTimers?: Record<string, QuestionTimer>;
    pauseHandled?: number;
    resumeHandled?: number;
    lockedQuestions?: Record<string, boolean>;  // Track which questions are locked
    socketToJoueur?: Record<string, string>;    // Map socket IDs to student IDs
    participants?: Record<string, any>;         // Participants in the quiz
    askedQuestions?: Set<string>;               // Track which questions have been asked
}
