This document is intended for developers and agents contributing to the MathQuest codebase.

# MathQuest - AGI Agent Guide

## 🎉 Live Page Migration Completed (December 2024)

The frontend socket event migration project has been **successfully completed**. All major issues including timer display, access code generation, and socket event handling have been resolved. Sequential numeric access codes starting from 3141 are now in production.

**📄 See:** [`frontend/migration-completed-summary.md`](frontend/migration-completed-summary.md) for complete technical details.

## Documentation Structure

The documentation is organized into logical categories to help you quickly find the information you need. For a visual map of the documentation structure, see the [Documentation Map](./documentation-map.md).

### Core Documentation
- [Overview](./overview/README.md): High-level overview of the MathQuest project
- [Setup Guide](./setup/README| `game_${code}`     | Live tournament participants     | game_123456      | Students (live), server  |md): How to set up the development environment
- [Architecture](./architecture/README.md): System architecture and design decisions

### Technical Documentation
- [Backend](./backend/README.md): Backend architecture and APIs
- [Frontend](./frontend/README.md): Frontend architecture and components
- [API](./api/README.md): API endpoints and specifications
- [Socket Communication](./sockets/README.md): Socket.IO implementation and events
- [Type System](./types/README.md): Shared types and type validation
- [Project Management](./project/README.md): TODO lists, migration status, and priorities
- [Testing](./tests/README.md): Backend and socket testing strategy and conventions
- [Troubleshooting](./troubleshooting/README.md): Solutions for common issues and debugging tips
- [Security Practices](./security.md): Authentication, authorization, and security guidelines
- [Environment Variables](./environment-variables.md): Reference for all required environment variables
- [Monitoring & Operations](./monitoring.md): Production monitoring, logging, and scaling
- [TypeScript Enforcement](./typescript_enforcing.md): Strict typing for Socket.IO and event payloads
- [Shared Types Guide](./shared-types-guide.md): How to use and extend shared types
- [Type Architecture](./type-architecture.md): Type system structure and best practices
- [Documentation Standards](./documentation-standards.md): Guidelines for writing and maintaining docs

### Quick Links
- [Project Overview](./overview/project-overview.md): What is MathQuest?
- [TypeScript Guide](./types/typescript-guide.md): Guide to TypeScript usage
- [Socket Guide](./sockets/socket-guide.md): Guide to Socket.IO implementation
- [Contribution Guide](./contributing.md): How to contribute as an AI agent or human collaborator

### Archive
- Historical documentation and obsolete files have been moved to the [archive/](./archive/) directory

## VERY IMPORTANT: Documentation & Code DRYness

> **MANDATORY: All changes to backend, frontend, hooks, or API logic must be reflected and documented in the corresponding technical reference files:**
>
> - [Backend Documentation](./backend/backend-architecture.md): Backend/server architecture, event flows, and state
> - [Frontend Documentation](./frontend/frontend-architecture.md): Frontend architecture, UI flows, and state
> - [React Hooks](./frontend/hooks.md): All custom React hooks and their APIs
> - [API Reference](./api/api-reference.md): All API endpoints, request/response, and business logic
>
> **Core Technical Guides:**
> - [TypeScript Guide](./types/typescript-guide.md): Comprehensive TypeScript integration and migration guide (includes ESLint configuration)
> - [Socket Guide](./sockets/socket-guide.md): Complete Socket.IO implementation and testing guide
>
> **Documentation Standards:**
> - [Documentation Standards](./documentation-standards.md): Guidelines for creating and maintaining documentation
>
> **Supporting Documentation:**
> - All completed project phases and cleanup plans have been moved to the [archive/](./archive/) directory
>
> **You MUST update these files whenever you modify or add backend, frontend, hook, or API code.**
>
> **DRY Principle:**
> - Always check for existing utilities, components, or logic before writing new code.
> - Reuse and refactor existing code where possible to keep the codebase maintainable and avoid duplication.
> - Document any new abstractions or shared logic in the appropriate technical reference file.

## Project Overview

MathQuest is an educational platform for creating and participating in math tournaments. Teachers can create quizzes/tournaments, and students can join these tournaments to answer questions in real-time or in "differed" (self-paced) mode.

## Development Guidelines

> **IMPORTANT: Code Standards & Best Practices**
>
> - **Code Organization**: Code should be factored and split into "small files" (<500 lines) as much as possible
> - **Comments**: All files should be commented, with a descriptive header comment explaining the file's purpose and functionality 
> - **Logging**: Use the centralized logger utility for all server-side logging. See the Logging section below for details.
> - **Documentation**: All technical changes/additions should be reflected in this README file
> - **Styling**: use globals.css and never hardcode styles/colors in components
> - **Best Practices**: When multiple implementation options are available, always choose the industry best practice

## Logging System

MathQuest implements a centralized, configurable logging system for both server-side and client-side components:

### Server-Side Logger Utility

The core logger utility is located at `logger.js` in the root directory. It provides:

- **Log Levels**: Four severity levels (DEBUG, INFO, WARN, ERROR)
- **Contextual Logging**: Each component creates its own logger instance with a unique context identifier
- **Timestamps**: All logs include ISO-formatted timestamps
- **Color Coding**: Console output is color-coded by severity for better readability
- **Environment-based Configuration**: Default log levels differ between production and development

### Using the Server-Side Logger

To use the logger in a module:

```javascript
const createLogger = require('@logger');
const logger = createLogger('ComponentName');

// Then use the appropriate level methods
logger.debug('Detailed debugging information');
logger.info('Normal operational information');
logger.warn('Warning that might need attention');
logger.error('Error condition', errorObject);
```

### Client-Side Logger Utility

For browser-side logging, the client logger utility is located at `src/clientLogger.ts`. It offers similar functionality to the server logger:

- **Log Levels**: Same four severity levels (DEBUG, INFO, WARN, ERROR)
- **Contextual Logging**: Each component creates its own logger instance
- **Timestamps**: All logs include time with millisecond precision
- **Color Coding**: Browser console output uses CSS styles for visual distinction
- **Environment-based Configuration**: Default levels change between production and development
- **Runtime Configuration**: Log levels can be changed dynamically without redeployment

### Using the Client-Side Logger

To use the logger in a client-side component:

```typescript
import { createLogger } from '../clientLogger';
const logger = createLogger('ComponentName');

// Then use the appropriate level methods
logger.debug('Detailed debugging information');
logger.info('Normal operational information');
logger.warn('Warning that might need attention');
logger.error('Error condition', errorObject);
```

### Dynamically Changing Client Log Level

The client logger also supports changing the log level at runtime:

```typescript
import { setLogLevel } from '../clientLogger';

// Set to debug for detailed logging
setLogLevel('DEBUG');

// Or disable all logs
setLogLevel('NONE');
```

### Log Level Guidelines

Choose the appropriate log level:

- **DEBUG**: Detailed information useful during development (socket IDs, room memberships, state details)
- **INFO**: Normal operational events (connections, tournament starts/ends, question changes)
- **WARN**: Conditions that don't cause errors but should be addressed (unauthorized access attempts, resource not found)
- **ERROR**: Critical issues that impair functionality (database errors, invalid states)

### Runtime Configuration

#### Server-Side

The server log level can be adjusted at runtime by setting the `LOG_LEVEL` environment variable to one of:
- `DEBUG` (most verbose)
- `INFO` (default in development)
- `WARN` 
- `ERROR` (default in production)
- `NONE` (suppress all logs)

For example:
```
LOG_LEVEL=DEBUG node server.js
```

#### Client-Side

The client log level can be configured in three ways:

1. **Build-time environment variable**: Set `NEXT_PUBLIC_CLIENT_LOG_LEVEL` in your `.env` file
2. **Runtime via localStorage**: The value is persisted across page reloads
3. **Programmatically**: Using the `setLogLevel()` function

When deploying to production, set `NEXT_PUBLIC_CLIENT_LOG_LEVEL=NONE` or `NEXT_PUBLIC_CLIENT_LOG_LEVEL=ERROR` to minimize console output.

## Technologies

- **Frontend**: Next.js, React, TypeScript
- **Backend**: Node.js with Express (with server.js)
- **Real-time Communication**: Socket.IO
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Authentication**: Custom auth (with AuthProvider component)

## Core Concepts

MathQuest is an educational platform for creating and participating in math games. Teachers can design reusable quiz structures, and students can join specific game sessions to answer questions in real-time or in a self-paced practice mode.

### Key Entities

1.  **`QuizTemplate`**: This represents the blueprint of a quiz. It's created by a `Teacher` and contains:
    *   A defined set of `Question`s, including their specific order.
    *   Default settings like `PlayMode` (e.g., `class`, `tournament`, `practice`), `gradeLevel`, and `themes`.
    *   This is a reusable template that can be used to launch multiple game sessions.

2.  **`GameInstance`**: This represents an actual "game session" or a specific playthrough of a `QuizTemplate`. It has:
    *   A unique `accessCode` for `Player`s to join.
    *   Its own `PlayMode`, which can override the default from the `QuizTemplate`.
    *   A list of `GameParticipant`s (players who have joined this specific session).
    *   A dedicated leaderboard for this session.
    *   Tracks the game's `status` (e.g., `pending`, `active`, `finished`).

3.  **`Question`**: An individual math question with its text, answer choices, correct answer, `gradeLevel`, `themes`, `difficulty`, and an optional `explanation`.

4.  **`Teacher`**: An educator who can create `QuizTemplate`s and launch `GameInstance`s.

5.  **`Player`**: A participant in a `GameInstance`. Can be anonymous or eventually linked to an account.

### Play Modes

*   **`class`**: Typically teacher-led, questions are presented one by one to the whole group.
*   **`tournament`**: Competitive mode, often timed, with a focus on leaderboards.
*   **`practice`**: Self-paced mode for individual students.

## Database Schema

Located at `/prisma/schema.prisma`. The schema has been refactored to improve clarity and support new features.

### Main Models

1.  **`Question`**
    *   Primary key: `id` (UUID)
    *   Fields: `text`, `responses` (JSON, array of `{text: string, correct: boolean}`), `type` (e.g., `single_choice`, `multiple_choice`), `difficulty`, `gradeLevel`, `themes` (array of strings), `explanation` (optional string), `teacherId` (links to `Teacher`).

2.  **`QuizTemplate`**
    *   Primary key: `id` (UUID)
    *   Fields: `title`, `description` (optional), `defaultPlayMode` (`PlayMode` enum), `gradeLevel`, `themes`, `teacherId` (links to `Teacher`).
    *   Relation: `questions` (many-to-many with `Question` via `QuestionsInQuizTemplate` to define order).

3.  **`QuestionsInQuizTemplate`** (Join Table)
    *   Primary keys: `quizTemplateId`, `questionUid`
    *   Field: `order` (integer, for question sequencing).
    *   Relations: `quizTemplate` (links to `QuizTemplate`), `question` (links to `Question`).

4.  **`GameInstance`**
    *   Primary key: `id` (UUID)
    *   Fields: `accessCode` (unique string for joining), `status` (e.g., `pending`, `active`, `finished`), `playMode` (`PlayMode` enum), `quizTemplateId` (links to `QuizTemplate`), `teacherId` (links to `Teacher`).
    *   Relations: `participants` (one-to-many with `GameParticipant`), `quizTemplate` (links to `QuizTemplate`).

5.  **`GameParticipant`**
    *   Primary key: `id` (UUID)
    *   Fields: `score` (integer), `gameInstanceId` (links to `GameInstance`), `userId` (links to `Player`).
    *   Relations: `gameInstance`, `player`.

6.  **`Teacher`**
    *   Primary key: `id` (UUID)
    *   Fields: `username`, `email` (unique), `passwordHash`.
    *   Relations: `questionsCreated` (one-to-many with `Question`), `quizTemplatesCreated` (one-to-many with `QuizTemplate`), `gameInstancesHosted` (one-to-many with `GameInstance`).

7.  **`Player`**
    *   Primary key: `id` (UUID)
    *   Fields: `username` (unique), `avatar` (optional string), `cookieId` (optional, for anonymous tracking), `email` (optional, unique), `passwordHash` (optional).
    *   Relation: `gameParticipations` (one-to-many with `GameParticipant`).

### Enums

*   **`PlayMode`**: `class`, `tournament`, `practice`.

## Application Architecture

### Server Setup

- **Entry point**: `server.js` - Initializes Next.js and Socket.IO
- **Socket handlers**:
  - `lobbyHandler.js`: Manages lobby room participants
  - `tournamentHandler.js`: Manages tournament gameplay and scoring
  - `quizHandler.js`: Manages teacher dashboard and quiz control

### State Management

The application uses in-memory state objects for real-time functionality:

1. **tournamentState**: Tracks active tournaments with:
   - participants: Map of players in the tournament
   - questions: Array of question objects
   - currentQuestionUid: UID of the current question
   - answers: Recorded answers from players
   - timer: Question timer control
   - paused: Whether the tournament is paused

2. **quizState**: Tracks teacher dashboard state with:
   - currentQuestionIdx: Index of active question
   - questions: Array of questions
   - chrono: Timer state {timeLeft, running}
   - locked: Whether students can still answer
   - profSocketId: Socket ID of the teacher

3. **lobbyParticipants**: Tracks users waiting in lobby by code

## Socket Events System

### Tournament Events

1. **From Client to Server**:
   - `join_tournament`: Client joins a tournament room
   - `tournament_answer`: Client submits an answer
   - `start_tournament`: Teacher starts a tournament

2. **From Server to Client**:
   - `tournament_question`: Sends question to participants
   - `tournament_timer_update`: Updates timer status
   - `quiz_update`: Updates from teacher dashboard
   - `tournament_end`: Notifies tournament completion

### Quiz/Teacher Dashboard Events

1. **From Client to Server**:
   - `join_quiz`: Teacher joins quiz room
   - `quiz_set_question`: Sets active question
   - `quiz_timer_action`: Controls timer (play/pause/stop)
   - `quiz_lock/unlock`: Controls answer submissions

2. **From Server to Client**:
   - `quiz_state`: Full state update
   - `quiz_timer_update`: Timer state only

## Key Workflows

### Game Creation and Participation Flow
1.  A `Teacher` creates a `QuizTemplate`, defining its questions, their order, and default settings (e.g., `defaultPlayMode`). This is saved to the database.
2.  To start a game, the `Teacher` launches a `GameInstance` based on a `QuizTemplate`. This `GameInstance` gets a unique `accessCode`.
3.  `Player`s join the `GameInstance` using this `accessCode`. Their participation is recorded in the `GameParticipant` table, linked to the specific `GameInstance`.
4.  The game proceeds according to the `playMode` of the `GameInstance`. Scores are tracked per `GameParticipant`.
5.  Each `GameInstance` has its own distinct leaderboard.

### Tournament Operation Flow (Example for `tournament` PlayMode)
1. Teacher dashboard sends `quiz_timer_action` or `quiz_set_question`
2. Server updates both `quizState` and `tournamentState`
3. Server broadcasts `quiz_update` to tournament clients
4. Client UI reacts to timer changes (pause/resume/stop)
5. Students submit answers with `tournament_answer`
6. Server calculates scores based on correctness and timing

### Scoring System
- Base score awarded for correct answers
- Bonus points for faster responses
- Multiple choice questions can have partial scoring
- Scores are stored in the `Score` table and as a leaderboard JSON

## Frontend Structure

- `/src/app`: Next.js app router structure
- `/src/components`: Reusable UI components
- `/src/app/tournament/[code]/page.tsx`: Tournament participation page
- `/src/app/teacher/dashboard/*`: Teacher dashboard
- `/src/app/lobby/[code]/page.tsx`: Tournament lobby

## Troubleshooting Common Issues

1. **Socket Disconnections**: Check socket room membership with io.sockets.adapter.rooms
2. **Question Sync Issues**: Check tournamentState[code].currentQuestionUid vs quizState[quizId].currentQuestionIdx
3. **Timer Problems**: Check for paused state and pausedRemainingTime in tournamentState

## Event Handling Between Quiz and Tournament

The communication between quiz (teacher dashboard) and tournament (student view) is bidirectional:

1. When teacher actions occur in the dashboard:
   - `quiz_timer_action` → server maps to tournament → `quiz_update` sent to students
   - Teacher advances question → `tournament_question` sent to students

2. When tournament events occur:
   - Question timers expire → updates sent to teacher dashboard
   - Student answers → stats aggregated for teacher view

This integration ensures that teacher controls drive the tournament experience while providing teachers with real-time feedback on student performance.

## Project Structure

The workspace has the following structure:

### Root Directories
- `/sockets/`: Socket.IO event handlers and state management
  - `lobbyHandler.js`: Manages waiting room functionality
  - `tournamentHandler.js`: Core tournament gameplay logic
  - `quizHandler.js`: Teacher dashboard control
  - `quizState.js`: In-memory state management for quizzes
  - `quizEvents.js`: Quiz-related event handlers
- `/prisma/`: Database schema and migrations
- `/public/`: Static assets, including avatar images
- `/src/`: Application source code
  - `/app/`: Next.js app router pages
  - `/components/`: Reusable React components
  - `/types/`: TypeScript type definitions
- `/teacher/`: Teacher-specific functionality
  - `/dashboard/`: Teacher control panel
  - `/projection/`: Classroom display mode

### Key Files
- `server.js`: Main entry point combining Next.js and Socket.IO
- `example.env`: Template for environment variables
- `db/index.js`: Database connection setup

## Environment Setup

The application requires several environment variables defined in a `.env` file:

```
DATABASE_URL="postgresql://username:password@localhost:5432/mathquest"
NEXTAUTH_SECRET="your-secret-here"
NEXT_PUBLIC_API_URL="http://localhost:3007"
```

Use the `example.env` as a starting point.

## API Routes

Key API endpoints include:

- `/api/quiz/*`: Quiz management endpoints
- `/api/teacher/*`: Teacher-specific actions
- `/api/socket/io`: Socket.IO connection endpoint

## Special Modes

### Projector Mode

The application includes a "projector mode" designed for classroom display:
- Path: `/projector/[quizId]` 
- Purpose: Displays active questions and results on a larger screen
- Used by teachers to show questions to an entire classroom

### Differed Mode

Tournaments can be played in "differed" (asynchronous) mode:
- Students can join and complete tournaments at their own pace
- Questions are served sequentially but without real-time constraints
- Scores are recorded and added to the leaderboard

## Deployment

For production deployment:

1. Build the application:
```
npm run build
```

2. Start the production server:
```
node server.js
```

The application uses a combined server (Next.js + Socket.IO) and must be deployed in a way that supports WebSockets (not all serverless platforms do).

## Further Considerations

- **Persistence**: Socket.IO state is in-memory and will reset on server restart - consider adding Redis for state persistence
- **Authentication**: The current auth system uses simple cookie-based identification for students and password auth for teachers
- **Scaling**: For multi-server deployments, Socket.IO requires a Redis adapter for proper room functionality.

## Local Storage Usage

MathQuest uses browser localStorage to persist user identity and settings across sessions:

- `mathquest_username`: Stores the username (username) for both students and teachers.
- `mathquest_avatar`: Stores the avatar filename for both students and teachers.
- `mathquest_cookie_id`: Unique identifier for gameplay and leaderboard tracking (set for both roles).
- `mathquest_teacher_id`: The teacher's database ID (set only for teachers).
- `CLIENT_LOG_LEVEL`: Controls the client logger verbosity at runtime.

All components and routes now use only `mathquest_username` and `mathquest_avatar` for identity, regardless of user role. This simplifies logic and avoids ambiguity. On logout, all these keys are removed.

## Real-Time Lobby and Tournament Redirection

### Classic vs Quiz-Linked Tournaments

- **Classic Tournament**: When a teacher starts a classic tournament, the server emits a `tournament_started` event to all lobby clients. The lobby UI displays a countdown before redirecting students to the live tournament page (`/live/[code]`).
- **Quiz-Linked Tournament**: When a teacher starts a quiz-linked tournament from the dashboard, the server emits a `redirect_to_tournament` event to all lobby clients for that code. The lobby UI immediately redirects students to `/live/[code]` with no countdown. This ensures a seamless and immediate transition for students.

#### Implementation Details
- The backend emits `redirect_to_tournament` only for quiz-linked tournaments, and only if the tournament state is being initialized.
- The lobby page listens for `redirect_to_tournament` and performs an immediate redirect. It only shows a countdown if it receives a `tournament_started` event (used for classic tournaments).
- Students in the lobby for a quiz-linked tournament cannot see a countdown timer, as the timer signal is only sent to live participants, not to the lobby.

#### Troubleshooting
- If students ever see a countdown in the lobby for a quiz-linked tournament, this indicates a UI bug or a misrouted event. The correct behavior is always an immediate redirect for quiz-linked tournaments.

## Real-Time Room Naming Conventions

MathQuest uses Socket.IO rooms to organize real-time communication between different roles (students, teachers, projector, lobby). The naming conventions are as follows:

| Room Name                | Used For                        | Example                | Who Joins/Sends?         |
|--------------------------|----------------------------------|------------------------|--------------------------|
| `game_${code}`     | Live tournament participants     | tournament_123456      | Students (live), server  |
| `dashboard_${quizId}`         | Teacher dashboard (quiz control) | quiz_abc123            | Teacher dashboard, server|
| `projection_${quizId}`   | Projector/classroom display      | projection_abc123      | Projector view, server   |
| `${code}`                | Lobby waiting room               | 123456                 | Students (lobby), server |
| `lobby_${code}`          | Quiz-linked tournament lobby     | lobby_123456           | Students (lobby), server |

**Guidelines:**
- All live gameplay events for students (questions, timer, results, etc.) are sent to `game_${code}`.
- Teacher dashboard events (state, timer, lock/unlock, etc.) are sent to `dashboard_${quizId}`.
- Projector events are sent to `projection_${quizId}`.
- Lobby events are sent to `${code}` or `lobby_${code}` depending on context.

**Example:**
- When a student joins a live tournament, they join `game_${code}`.
- When a teacher controls a quiz, their dashboard joins `dashboard_${quizId}`.
- When showing the projector view, it joins `projection_${quizId}`.

**Note:**
- Always use the correct room for the intended audience to avoid leaking information (e.g., do not send the full leaderboard to all students).
- When mapping between quiz and tournament, use the `tournament_code` field in the Quiz table and the `linkedQuizId` in the tournament state.

## Socket.IO Testing and Troubleshooting

MathQuest includes dedicated tools for testing and troubleshooting Socket.IO connections between frontend and backend.

For a complete index of all socket-related documentation, see [socket-documentation-index.md](./archive/socket-documentation-index.md).

### Command Line Socket Test
A Node.js-based command-line tool is available for testing basic socket connectivity:

```bash
# From project root
cd /home/aflesch/mathquest/app
node socket-test.js
```

This script tests:
- Socket connection establishment
- Two-way communication via ping-pong events
- API health checks
- Connection stability and parameters

### Common Socket Connection Issues

If you encounter socket connection issues, check these common causes:

1. **CORS Configuration**: Ensure the CORS settings in `backend/server.ts` match your frontend origin
2. **Socket Path**: Verify the socket path is consistent between frontend and backend (`/api/socket/io`)
3. **Transport Settings**: Make sure both client and server support the same transports (`['websocket', 'polling']`)
4. **Server Status**: Confirm the backend server is running and accessible at the expected URL/port
5. **Environment Variables**: Check that `NEXT_PUBLIC_API_URL` is set correctly in the frontend

For more detailed diagnostics and test results, see the [Socket.IO Integration and Testing Guide](./sockets/socket-guide.md).

## Answer Feedback Overlay & Explication Event

### Overview

When a tournament question timer expires, if the question has an `explication` field, the backend emits a new `explication` socket event to all participants in the tournament room. The frontend displays a floating overlay with the explanation for 5 seconds before advancing to the next question (classic mode) or before allowing the teacher to advance (quiz-linked mode).

### Backend Changes
- In `handleTimerExpiration` (tournamentHelpers.js):
  - After scoring and emitting the `tournament_question_state_update`, the server checks if the current question has an `explication`.
  - If so, emits an `explication` event: `{ questionUid, explication }` to `game_${code}`.
  - Waits 5 seconds before sending the next question or ending the tournament.
  - If no explication, proceeds as before.

### Frontend Changes
- In `/src/app/live/[code]/page.tsx`:
  - Listens for the `explication` event from the socket.
  - If in tournament mode (not quiz mode), displays the `AnswerFeedbackOverlay` component with the explanation for 5 seconds.
  - The overlay blocks main content but not the navbar.

### Event Details
- **Event name:** `explication`
- **Payload:** `{ questionUid: string, explication: string }`
- **Emitted by:** Server (after timer expires, if explication exists)
- **Received by:** Tournament participants (students)
- **UI:** Overlay with explanation, animated timer bar, and BookOpenCheck icon.

### Example

When a question ends:
- If the question has an explication, students see an overlay for 5 seconds with the explanation before the next question appears.
- If not, the next question appears immediately as before.

---

## 9. Related Documentation
- [Project Overview](overview/README.md)
- [Backend Architecture](backend/backend-architecture.md)
- [State Models](backend/state-models.md)

This directory contains documentation for the MathQuest backend, overall project, architecture, state management, and real-time logic.

---

_Last updated: 2025-05-20_