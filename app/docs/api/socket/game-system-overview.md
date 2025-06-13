# Game System & Socket Rooms Overview

This document provides a high-level overview of how MathQuest's game system works for all game types (tournament, quiz, practice), focusing on real-time event flows and socket room architecture for students and teachers.

---

## Game Types & Play Modes
- **Quiz:** Standard quiz game, usually single session.
- **Practice:** Practice mode, often solo or informal.
- **Tournament:** Competitive mode, can be direct (live) or deferred (asynchronous).

---

## Socket Rooms & Participants
- **Lobby Room:** All users join the lobby before the game starts. Managed via `lobby:` events.
- **Game Room:** All active players join the game room for real-time gameplay. Managed via `game:` events.
- **Tournament Room:** Tournament participants join for tournament-specific events. Managed via `tournament:` events.
- **Teacher Room:** Teacher dashboard joins a control room for monitoring and control. Managed via `game_control:` events.
- **Projector Room:** Projector clients join to display live game state. Managed via `projector:` events.

---

## Event Flow by Game Type

### 1. Quiz & Practice
- **Lobby:** Players join via `lobby:join`.
- **Game Start:** Players are moved to the game room.
- **Gameplay:**
  - Server emits `game:question` to all in the game room.
  - Players answer via `game:answer`.
  - Server emits `game:question_ended`, `game:leaderboard_update` as needed.
  - Game ends with `game:ended`.
- **Teacher/Projector:** Receive updates in their respective rooms.

### 2. Tournament (Direct/Deferred)
- **Lobby:** All participants join the tournament lobby.
- **Start:**
  - Direct: `tournament:start_tournament` triggers immediate start.
  - Deferred: Tournament may start at a scheduled time or when enough players join.
- **Gameplay:**
  - Follows same event flow as quiz/practice, but in the tournament room.
  - Tournament-specific events (`tournament:started`, etc.) are sent to all participants.
- **Teacher/Projector:** Receive updates as in quiz/practice.

---

## Game Mode Responsibilities & Event Flow Rules

### General Rule
- The backend **must NOT** send immediate feedback, score, or correct answers to participants after they submit an answer in any mode.

### Quiz Mode
- **Teacher-controlled:**
  - Only the teacher can close a question, end a game, send correct answers, and trigger feedback (by sending explicit commands to the backend).
  - The backend never auto-advances questions or sends feedback/correct answers on its own.
  - The teacher can control the timer (pause, resume, set, stop) by sending commands to the backend, which then informs all rooms via socket.
  - The teacher is responsible for requesting leaderboard computation.
  - The UI is not designed for in-app feedback; feedback is given orally by the teacher.

### Tournament Mode (Live or Deferred)
- **Backend-controlled:**
  - The backend manages all progression: sends questions, sets and manages timers, sends correct answers and feedback only after the timer ends, and moves to the next question.
  - The backend computes and sends the leaderboard after each question ends.
  - No immediate feedback: users can change their answers until the timer expires. Feedback and correct answers are only sent after the timer.
  - The backend never sends feedback or correct answers while the timer is running.

### Practice Mode
- **User-controlled:**
  - No timer is used.
  - The user requests the next question, correct answers, and feedback via socket messages.
  - When the user submits an answer, it is final (no changing answers). The backend sends correct answers and feedback immediately upon request.
  - The user requests the next question after closing feedback.
  - No score calculation is performed in practice mode.

---

## Room/Event Mapping Table
| Game Type   | Lobby Room | Game Room | Tournament Room | Teacher Room | Projector Room |
|-------------|------------|-----------|----------------|--------------|---------------|
| Quiz        | Yes        | Yes       | No             | Yes          | Yes           |
| Practice    | Yes        | Yes       | No             | Yes          | Yes           |
| Tournament  | Yes        | Yes       | Yes            | Yes          | Yes           |

---

## Real-Time Architecture Diagram

```
[Student Client] --(lobby:join)--> [Lobby Room]
   |                                   |
   |<--(lobby:participants)------------|
   |
   |--(game:join)---------------------> [Game Room]
   |<--(game:question, leaderboard, etc.)

[Teacher Dashboard] --(joins Teacher Room)-->
   |<--(game_control:question_set, etc.)

[Projector] --(joins Projector Room)-->
   |<--(projector:projector_state)

[Tournament] --(tournament:start_tournament)--> [Tournament Room]
   |<--(tournament:started, etc.)
```

---

## Notes
- All events and room logic are documented in detail in the respective event docs (`lobby.md`, `game.md`, `tournament.md`, etc.).
- Direct and deferred tournaments use the same event structure, but may differ in timing and triggers.
- For any legacy/compatibility logic, see modernization notes (should be none as of June 2025).
- These rules are critical for correct game flow and user experience. All developers must follow them to avoid bugs and confusion.
- For detailed event payloads and socket message structure, see the linked event documentation files.

---

For more, see:
- [Lobby Events](./lobby.md)
- [Game Events](./game.md)
- [Tournament Events](./tournament.md)
- [Teacher Control Events](./teacher-control.md)
- [Projector Events](./projector.md)
