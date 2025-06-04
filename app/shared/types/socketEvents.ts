// /home/aflesch/mathquest/app/shared/types/socketEvents.ts
// This file defines the types for Socket.IO events and their payloads,
// shared between the backend and frontend.

export interface JoinGamePayload {
    accessCode: string;
    userId: string;
    username: string;
    avatarEmoji?: string;
    isDiffered?: boolean; // For joining a differed mode game
}

export interface GameAnswerPayload {
    accessCode: string;
    userId: string;
    questionId: string; // Typically the UID of the question
    answer: any; // Can be string, number, array depending on question type - TODO: Make more specific if possible (e.g. string | string[] | number)
    timeSpent: number; // Milliseconds spent on the question
}

// Placeholder for other payloads - we'll add more as we identify them.

// Example of a payload for an error event
export interface ErrorPayload {
    message: string;
    code?: string | number; // Optional error code
}

// Payload for when a player has already played/completed a differed game
export interface GameAlreadyPlayedPayload {
    accessCode: string;
}

// Payload for when a client successfully joins a game
export interface GameJoinedPayload {
    accessCode: string;
    participant: ParticipantData; // Detailed information about the participant who joined
    gameStatus: 'pending' | 'active' | 'completed' | 'archived'; // Current status of the game
    isDiffered: boolean;
    differedAvailableFrom?: string; // ISO string
    differedAvailableTo?: string;   // ISO string
    // Potentially include initial game state info here if needed immediately on join
}

// Payload for broadcasting when a new player joins a live game
export interface PlayerJoinedGamePayload {
    // Using ParticipantData directly might be too much if only a subset is needed for broadcast.
    // However, for consistency and if most fields are useful, it's acceptable.
    // If a smaller subset is preferred, define a new interface like PlayerInfoForBroadcast.
    participant: ParticipantData;
}

// Example of a payload for a generic notification
export interface NotificationPayload {
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
}

// --- Specific Data Structures for Payloads ---

export interface QuestionData {
    uid: string;
    title?: string;
    text: string;
    answerOptions: string[]; // Array of text options
    correctAnswers: boolean[]; // Array of booleans indicating correct answers (required everywhere)
    questionType: string; // e.g., 'multiple_choice_single_answer'
    timeLimit?: number; // Time in seconds
    currentQuestionIndex?: number; // 0-based index of the current question
    totalQuestions?: number;     // Total number of questions in the game/quiz
    // Add other fields the client needs to display and interact with a question
}

export interface ParticipantData {
    id: string;                 // GameParticipant ID from Prisma (if available post-join) or socket.id as a temporary identifier
    userId: string;           // Player model ID
    username: string;           // Player model username
    avatarEmoji?: string;         // Player model avatarEmoji
    score?: number;             // Current score in the game (from GameParticipant model or Redis)
    online?: boolean;           // Real-time presence status
    joinedAt?: number | string; // Timestamp or ISO string of when they joined this specific game session
    // Add other relevant fields that the client needs to display a participant
}

export interface LeaderboardEntryData {
    userId: string;           // Corresponds to Player.id
    username: string;           // From Player model
    avatarEmoji?: string;         // From Player model
    score: number;              // From GameParticipant model
    rank?: number;              // Calculated rank
    // Add any other fields needed for displaying a leaderboard entry
}

// --- Core Socket.IO Event Definitions ---

// Events emitted by the client and listened to by the server
export interface ClientToServerEvents {
    join_game: (payload: JoinGamePayload) => void;
    game_answer: (payload: GameAnswerPayload) => void;
    request_participants: (payload: { accessCode: string }) => void;
    request_next_question: (payload: { accessCode: string; userId: string; currentQuestionId: string }) => void;
    // Example: teacher controls
    teacher_set_question: (payload: { accessCode: string; questionUid: string; questionIndex: number }) => void;
    teacher_timer_action: (payload: { accessCode: string; action: 'start' | 'pause' | 'resume' | 'stop' | 'set_duration'; duration?: number }) => void;
    teacher_lock_answers: (payload: { accessCode: string; lock: boolean }) => void;
    teacher_end_game: (payload: { accessCode: string }) => void;
    // Add other client-to-server events here
}

// Events emitted by the server and listened to by the client
export interface ServerToClientEvents {
    connect: () => void;
    disconnect: (reason: string) => void;
    connection_established: (payload: { socketId: string; timestamp: string; user: Partial<SocketData> }) => void; // Example welcome event

    game_joined: (payload: GameJoinedPayload) => void; // Updated to use GameJoinedPayload
    game_question: (payload: QuestionData) => void;
    answer_received: (payload: {
        questionId: string;
        timeSpent: number;
        correct?: boolean;
        correctAnswers?: boolean[];
        explanation?: string;
    }) => void;
    leaderboard_update: (payload: { leaderboard: LeaderboardEntryData[] }) => void;
    player_joined_game: (payload: PlayerJoinedGamePayload) => void; // Updated to use PlayerJoinedGamePayload
    player_left_game: (payload: { userId: string; socketId: string }) => void; // Broadcast when a player leaves
    game_participants: (payload: { participants: ParticipantData[] }) => void; // Full list of participants

    // Game control events
    game_control_question_set: (payload: { questionIndex: number; timer: any }) => void;
    game_control_question_ended: (payload: { questionIndex: number; answers: any; leaderboard: any }) => void;
    question_ended: (payload: { questionIndex: number; questionUid?: string; showLeaderboard?: boolean }) => void;

    game_state_update: (payload: any /* TODO: Define GameStatePayload for overall game state */) => void;
    timer_update: (payload: { timeLeft: number | null; running: boolean; duration?: number }) => void;
    answers_locked: (payload: { locked: boolean }) => void;
    game_ended: (payload: { accessCode: string; correct?: number; total?: number; score?: number; totalQuestions?: number; /* any final stats */ }) => void;

    game_error: (payload: ErrorPayload) => void;
    game_already_played: (payload: GameAlreadyPlayedPayload) => void; // Updated to use GameAlreadyPlayedPayload
    notification: (payload: NotificationPayload) => void;
    // Add other server-to-client events here
}

// Events used for server-to-server communication (if any)
// For most applications, this might not be used directly with client-facing Socket.IO.
export interface InterServerEvents {
    // e.g., ping: () => void;
}

// Data associated with each socket instance on the server-side
// Can be used to store session-like information.
export interface SocketData {
    userId?: string;    // Player ID or Teacher ID
    username?: string;
    role?: 'player' | 'teacher' | 'admin' | 'projector';
    accessCode?: string; // If the socket is associated with a specific game/lobby
    currentGameRoom?: string; // Room name for current game
    // Add any other data you want to associate with the socket
}

// TODO: Define GameStatePayload for overall game state updates.
// TODO: Review and refine 'any' types to be more specific where possible.
