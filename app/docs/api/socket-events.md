# Socket.IO Events

This document outlines the Socket.IO events used in the MathQuest application. The events are organized by their functional areas.

## Connection Events

### Client to Server
- **Connection**
  - Happens automatically when a client connects
  - Auth data should be passed in the connection query or handshake

### Server to Client
- **connect**: Emitted when connection is successful
- **disconnect**: Emitted when connection is closed
- **connection_established**: Confirmation of successful connection with session data

## Lobby Events

Lobby events handle player joining, leaving, and waiting in game lobbies before a game starts.

### Client to Server

- **join_lobby**
  ```typescript
  {
    accessCode: string;     // The unique code for the game/lobby
    userId: string;       // Unique identifier for the player
    username: string;       // Display name for the player
    avatarUrl?: string;     // Optional URL to player's avatar image
  }
  ```

- **leave_lobby**
  ```typescript
  {
    accessCode: string;     // The unique code for the game/lobby
  }
  ```

- **get_participants**
  ```typescript
  {
    accessCode: string;     // The unique code for the game/lobby
  }
  ```

### Server to Client

- **participants_list**
  ```typescript
  {
    participants: Array<{
      id: string;           // Socket ID of participant
      username: string;     // Display name
      userId: string;     // Unique identifier
      avatarUrl?: string;   // Optional avatar URL
    }>;
    gameName: string;       // Name of the game
  }
  ```

- **participant_joined**
  ```typescript
  {
    id: string;             // Socket ID of new participant
    username: string;       // Display name of new participant
    userId: string;       // Unique ID of new participant
    avatarUrl?: string;     // Optional avatar URL
  }
  ```

- **participant_left**
  ```typescript
  {
    id: string;             // Socket ID of departing participant
  }
  ```

- **room_left**
  ```typescript
  {
    accessCode: string;     // The lobby that was left
  }
  ```

- **redirect_to_game**
  ```typescript
  {
    accessCode: string;     // The game to redirect to
    gameUrl?: string;       // Optional URL to redirect to
  }
  ```

## Game Events

Game events handle player interactions during active gameplay, including joining games, submitting answers, and receiving game state updates.

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

- **request_participants**
  ```typescript
  {
    accessCode: string;     // The unique code for the game
  }
  ```

- **game_answer**
  ```typescript
  {
    accessCode: string;     // The unique code for the game
    questionId: string;     // The ID of the current question
    answer: string | string[]; // Player's answer(s), could be single ID or array of IDs
    timeSpent: number;      // Time in milliseconds spent on this question
  }
  ```

### Server to Client

- **game_joined**
  ```typescript
  {
    accessCode: string;     // The game that was joined
    gameId: string;         // Unique ID for the game instance
    currentQuestion: number; // Index of current question
    totalQuestions: number;  // Total number of questions in the game
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
      avatarUrl?: string;   // Optional avatar URL
    }>;
  }
  ```

- **game_question**
  ```typescript
  {
    question: {
      id: string;           // Question ID
      content: string;      // The question text
      type: string;         // Type of question (multiple_choice_single_answer, etc.)
      options: Array<{      // For multiple choice questions
        id: string;         // Option identifier
        content: string;    // Option text content
      }>;
      timeLimit: number;    // Time limit in seconds
    };
    index: number;          // Which question in the sequence (0-indexed)
    total: number;          // Total number of questions in the game
    timer: number;          // Time limit in milliseconds
  }
  ```

- **answer_received**
  ```typescript
  {
    questionId: string;     // ID of the question answered
    timeSpent: number;      // Confirmed time spent on the question
  }
  ```

- **game_question_results**
  ```typescript
  {
    questionId: string;     // ID of the question
    correctAnswers: string[]; // List of correct answer IDs
    playerStats: {          // Stats for each player
      [userId: string]: {
        answer: string | string[]; // Player's submitted answer(s)
        isCorrect: boolean;  // Whether the answer was correct
        timeSpent: number;   // Time spent answering
        score: number;       // Points earned for this question
      }
    };
  }
  ```

- **game_state_update**
  ```typescript
  {
    status: 'waiting' | 'in_progress' | 'question_active' | 'reviewing_question' | 'completed';
    currentQuestionIndex: number; // Current question index (0-based)
    timeRemaining?: number; // Time remaining for current question in ms
  }
  ```

- **answer_progress**
  ```typescript
  {
    questionId: string;     // ID of the question
    answered: number;       // Number of players who have answered
    total: number;          // Total number of players in the game
    percentage: number;     // Percentage of players who have answered
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

- All Socket.IO connections are made to the `/api/socket.io` endpoint
- Authentication is handled via socket handshake or query parameters
- Rooms are used for organizing participants (e.g., `lobby_GAMECODE`)
- Redis is used for state management to support horizontal scaling

## Example Usage

Client-side connection:

```javascript
const socket = io('http://localhost:3000/api/socket.io', {
  query: {
    token: 'player-token',
    role: 'player'
  },
  transports: ['websocket']
});

// Join a lobby
socket.emit('join_lobby', {
  accessCode: 'ABC123',
  userId: 'player-123',
  username: 'Test Player'
});

// Listen for participants list
socket.on('participants_list', (data) => {
  console.log('Participants:', data.participants);
  console.log('Game name:', data.gameName);
});
