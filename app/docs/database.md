# Database Model: Unified User Table & Game Structure

## Overview
The MathQuest backend uses a PostgreSQL database managed via Prisma ORM. The schema is designed to support flexible quiz, tournament, and classroom game logic, with a unified user model and robust support for real-time and self-paced play.

---

## Core Entities

### User
- **id**: Primary key (UUID)
- **username**: User's display name
- **email**: Unique (optional)
- **passwordHash**: Hashed password (optional, for authentication)
- **avatarUrl**: Optional avatar image
- **createdAt**: Timestamp
- **role**: Enum (`STUDENT` or `TEACHER`)
- **Relations**:
  - `createdGameTemplates`: Game templates created by this user (as teacher)
  - `initiatedGameInstances`: Game instances started by this user
  - `gameParticipations`: Participation records in games
  - `teacherProfile`/`studentProfile`: Optional 1:1 profile tables for extra fields

#### UserRole Enum
- `STUDENT`, `TEACHER`

### TeacherProfile / StudentProfile
- 1:1 extension tables for user-specific fields (e.g., `cookieId` for students)

---

### Question
- **uid**: Primary key (UUID)
- **title**: Optional title
- **text**: Main question text
- **answerOptions**: Array of possible answers (strings)
- **correctAnswers**: Array of booleans (for multiple correct answers)
- **questionType**: String (e.g., 'multiple_choice_single_answer', 'short_answer')
- **discipline**: Subject (e.g., 'math')
- **themes**: Array of topic tags
- **difficulty**: Optional integer
- **gradeLevel**: Optional string
- **author**: Optional
- **explanation**: Optional explanation for the answer
- **tags**: Array of tags
- **timeLimit**: Optional (seconds)
- **isHidden**: Optional boolean (default: false)
- **feedbackWaitTime**: Optional (seconds)
- **createdAt/updatedAt**: Timestamps
- **Relations**:
  - `gameTemplates`: Many-to-many via `QuestionsInGameTemplate`

---

### GameTemplate
- **id**: Primary key (UUID)
- **name**: Template name
- **creatorId**: User who created the template
- **gradeLevel**: Optional
- **themes**: Array of topics
- **discipline**: Optional
- **description**: Optional
- **defaultMode**: Enum (`quiz`, `tournament`, `practice`, `class`)
- **createdAt/updatedAt**: Timestamps
- **Relations**:
  - `creator`: User (teacher)
  - `questions`: Ordered list via `QuestionsInGameTemplate`
  - `gameInstances`: Instances created from this template

---

### QuestionsInGameTemplate (Join Table)
- **gameTemplateId**: FK to GameTemplate
- **questionUid**: FK to Question
- **sequence**: Integer (order in template)
- **createdAt**: Timestamp
- **Relations**:
  - `gameTemplate`, `question`
- **Constraints**:
  - Composite PK: `[gameTemplateId, sequence]`
  - Unique: `[gameTemplateId, questionUid]` (no duplicate questions per template)

---

### GameInstance
- **id**: Primary key (UUID)
- **name**: Instance name
- **gameTemplateId**: FK to GameTemplate
- **initiatorUserId**: FK to User (who started the game)
- **accessCode**: Unique code for joining
- **status**: String (`pending`, `active`, `paused`, `completed`, `archived`)
- **playMode**: Enum (`quiz`, `tournament`, `practice`, `class`)
- **leaderboard**: JSON (instance-specific leaderboard)
- **currentQuestionIndex**: Optional (for live games)
- **settings**: JSON (game-specific settings)
- **createdAt/startedAt/endedAt**: Timestamps
- **isDiffered**: Boolean (for self-paced/differed mode)
- **differedAvailableFrom/To**: Optional (window for differed mode)
- **Relations**:
  - `gameTemplate`, `initiatorUser`, `participants`

---

### GameParticipant
- **id**: Primary key (UUID)
- **gameInstanceId**: FK to GameInstance
- **userId**: FK to User
- **score**: Integer (default 0)
- **rank**: Optional (leaderboard rank)
- **timeTakenMs**: Optional (total time in ms)
- **joinedAt/completedAt/createdAt/updatedAt**: Timestamps
- **answers**: JSON (detailed answers per question)
- **Relations**:
  - `gameInstance`, `user`
- **Constraints**:
  - Unique: `[gameInstanceId, userId]` (one participation per user per game)

---

## Design Highlights
- **Unified User Model**: All users (students, teachers) are in a single table, with role-based logic and optional profile extensions.
- **Flexible Game Modes**: Support for real-time, practice, and differed (asynchronous) play via `playMode` and `isDiffered` fields.
- **Ordered Questions**: Game templates use an explicit join table to maintain question order and allow reuse.
- **Rich Participation Data**: GameParticipant stores detailed answer and timing data for analytics and leaderboards.
- **Extensible**: The schema is designed for future expansion (e.g., new roles, more game modes, richer question types).

---

## How It Works
- **Teachers** create game templates, add questions, and launch game instances.
- **Students** join games via access codes, participate in real-time or self-paced modes, and their progress is tracked in GameParticipant.
- **All relations** are managed via foreign keys and explicit join tables for clarity and data integrity.
- **Prisma** is used for all database access, migrations, and type-safe queries.

---

_Last updated: 2025-05-20_
