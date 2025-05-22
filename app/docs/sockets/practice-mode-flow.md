# Practice Mode Socket Flow

This document describes the socket event flow for practice/differed mode in MathQuest.

## Overview

Practice mode (also called "differed mode") allows players to take quizzes at their own pace, without real-time competition or time pressure. The key differences from tournament or live quiz modes:

- Players complete the quiz individually (not in a room with others)
- Players must explicitly request the next question after answering
- Feedback is provided immediately after each answer
- No timer is enforced by the backend

## Event Flow Sequence

1. **Player joins the practice session**:
   ```
   Client → Server: join_game { accessCode, userId, username, isDiffered: true }
   Server → Client: game_joined { accessCode, participant, gameStatus, isDiffered: true }
   ```

2. **Player receives first question**:
   ```
   Server → Client: game_question { uid, text, answerOptions, ... }
   ```

3. **Player answers a question**:
   ```
   Client → Server: game_answer { accessCode, userId, questionId, answer, timeSpent }
   Server → Client: answer_received { questionId, timeSpent, correct, correctAnswers?, explanation? }
   ```

4. **Player explicitly requests next question**:
   ```
   Client → Server: request_next_question { accessCode, userId, currentQuestionId }
   Server → Client: game_question { uid, text, answerOptions, currentQuestionIndex, totalQuestions, ... }
   ```

5. **Steps 3-4 repeat until all questions are answered**

6. **Game completion**:
   ```
   Server → Client: game_ended { accessCode, score, totalQuestions, correct, total }
   ```

## Implementation Details

### Question Tracking

- The backend tracks completed questions using the participant's `answers` array
- Each answer includes the `questionUid`, `answer`, and time taken
- The `request_next_question` handler uses this data to determine which question to send next

### Answer Processing

- When a player answers a question, the backend:
  1. Records the answer in the database
  2. Determines if the answer is correct
  3. Sends feedback with the correct answer and explanation
  4. Waits for the player to request the next question

### Game Completion

- Game completion requires player interaction and follows this sequence:
  1. **After answering the last question:**
     - The player receives `answer_received` with feedback like any other question
     - The backend does not automatically send the game results
     - The player must review the feedback at their own pace
  
  2. **Player explicitly requests the next question after the last question:**
     - After reviewing the feedback, the player sends `request_next_question` 
     - The backend detects that there are no more questions
     - Calculates the final score (number of correct answers)
     - Sends the `game_ended` event with the results
     - Marks the participant as completed in the database

## Error Handling

Various error conditions are handled with the `game_error` event:

- Game not found
- Participant not found
- Differed mode not available (outside time window)
- Player already completed the session
- Other unexpected errors

## Frontend Considerations

The frontend should:

1. Display the question to the player
2. Allow the player to submit an answer
3. Show feedback after submitting an answer
4. Provide a "Next Question" button that triggers the `request_next_question` event
5. Display final results when the `game_ended` event is received

## Testing Practice Mode

See the integration tests in `/app/backend/tests/integration/practiceMode.test.ts` for examples of how to simulate and test the practice mode flow.
