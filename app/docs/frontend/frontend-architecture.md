<!-- filepath: /home/aflesch/mathquest/app/docs/frontend/frontend-architecture.md -->
# MathQuest Frontend – Exhaustive Technical Reference

_Last updated: June 2, 2025_

## Purpose
Detailed technical reference for the MathQuest frontend, including app structure, core components, hooks, state/data flows, and event mapping with the unified 4-state authentication system.

## See Also
- [Frontend README](./README.md)
- [Hooks Reference](./hooks.md)
- [Socket Integration](./socket.md)
- [Timer Management](./timer-management.md)
- [Component Library](./components.md)

---

## Table of Contents
- App Pages
- Core Components
- Hooks
- State, Real-Time, and Data Flows
- Authentication System
- Styling, Theming, and Logging
- Identity, Auth, and LocalStorage
- UI-to-Backend Event Mapping

---

## App Pages

### `/src/app/layout.tsx`
- **Purpose:** Root layout for the app. Wraps all pages with global providers (AuthProvider, MathJaxContext), global styles, and navigation (AppNav). Manages sidebar state and client-side logging (toggle log level with Ctrl+Shift+D).
- **Patterns:** All real-time/auth context is initialized here. Logging is demonstrated and can be toggled at runtime.

### `/src/app/leaderboard/[code]/page.tsx`
- **Purpose:** Displays the leaderboard for a completed tournament.
- **Features:**
  - Fetches leaderboard and tournament info from API.
  - Highlights current user (username/avatar from localStorage).
  - Shows live/differed icons, sharing button, and link to play in differed mode if allowed.
- **Data:** Uses localStorage for identity, fetches leaderboard and canPlayDiffered from API.

### `/src/app/live/[code]/page.tsx`
- **Purpose:** Main student-facing tournament gameplay page.
- **Features:**
  - Connects to Socket.IO for real-time tournament events.
  - Handles question display, answer submission, timer, pause/resume, and explication overlays.
  - Supports both live and differed modes, and a dev mode for testing.
- **State:** Tracks current question, timer, answers, paused state, explication overlay, and more.
- **Socket Events:** Handles all tournament and quiz events, including question, timer, answer result, explication, and redirects.

### `/src/app/lobby/[code]/page.tsx`
- **Purpose:** Tournament lobby/waiting room before tournament starts.
- **Features:**
  - Real-time participant list via Socket.IO.
  - Shows creator, code, share button, and participant avatars.
  - Handles countdown and redirect to tournament on start.
  - Handles both classic and quiz-linked tournaments (immediate vs countdown redirect).
- **Identity:** Uses AuthProvider and localStorage for identity.

### `/src/app/my-tournaments/page.tsx`
- **Purpose:** Shows tournaments created and played by the current user (student).
- **Features:**
  - Fetches from API using cookie_id from localStorage.
  - Lists created tournaments (with lobby links) and played tournaments (with leaderboard links).

### `/src/app/teacher/dashboard/[quizId]/page.tsx`
- **Purpose:** Teacher dashboard for controlling a quiz.
- **Features:**
  - Uses `useTeacherQuizSocket` for real-time quiz/tournament control.
  - Displays and manages questions with DraggableQuestionsList.
  - Handles tournament code management, stats, and end quiz confirmation.
  - Shows connected count, quiz status, and links to projector view.
- **Data:** Fetches quiz name, questions, and tournament code from API.

### `/src/app/teacher/projection/[quizId]/page.tsx`
- **Purpose:** Full-screen projection view for classroom display.
- **Features:**
  - Uses `useProjectionQuizSocket` for real-time updates.
  - Draggable/resizable layout (react-grid-layout) for timer, question, QR code, and podium.
  - Shows leaderboard, correct answers, and stats in real time.
  - Handles teacher authentication and tournament code fetching.

### `/src/app/teacher/quiz/create/page.tsx`
- **Purpose:** Quiz creation wizard for teachers.
- **Features:**
  - Filter and select questions, set quiz name, and save quiz to API.
  - Infinite scroll and tag search for questions.
  - Uses QuestionDisplay for previewing questions.

### `/src/app/teacher/quiz/use/page.tsx`
- **Purpose:** Quiz selection page for teachers.
- **Features:**
  - Filter/search quizzes, select one, and navigate to dashboard.
  - Uses CustomDropdown and MultiSelectDropdown for filters.

---

## Core Components

### `DraggableQuestionsList.tsx`
- **Purpose:** Drag-and-drop list of quiz questions for the teacher dashboard.
- **Features:**
  - Reordering, play/pause/stop controls, timer editing, stats, and results.
  - Visual indicators for active question and real-time sync with quiz state.
  - Uses dnd-kit for drag-and-drop and SortableQuestion for each item.

### `QuestionCard.tsx`
- **Purpose:** Renders a tournament/quiz question and its answers.
- **Features:**
  - Supports both single and multiple choice, readonly mode, correct answer highlighting, and answer stats.
  - Used in both student and projector views.

### `ClassementPodium.tsx`
- **Purpose:** Animated podium and leaderboard for top 3 and others.
- **Features:**
  - Uses framer-motion for animation, supports avatars, and zoom factor.

### `AnswerFeedbackOverlay.tsx`
- **Purpose:** Overlay for showing explication after a question ends.
- **Features:**
  - Animated timer bar, BookOpenCheck icon, auto-dismiss after duration.

### `QuestionDisplay.tsx`
- **Purpose:** Renders a question for preview/selection in quiz creation and dashboard.
- **Features:**
  - Shows question, answers, correct/wrong icons, timer, play/pause/stop, stats, and meta info.
  - Expand/collapse for details, supports editing timer and showing results.

---

## Hooks

- **useTeacherQuizSocket:** Real-time logic for teacher dashboard (quiz/tournament control, state, timer, stats, emitters).
- **useProjectionQuizSocket:** Real-time logic for projector view (state, timer, leaderboard, stats, correct answers).
- **useAuth:** Authentication context for teacher/student role and identity.

---

## State, Real-Time, and Data Flows
- **State:** Managed via React state/hooks, context (AuthProvider), and localStorage for identity.
- **Real-Time:** All live quiz/tournament logic is handled via Socket.IO, with custom hooks for each role/view.
- **Data:** API is used for fetching quiz/tournament/question data, leaderboard, and saving quizzes.

---

## Authentication System

### 4-State Authentication System ✨
The frontend implements a comprehensive 4-state authentication system:

1. **Anonymous** (`userState: 'anonymous'`)
   - No username/avatar set
   - Cannot join games or create content
   - Redirected to login/registration

2. **Guest** (`userState: 'guest'`)
   - Username and avatar set via localStorage
   - Can join games and tournaments
   - Profile stored in database with cookieId for upgradeability
   - No email/password required

3. **Student** (`userState: 'student'`)
   - Full student account with email/password
   - Can join games, view tournaments, access profile
   - Upgraded from guest or direct registration

4. **Teacher** (`userState: 'teacher'`)
   - Teacher account with admin privileges
   - Can create quizzes, manage tournaments, access dashboard
   - Requires admin password for registration/upgrade

### AuthProvider Integration
- **Unified Methods**: All authentication flows use unified backend endpoints (`/auth/register`, `/auth/upgrade`)
- **Profile Preservation**: Guest profiles (username/avatar) are preserved during upgrades
- **Backward Compatibility**: Maintains `isStudent`/`isTeacher` flags for existing components
- **Database Persistence**: Guest profiles are stored in database for reliable upgrade lookup

### Key Authentication Pages
- **`/login`**: Unified authentication page supporting all user types and upgrade flows
- **`/profile`**: Profile management with upgrade options for guests and students
- **`/student`**: Legacy guest registration (redirects to `/login?mode=guest`)

---

## Styling, Theming, and Logging
- **Styling:** Tailwind CSS via globals.css. No hardcoded styles/colors in components.
- **Theming:** Uses CSS variables for colors, supports light/dark mode.
- **Logging:** Uses clientLogger for contextual, leveled logging in all components and hooks. Log level can be toggled at runtime.

---

## Identity, Auth, and LocalStorage
- **Identity:** All pages/components use `mathquest_username`, `mathquest_avatar`, and `mathquest_cookie_id` from localStorage for user identity.
- **Auth:** Teachers use AuthProvider and `mathquest_teacher_id` for authentication.
- **Logout:** Removes all identity keys from localStorage.

---

## UI-to-Backend Event Mapping
- **Socket Events:**
  - Student: `join_tournament`, `tournament_answer`, receives `tournament_question`, `tournament_timer_update`, `explication`, `tournament_end`, etc.
  - Teacher: `join_quiz`, `quiz_set_question`, `quiz_timer_action`, `quiz_set_timer`, receives `quiz_state`, `quiz_timer_update`, `quiz_answer_stats_update`, etc.
  - Lobby: `join_lobby`, receives `participants_list`, `redirect_to_tournament`, `tournament_started`, etc.
- **API:** Used for all persistent data (quiz, tournament, leaderboard, etc).

---

*This document is auto-generated for AI agent use. Every page, component, and hook is documented based on the actual codebase. For further details, see code comments and logger output.*
