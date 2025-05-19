# Phase 9 Implementation Plan: Special Modes & Additional Features

## Overview
This plan details the implementation of Phase 9 for the MathQuest backend, focusing on Projector Mode, Practice Mode, Differed (Asynchronous) Mode, a full API audit, and comprehensive testing. The plan is based on project documentation, previous backend phases, and your clarifications.

---

## 1. Projector Mode

### Goals
- Provide a real-time, read-only view for classroom display.
- Show: current question, answers, timer, QR code (with game code), leaderboard, and per-question stats.
- Use a dedicated `projector_${gameId}` Socket.IO room.

### Tasks
- [ ] Create a new socket handler: `src/sockets/handlers/projectorHandler.ts`.
- [ ] Implement join/leave logic for `projector_${gameId}` room.
- [ ] Serve real-time game state from Redis:
    - Current question and possible answers
    - Timer state
    - Game code (for QR code)
    - Leaderboard (including stats for current question)
- [ ] Broadcast updates to projector clients on relevant game state changes.
- [ ] Ensure all data is read-only and no control actions are possible from projector clients.
- [ ] Handle disconnects and reconnections gracefully.
- [ ] Add integration tests for projector mode (including disconnect/reconnect scenarios).

---

## 2. Practice Mode (Self-Paced, Untimed)

### Goals
- Allow students to play quizzes or tournaments at their own pace, with no timer.
- No teacher controls; students can start, pause, and finish whenever they want within the allowed period.
- Leaderboard updates as submissions come in, tagged as "practice".

### Tasks
- [ ] Add a configuration file (e.g., `src/config/gameModes.ts`) to define practice mode parameters (availability window, etc.).
- [ ] Update `GameInstance` model and logic to support a `practice` flag and time window.
- [ ] Adapt answer submission and scoring logic to tag and process practice participations.
- [ ] Update leaderboard logic to recalculate and broadcast on each new submission.
- [ ] Ensure userID (not socketId) is used for identification in practice mode.
- [ ] Add integration tests for practice mode, including edge cases (late join, expired game, etc.).

---

## 3. Differed Mode (Timed, Asynchronous Tournament)

### Goals
- Allow students to play tournaments asynchronously, but with a timer that starts when the student begins.
- Differed mode can be enabled for any live tournament after it has been played.
- Leaderboard updates as submissions come in, tagged as "differed".
- No teacher controls; questions are pre-selected (by teacher or randomly, depending on tournament type).

### Tasks
- [ ] Update configuration to support differed mode parameters (duration, allowed window, etc.).
- [ ] Update `GameInstance` model and logic to support a `differed` flag and time window.
- [ ] Implement timer logic that starts per-user when they begin the differed tournament.
- [ ] Adapt answer submission and scoring logic to tag and process differed participations.
- [ ] Update leaderboard logic to recalculate and broadcast on each new submission.
- [ ] Ensure userID (not socketId) is used for identification in differed mode.
- [ ] Add integration tests for differed mode, including edge cases (late join, expired game, timer enforcement, etc.).

---

## 4. API Endpoints Review & Documentation

### Goals
- Full audit of all API endpoints for completeness and correctness.
- Update and document all endpoints in `docs/api/` (and/or `docs/README.md`).

### Tasks
- [ ] Review all endpoints in code and documentation.
- [ ] Ensure endpoints for new modes (projector, practice, differed) are present and documented.
- [ ] Update API docs for request/response formats, authentication, and error cases.
- [ ] Add usage examples where helpful.

---

## 5. Testing

### Goals
- Ensure robust, real-world coverage for new features.
- Follow established testing patterns (Jest, integration tests, Redis, Socket.IO, etc.).

### Tasks
- [ ] Add/extend integration tests for projector mode (real-time updates, disconnects, reconnections).
- [ ] Add/extend integration tests for practice mode (self-paced flow, leaderboard updates, edge cases).
- [ ] Add/extend integration tests for differed mode (timed, per-user flow, leaderboard updates, edge cases).
- [ ] Ensure userID-based identification is tested for all modes.
- [ ] Achieve high coverage and reliability for all new/modified code.

---

## 6. Deliverables
- New/updated socket handlers and supporting logic for all modes.
- Updated models/configuration for practice and differed modes.
- Comprehensive, up-to-date API documentation.
- Thorough integration tests for all new features.

---

## 7. Next Steps
1. Review and approve this plan.
2. Begin implementation, starting with Projector Mode socket handler and tests.
3. Proceed to Practice Mode and Differed Mode logic and tests.
4. Complete API audit and documentation.
5. Finalize with comprehensive testing and code review.

---

*Prepared: May 15, 2025*
