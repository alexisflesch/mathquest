# Socket Integration in MathQuest Frontend

This document details how real-time communication is handled in the MathQuest frontend using Socket.IO. It is intended for developers and AI agents working on features involving live quizzes, tournaments, and classroom interactions.

---

## Overview

- **Library:** [socket.io-client](https://socket.io/)
- **Location:** All socket logic is encapsulated in custom React hooks in `src/hooks/`.
- **Main Hooks:**
  - `useTeacherQuizSocket` – For teacher dashboard and quiz control
  - `useProjectionQuizSocket` – For classroom/projector view

---

## Connection Pattern

- Sockets are initialized in hooks using the backend URL from a config file.
- Each hook manages its own socket instance and lifecycle (connect/disconnect, event listeners, cleanup).
- User/session identity is passed via localStorage tokens when joining rooms.

---

## Key Events & Data Flows

### Teacher Side (`useTeacherQuizSocket`)
- **Emits:**
  - `set_question`, `end_quiz`, `pause_quiz`, `resume_quiz`, `set_timer`, `timer_action`, `update_tournament_code`
- **Listens:**
  - `quiz_state`, `timer_status`, `stats_update`, `connected_count`, etc.
- **State:**
  - Tracks quiz state, timer, connected clients, and exposes emitters for UI actions.

### Projection Side (`useProjectionQuizSocket`)
- **Emits:**
  - `join_projection`, `get_quiz_state`
- **Listens:**
  - `quiz_state`, `timer_status`, `leaderboard_update`, etc.
- **State:**
  - Tracks quiz state, timer, leaderboard, and local animation state.

---

## Best Practices

- Always clean up socket listeners on unmount to avoid memory leaks.
- Use React state to reflect socket-driven updates in the UI.
- Use localStorage for persistent identity/session tokens.
- Keep all socket logic in hooks for testability and separation of concerns.

---

## Extending

- Add new events in the relevant hook and document them here.
- For new real-time features, create a new hook or extend an existing one.
- Coordinate event names and payloads with the backend team.

---

## See Also
- [Custom React Hooks](hooks.md)
- [Frontend Architecture](frontend-architecture.md)
- [Backend Socket API](../../backend/sockets/)
