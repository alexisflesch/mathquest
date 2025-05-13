# Refactoring Live Game Logic (Quiz & Tournament)

## Goal

The primary goal of this refactoring effort is to reduce code duplication and improve maintainability by consolidating shared logic between the quiz and tournament modes. This will make the codebase DRYer (Don't Repeat Yourself) and easier to understand and modify in the future.

## Approach

We will create a new dedicated directory, `app/backend/sockets/sharedLiveLogic/`, to house the common functionalities. Logic from existing quiz and tournament handlers/utilities will be extracted into new, more generic modules within this shared directory.

## Initial Steps & Focus Areas

We will refactor the following areas incrementally:

1.  **Emitting Question Results & Scores:**
    *   **Current State:** The logic for emitting correct answers (`question_results` event) is partially centralized in `sharedLiveLogic/emitQuestionResults.ts`. Individual score emission was previously part of mode-specific handlers.
    *   **Refactoring Plan:**
        *   The existing `emitQuestionResults(io, roomName, questionUid, correctAnswers)` in `sharedLiveLogic/emitQuestionResults.ts` will continue to be used to broadcast the correct answers to a room (e.g., for projectors or a general student announcement).
        *   Create a **new shared function**: `emitParticipantScoreUpdate(socket: Socket, data: { questionUid: string; score: number; rank: number; totalScore?: number })` in `sharedLiveLogic/participantScoreUpdate.ts` (or a similar name).
            *   This function will send an event like `participant_score_update` directly to an individual participant's socket.
            *   The payload will include the `questionUid`, their score for that question (`score`), their current rank (`rank`), and optionally their new `totalScore`.
        *   **Tournament Flow (`handleTimerExpiration` in `tournamentHelpers.ts`):**
            1.  Call `emitQuestionResults` to send correct answers to the `live_${code}` room.
            2.  Loop through participants: calculate their score for the question and current rank.
            3.  Call `emitParticipantScoreUpdate` for each participant.
            4.  Implement a 1.5s delay (`setTimeout`).
            5.  Emit a `show_explication` event to the `live_${code}` room, including `questionUid` and `explication` text (frontend will display for 5s). (Requires `Question` type to have `explication`).
            6.  Proceed to the next question if auto-progressing.
        *   **Quiz Flow (`closeQuestionHandler.ts`):**
            1.  When the teacher clicks the "trophy" icon:
            2.  Call `emitQuestionResults` to send correct answers to the `projection_${quizId}` room and potentially to `live_${tournamentCode}` if a tournament is linked.
            3.  If a tournament is linked, loop through its participants: calculate their score for the question and current rank.
            4.  Call `emitParticipantScoreUpdate` for each relevant participant.
            5.  No explication is shown, and no automatic advance to the next question.

2.  **Sending Questions:**
    *   **Current State:** Refactored to use `sharedLiveLogic/sendQuestion.ts`. This is complete.
    *   **Refactoring Plan:** Ensure frontend correctly handles the `live_question` event and its standardized payload.

3.  **Handling Answers:**
    *   **Current State:** Separate answer handlers like `tournamentEventHandlers/answerHandler.ts`. Quiz mode doesn't have direct student answer submission in the same way.
    *   **Refactoring Plan:**
        *   Focus on `tournamentEventHandlers/answerHandler.ts`.
        *   Ensure answers are only registered if the question is active (not locked/timed out).
        *   When an answer is received (or changed):
            *   Update the participant's answer in memory.
            *   Re-calculate the score for that answer using a robust scoring utility.
            *   Update the participant's total score in memory.
            *   **Do not** send score feedback to the student immediately upon answering. Score/rank is only sent when the question concludes (see step 1).
        *   Address the `AnswerVal: undefined` warning within the scoring logic.

4.  **Scoring Logic:**
    *   **Current State:** `tournamentUtils/scoreUtils.ts` and potentially quiz-specific scoring.
    *   **Refactoring Plan:** Abstract any common scoring patterns or calculations into shared utilities if possible, while allowing mode-specific scoring rules to remain separate or extend the shared logic.

5.  **Session End/Stop Signal:**
    *   **Current State:** Logic for ending sessions and redirecting users might be duplicated.
    *   **Refactoring Plan:** Create a shared mechanism for handling the "stop" signal and managing redirection to leaderboards or other appropriate pages.

## Type-Safety Improvements

During the implementation of the shared logic for both quiz and tournament modes, we encountered and fixed several TypeScript errors to ensure type safety across the codebase:

### 1. Enhanced `emitQuestionResults` Function

The original `emitQuestionResults` function had a simple signature:

```typescript
emitQuestionResults(
  io: Server, 
  roomName: string, 
  questionUid: string, 
  correctAnswers: number[]
)
```

This was refactored to use a more flexible parameter object pattern:

```typescript
emitQuestionResults(
  io: Server,
  roomName: TournamentRoomName | QuizRoomName,
  params: QuestionResultsParams
)
```

Where:
- `TournamentRoomName` and `QuizRoomName` are template literal types for improved type safety
- `QuestionResultsParams` is an interface containing:
  ```typescript
  {
    questionUid: string;
    correctAnswers: string[] | number[]; // Allow string[] for text answers or number[] for indices
    leaderboard?: Array<{ id: string, name: string, score: number, rank: number }>;
    participantAnswers?: Record<string, any>; // Optional detailed breakdown
  }
  ```

### 2. Consistent Room Name Typing

We defined proper type constraints for room names to prevent string-related errors:

```typescript
export type TournamentRoomName = `live_${string}` | `differed_${string}` | `live_${string}_${string}`;
export type QuizRoomName = `dashboard_${string}` | `quiz_${string}` | `quiz_projector_${string}`;
```

### 3. Fixed Errors in `tournamentHelpers.ts`

- Added proper typing for room targets when emitting question results
- Ensured parameters are passed in the correct format with appropriate typing
- Fixed issues where type declarations weren't matching actual implementation

### 4. Updated Quiz and Tournament Event Handlers

- Fixed score calculation and result emission in both `closeQuestionHandler.ts` and `tournamentHelpers.ts` to use the common pattern
- Unified how leaderboard data is generated and sent to clients

### 5. Fixed Other Common Type Errors

- Removed incorrect import of non-existent `QuestionType` from `quizTypes.ts`
- Updated `BackendQuizAnswer` to include the `questionType` field for compatibility with `TournamentAnswer`
- Fixed state management to ensure indexes are properly initialized

## Next Steps

While we've made significant progress in refactoring the shared live logic and fixing type errors, there are still some type errors in other files that need attention:

1. Fix errors in `quizHandler.ts` related to incorrect arguments in `calculateScore` call
2. Address null checks in tournament event handlers (`answerHandler.ts`, `joinHandler.ts`, `resumeHandler.ts`)
3. Fix missing `Answer` export errors in `startHandler.ts` and `computeStats.ts`
4. Update `tournamentTriggers.ts` to use the correct score calculation result structure

These remaining issues should be addressed to ensure full type safety across the codebase.

## Process

We will proceed by:
1.  Identifying a piece of shared logic.
2.  Creating a new module for it in `app/backend/sockets/sharedLiveLogic/`.
3.  Moving the logic into the new module, making it generic enough for both modes.
4.  Updating the existing tournament and quiz handlers to use the new shared module.
5.  Testing thoroughly after each step.

This incremental approach will help manage the complexity and ensure stability throughout the refactoring process.
