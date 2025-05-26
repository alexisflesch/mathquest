# Timer Management in MathQuest Frontend

## Overview

Timer management in MathQuest is designed to keep the frontend and backend in sync while ensuring a smooth user experience for teachers, students, and projection views. This document describes how timers are managed in all supported modes (Quiz, Tournament, Self-Paced), the division of responsibilities between frontend and backend, and the expected UI behaviors.

---

## 1. Quiz Mode (Teacher-Led)

### Teacher Actions
- **Set Question:** The teacher can select a question by its UID.
- **Set Timer Value:** The teacher can set the timer's value for the current question.
- **Set Question Status:** The teacher can set the question status to `play`, `pause`, or `stop`, which affects the timer's behavior.

### Backend Responsibilities
- The backend validates all teacher actions.
- After validation, the backend sends a payload to all relevant rooms:
  - **dashboard** (teacher dashboard)
  - **live** (student devices)
  - **projector** (projection/classroom view)
- The payload includes the current question, timer value, and question state.
- **The backend does NOT send a ticking timer.**

### Frontend Responsibilities
- When a client receives a timer/question update payload, the UI must update to reflect the new state.
- If the timer status is `play`, the frontend starts a local countdown from the value provided by the backend.
- If the timer status is `pause` or `stop`, the countdown is paused or reset accordingly.
- The frontend must always trust the backend as the source of truth for timer values and status.
- The frontend must never update timer state optimistically; it only updates in response to backend events.

---

## 2. Tournament Mode

- The creator starts the tournament; after that, the backend controls the flow.
- The backend sends the current question and timer value at the start of each round.
- **No ticking timer is sent from the backend.**
- The frontend is responsible for counting down locally from the provided value if the timer is running.

---

## 3. Self-Paced (Practice) Mode

- There is **no timer** in self-paced mode.
- The user requests the next question by sending the appropriate payload to the backend.
- The backend responds with the next question; no timer management is required.

---

## 4. Key Principles

- **Backend is the source of truth:** The frontend must always reflect the timer value and status as sent by the backend.
- **No optimistic updates:** The frontend should not change timer state until it receives confirmation from the backend.
- **Local countdown:** The frontend is responsible for ticking down the timer locally, starting from the value provided by the backend, and only if the timer status is `play`.
- **Room propagation:** All timer and question updates are sent to all relevant rooms (dashboard, live, projector) to keep all clients in sync.

---

## 5. References
- See `/docs/backend/` for backend API and socket event documentation.
- See `/docs/backend/shared-types-guide.md` and `/docs/backend/type-architecture.md` for payload and type definitions.
- See `/docs/frontend/frontend-update.md` for overall frontend migration and update tasks.

---

## 6. FAQ

**Q: What happens if the frontend and backend timer values get out of sync?**
- The frontend must always reset its timer to the value sent by the backend on every update event.

**Q: Can the frontend ever "guess" or "force" a timer value?**
- No. The frontend only starts a local countdown from the backend-provided value and never updates timer state without backend confirmation.

**Q: Is there ever a ticking timer sent from the backend?**
- No. The backend only sends the timer value at key events (start, pause, stop, set). The frontend is responsible for the countdown display.

---

_Last updated: 2025-05-23_
