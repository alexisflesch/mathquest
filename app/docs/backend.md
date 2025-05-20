# MathQuest Backend Documentation

This document is the main entry point for understanding the MathQuest backend. It provides a summary of the backend's architecture, real-time logic, and state management. For in-depth technical details, see the documentation in `/docs/backend/`.

---

## Overview

The MathQuest backend is a modern, scalable Node.js server built with TypeScript, Prisma (PostgreSQL), Socket.IO, and Redis. It powers all real-time quiz, tournament, and classroom game features, as well as user management and data persistence.

- **Node.js + TypeScript**: Robust, type-safe backend foundation
- **Prisma ORM**: Type-safe database access (PostgreSQL)
- **Socket.IO**: Real-time communication for quizzes, tournaments, dashboards, and projectors
- **Redis**: Fast in-memory store for game state, participants, answers, and leaderboards
- **Express**: REST API (see `/docs/api/` for endpoint details)

---

## Key Concepts

- **Unified User Model**: All users (students, teachers) are in a single table, with role-based logic and optional profile extensions.
- **Game Templates & Instances**: Teachers create templates, launch game instances, and control game flow. Students join via access codes.
- **Real-Time State**: All active game state is managed in Redis for speed and horizontal scaling.
- **Event-Driven Logic**: All client actions (join, answer, dashboard control) are handled via Socket.IO events.
- **Extensible Services**: Business logic is organized in service classes for users, questions, templates, games, and participants.

---

## Where to Find More

- [Backend Technical Guide](./backend/README.md): Full architecture, event flow, and state management details
- [Backend Architecture Deep Dive](./backend/backend-architecture.md): Event flows, handler structure, and in-memory models
- [Timer System & Bugs](./backend/timer-bugs.md): Timer logic and fixes
- [Refactoring Live Logic](./backend/refactor-live-logic.md): DRYing up quiz/tournament logic
- [Database Model](./database.md): Full schema and data model reference

---

## API Reference

API endpoint documentation is in `/docs/api/`.

---

_Last updated: 2025-05-20_
