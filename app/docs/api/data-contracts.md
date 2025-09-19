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

### Current Shared Types Structure

The shared types are organized as follows:

- `shared/types/api/requests.ts` - All API request payload types
- `shared/types/api/responses.ts` - All API response payload types  
- `shared/types/core/user.ts` - User-related core types (UserRole, etc.)
- `shared/types/core/game.ts` - Game-related core types (GameTemplate, GameInstance, PlayMode, etc.)
- `shared/types/core/participant.ts` - Participant and leaderboard types
- `shared/types/quiz/question.ts` - Question and quiz-related types

### API Contract Enforcement

All backend API endpoints use strictly typed request and response payloads using shared types:

```typescript
// Backend API endpoint example
router.post('/', async (req: Request<{}, GameCreationResponse, CreateGameRequest>, res: Response<GameCreationResponse | ErrorResponse>) => {
    // Request body is typed as CreateGameRequest
    // Response is typed as GameCreationResponse
});
```

### Request Validation with Zod

All API endpoints should use runtime validation with Zod schemas for type safety and input validation:

```typescript
// Define validation schema
export const CreateGameRequestSchema = z.object({
    name: z.string().min(1, 'Game name is required'),
    gameTemplateId: z.string().uuid('Invalid game template ID').optional(),
    playMode: z.enum(['quiz', 'tournament', 'practice']),
    settings: z.record(z.any()).optional()
});

// Apply validation middleware
router.post('/', validateRequestBody(CreateGameRequestSchema), async (req, res) => {
    // req.body is now validated and typed
});
```

**Validation Middleware Available:**
- `validateRequestBody(schema)` - Validates request body
- `validateRequestParams(schema)` - Validates URL parameters  
- `validateRequestQuery(schema)` - Validates query parameters

**Current Validation Status:**
- ✅ `auth.ts` - All 6 endpoints with Zod validation (login, register, upgrade, reset password, profile)
- ✅ `games.ts` - 3 critical endpoints with Zod validation (create, join, status update)
- ✅ `gameTemplates.ts` - 2 endpoints with Zod validation (create, update)
- ✅ `questions.ts` - 2 endpoints with Zod validation (create, update)
- ✅ `quizTemplates.ts` - 2 endpoints with Zod validation (create, update)
- ✅ `gameControl.ts` - 1 endpoint with Zod validation (set question)
- ✅ All other files (`users.ts`, `teachers.ts`, `student.ts`, `players.ts`) - Only GET endpoints, no validation needed

**Backend API Request Validation: 100% Complete ✅**

### Prisma Integration Notes

When designing shared types that map to Prisma models, handle nullable fields correctly:

- Use `| null` for fields that are nullable in Prisma schema (marked with `?`)
- Ensure database queries include all required fields when using relations
- Transform `null` to `undefined` only when necessary for frontend consumption

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
