# Audit: Socket Emissions to `projection_${gameId}`

## 1. `/backend/src/sockets/handlers/teacherControl/revealLeaderboardHandler.ts`
- **Line 47:**
  ```ts
  io.to(`projection_${gameId}`).emit(PROJECTOR_EVENTS.PROJECTION_LEADERBOARD_UPDATE, fullSnapshot);
  ```
  - **Payload:** `fullSnapshot` (validated by `ProjectionLeaderboardUpdatePayloadSchema`)

## 2. `/backend/src/sockets/handlers/teacherControl/setQuestion.ts`
- **Line 343:**
  ```ts
  io.to(projectionRoom).emit(SOCKET_EVENTS.PROJECTOR.PROJECTION_QUESTION_CHANGED, gameQuestionPayload);
  ```
  - **Payload:** `gameQuestionPayload` (same as live, canonical)

## 3. `/backend/src/utils/projectionLeaderboardBroadcast.ts`
- **Line 59:**
  - Prepares and logs a `projectionLeaderboardPayload` for the projection room, but emission not shown in snippet. (Check for actual emission in full file if needed.)
  - **Payload:** `{ leaderboard: leaderboard.slice(0, 20), accessCode, timestamp }`

## 4. `/backend/src/sockets/handlers/projectionHandler.ts`
- **Line 96:**
  ```ts
  await socket.join(projectionRoom);
  ```
  - **Purpose:** Socket joins projection room (not an emission)
- **Line 293:**
  ```ts
  await socket.leave(projectionRoom);
  ```
  - **Purpose:** Socket leaves projection room (not an emission)

## 5. `/backend/src/sockets/handlers/teacherControl/endGame.ts`
- **Line 155:**
  - Prepares `projectionRoom` for possible emission, but emission not shown in snippet. (Check for actual emission in full file if needed.)

## 6. `/backend/src/sockets/handlers/teacherControl/lockAnswers.ts`
- **Line 135:**
  - Prepares `projectionRoom` for possible emission, but emission not shown in snippet. (Check for actual emission in full file if needed.)

## 7. `/backend/src/sockets/handlers/teacherControl/joinDashboard.ts`
- **Line 172:**
  - Joins `projectionRoom` (not an emission)

---

# Next Steps
- Repeat this process for `game_${accessCode}` emissions.
- For any lines that only prepare the room name but do not emit, check the full file for actual emissions if needed.
- After both audits, compare emissions for correctness, redundancy, and completeness.
