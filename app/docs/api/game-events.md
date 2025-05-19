# Game Socket Events

This document outlines the game-related Socket.IO events used in the MathQuest application.

## Game Player Events

These events are used for players joining and participating in active games.

### Client to Server

- **join_game**
  ```typescript
  {
    accessCode: string;     // The unique code for the game
    userId: string;       // Unique identifier for the player
    username: string;       // Display name for the player
    avatarUrl?: string;     // Optional URL to player's avatar image
  }
  ```

- **game_answer**
  ```typescript
  {
    accessCode: string;     // The unique code for the game
    questionId: string;     // ID of the question being answered
    answer: any;            // The player's answer (format depends on question type)
    timeSpent?: number;     // How long the player took to answer (ms)
  }
  ```

- **request_participants**
  ```typescript
  {
    accessCode: string;     // The unique code for the game
  }
  ```

### Server to Client

- **game_joined**
  ```typescript
  {
    gameId: string;           // Database ID of the game
    accessCode: string;       // The access code
    currentQuestion: number;  // Current question index (-1 if no question active)
    totalQuestions: number;   // Total number of questions
  }
  ```

- **game_question**
  ```typescript
  {
    question: {
      id: string;           // Question ID
      content: string;      // Question text content
      type: string;         // Question type (multiple-choice, etc.)
      options: Array<{      // Available options (for multiple choice)
        id: string;         // Option identifier
        content: string;    // Option text
      }>;
      timeLimit: number;    // Time limit in seconds (including multiplier)
    };
    index: number;          // Question index (0-based)
    total: number;          // Total number of questions
    timer: number;          // Time allowed in milliseconds
  }
  ```

- **answer_received**
  ```typescript
  {
    questionId: string;      // ID of the answered question
    timeSpent: number;       // Time spent answering (ms)
  }
  ```

- **player_joined_game**
  ```typescript
  {
    id: string;             // Socket ID of new participant
    username: string;       // Display name of new participant
    userId: string;       // Unique ID of new participant
    avatarUrl?: string;     // Optional avatar URL
  }
  ```

- **player_left_game**
  ```typescript
  {
    id: string;             // Socket ID of departing participant
    username: string;       // Display name of departing participant
  }
  ```

- **game_participants**
  ```typescript
  {
    participants: Array<{
      id: string;           // Socket ID of participant
      username: string;     // Display name
      userId: string;     // Unique identifier
      score: number;        // Current score
      avatarUrl?: string;   // Optional avatar URL
    }>;
  }
  ```

- **question_ended**
  ```typescript
  {
    questionIndex: number;  // Index of the ended question
  }
  ```

- **leaderboard_update**
  ```typescript
  {
    leaderboard: Array<{
      userId: string;     // Unique player ID
      username: string;     // Display name
      score: number;        // Current total score
      avatarUrl?: string;   // Optional avatar URL
    }>;
  }
  ```

- **game_ended**
  ```typescript
  {
    accessCode: string;     // Game access code
    leaderboard: Array<{    // Final leaderboard
      userId: string;
      username: string;
      score: number;
      avatarUrl?: string;
    }>;
  }
  ```

## Teacher Control Events

These events are used for teachers to control active games.

### Client to Server

- **join_teacher_control**
  ```typescript
  {
    gameId: string;         // Database ID of the game
    teacherId: string;      // Teacher ID
  }
  ```

- **set_question**
  ```typescript
  {
    gameId: string;         // Database ID of the game
    questionIndex: number;  // Index of the question to show
  }
  ```

- **timer_action**
  ```typescript
  {
    gameId: string;         // Database ID of the game
    action: 'start' | 'pause' | 'resume' | 'stop';  // Timer action
  }
  ```

- **lock_answers**
  ```typescript
  {
    gameId: string;         // Database ID of the game
    locked: boolean;        // Whether to lock or unlock answers
  }
  ```

### Server to Client

- **game_control_state**
  ```typescript
  {
    gameId: string;           // Database ID of the game
    accessCode: string;       // The access code
    status: string;           // Game status
    currentQuestionIndex: number; // Current question index
    totalQuestions: number;   // Total number of questions
    timer: {                  // Current timer state
      startedAt: number;      // Timestamp when timer started
      duration: number;       // Timer duration (ms)
      isPaused: boolean;      // Whether timer is paused
      pausedAt?: number;      // When timer was paused
      timeRemaining?: number; // Time remaining when paused
    };
  }
  ```

- **game_control_question_set**
  ```typescript
  {
    questionIndex: number;    // Index of the question that was set
    timer: {                  // Timer object
      startedAt: number;
      duration: number;
      isPaused: boolean;
    };
  }
  ```

- **answer_progress**
  ```typescript
  {
    questionId: string;       // ID of the current question
    answered: number;         // Number of answers received
    total: number;            // Total participants
    percentage: number;       // Percentage of participants who answered
  }
  ```

- **game_control_question_ended**
  ```typescript
  {
    questionIndex: number;    // Index of the question that ended
    answers: Record<string, any[]>; // All answers organized by question ID
    leaderboard: any[];       // Current leaderboard
  }
  ```

## Error Events

### Server to Client

- **error**
  ```typescript
  {
    code: string;           // Error code
    message: string;        // Human-readable error message
    details?: any;          // Optional additional error details
  }
  ```

## Implementation Notes

- All game-related events use the room `game_${accessCode}` for broadcasting
- Teacher control events use the room `teacher_control_${gameId}`
- Redis is used for state management with the following key patterns:
  - `mathquest:game:${accessCode}` - Main game state
  - `mathquest:game:participants:${accessCode}` - Game participants
  - `mathquest:game:answers:${accessCode}:${questionId}` - Answers for a specific question
  - `mathquest:game:leaderboard:${accessCode}` - Sorted set for the leaderboard
- All timestamps are represented in milliseconds since the Unix epoch
