# Timer Bugs and Analysis (2025-05-08)

## How the Timer System Should Work

### 1. Per-Question Timers
- Each question in a quiz should have its own independent timer object.
- The timer for each question should be stored in `quizState[quizId].questionTimers[questionId]`.
- When a question is started ("play"), its timer should be initialized to its own default value (from `question.temps` or a default, e.g., 20s).
- Pausing, resuming, or stopping a timer should only affect the timer for the current question, not others.
- Switching to a new question should never reuse the timer value from a previous question.

### 2. Timer State Transitions
- **Play:**
  - If the timer is paused, resume from the paused value.
  - If the timer is stopped or uninitialized, start from the question's initial value.
- **Pause:**
  - Only allowed if the timer is currently running (`status === 'play'` and `timestamp` is set).
  - Pausing should calculate the precise remaining time and store it in the timer object for that question.
- **Stop:**
  - Resets the timer for that question to its initial value and stops it.

### 3. Tournament Synchronization
- Tournament timer state should be synchronized with the per-question timer in the quiz.
- Each question in the tournament should also have its own timer state, not a global one.

## Bugs Observed

### 1. First Pause Resets to Full Duration
- When pausing a question for the first time, the timer resets to the full duration (e.g., 20s), not the correct remaining time.
- Log evidence: `[calculateQuestionRemainingTime] ... status=stop, timeLeft=20, timestamp=null`
- This means the timer for that question was never started (`status=stop`, `timestamp=null`), so the server cannot compute elapsed time.
- Likely cause: The timer is not set to `play` with a timestamp before the pause is attempted.

### 2. Timers Are Shared Between Questions
- Pausing one question and then starting another causes the new question to start with the last paused value (e.g., pause Q1 at 18.5s, start Q2, Q2 starts at 18.5s).
- This is exactly the bug per-question timers were meant to solve.
- Log evidence: Tournament triggers and timer updates show the same `timeLeft` being used for different questions.
- Likely cause: The timer state is being reused/shared between questions, or the code is not initializing a new timer for each question.
- There may be a global timer value (e.g., `quizState[quizId].timerTimeLeft`) being used instead of the per-question timer.

### 3. Tournament Timer Sync Issues
- Tournament timer sometimes resumes from a paused value even when a new question is started.
- Log evidence: `[TimerSet] Resuming from paused state with precise pausedRemainingTime=18.6s (ignoring any passed timeLeft)`
- This suggests the tournament state is not being reset per question, or is using a global paused value.

## What Should Be Done

### 1. Enforce Per-Question Timer Objects
- Ensure that `quizState[quizId].questionTimers[questionId]` is always used for all timer actions.
- When starting a new question, always initialize or reset its timer object to its own initial value.
- Never copy or reuse `timeLeft` from another question's timer.

### 2. Fix Timer Initialization on Play
- On "play" for a question:
  - If the timer does not exist, create it with the correct initial value.
  - If the timer exists and is not paused, reset it to the initial value.
  - Only resume from a paused value if the timer is paused for that question.

### 3. Guard Against Invalid Pause
- Only allow pausing if the timer is running (`status === 'play'` and `timestamp` is set).
- If pause is attempted in any other state, log a warning and do not process the pause.

### 4. Tournament State Sync
- Ensure tournament timer state is also per-question, not global.
- When switching questions, reset the tournament timer state for the new question.
- Never resume from a paused value unless resuming the same question.

### 5. Audit All Timer State Usage
- Search for any usage of global timer fields like `timerTimeLeft`, `timerStatus`, etc., and ensure they are only used for backward compatibility or UI, not for logic.
- All timer logic should use the per-question timer objects.

### 6. Add Logging and Tests
- Add verbose logging for timer state transitions, including questionId, status, timeLeft, and timestamp.
- Add tests for:
  - Pausing and resuming the same question
  - Switching between questions and ensuring timers are independent
  - Tournament timer sync for each question

---

**Summary:**
- The timer system must use per-question timer objects everywhere.
- Never share or reuse timer values between questions.
- Always initialize/reset timers for new questions.
- Only allow valid state transitions (e.g., pause only if running).
- Tournament state must also be per-question.

**Action:**
- Audit and patch all timer logic to enforce these rules.
- Add tests and logging to catch regressions.
