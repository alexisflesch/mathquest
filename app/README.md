This document is intended for developers and agents contributing to the MathQuest codebase.

# MathQuest - AGI Agent Guide

This guide provides technical documentation for an AI agent working on the MathQuest project. It covers the application architecture, database schema, event system, and key workflows.

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

### Quiz vs Tournament

1. **Quiz**: A collection of questions created by a teacher. It's stored in the `Quiz` table and includes:
   - Set of questions (questions_ids)
   - Configuration (type, niveaux, categories, themes)
   - Has an optional `tournament_code` field that references the code of a tournament

2. **Tournament**: The actual "game session" that uses questions. Stored in the `Tournoi` table:
   - Has its own `code` field which is a unique string used for joining
   - Can be "direct" (real-time) or "differé" (asynchronous)
   - Tracks participation status via the `statut` field
   - Keeps track of scores and leaderboard data

The relationship works as follows:
- A quiz has a `tournament_code` field that references a tournament's `code`
- A tournament has its own `questions_ids` field with the questions to be asked

## Database Schema

Located at `/prisma/schema.prisma`:

### Main Tables

1. **Question**
   - Primary key: `uid`
   - Contains question text, possible answers, type, difficulty, etc.
   - Answer format: JSON array of `{texte: string, correct: boolean}`
   - Question types: "choix_simple", "choix_multiple"

2. **Quiz**
   - Primary key: `id`
   - Stores: name, creation date, questions_ids, type, niveaux, categories, themes
   - Related to Enseignant (teacher) via `enseignant_id`
   - Has optional `tournament_code` field which references an active tournament's code

3. **Tournoi**
   - Primary key: `id`
   - Has its own unique `code` field for joining (null when not yet active)
   - Stores: name, dates, status, questions_ids, type, niveau, categorie
   - Status values: "en préparation", "en cours", "terminé"
   - Can be created by teacher or student (polymorphic creator relation)
   - Contains leaderboard data as JSON

4. **Score**
   - Relates tournaments to players with their scores
   - Unique constraint on [tournoi_id, joueur_id]

5. **Enseignant** (Teacher)
   - Primary key: `id`
   - Stores auth info (password hash), personal data

6. **Joueur** (Player)
   - Primary key: `id` 
   - Identified by `cookie_id` for anonymous participation
   - Stores pseudo, avatar, etc.

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
   - currentIndex: Current question index
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

### Tournament Creation Flow
1. Teacher creates a quiz (saved in `Quiz` table)
2. A tournament is created in the `Tournoi` table with a unique `code`
3. The quiz is updated with the `tournament_code` to link it to this tournament
4. Students join using the tournament's `code` through the lobby

### Tournament Operation Flow
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
2. **Question Sync Issues**: Check tournamentState[code].currentIndex vs quizState[quizId].currentQuestionIdx
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

- `mathquest_pseudo`: Stores the pseudo (username) for both students and teachers.
- `mathquest_avatar`: Stores the avatar filename for both students and teachers.
- `mathquest_cookie_id`: Unique identifier for gameplay and leaderboard tracking (set for both roles).
- `mathquest_teacher_id`: The teacher's database ID (set only for teachers).
- `CLIENT_LOG_LEVEL`: Controls the client logger verbosity at runtime.

All components and routes now use only `mathquest_pseudo` and `mathquest_avatar` for identity, regardless of user role. This simplifies logic and avoids ambiguity. On logout, all these keys are removed.

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
| `tournament_${code}`     | Live tournament participants     | tournament_123456      | Students (live), server  |
| `quiz_${quizId}`         | Teacher dashboard (quiz control) | quiz_abc123            | Teacher dashboard, server|
| `projection_${quizId}`   | Projector/classroom display      | projection_abc123      | Projector view, server   |
| `${code}`                | Lobby waiting room               | 123456                 | Students (lobby), server |
| `lobby_${code}`          | Quiz-linked tournament lobby     | lobby_123456           | Students (lobby), server |

**Guidelines:**
- All live gameplay events for students (questions, timer, results, etc.) are sent to `tournament_${code}`.
- Teacher dashboard events (state, timer, lock/unlock, etc.) are sent to `quiz_${quizId}`.
- Projector events are sent to `projection_${quizId}`.
- Lobby events are sent to `${code}` or `lobby_${code}` depending on context.

**Example:**
- When a student joins a live tournament, they join `tournament_${code}`.
- When a teacher controls a quiz, their dashboard joins `quiz_${quizId}`.
- When showing the projector view, it joins `projection_${quizId}`.

**Note:**
- Always use the correct room for the intended audience to avoid leaking information (e.g., do not send the full leaderboard to all students).
- When mapping between quiz and tournament, use the `tournament_code` field in the Quiz table and the `linkedQuizId` in the tournament state.

---