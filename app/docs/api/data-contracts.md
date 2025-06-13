# Data Contracts (Types & Schemas)

This document defines the shared data structures, TypeScript types, and Zod validation schemas used throughout the MathQuest application, particularly for API requests/responses and WebSocket event payloads.

## Importance of Data Contracts

-   **Consistency**: Ensures that frontend, backend, and shared modules agree on data shapes.
-   **Validation**: Provides a single source of truth for data validation, preventing errors and ensuring data integrity.
-   **Type Safety**: Leverages TypeScript for compile-time checks and improved developer experience.
-   **Clear Communication**: Defines a clear contract for how different parts of the system interact.

## Location of Shared Types

All shared types and Zod schemas should ideally reside in the `/shared` directory, organized by domain or feature. For example:

-   `shared/types/auth.ts`
-   `shared/types/game.ts`
-   `shared/types/user.ts`
-   `shared/constants/questionTypes.ts`

## Zod Schemas

Zod is used for runtime validation of API requests, responses, and WebSocket payloads. Schemas should be defined alongside their corresponding TypeScript types or directly inferred from them.

**Example Zod Schema:**

```typescript
// In shared/types/user.ts
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(3),
  email: z.string().email(),
  createdAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;
```

## Key Data Structures

_This section will be populated with definitions and explanations for major data structures used in the application._

### User Data

-   `User`: Represents a registered user.
-   `UserProfile`: Publicly viewable user information.

### Game Data

-   `Game`: Represents a game session (tournament or practice).
-   `GameState`: The current state of an active game.
-   `Player`: A participant in a game.
-   `Question`: A math question with its variants and correct answer.
    -   `QUESTION_TYPES`: Enum defining different types of questions (e.g., `MULTIPLE_CHOICE`, `EQUATION`).
-   `Answer`: A player's submitted answer to a question.

### API Payloads

-   `AuthRequest`: Payload for login/registration.
-   `AuthResponse`: Payload containing JWT and user info.
-   `CreateGameRequest`: Payload to create a new game.

### WebSocket Payloads

-   `JoinGamePayload`: Payload for a player joining a game.
-   `SubmitAnswerPayload`: Payload for submitting an answer.
-   `TimerUpdatePayload`: Contains `timeLeftMs` for game timers.

---

_This document will be continuously updated as new types and schemas are defined or existing ones are modified._
