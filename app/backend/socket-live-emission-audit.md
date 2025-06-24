# Audit: Socket Emissions to `game_${accessCode}` (Live Room)

## `/backend/src/sockets/handlers/sharedGameFlow.ts`
- **Emits to `game_${accessCode}`:**
  - `game_question` (filtered, canonical)
  - `game_timer_updated` (canonical timer payload)
  - `correct_answers` (canonical)
  - `feedback` (canonical, only if explanation exists)
  - `game_ended` (canonical)

## `/backend/src/utils/projectionLeaderboardBroadcast.ts`
- **Emits to `game_${accessCode}`:**
  - `SOCKET_EVENTS.GAME.LEADERBOARD_UPDATE` (top N leaderboard)

## `/backend/src/sockets/handlers/teacherControl/timerAction.ts`
- **Emits to `game_${accessCode}`:**
  - `game_timer_updated` (timer expiry)

## `/backend/src/sockets/handlers/teacherControl/endGame.ts`
- **Emits to `game_${accessCode}`:**
  - `game_ended` (with `accessCode`, `endedAt`)

## `/backend/src/sockets/handlers/tournamentHandler.ts`
- **Emits to `game_${accessCode}`:**
  - `tournament_starting` (countdown)
  - `countdown_tick` (countdown tick)

## `/backend/src/sockets/handlers/game/joinGame.ts`
- **Joins `game_${accessCode}`:**
  - Player joins room (no emission, just join)

## `/backend/src/sockets/utils/participantCountUtils.ts`
- **Reads `game_${accessCode}`:**
  - For counting participants (no emission)

---

# Payloads
- All payloads are canonical/shared types, validated and filtered as needed.
- Timer, question, leaderboard, and feedback events are all sent to the live room at the appropriate time.

# Next Steps
- Compare with projection emissions for redundancy, missing events, or incorrect payloads.
- Identify and fix any issues so projection always receives the correct, up-to-date question and timer events.
