# MathQuest Backend Service Layer

This document catalogs the main service classes in the MathQuest backend (`backend/src/core/services/`).

## GameInstanceService
- **Purpose:** Manage game instances (creation, status, access codes, etc.)
- **Key Methods:**
  - `createGameInstance(initiatorUserId, data)`: Create a new game instance with unique access code.
  - `updateGameStatus(gameId, status)`: Update the status of a game (pending, active, paused, completed, archived).
  - `getGameInstanceByAccessCode(accessCode)`: Fetch a game instance by its access code.

## QuestionService
- **Purpose:** Handle question CRUD, validation, and metadata.
- **Key Methods:**
  - `createQuestion(userId, data)`: Create a new question.
  - `updateQuestion(data)`: Update an existing question.
  - `getQuestionById(uid)`: Fetch a question by its unique ID.
  - `listQuestions(filters)`: List/filter questions by discipline, theme, etc.

## QuizTemplateService / GameTemplateService
- **Purpose:** Manage quiz/game templates, including creation, update, and question assignment.
- **Key Methods:**
  - `creategameTemplate(userId, data)`: Create a new quiz/game template.
  - `updategameTemplate(userId, data)`: Update an existing template.
  - `addQuestionTogameTemplate(userId, id, questionUid, sequence)`: Add a question to a template.
  - `removeQuestionFromgameTemplate(userId, id, questionUid)`: Remove a question from a template.

## GameParticipantService
- **Purpose:** Manage game participants and answer submission.
- **Key Methods:**
  - `joinGame(userId, accessCode, username?, avatarEmoji?)`: Join a game as a participant.
  - `submitAnswer(userId, accessCode, data)`: Submit an answer for a participant.
  - `getParticipants(gameId)`: List all participants in a game.

## ScoringService
- **Purpose:** Handle all scoring calculations, time penalties, and answer evaluation.
- **Key Methods:**
  - `calculateAnswerScore(question, answer, serverTimeSpent, totalPresentationTime, accessCode)`: Calculate score with time penalties.
  - `submitAnswerWithScoring(gameId, userId, answerData, isDeferred)`: Submit answer and update scores.
  - `checkAnswerCorrectness(question, answer)`: Validate answer correctness.
- **Key Features:**
  - Dynamic penalty system for restarted questions (see [Time Penalty Behavior](time-penalty-behavior.md))
  - Balanced multiple-choice scoring (rewards precision, penalizes guessing)
  - Logarithmic time penalties (gentle curve, max 30-50% penalty)
  - Game scaling to exactly 1000 total points

## UserService
- **Purpose:** Manage user registration, login, upgrade, and authentication.
- **Key Methods:**
  - `registerUser(data)`: Register a new user (student or teacher).
  - `loginUser(data)`: Authenticate a user and return a JWT.
  - `upgradeUser(data)`: Upgrade a user (e.g., guest to student/teacher).
  - `getUserById(id)`: Fetch user details by ID.

---

For detailed method signatures and usage, see the source files in `backend/src/core/services/`.
