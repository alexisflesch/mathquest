# Backend State Models: quizState, tournamentState, lobbyParticipants

This section documents the structure and relationships of the main in-memory and Redis-persisted state models used in MathQuest's backend real-time logic. These models are central to quiz, tournament, and lobby management, and are shared between backend and client via TypeScript types.

---

## Overview Table

| State Model         | Scope         | Storage         | Key Fields / Structure                | Used For                |
|---------------------|--------------|----------------|---------------------------------------|-------------------------|
| `quizState`         | Per-quiz     | In-memory + Redis| See below                             | Live quiz sessions      |
| `tournamentState`   | Per-tournament| In-memory + Redis| See below                             | Tournament sessions     |
| `lobbyParticipants` | Per-lobby    | In-memory       | See below                             | Lobby membership        |

---

## quizState

- **Type:** `QuizState` (see `shared/types/quiz/state.ts`)
- **Scope:** One per active quiz session
- **Persistence:** In-memory (Node process) and Redis (for recovery/failover)
- **Key Fields:**
  - `quizId: string`
  - `hostId: string`
  - `participants: Record<string, QuizParticipant>`
  - `questions: QuizQuestion[]`
  - `currentQuestionIndex: number`
  - `answers: Record<string, QuizAnswer>`
  - `leaderboard: QuizLeaderboardEntry[]`
  - `status: 'waiting' | 'in_progress' | 'finished'`
  - `startTime: number`
  - `endTime?: number`

**Diagram:**

```
QuizState
├─ quizId
├─ hostId
├─ participants: { userId → QuizParticipant }
├─ questions: [ QuizQuestion, ... ]
├─ currentQuestionIndex
├─ answers: { userId → QuizAnswer }
├─ leaderboard: [ QuizLeaderboardEntry, ... ]
├─ status
├─ startTime
└─ endTime?
```

---

## tournamentState

- **Type:** `TournamentState` (see `shared/types/tournament/state.ts`)
- **Scope:** One per active tournament
- **Persistence:** In-memory and Redis
- **Key Fields:**
  - `tournamentId: string`
  - `hostId: string`
  - `participants: Record<string, TournamentParticipant>`
  - `rounds: TournamentRound[]`
  - `currentRound: number`
  - `leaderboard: TournamentLeaderboardEntry[]`
  - `status: 'waiting' | 'in_progress' | 'finished'`
  - `startTime: number`
  - `endTime?: number`

**Diagram:**

```
TournamentState
├─ tournamentId
├─ hostId
├─ participants: { userId → TournamentParticipant }
├─ rounds: [ TournamentRound, ... ]
├─ currentRound
├─ leaderboard: [ TournamentLeaderboardEntry, ... ]
├─ status
├─ startTime
└─ endTime?
```

---

## lobbyParticipants

- **Type:** `LobbyParticipants` (see `shared/types/tournament/participant.ts`)
- **Scope:** One per lobby (quiz or tournament)
- **Persistence:** In-memory only (ephemeral)
- **Key Fields:**
  - `lobbyId: string`
  - `participants: Record<string, LobbyParticipant>`

**Diagram:**

```
LobbyParticipants
├─ lobbyId
└─ participants: { userId → LobbyParticipant }
```

---

## Relationships

- **quizState** and **tournamentState** are persisted to Redis for recovery and multi-instance support. `lobbyParticipants` is ephemeral and rebuilt on reconnect.
- `participants` in all models are keyed by `userId` and reference user/session data.
- `quizState` and `tournamentState` are linked to their respective lobbies by `quizId` or `tournamentId`.

---

> **See also:**
> - Type definitions in `shared/types/quiz/state.ts`, `shared/types/tournament/state.ts`, and `shared/types/tournament/participant.ts`
> - Socket event flows in `docs/sockets/event-reference.md`
