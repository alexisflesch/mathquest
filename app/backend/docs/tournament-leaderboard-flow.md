# MathQuest Backend: Tournament Answer and Leaderboard Flow

## Tournament Answer Flow

1. **Player submits answer** via `tournament_answer` socket event.
2. **sharedLiveHandler.ts** handles the event:
   - Validates game state, question, and timer.
   - Stores the answer in the participant's Redis hash.
   - Does **not** immediately update the leaderboard or score.
3. **sharedGameFlow.ts** (runGameFlow):
   - After the question timer, emits `correct_answers` event.
   - Calls `gameStateService.calculateScores(accessCode, questionId)`.
   - This function:
     - Loads all participants and their answers from Redis.
     - Calculates correctness and score for each participant.
     - Updates each participant's score in Redis.
     - Updates the leaderboard ZSET in Redis.

## Leaderboard Endpoint

- `/api/v1/games/:accessCode/leaderboard` calls `getFormattedLeaderboard` in `gameStateService.ts`.
- This reads the leaderboard ZSET and participant hashes from Redis.
- Returns an array of leaderboard entries with userId, username, avatarEmoji, and score.

## Debugging Empty Leaderboard

- If the leaderboard is empty after answers:
  - Check that `calculateScores` is called after each question (it is, in `runGameFlow`).
  - Ensure answers are stored in Redis before `calculateScores` runs.
  - If answers are rejected as 'late' (see logs), participants will have no valid answers, so no score is awarded.

## Known Issue

- If the timer is not started or is paused, all answers are rejected as 'late'.
- This can happen if the timer logic in `runGameFlow` or game state initialization is incorrect.

## Recommendations

- Review timer initialization in `runGameFlow` and game state.
- Ensure the timer is started and not paused when the question is sent.
- Consider adding debug logs for timer state at each step.

---

_Last updated: 2025-05-20_
