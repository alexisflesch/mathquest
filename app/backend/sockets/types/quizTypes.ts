/**
 * TypeScript definitions for Quiz-related data structures
 */

/**
 * Question Timer State
 */
export interface QuestionTimer {
    status: 'play' | 'pause' | 'stop';
    timeLeft: number;
    initialTime: number;
    timestamp: number | null;
}

/**
 * Answer type for questions
 */
export interface Answer {
    texte: string;
    correct?: boolean;
}

/**
 * Question structure
 */
export interface Question {
    uid: string;
    texte: string;
    type: string;
    temps?: number; // Time in seconds
    question?: string; // Alternative text field
    answers?: Answer[];
    reponses?: Answer[]; // Alternative field name
    correct?: boolean | number[];
    theme?: string;
    difficulte?: number;
    niveau?: string | string[];
    discipline?: string;
    explication?: string;
    image_url?: string;
    hidden?: boolean;
    title?: string;
}

/**
 * Timer state
 */
export interface Chrono {
    timeLeft: number | null;
    running: boolean;
    status?: 'play' | 'pause' | 'stop'; // Additional field sometimes used
}

/**
 * Full quiz state structure
 */
export interface QuizState {
    id?: string;
    quizId?: string;
    currentQuestionUid: string | null;
    currentQuestionIdx?: number | null;
    questions: Question[];
    chrono: Chrono;
    locked: boolean;
    ended: boolean;
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
    lockedQuestions?: Record<string, boolean>; // Track which questions are locked
    socketToJoueur?: Record<string, string>; // Map socket IDs to student IDs
    participants?: Record<string, any>; // Participants in the quiz
}

/**
 * Global quiz state container
 * Note: We're using a hybrid approach to handle the wrapWithLogger function
 */
export interface QuizStateContainer {
    // Use symbol as key for the wrapWithLogger function to avoid collision with string indexer
    [key: string]: QuizState;
    // Need to use any here to work around TypeScript's constraint that
    // all properties must conform to the index signature
    wrapWithLogger?: any;
}
