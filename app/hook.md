# MathQuest Hooks - Technical Reference

This document provides a comprehensive reference for all custom React hooks used in the MathQuest codebase. Hooks encapsulate reusable logic for state management, real-time socket communication, authentication, and side effects. They are typically located in `/src/hooks/` and are used throughout the frontend to keep components clean and logic modular.

---

## What is a Hook?
A **hook** is a special function in React (introduced in React 16.8) that lets you use state, side effects, and other React features in function components. Hooks whose names start with `use` can also encapsulate custom logic and be reused across components.

**In MathQuest, hooks are used for:**
- Real-time socket communication (quiz/tournament logic)
- Authentication and identity context
- Timer and state synchronization
- Encapsulating side effects and shared logic

---

## Core Hooks in MathQuest

### `useTeacherQuizSocket`
- **Purpose:** Manages all real-time quiz/tournament logic for the teacher dashboard.
- **Responsibilities:**
  - Connects to the backend via Socket.IO
  - Tracks quiz state, timer status, current question, and connected count
  - Provides emitters for quiz actions (set question, pause, resume, end, set timer, update tournament code)
  - Listens for state/timer/stats updates from the server
- **Returns:**
  - `quizSocket`: The socket instance
  - `quizState`: Current quiz state object
  - `timerStatus`, `timerQuestionId`, `localTimeLeft`: Timer state
  - `connectedCount`: Number of connected clients
  - `emitSetQuestion`, `emitEndQuiz`, `emitPauseQuiz`, `emitResumeQuiz`, `emitSetTimer`, `emitTimerAction`, `emitUpdateTournamentCode`: Action emitters

### `useProjectionQuizSocket`
- **Purpose:** Handles real-time updates for the projector/classroom view.
- **Responsibilities:**
  - Connects to backend via Socket.IO
  - Tracks quiz state, timer, leaderboard, stats, and correct answers
  - Listens for all relevant events for the projector view
  - Exposes setters for local timer state (for animation)
- **Returns:**
  - `quizSocket`, `quizState`, `timerStatus`, `timerQuestionId`, `timeLeft`, `localTimeLeft`, `setLocalTimeLeft`, `connectedCount`

### `useAuth`
- **Purpose:** Provides authentication and identity context for teachers and students.
- **Responsibilities:**
  - Reads/writes identity from localStorage (`mathquest_pseudo`, `mathquest_avatar`, `mathquest_cookie_id`, `mathquest_teacher_id`)
  - Exposes `isTeacher`, `isStudent`, `teacherId`, and login/logout helpers
  - Used by AuthProvider to wrap the app and provide context

---

## General Hook Patterns
- Hooks always start with `use` (e.g., `useTeacherQuizSocket`)
- Hooks can use other hooks (e.g., `useState`, `useEffect`, `useContext`)
- Hooks encapsulate logic that would otherwise clutter components
- Hooks can return state, setters, and functions for use in components
- Hooks are only called at the top level of React function components or other hooks

---

## Example Usage

```typescript
import { useTeacherQuizSocket } from '@/hooks/useTeacherQuizSocket';

const {
  quizSocket,
  quizState,
  timerStatus,
  emitSetQuestion,
  // ...other emitters
} = useTeacherQuizSocket(quizId, tournamentCode);
```

---

## Best Practices
- Use hooks to keep components focused on UI, not logic
- Always document the purpose and API of each hook
- Use hooks for all real-time, authentication, and shared logic
- Never call hooks conditionally or inside loops

---

*This document is auto-generated for AI agent use. For further details, see code comments in `/src/hooks/` and usage in components/pages.*
