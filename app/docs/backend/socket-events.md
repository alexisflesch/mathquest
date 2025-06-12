# Backend Socket Events Documentation

_Last updated: June 11, 2025_

## Overview

This document provides comprehensive documentation of all Socket.IO events in the MathQuest backend, including event names, payload structures, responses, and flow patterns. The backend uses Socket.IO with Redis adapter for horizontal scaling and supports real-time communication for teacher dashboards, student games, tournaments, lobbies, and projector displays.

## Architecture

### Socket.IO Configuration

- **Path:** `/api/socket.io`
- **Transports:** `['websocket', 'polling']`
- **Adapter:** Redis adapter for horizontal scaling
- **Authentication:** Custom middleware (`socketAuthMiddleware`)
- **Ping Configuration:** 30s timeout, 25s interval

### Event Categories

The backend organizes socket events into five main categories:

1. **Teacher Control Events** - Dashboard management and game control
2. **Game Events** - Student gameplay interactions
3. **Tournament Events** - Tournament-specific functionality
4. **Lobby Events** - Waiting room management
5. **Projector Events** - Classroom display functionality

## Connection Management

### Connection Flow

```
Client connects → socketAuthMiddleware → connectionHandlers → Feature handlers
```

### Connection Events

#### `connection_established`
**Direction:** Server → Client  
**Description:** Welcome event sent to newly connected clients

**Server Response:**
```typescript
{
  socketId: string;
  timestamp: string; // ISO string
  user: {
    role?: 'player' | 'teacher' | 'admin' | 'projector';
    userId?: string;
    username?: string;
  }
}
```

#### `disconnect`
**Direction:** Client → Server  
**Description:** Handles client disconnection and cleanup

**Cleanup Actions:**
- Remove from Redis participant lists
- Update participant counts
- Notify other players of departure
- Clean up room subscriptions

## Teacher Control Events

Teacher control events manage game flow from the teacher dashboard.

### Client → Server Events

#### `join_dashboard`
**Handler:** `joinDashboardHandler`  
**Description:** Teacher joins the dashboard for a specific game

**Payload:**
```typescript
{
  gameId?: string;      // Database ID of the game instance
  accessCode?: string;  // Access code (for backward compatibility)
}
```

**Server Response Events:**
- `dashboard_joined` - Confirmation with game state
- `error_dashboard` - If authorization fails or game not found

#### `set_question`
**Handler:** `setQuestionHandler`  
**Description:** Set the current question for the game

**Payload:**
```typescript
{
  gameId: string;        // Database ID of the game instance
  questionUid?: string;  // UID of the question to show
  questionIndex?: number; // Index of the question (legacy support)
}
```

**Server Response Events:**
- `dashboard_question_changed` - Broadcast to dashboard
- `game_question` - Broadcast to students
- `error_dashboard` - If unauthorized or question not found

#### `quiz_timer_action`
**Handler:** `timerActionHandler`  
**Description:** Control timer actions (start, pause, resume, stop, set_duration)

**Payload:**
```typescript
{
  gameId: string;
  action: 'start' | 'pause' | 'resume' | 'stop' | 'set_duration';
  duration?: number;     // Required for set_duration action
  questionUid?: string;  // Optional question association
}
```

**Server Response Events:**
- `dashboard_timer_updated` - Timer state to dashboard
- `game_timer_updated` - Timer state to students
- `error_dashboard` - If action fails

#### `lock_answers`
**Handler:** `lockAnswersHandler`  
**Description:** Lock or unlock answer submissions

**Payload:**
```typescript
{
  gameId: string;
  lock: boolean;  // true to lock, false to unlock
}
```

**Server Response Events:**
- `dashboard_answers_lock_changed` - To dashboard
- `answers_locked` - To students
- `error_dashboard` - If unauthorized

#### `end_game`
**Handler:** `endGameHandler`  
**Description:** End the current game

**Payload:**
```typescript
{
  gameId: string;
}
```

**Server Response Events:**
- `game_ended` - To all participants
- `dashboard_game_status_changed` - To dashboard
- `error_dashboard` - If unauthorized

#### `start_timer`
**Handler:** `startTimerHandler`  
**Description:** Start a timer for specified duration

**Payload:**
```typescript
{
  gameId?: string;
  accessCode?: string;  // Legacy support
  duration: number;     // Duration in milliseconds
}
```

#### `pause_timer`
**Handler:** `pauseTimerHandler`  
**Description:** Pause the current timer

**Payload:**
```typescript
{
  gameId?: string;
  accessCode?: string;  // Legacy support
}
```

### Server → Client Events

#### `dashboard_joined`
**Description:** Confirms teacher joined dashboard successfully

**Payload:**
```typescript
{
  gameId: string;
}
```

#### `dashboard_question_changed`
**Description:** Question was changed on dashboard

**Payload:**
```typescript
{
  questionUid: string;
  questionIndex?: number;
}
```

#### `dashboard_timer_updated`
**Description:** Timer state changed

**Payload:**
```typescript
{
  timer: {
    status: 'idle' | 'running' | 'paused' | 'expired';
    remaining: number;    // Milliseconds remaining
    duration: number;     // Total duration
    questionUid?: string; // Associated question
  };
  questionUid?: string;
  gameId?: string;
}
```

#### `dashboard_answers_lock_changed`
**Description:** Answer lock state changed

**Payload:**
```typescript
{
  locked: boolean;
}
```

#### `dashboard_game_status_changed`
**Description:** Game status changed

**Payload:**
```typescript
{
  status: string;
}
```

#### `quiz_connected_count`
**Description:** Number of connected participants changed

**Payload:**
```typescript
{
  count: number;
}
```

#### `error_dashboard`
**Description:** Dashboard-specific error occurred

**Payload:**
```typescript
{
  message: string;
  code?: string | number;
}
```

## Game Events

Game events handle student interactions during gameplay.

### Client → Server Events

#### `join_game`
**Handler:** `joinGameHandler`  
**Description:** Student joins a game with access code

**Payload:**
```typescript
{
  accessCode: string;
  userId: string;
  username: string;
  avatarEmoji?: string;
  isDiffered?: boolean;  // For deferred mode games
}
```

**Server Response Events:**
- `game_joined` - Confirmation with game state
- `player_joined_game` - Broadcast to other players
- `game_error` - If game not found or already played
- `game_already_played` - If player already completed deferred game

#### `game_answer`
**Handler:** `gameAnswerHandler`  
**Description:** Student submits an answer

**Payload:**
```typescript
{
  accessCode: string;
  userId: string;
  questionId: string;
  answer: boolean[] | number[];  // Answer selection
  timeSpent: number;            // Time taken to answer
}
```

**Server Response Events:**
- `answer_received` - Confirmation with correctness
- `leaderboard_update` - Updated leaderboard
- `game_error` - If invalid answer or game state

#### `request_participants`
**Handler:** `requestParticipantsHandler`  
**Description:** Request current list of game participants

**Payload:**
```typescript
{
  accessCode: string;
}
```

**Server Response Events:**
- `game_participants` - List of current participants

#### `request_next_question`
**Handler:** `requestNextQuestionHandler`  
**Description:** Request next question (practice/deferred modes)

**Payload:**
```typescript
{
  accessCode: string;
  userId: string;
  currentQuestionId: string | null;
}
```

**Server Response Events:**
- `game_question` - Next question data
- `game_ended` - If no more questions
- `game_error` - If unauthorized or game not found

#### `start_game`
**Handler:** Direct handler in `gameHandler`  
**Description:** Start a practice mode game

**Payload:**
```typescript
{
  accessCode: string;
  userId: string;
}
```

### Server → Client Events

#### `game_joined`
**Description:** Player successfully joined game

**Payload:**
```typescript
{
  accessCode: string;
  participant: {
    userId: string;
    username: string;
    avatarEmoji?: string;
    score?: number;
    joinedAt: string;  // ISO timestamp
  };
  gameStatus: 'pending' | 'active' | 'completed' | 'archived';
  isDiffered: boolean;
  differedAvailableFrom?: string;  // ISO string
  differedAvailableTo?: string;    // ISO string
}
```

#### `player_joined_game`
**Description:** Another player joined the game

**Payload:**
```typescript
{
  participant: {
    userId: string;
    username: string;
    avatarEmoji?: string;
    score?: number;
    joinedAt: string;
  };
}
```

#### `game_question`
**Description:** New question presented to players

**Payload:**
```typescript
{
  question: {
    uid: string;
    title?: string;
    text: string;
    answerOptions: string[];
    correctAnswers: boolean[];
    questionType: string;
    timeLimit?: number;
    gradeLevel?: string;
    discipline?: string;
    themes?: string[];
    tags?: string[];
    difficulty?: number;
    explanation?: string;
  };
  questionIndex: number;
  totalQuestions: number;
  timer?: {
    duration: number;
    remaining: number;
    status: string;
  };
}
```

#### `answer_received`
**Description:** Confirmation of answer submission

**Payload:**
```typescript
{
  questionId: string;
  timeSpent: number;
  correct?: boolean;
  correctAnswers?: boolean[];
  explanation?: string;
}
```

#### `game_participants`
**Description:** Current list of game participants

**Payload:**
```typescript
{
  participants: Array<{
    userId: string;
    username: string;
    avatarEmoji?: string;
    score?: number;
    joinedAt: string;
  }>;
}
```

#### `leaderboard_update`
**Description:** Updated game leaderboard

**Payload:**
```typescript
{
  leaderboard: Array<{
    userId: string;
    username: string;
    score: number;
    rank: number;
    avatarEmoji?: string;
  }>;
}
```

#### `game_timer_updated`
**Description:** Game timer state update

**Payload:**
```typescript
{
  timer: {
    status: 'idle' | 'running' | 'paused' | 'expired';
    remaining: number;
    duration: number;
    questionUid?: string;
  };
  questionUid?: string;
}
```

#### `answers_locked`
**Description:** Answer submission lock state changed

**Payload:**
```typescript
{
  locked: boolean;
}
```

#### `game_ended`
**Description:** Game has ended

**Payload:**
```typescript
{
  accessCode: string;
  correct?: number;
  total?: number;
  score?: number;
  totalQuestions?: number;
}
```

#### `game_error`
**Description:** Game-related error occurred

**Payload:**
```typescript
{
  message: string;
  code?: string | number;
}
```

#### `game_already_played`
**Description:** Player already completed this deferred game

**Payload:**
```typescript
{
  accessCode: string;
}
```

## Tournament Events

Tournament events handle competitive gameplay sessions.

### Client → Server Events

#### `start_tournament`
**Handler:** `tournamentHandler`  
**Description:** Start a tournament (creator only)

**Payload:**
```typescript
{
  accessCode: string;
}
```

**Server Response Events:**
- `game_started` - 5-second countdown begins
- `tournament_started` - Tournament begins
- `game_error` - If unauthorized or tournament not found

#### `join_tournament`
**Handler:** Shared with game events  
**Description:** Join a tournament

**Payload:**
```typescript
{
  code: string;
  username?: string;
  avatar?: string;
  isDeferred?: boolean;
  userId?: string;
  classId?: string;
  cookieId?: string;
}
```

### Server → Client Events

#### `tournament_started`
**Description:** Tournament has officially started

#### `tournament_question`
**Description:** New tournament question

#### `tournament_leaderboard_update`
**Description:** Tournament leaderboard updated

#### `tournament_timer_update`
**Description:** Tournament timer state changed

#### `tournament_ended`
**Description:** Tournament completed

#### `tournament_error`
**Description:** Tournament-related error

## Lobby Events

Lobby events manage waiting rooms before games start.

### Client → Server Events

#### `join_lobby`
**Handler:** `registerLobbyHandlers`  
**Description:** Join a game lobby

**Payload:**
```typescript
{
  accessCode: string;
  userId?: string;      // Optional, taken from auth if not provided
  username?: string;    // Optional, taken from auth if not provided
  avatarEmoji?: string; // Optional, taken from auth if not provided
}
```

#### `leave_lobby`
**Handler:** `registerLobbyHandlers`  
**Description:** Leave a game lobby

#### `get_participants`
**Handler:** `registerLobbyHandlers`  
**Description:** Get current lobby participants

### Server → Client Events

#### `participant_joined`
**Description:** New participant joined lobby

#### `participant_left`
**Description:** Participant left lobby

#### `participants_list`
**Description:** Current lobby participants

#### `game_started`
**Description:** Game is starting (5-second countdown)

**Payload:**
```typescript
{
  accessCode: string;
  gameId: string;
}
```

#### `redirect_to_game`
**Description:** Client should redirect to game

#### `lobby_error`
**Description:** Lobby-related error

**Payload:**
```typescript
{
  error: string;
  message: string;
}
```

## Projector Events

Projector events handle classroom display functionality.

### Client → Server Events

#### `join_projector`
**Handler:** `projectorHandler`  
**Description:** Connect projector to a game

#### `leave_projector`
**Handler:** `projectorHandler`  
**Description:** Disconnect projector from game

### Server → Client Events

#### `projector_state`
**Description:** Current projector state

#### `projection_timer_updated`
**Description:** Timer update for projector display

#### `projector_connected_count`
**Description:** Number of connected projectors

#### `joined_room`
**Description:** Successfully joined projector room

## Event Flow Patterns

### Teacher-Driven Game Flow

1. Teacher: `join_dashboard` → `dashboard_joined`
2. Teacher: `set_question` → `dashboard_question_changed` + `game_question` (to students)
3. Students: `game_answer` → `answer_received` + `leaderboard_update`
4. Teacher: `quiz_timer_action` → `dashboard_timer_updated` + `game_timer_updated`
5. Teacher: `end_game` → `game_ended` (to all)

### Student-Driven Tournament Flow

1. Students: `join_tournament` → `tournament_joined`
2. Creator: `start_tournament` → `game_started` (5s countdown) → `tournament_started`
3. System broadcasts questions automatically
4. Students: `tournament_answer` → `tournament_leaderboard_update`
5. System: `tournament_ended` when complete

### Practice Mode Flow

1. Student: `join_game` → `game_joined`
2. Student: `start_game` → First question presented
3. Student: `game_answer` → `answer_received`
4. Student: `request_next_question` → Next question or `game_ended`

## Error Handling

### Common Error Codes

- `AUTHENTICATION_REQUIRED` - User not authenticated
- `AUTHORIZATION_FAILED` - User not authorized for action
- `GAME_NOT_FOUND` - Game/tournament not found
- `INVALID_PAYLOAD` - Malformed request data
- `GAME_ALREADY_STARTED` - Action not allowed, game in progress
- `QUESTION_NOT_FOUND` - Question UID not found
- `TIMER_ERROR` - Timer operation failed

### Error Response Format

```typescript
{
  message: string;
  code?: string | number;
  details?: any;  // Additional error context
}
```

## Redis Integration

### Participant Management

- **Key Pattern:** `mathquest:game:participants:{accessCode}`
- **Type:** Hash - stores participant data
- **Fields:** userId, username, avatarEmoji, score, joinedAt

### Socket Mapping

- **Key Pattern:** `mathquest:game:userIdToSocketId:{accessCode}`
- **Type:** Hash - maps userId to socketId
- **Purpose:** Handle reconnections and participant cleanup

### Participant Counts

- **Key Pattern:** `mathquest:game:participantCount:{accessCode}`
- **Type:** String - participant count
- **Updates:** Real-time on join/leave

## Testing

### Mock Implementation

The backend includes comprehensive Socket.IO mocking for tests:

```typescript
interface MockSocket {
  id: string;
  rooms: Set<string>;
  emit: jest.Mock;
  on: jest.Mock;
  join: jest.Mock;
  triggerEvent: (event: string, payload?: any) => Promise<void>;
}
```

### Test Events

- `echo` - Simple echo test
- `test_event` - Event validation testing
- Connection/disconnection tests

## Security Considerations

### Authentication

- JWT-based authentication via `socketAuthMiddleware`
- Role-based authorization (teacher, student, admin, projector)
- Game creator verification for control actions

### Authorization Checks

- Teachers can only control games they created
- Students can only join games with valid access codes
- Answers validated against game state and timing

### Rate Limiting

- Answer submissions limited by game timer
- Connection attempts monitored
- Malformed payload rejection

## Performance Optimization

### Redis Adapter

- Horizontal scaling across multiple server instances
- Shared state management
- Efficient room broadcasting

### Connection Management

- Automatic cleanup on disconnect
- Participant count optimization
- Memory-efficient state storage

## Migration Notes

### Legacy Event Support

The backend maintains backward compatibility for:

- Old quiz template events → new game instance events
- Legacy timer formats → standardized timer payloads
- Deprecated field names → current schema

### Event Name Evolution

- `quiz_*` events → `game_*` events
- `tournament_answer` → `game_answer` (shared handler)
- Template-based → instance-based event patterns

---

This documentation covers all major socket events and patterns in the MathQuest backend. For implementation details, refer to the specific handler files in `/backend/src/sockets/handlers/`.
