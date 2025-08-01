// Generated by ts-to-zod
import { z } from 'zod';

// Timer update payload schema
export const timerUpdatePayloadSchema = z.object({
  timeLeftMs: z.number().int().nonnegative().nullable(),
  running: z.boolean(),
  durationMs: z.number().int().positive().optional(),
  serverTime: z.number().int().nonnegative({ message: "serverTime must be a non-negative integer (ms since epoch, UTC)." }),
});

// Canonical Zod schema for GameTimerState (MODERNIZED: only canonical fields)
export const gameTimerStateSchema = z.object({
  status: z.enum(['run', 'pause', 'stop']),
  timerEndDateMs: z.number(),
  questionUid: z.string(),
});

// DashboardTimerUpdatedPayload (MODERNIZED)
export const dashboardTimerUpdatedPayloadSchema = z.object({
  timer: gameTimerStateSchema,
  questionUid: z.string(),
  questionIndex: z.number(),
  totalQuestions: z.number(),
  answersLocked: z.boolean(),
  serverTime: z.number().int().nonnegative({ message: "serverTime must be a non-negative integer (ms since epoch, UTC)." }),
});

// GameTimerUpdatePayload (MODERNIZED)
export const gameTimerUpdatePayloadSchema = z.object({
  timer: gameTimerStateSchema,
  questionUid: z.string(),
  questionIndex: z.number(),
  totalQuestions: z.number(),
  answersLocked: z.boolean(),
  serverTime: z.number().int().nonnegative({ message: "serverTime must be a non-negative integer (ms since epoch, UTC)." }),
});

// Participant status enum schema for unified join flow
export const participantStatusSchema = z.enum(['PENDING', 'ACTIVE', 'COMPLETED', 'LEFT'], {
  errorMap: () => ({ message: "Status must be one of: PENDING, ACTIVE, COMPLETED, LEFT" }),
});

// Participation type enum schema
export const participationTypeSchema = z.enum(['LIVE', 'DEFERRED'], {
  errorMap: () => ({ message: "Participation type must be one of: LIVE, DEFERRED" }),
});

// Teacher dashboard payload schemas
export const setQuestionPayloadSchema = z.object({
  accessCode: z.string().min(1, { message: "Access code cannot be empty." }),
  questionUid: z.string().min(1, { message: "Question UID cannot be empty." }),
  questionIndex: z.number().int().nonnegative({ message: "Question index must be non-negative." }).optional(),
});

export const joinDashboardPayloadSchema = z.object({
  accessCode: z.string().min(1, { message: "Access code cannot be empty." }),
});

export const timerActionPayloadSchema = z.object({
  accessCode: z.string().min(1, { message: "Access code cannot be empty." }),
  action: z.enum(['run', 'pause', 'stop', 'edit'], {
    errorMap: () => ({ message: "Action must be one of: run, pause, stop, edit" }),
  }),
  /**
   * Absolute timestamp (ms since epoch, UTC) when the timer is scheduled to end.
   * This is the canonical end date for the timer, used for backend/logic and precise signaling.
   * May be updated if the timer is changed during a quiz.
   */
  timerEndDateMs: z.number().int().nonnegative({ message: "timerEndDateMs must be a non-negative integer (ms since epoch, UTC)." }).optional(),
  /**
   * Target time in milliseconds (duration or remaining time, NOT a date).
   * Used for UI, duration, or other timer logic. Distinct from timerEndDateMs.
   */
  targetTimeMs: z.number().int().nonnegative({ message: "targetTimeMs must be a non-negative integer." }).optional(),
  questionUid: z.string().min(1, { message: "Question UID cannot be empty." }),
  /**
   * For 'edit' action: the new duration in milliseconds (REQUIRED for 'edit')
   */
  durationMs: z.number().int().nonnegative({ message: "durationMs must be a non-negative integer (ms)." }).optional(),
});

export const lockAnswersPayloadSchema = z.object({
  accessCode: z.string().min(1, { message: "Access code cannot be empty." }),
  lock: z.boolean({ errorMap: () => ({ message: "Lock must be a boolean value." }) }),
});

export const endGamePayloadSchema = z.object({
  accessCode: z.string().min(1, { message: "Access code cannot be empty." }),
});

// UNIFIED JOIN FLOW SCHEMAS
export const joinGamePayloadSchema = z.object({
  accessCode: z.string().min(1, { message: "Access code cannot be empty." }),
  userId: z.string().min(1, { message: "Player ID cannot be empty." }),
  username: z.string().min(1, { message: "Username cannot be empty." }),
  avatarEmoji: z.string().optional(),
});

// Leave game payload schema for unified flow
export const leaveGamePayloadSchema = z.object({
  accessCode: z.string().min(1, { message: "Access code cannot be empty." }),
  userId: z.string().min(1, { message: "User ID cannot be empty." }),
});

// Participant data schema with status
export const participantDataSchema = z.object({
  id: z.string().min(1, { message: "Participant ID cannot be empty." }),
  userId: z.string().min(1, { message: "User ID cannot be empty." }),
  username: z.string().min(1, { message: "Username cannot be empty." }),
  avatarEmoji: z.string().optional(), // Allow optional as per interface
  score: z.number().int().nonnegative({ message: "Score must be non-negative." }),
  status: participantStatusSchema.optional(),
  online: z.boolean().optional(),
  joinedAt: z.union([z.number(), z.string()]).optional(),
  socketId: z.string().optional(),
  attemptCount: z.number().int().nonnegative().optional(),
});

export const gameAnswerPayloadSchema = z.object({
  accessCode: z.string().min(1, { message: "Access code cannot be empty." }),
  userId: z.string().min(1, { message: "Player ID cannot be empty." }),
  questionUid: z.string().min(1, { message: "Question UID cannot be empty." }),
  answer: z.union([
    z.string(),
    z.number(),
    z.array(z.string()),
    z.array(z.number())
  ]),
  timeSpent: z.number().int({ message: "Time spent must be an integer." }).nonnegative({ message: "Time spent cannot be negative." }),
});

export const errorPayloadSchema = z.object({
  message: z.string().min(1, { message: "Error message cannot be empty." }),
  code: z.union([z.string(), z.number()]).optional(),
  details: z.record(z.any()).optional(),
});

export const gameAlreadyPlayedPayloadSchema = z.object({
  accessCode: z.string().min(1, { message: "Access code cannot be empty." }),
});

export const playerJoinedGamePayloadSchema = z.object({
  participant: participantDataSchema,
});

export const notificationPayloadSchema = z.object({
  message: z.string().min(1, { message: "Notification message cannot be empty." }),
  defaultMode: z.enum(['info', 'warning', 'error', 'success']),
});


// === CANONICAL SPLIT: Student vs. Teacher Question Payloads ===

// Student: never receives correctAnswers or explanation
export const questionDataForStudentSchema = z.object({
  uid: z.string().min(1, { message: "Question UID cannot be empty." }),
  title: z.string().min(1).optional(),
  text: z.string().min(1, { message: "Question text cannot be empty." }),
  answerOptions: z.array(z.string().min(1)).min(1, { message: "At least one answer option is required." }),
  questionType: z.string().min(1, { message: "Question type cannot be empty." }),
  timeLimit: z.number().int({ message: "Time limit must be an integer." }).positive({ message: "Time limit must be positive." }),
  currentQuestionIndex: z.number().int({ message: "Question index must be an integer." }).nonnegative({ message: "Question index cannot be negative." }).optional(),
  totalQuestions: z.number().int({ message: "Total questions must be an integer." }).positive({ message: "Total questions must be positive." }).optional(),
});

// Teacher/Projection: includes correctAnswers and explanation
export const questionDataForTeacherSchema = questionDataForStudentSchema.extend({
  correctAnswers: z.array(z.boolean()),
  explanation: z.string().optional(),
});

// For legacy/compatibility: REMOVE after migration
/** @deprecated Use questionDataForStudentSchema or questionDataForTeacherSchema */
export const questionDataSchema = questionDataForStudentSchema;

export const leaderboardEntryDataSchema = z.object({
  userId: z.string().min(1, { message: "Player ID cannot be empty." }),
  username: z.string().min(1, { message: "Username cannot be empty." }),
  avatarEmoji: z.string().optional(),
  score: z.number().int({ message: "Score must be an integer." }),
  rank: z.number().int({ message: "Rank must be an integer." }).positive({ message: "Rank must be positive." }).optional(),
});

export const clientToServerEventsSchema = z.object({
  join_game: z.function().args(joinGamePayloadSchema).returns(z.void()),
  game_answer: z.function().args(gameAnswerPayloadSchema).returns(z.void()),
  request_participants: z
    .function()
    .args(
      z.object({
        accessCode: z.string().min(1),
      }),
    )
    .returns(z.void()),
  teacher_set_question: z
    .function()
    .args(
      z.object({
        accessCode: z.string().min(1),
        questionUid: z.string().min(1),
        questionIndex: z.number().int().nonnegative(),
      }),
    )
    .returns(z.void()),
  teacher_timer_action: z
    .function()
    .args(timerActionPayloadSchema)
    .returns(z.void()),
  teacher_lock_answers: z
    .function()
    .args(
      z.object({
        accessCode: z.string().min(1),
        lock: z.boolean(),
      }),
    )
    .returns(z.void()),
  teacher_end_game: z
    .function()
    .args(
      z.object({
        accessCode: z.string().min(1),
      }),
    )
    .returns(z.void()),
});

export const interServerEventsSchema = z.object({});

export const socketDataSchema = z.object({
  userId: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  role: z.enum(['STUDENT', 'TEACHER', 'GUEST']).optional(),
  accessCode: z.string().min(1).optional(),
  currentGameRoom: z.string().min(1).optional(),
});

export const gameJoinedPayloadSchema = z.object({
  accessCode: z.string().min(1, { message: "Access code cannot be empty." }),
  participant: participantDataSchema,
  gameStatus: z.enum(['pending', 'active', 'completed', 'archived']),
  gameMode: z.enum(['tournament', 'quiz', 'practice', 'class']),
  differedAvailableFrom: z.string().datetime({ message: "Invalid datetime string for differedAvailableFrom. Must be an ISO string." }).optional(),
  differedAvailableTo: z.string().datetime({ message: "Invalid datetime string for differedAvailableTo. Must be an ISO string." }).optional(),
});

export const requestNextQuestionPayloadSchema = z.object({
  accessCode: z.string().min(1, { message: "Access code cannot be empty." }),
  userId: z.string().min(1, { message: "User ID cannot be empty." }),
  currentQuestionUid: z.string().min(1, { message: "Current question UID cannot be empty." }),
});

// Canonical event payload schemas (for tournament-style events)
export const correctAnswersPayloadSchema = z.object({
  questionUid: z.string().min(1, { message: "Question UID cannot be empty." }),
  correctAnswers: z.array(z.boolean()).optional(),
  /**
   * Map of questionUid to boolean indicating if correct answers have been shown (terminated)
   */
  terminatedQuestions: z.record(z.string(), z.boolean()).optional(),
});

export const feedbackPayloadSchema = z.object({
  questionUid: z.string().min(1, { message: "Question UID cannot be empty." }),
  feedbackRemaining: z.number().int().nonnegative({ message: "Feedback remaining must be non-negative." }),
}).catchall(z.any()); // Allow additional properties for flexibility

// Game state update payload schema
export const gameStateUpdatePayloadSchema = z.object({
  status: z.enum(['waiting', 'active', 'paused', 'finished']).optional(),
  currentQuestion: questionDataSchema.optional(),
  questionIndex: z.number().int().nonnegative().optional(),
  totalQuestions: z.number().int().positive().optional(),
  timer: z.number().int().nonnegative().optional(),
  participants: z.array(participantDataSchema).optional(),
  gameMode: z.enum(['tournament', 'quiz', 'practice', 'class']).optional(),
}).catchall(z.any()); // Allow additional properties for flexibility

// Answer received payload schema
export const answerReceivedPayloadSchema = z.object({
  questionUid: z.string().min(1, { message: "Question UID cannot be empty." }),
  timeSpent: z.number().int().nonnegative({ message: "Time spent must be a non-negative integer." }),
  correct: z.boolean().optional(),
  correctAnswers: z.array(z.boolean()).optional(),
  explanation: z.string().optional(),
});

// Answer feedback payload schema
export const answerFeedbackPayloadSchema = z.object({
  status: z.enum(['ok', 'error'], { message: "Status must be 'ok' or 'error'." }),
  questionUid: z.string().min(1, { message: "Question UID cannot be empty." }).optional(),
  scoreAwarded: z.number().int().nonnegative({ message: "Score awarded must be a non-negative integer." }).optional(),
  code: z.string().optional(),
  message: z.string().optional(),
  isCorrect: z.boolean().optional(),
  correctAnswers: z.array(z.boolean()).optional(),
  explanation: z.string().optional(),
}).catchall(z.any()); // Allow additional properties for flexibility

export const serverToClientEventsSchema = z.object({
  connect: z.function().args().returns(z.void()),
  disconnect: z.function().args(z.string()).returns(z.void()),
  connection_established: z
    .function()
    .args(
      z.object({
        socketId: z.string().min(1),
        timestamp: z.string().datetime(),
        user: socketDataSchema.partial(),
      }),
    )
    .returns(z.void()),
  game_joined: z.function().args(gameJoinedPayloadSchema).returns(z.void()),
  game_question: z.function().args(questionDataSchema).returns(z.void()),
  answer_received: z.function().args(answerReceivedPayloadSchema).returns(z.void()),
  leaderboard_update: z
    .function()
    .args(
      z.object({
        leaderboard: z.array(leaderboardEntryDataSchema),
      }),
    )
    .returns(z.void()),
  player_joined_game: z
    .function()
    .args(playerJoinedGamePayloadSchema)
    .returns(z.void()),
  player_left_game: z
    .function()
    .args(
      z.object({
        userId: z.string().min(1),
        socketId: z.string().min(1),
      }),
    )
    .returns(z.void()),
  game_participants: z
    .function()
    .args(
      z.object({
        participants: z.array(participantDataSchema),
      }),
    )
    .returns(z.void()),
  game_state_update: z.function().args(gameStateUpdatePayloadSchema).returns(z.void()),
  timer_update: z
    .function()
    .args(timerUpdatePayloadSchema)
    .returns(z.void()),
  answers_locked: z
    .function()
    .args(
      z.object({
        locked: z.boolean(),
      }),
    )
    .returns(z.void()),
  game_ended: z
    .function()
    .args(
      z.object({
        accessCode: z.string().min(1),
      }),
    )
    .returns(z.void()),
  game_error: z.function().args(errorPayloadSchema).returns(z.void()),
  game_already_played: z
    .function()
    .args(gameAlreadyPlayedPayloadSchema)
    .returns(z.void()),
  notification: z.function().args(notificationPayloadSchema).returns(z.void()),
  game_control_question_set: z
    .function()
    .args(
      z.object({
        questionIndex: z.number().int().nonnegative(),
        timer: z.object({
          startedAt: z.number(),
          duration: z.number(),
          isPaused: z.boolean(),
          pausedAt: z.number().optional(),
          timeRemaining: z.number().optional()
        })
      })
    )
    .returns(z.void()),
  game_control_question_ended: z
    .function()
    .args(
      z.object({
        questionUid: z.string(),
        timer: z.object({
          startedAt: z.number(),
          duration: z.number(),
          isPaused: z.boolean(),
          pausedAt: z.number().optional(),
          timeRemaining: z.number().optional()
        })
      })
    )
    .returns(z.void()),
  question_ended: z
    .function()
    .args(
      z.object({
        questionUid: z.string(),
        showLeaderboard: z.boolean().optional(),
        leaderboard: z.array(
          z.object({
            userId: z.string(),
            username: z.string(),
            avatarEmoji: z.string().optional(),
            score: z.number()
          })
        ).optional()
      })
    )
    .returns(z.void()),
  // Teacher dashboard socket event schemas
  set_question: z.function().args(setQuestionPayloadSchema).returns(z.void()),
  join_dashboard: z.function().args(joinDashboardPayloadSchema).returns(z.void()),
  timer_action: z.function().args(timerActionPayloadSchema).returns(z.void()),
  lock_answers: z.function().args(lockAnswersPayloadSchema).returns(z.void()),
  end_game: z.function().args(endGamePayloadSchema).returns(z.void()),
  // Canonical tournament/practice events
  correct_answers: z.function().args(correctAnswersPayloadSchema).returns(z.void()),
  feedback: z.function().args(feedbackPayloadSchema).returns(z.void()),
});

// Additional teacher control schemas
export const startTimerPayloadSchema = z.object({
  gameId: z.string().min(1, { message: "Game ID cannot be empty." }).optional(),
  accessCode: z.string().min(1, { message: "Access code cannot be empty." }).optional(),
  durationMs: z.number().int().positive({ message: "durationMs must be a positive integer (ms)." }),
}).refine(data => data.gameId || data.accessCode, {
  message: "Either gameId or accessCode must be provided.",
});

export const pauseTimerPayloadSchema = z.object({
  gameId: z.string().min(1, { message: "Game ID cannot be empty." }).optional(),
  accessCode: z.string().min(1, { message: "Access code cannot be empty." }).optional(),
}).refine(data => data.gameId || data.accessCode, {
  message: "Either gameId or accessCode must be provided.",
});

// Tournament schemas
export const startTournamentPayloadSchema = z.object({
  accessCode: z.string().min(1, { message: "Access code cannot be empty." }),
});

// Projector schemas
export const joinProjectorPayloadSchema = z.object({
  gameId: z.string().min(1, { message: "Game ID cannot be empty." }),
});

export const leaveProjectorPayloadSchema = z.object({
  gameId: z.string().min(1, { message: "Game ID cannot be empty." }),
});

// DEPRECATED LOBBY SCHEMAS - Use unified join flow instead
// These will be removed after migration to unified join flow

/**
 * @deprecated Use joinGamePayloadSchema instead
 */
export const joinLobbyPayloadSchema = z.object({
  accessCode: z.string().min(1, { message: "Access code cannot be empty." }),
  userId: z.string().min(1, { message: "User ID cannot be empty." }),
  username: z.string().min(1, { message: "Username cannot be empty." }),
  avatarEmoji: z.string().optional(),
});

/**
 * @deprecated Use leaveGamePayloadSchema instead
 */
export const leaveLobbyPayloadSchema = z.object({
  accessCode: z.string().min(1, { message: "Access code cannot be empty." }),
  userId: z.string().min(1, { message: "User ID cannot be empty." }).optional(),
});

/**
 * @deprecated Use joinGamePayloadSchema instead
 */
export const getParticipantsPayloadSchema = z.object({
  accessCode: z.string().min(1, { message: "Access code cannot be empty." }),
});

// Game start schema
export const startGamePayloadSchema = z.object({
  accessCode: z.string().min(1, { message: "Access code cannot be empty." }),
  userId: z.string().min(1, { message: "User ID cannot be empty." }),
});

export const requestParticipantsPayloadSchema = z.object({
  accessCode: z.string().min(1, { message: "Access code cannot be empty." }),
});

// Shared live handler schemas
export const sharedJoinPayloadSchema = z.object({
  accessCode: z.string().min(1, { message: "Access code cannot be empty." }),
  userId: z.string().min(1, { message: "User ID cannot be empty." }),
  username: z.string().min(1, { message: "Username cannot be empty." }),
  avatarEmoji: z.string().optional(),
  playMode: z.enum(['quiz', 'tournament', 'practice']).optional(),
});

export const sharedAnswerPayloadSchema = z.object({
  accessCode: z.string().min(1, { message: "Access code cannot be empty." }),
  userId: z.string().min(1, { message: "User ID cannot be empty." }),
  questionUid: z.string().min(1, { message: "Question UID cannot be empty." }),
  answer: z.union([
    z.string(),
    z.number(),
    z.array(z.string()),
    z.array(z.number())
  ]),
  timeSpent: z.number().int({ message: "Time spent must be an integer." }).nonnegative({ message: "Time spent cannot be negative." }),
  playMode: z.enum(['quiz', 'tournament', 'practice']).optional(),
});

// Dashboard payload schemas
export const connectedCountPayloadSchema = z.object({
  count: z.number().int().nonnegative({ message: "Count must be a non-negative integer." }),
});

// Test-specific schemas for unit tests
export const joinRoomPayloadSchema = z.object({
  roomName: z.string().min(1, { message: "Room name cannot be empty." }),
});

export const testConnectionPayloadSchema = z.object({
  // No payload for connection event, but we can validate the socket metadata
});

// Game ended payload schema
export const gameEndedPayloadSchema = z.object({
  accessCode: z.string().min(1, { message: "Access code cannot be empty." }),
  endedAt: z.string().datetime({ message: "Invalid datetime string for endedAt. Must be an ISO string." }).optional(),
  score: z.number().int().nonnegative({ message: "Score must be a non-negative integer." }).optional(),
  totalQuestions: z.number().int().nonnegative({ message: "Total questions must be a non-negative integer." }).optional(),
  correct: z.number().int().nonnegative({ message: "Correct answers count must be a non-negative integer." }).optional(),
  total: z.number().int().nonnegative({ message: "Total answers count must be a non-negative integer." }).optional(),
});

// Connection established payload schema
export const connectionEstablishedPayloadSchema = z.object({
  socketId: z.string().min(1, { message: "Socket ID cannot be empty." }),
  timestamp: z.string().datetime({ message: "Invalid datetime string for timestamp. Must be an ISO string." }),
  user: z.object({
    userId: z.string().optional(),
    username: z.string().optional(),
    role: z.enum(['STUDENT', 'TEACHER', 'GUEST']).optional(),
    accessCode: z.string().optional(),
    currentGameRoom: z.string().optional(),
    practiceSessionId: z.string().optional(),
    practiceUserId: z.string().optional(),
  }).partial(),
});

export const revealLeaderboardPayloadSchema = z.object({
  accessCode: z.string().min(1, { message: "Access code cannot be empty." })
});
