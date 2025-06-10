# MathQuest Frontend – Technical Overview

_Last updated: December 2024_

## 🎉 Migration Status: COMPLETED

The live page migration project has been **successfully completed** as of December 2024. All major socket event handling, timer display, and access code generation issues have been resolved.

**📄 Complete Details:** [migration-completed-summary.md](./migration-completed-summary.md)

## Purpose
This document provides a concise technical overview of the MathQuest frontend, including architecture, key folders, state management, and real-time data flow. For detailed implementation, see the cross-referenced docs below.

## See Also
- [Frontend Architecture](./frontend-architecture.md)
- [Hooks Reference](./hooks.md)
- [Socket Integration](./socket.md)
- [Timer Management](./timer-management.md)
- [Component Library](./components.md)
- [Loading Patterns & InfinitySpin](./loading-patterns.md)

---

## 1. Introduction

MathQuest’s frontend is built with **Next.js** (App Router), **React**, **TypeScript**, and **Socket.IO** for real-time features. The codebase is modular, with clear separation between quiz, tournament, shared UI, and socket logic.

## 2. Architecture Overview
- **Framework:** Next.js (App Router, SSR/SSG, API routes)
- **UI:** React, Tailwind CSS, shadcn-ui, custom components
- **Real-Time:** Socket.IO Client for live quizzes/tournaments
- **Type Safety:** TypeScript, shared types with backend
- **State:** React Context, hooks, local state, localStorage

## 3. Key Folders & Files
- `src/app/` – Next.js pages and routing logic
- `src/components/` – Reusable UI
- `src/hooks/` – Custom hooks for socket logic
- `src/types/` – TypeScript types
- `src/utils.ts` – Utility functions
- `public/` – Static assets

## 4. State Management
- **Global:** React Context (Auth, user identity, etc.)
- **Local:** React hooks for component state
- **Custom:** Hooks encapsulate socket logic and timer state
- **Persistence:** localStorage for user/session info

## 5. Real-Time & Data Flow
- **Socket.IO** connects to backend for:
  - Quiz/tournament state sync
  - Real-time question/answer/timer events
  - Live participant and leaderboard updates
- **Hooks** abstract socket logic for both teacher and projection views

---

For more details, see the referenced docs above.
