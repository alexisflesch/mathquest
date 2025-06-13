# MathQuest Custom Hooks

This document catalogs and describes the main custom React hooks used in the MathQuest frontend (`frontend/src/hooks/`).

---

## useGameSocket

**Purpose:**
Manages real-time game state and events for student gameplay via Socket.IO. Provides a unified interface for connecting, emitting, and listening to game events, with role-based configuration (student, teacher, projection, tournament).

**Signature:**
```ts
function useGameSocket(
  role: TimerRole,
  gameId: string | null,
  customConfig?: Partial<SocketConfig>
): GameSocketHook
```
- `role`: 'student' | 'teacher' | 'projection' | 'tournament'
- `gameId`: The game or quiz identifier
- `customConfig`: Optional overrides for socket config
- **Returns:** An object with the socket instance, connection state, emitters, and event listeners

**Usage Example:**
```tsx
const {
  socket,
  socketState,
  connect,
  disconnect,
  emitGameAnswer,
  emitJoinGame,
  onGameJoined,
  emitTimerAction,
  onTimerUpdate
} = useGameSocket('student', accessCode);
```

**Best Practices:**
- Use the provided emitters and listeners for all game-related events.
- Clean up listeners on unmount to avoid memory leaks.
- Prefer the role-specific wrappers (`useTeacherSocket`, `useStudentSocket`, etc.) for clarity.

---

## useTeacherQuizSocket

**Purpose:**
Provides comprehensive teacher quiz management functionality, including timer control, question management, and real-time synchronization for the teacher dashboard.

**Signature:**
```ts
function useTeacherQuizSocket(
  accessCode: string | null,
  token: string | null,
  quizId?: string | null
): {
  quizSocket: Socket | null;
  quizState: QuizState | null;
  timerStatus: string;
  timerQuestionUid: string | null;
  timeLeftMs: number | null;
  localTimeLeftMs: number | null;
  connectedCount: number;
  setLocalTimeLeft: (ms: number) => void;
  emitSetQuestion: (...args) => void;
  emitEndQuiz: (...args) => void;
  emitPauseQuiz: (...args) => void;
  emitResumeQuiz: (...args) => void;
  emitSetTimer: (...args) => void;
  emitTimerAction: (...args) => void;
  emitUpdateTournamentCode: (...args) => void;
}
```

**Usage Example:**
```tsx
const {
  quizSocket,
  quizState,
  timerStatus,
  emitSetQuestion,
  emitEndQuiz
} = useTeacherQuizSocket(accessCode, token, quizId);
```

**Best Practices:**
- Use this hook in teacher dashboard pages/components.
- Syncs with the unified game manager for consistent state.
- Use the provided emitters for all quiz control actions.

---

## useGameTimer

**Purpose:**
Provides unified, role-based timer management for all game/quiz/tournament scenarios. Handles countdowns, timer state, and synchronization with backend events.

**Signature:**
```ts
function useGameTimer(
  role: TimerRole,
  socket?: Socket | null,
  customConfig?: Partial<TimerConfig>
): GameTimerHook
```
- `role`: 'teacher' | 'student' | 'projection' | 'tournament'
- `socket`: Optional Socket.IO instance for event handling
- `customConfig`: Optional timer config overrides
- **Returns:** An object with timer state, controls, and formatting utilities

**Usage Example:**
```tsx
const timer = useGameTimer('student', socket);

// Start a timer for a question
useEffect(() => {
  timer.start(questionUid, 30); // 30 seconds
}, [questionUid]);
```

**Best Practices:**
- Use the same timer hook for all roles to ensure consistent behavior.
- Use `formatTime` for displaying time in the UI.
- Sync with backend timer events for real-time accuracy.

---

## useAuthState

**Purpose:**
Provides enhanced access to authentication state and utilities, including user role checks, permission helpers, and profile info.

**Signature:**
```ts
function useAuthState(): {
  isAnonymous: boolean;
  isGuest: boolean;
  isStudent: boolean;
  isTeacher: boolean;
  isAuthenticated: boolean;
  hasAccount: boolean;
  canCreateQuiz: boolean;
  canJoinGame: boolean;
  requiresAuth: boolean;
  hasProfile: boolean;
  hasEmail: boolean;
  isProfileComplete: boolean;
  getHomeRoute: () => string;
  getLoginRoute: () => string;
  needsUpgrade: boolean;
  canUpgrade: boolean;
  getDisplayName: () => string;
  getDisplayAvatar: () => string;
  // ...other helpers
}
```

**Usage Example:**
```tsx
const auth = useAuthState();
if (auth.isTeacher) {
  // Show teacher dashboard link
}
```

**Best Practices:**
- Use this hook for all auth/role-based UI logic.
- Prefer over direct context access for convenience and consistency.

---

## useAccessGuard

**Purpose:**
Controls access to pages/components based on authentication state and role. Can redirect or run a callback if access is denied.

**Signature:**
```ts
function useAccessGuard(options?: AccessGuardOptions): {
  isAllowed: boolean;
  userState: 'anonymous' | 'guest' | 'student' | 'teacher';
  hasMinimumAccess: (minimum: 'guest' | 'student' | 'teacher') => boolean;
  canCreateQuiz: boolean;
  canJoinGame: boolean;
  requiresAuth: boolean;
  isAnonymous: boolean;
  isGuest: boolean;
  isStudent: boolean;
  isTeacher: boolean;
  isAuthenticated: boolean;
}
```
- `options`: `{ redirectTo?: string; requireMinimum?: 'guest' | 'student' | 'teacher'; allowStates?: Array<'anonymous' | 'guest' | 'student' | 'teacher'>; onUnauthorized?: () => void; }`

**Usage Example:**
```tsx
const { isAllowed } = useAccessGuard({ requireMinimum: 'student' });
if (!isAllowed) return null;
```

**Best Practices:**
- Use for route/page protection and conditional rendering.
- Prefer `onUnauthorized` for custom handling, or `redirectTo` for navigation.

---

## Game & Quiz Sockets
- **useTeacherQuizSocket**: Handles teacher dashboard socket events for quiz control and monitoring.
- **useEnhancedStudentGameSocket**: Advanced student game socket logic (likely with extra features or analytics).
- **usePracticeGameSocket**: Socket logic for practice mode games.
- **useTournamentSocket**: Manages tournament-specific real-time events.
- **useProjectionQuizSocket**: Handles projector mode socket events for live display.
- **useUnifiedGameManager**: Centralized manager for game state across different play modes.

## State & Auth
- **useAuthState**: Provides authentication state and helpers for login, logout, and user info.
- **useAccessGuard**: Route guard for protected pages based on user role or authentication.

## Timers
- **useGameTimer**: Manages countdowns and timers for questions and game phases.

## Notes
- Some hooks have `_backup` variants, which may be legacy or experimental (e.g., `useTeacherQuizSocket_backup`, `useProjectionQuizSocket_backup`).
- All hooks are implemented in TypeScript and designed for use with React functional components.

---

## useUnifiedGameManager

**Purpose:**
Combines unified timer and socket management into a single interface for managing all aspects of game state, connection, and flow. Used for all roles (student, teacher, projection, tournament).

**Signature:**
```ts
function useUnifiedGameManager(config: UnifiedGameConfig): UnifiedGameManagerHook
```
- `config`: `{ role, gameId, timerConfig?, socketConfig?, token?, accessCode?, userId?, username?, avatarEmoji? }`
- **Returns:** An object with game state, timer controls, socket controls, and game actions

**Usage Example:**
```tsx
const gameManager = useUnifiedGameManager({
  role: 'teacher',
  gameId,
  token
});

// Access state and controls
const { gameState, timer, socket } = gameManager;
```

**Best Practices:**
- Use this as the main state manager for complex game/tournament flows.
- Prefer role-specific wrappers (e.g., `useTeacherGameManager`) for clarity.

---

## useEnhancedStudentGameSocket

**Purpose:**
Provides student game socket logic with runtime Zod validation for payloads and events. Ensures type safety and validation for all real-time interactions.

**Signature:**
```ts
function useEnhancedStudentGameSocket(
  accessCode: string | null,
  userId: string | null
): {
  socket: Socket | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  gameState: EnhancedGameState;
  joinGame: () => void;
  submitAnswer: (answer: any) => void;
  getValidationStats: () => any;
  resetValidationStats: () => void;
}
```

**Usage Example:**
```tsx
const {
  socket,
  gameState,
  joinGame,
  submitAnswer
} = useEnhancedStudentGameSocket(accessCode, userId);
```

**Best Practices:**
- Use for student gameplay where runtime validation is critical.
- Use `getValidationStats` and `resetValidationStats` for debugging validation issues.

---

## usePracticeGameSocket

**Purpose:**
Manages practice mode game state and real-time events for solo/practice quizzes. Handles question flow, answer submission, feedback, and session management.

**Signature:**
```ts
function usePracticeGameSocket(
  userId: string | null,
  questionLimit?: number
): {
  socket: Socket | null;
  gameState: PracticeGameState;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  startPracticeSession: () => void;
  submitAnswer: (answer: any) => void;
  requestNextQuestion: () => void;
  endPracticeSession: () => void;
  clearFeedback: () => void;
  resetSession: () => void;
}
```

**Usage Example:**
```tsx
const {
  gameState,
  startPracticeSession,
  submitAnswer,
  requestNextQuestion
} = usePracticeGameSocket(userId, 10);
```

**Best Practices:**
- Use for solo/practice quiz flows.
- Use `resetSession` to restart a practice session cleanly.

---

## useTournamentSocket

**Purpose:**
Provides a convenient wrapper for managing tournament game state and socket events, using the unified game manager under the hood.

**Signature:**
```ts
function useTournamentSocket(props: UnifiedGameConfig): UnifiedGameManagerHook
```
- `props`: Unified game config (accessCode, userId, username, avatarEmoji, etc.)
- **Returns:** Unified game manager interface for tournament play

**Usage Example:**
```tsx
const tournament = useTournamentSocket({
  accessCode,
  userId,
  username,
  avatarEmoji
});
```

**Best Practices:**
- Use for all tournament play flows.
- Pass all required props for correct state management.

---

## useProjectionQuizSocket

**Purpose:**
Provides projection display functionality for quizzes, including timer animations and real-time synchronization for projection screens. Uses the unified game manager internally.

**Signature:**
```ts
function useProjectionQuizSocket(
  gameId: string | null,
  tournamentCode: string | null
): {
  gameState: QuizState | null;
  localTimeLeftMs: number | null;
  // ...other unified game manager fields
}
```

**Usage Example:**
```tsx
const {
  gameState,
  localTimeLeftMs
} = useProjectionQuizSocket(gameId, tournamentCode);
```

**Best Practices:**
- Use for all projection (display) screens in quizzes/tournaments.
- Leverages the unified game manager for consistent state.

---

## useGameTimer (role-specific wrappers)

**Purpose:**
Provides role-specific timer hooks for projection and tournament modes, wrapping `useGameTimer` with preconfigured roles.

**Signature:**
```ts
function useProjectionTimer(socket?: Socket | null, customConfig?: Partial<TimerConfig>): GameTimerHook
function useTournamentTimer(socket?: Socket | null, customConfig?: Partial<TimerConfig>): GameTimerHook
```

**Usage Example:**
```tsx
const projectionTimer = useProjectionTimer(socket);
const tournamentTimer = useTournamentTimer(socket);
```

**Best Practices:**
- Use these wrappers for projection and tournament timer logic to ensure correct configuration.

---
