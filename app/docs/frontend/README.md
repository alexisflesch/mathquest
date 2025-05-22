# MathQuest Frontend – Technical Overview

## 1. Introduction

This frontend powers MathQuest’s interactive quiz and tournament platform. It is built with **Next.js** (App Router), **React**, **TypeScript**, and **Socket.IO** for real-time features. The codebase is modular, with a clear separation between quiz, tournament, shared UI, and socket logic.

---

## 2. Architecture Overview

- **Framework:** Next.js (App Router, SSR/SSG, API routes)
- **UI:** React, Tailwind CSS, shadcn-ui, custom components
- **Real-Time:** Socket.IO Client for live quizzes/tournaments
- **Type Safety:** TypeScript, shared types with backend
- **State:** React Context, hooks, local state, localStorage

---

## 3. Key Folders & Files

- `src/app/` – All Next.js pages and routing logic
  - `/teacher/` – Teacher dashboard, quiz management, results, login/signup
  - `/student/` – Student dashboard, join/create tournaments, practice
  - `/live/`, `/lobby/`, `/leaderboard/` – Real-time tournament flows
- `src/components/` – Reusable UI (QuizList, Scoreboard, Lobby, etc.)
- `src/hooks/` – Custom hooks for socket logic (`useTeacherQuizSocket`, `useProjectionQuizSocket`)
- `src/types/` – TypeScript types, re-exported from shared types
- `src/utils.ts` – Utility functions (e.g., time formatting)
- `public/` – Static assets

---

## 4. State Management

- **Global:** React Context (Auth, user identity, etc.)
- **Local:** React hooks for component state
- **Custom:** Hooks encapsulate socket logic and timer state
- **Persistence:** localStorage for user/session info

---

## 5. Real-Time & Data Flow

- **Socket.IO** connects to backend for:
  - Quiz/tournament state sync
  - Real-time question/answer/timer events
  - Live participant and leaderboard updates
- **Hooks** abstract socket logic for both teacher and projection views

---

## 6. Core Components

- **Quiz Components:** `QuizList`, `QuestionDisplay`, `AnswerFeedbackOverlay`, etc.
- **Tournament Components:** `Lobby`, `Scoreboard`, `TournamentTimer`, etc.
- **Shared UI:** `AppNav`, `Snackbar`, `ConfirmDialog`, `AvatarSelector`, etc.

---

## 7. Routing Structure

- `/` – Home
- `/teacher/` – Teacher dashboard, quiz/tournament management
- `/student/` – Student dashboard, join/create/practice
- `/live/[code]` – Student live tournament
- `/lobby/[code]` – Tournament lobby
- `/leaderboard/[code]` – Tournament results

---

## 8. Styling & Theming

- **Tailwind CSS** for utility-first styling
- **shadcn-ui** for accessible UI primitives
- **Custom theming** via CSS variables

---

## 9. Logging & Debugging

- **Custom logger** with runtime log level toggle (Ctrl+Shift+D)
- **Client-side logging** for debugging real-time flows

---

## 10. Extending & Contributing

- Add new pages in `src/app/`
- Add new UI in `src/components/`
- Add new socket logic in `src/hooks/`
- Types should be added to `src/types/` or shared types

---

## 11. Documentation Standards

> **It is mandatory to keep the documentation up to date when working on shared components or shared types.**
>
> - When you add, remove, or change props or logic in any shared component (see [components.md](components.md)), update the documentation accordingly.
> - When you change or add shared types, update the relevant docs and type references.
> - This ensures maintainability for all contributors and AI agents.

---

## 12. Further Reading

- [Frontend Architecture](frontend-architecture.md)
- [Custom React Hooks](hooks.md)
- [Socket Integration](socket.md)
- [UI Component Library](components.md) *(if available)*
- [Backend API Reference](../api/)
