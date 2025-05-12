# TypeScript Handler Test Plan

This document outlines the testing strategy for the TypeScript-converted handlers.

## Testing Environment

- **Server**: Run with `npm run dev:ts`
- **Browser**: Access at http://localhost:3000
- **Tools**: Browser developer console for monitoring Socket.IO events

## Testing Converted Handlers

### Core State Management
- ✓ Verify `quizState.ts` and `quizUtils.ts` integrate with remaining JS modules
- ✓ Verify `tournamentUtils/tournamentState.ts` functions properly

### Quiz Management Handlers

#### 1. Set Question Handler
- [ ] Test `setQuestionHandler.ts`:
  - Create a quiz
  - Set a question
  - Verify question appears in the UI
  - Check console logs for proper execution

#### 2. Timer Action Handler
- [ ] Test `timerActionHandler.ts`:
  - Start a timer for a question
  - Stop the timer
  - Reset the timer
  - Verify timer state updates in UI

#### 3. Set Timer Handler
- [ ] Test `setTimerHandler.ts`:
  - Set a custom time for a question
  - Verify the time updates in the UI
  - Check that remaining time calculates correctly

#### 4. Lock/Unlock Handler
- [ ] Test `lockHandler.ts` and `unlockHandler.ts`:
  - Lock a quiz
  - Verify students can't submit answers
  - Unlock the quiz
  - Verify submissions are allowed again

#### 5. Pause/Resume Handler
- [ ] Test `pauseHandler.ts` and `resumeHandler.ts`:
  - Start a question timer
  - Pause the quiz
  - Verify the timer stops
  - Resume the quiz
  - Verify the timer continues from where it was paused

#### 6. End Handler
- [ ] Test `endHandler.ts`:
  - Run a quiz
  - End the quiz
  - Verify the quiz state updates correctly
  - Check that scores are calculated and displayed

## Integration Testing

1. **Tournament Integration**
   - [ ] Test that quiz handlers properly synchronize with tournament state
   - [ ] Verify that quiz and tournament timers stay in sync

2. **Multiple Client Testing**
   - [ ] Test with teacher dashboard open
   - [ ] Test with student view open
   - [ ] Test with projector view open
   - [ ] Verify all views stay in sync

## Error Cases to Test

- [ ] Attempt unauthorized actions (wrong teacher ID)
- [ ] Test with invalid question IDs
- [ ] Test with missing parameters
- [ ] Test rapid sequential actions (pause/resume/pause)

## Testing Notes

- Record any unexpected behaviors or errors
- Note any performance differences between JS and TS versions
- Document any edge cases discovered during testing
