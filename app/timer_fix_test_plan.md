# Timer Fix Test Plan

## Issues Fixed

1. **Confirmation Dialog State Management**
   - Fixed `setPendingPlayIdx` to use `mappedQuestions` instead of `questions`
   - Added proper logging to confirmation dialog functions
   - Fixed `confirmPlay` to use new `emitTimerAction` API instead of deprecated `emitSetQuestion`

2. **Missing Confirmation Dialog Handlers**
   - `confirmPlay` function now properly stops current timer and starts new one
   - `cancelPlay` function now has proper logging
   - Updated function dependencies to include all necessary values

3. **Timer State Synchronization**
   - Added logging to track when confirmation dialog should appear
   - Fixed timer action logic to handle question switching correctly

## Expected Behavior After Fix

### Scenario 1: Click play on Question A (no timer running)
- ✅ Should start timer for Question A
- ✅ No confirmation dialog should appear

### Scenario 2: Click play on Question A while Question A is playing
- ✅ Should pause Question A
- ✅ No confirmation dialog should appear

### Scenario 3: Click play on Question A while Question A is paused
- ✅ Should resume Question A
- ✅ No confirmation dialog should appear

### Scenario 4: Click play on Question B while Question A is playing/paused
- ✅ Should show confirmation dialog: "Change question? Another question is running or paused..."
- ✅ Click "Confirm" should stop Question A timer and start Question B timer
- ✅ Click "Cancel" should dismiss dialog and keep Question A timer unchanged

## Test Steps

1. Start timer for Question 1 (TEST-DL-1)
2. Click play on Question 2 (TEST-DL-2) 
   - Should show confirmation dialog
3. Click "Confirm"
   - Should stop Question 1 timer and start Question 2 timer
4. Click play on Question 2 again
   - Should pause Question 2 (no dialog)
5. Click play on Question 1 while Question 2 is paused
   - Should show confirmation dialog
6. Click "Cancel"
   - Should keep Question 2 paused

## Files Modified

- `/home/aflesch/mathquest/app/frontend/src/app/teacher/dashboard/[code]/page.tsx`
  - Fixed `handlePlay` function to use `mappedQuestions` for `pendingPlayIdx`
  - Fixed `confirmPlay` function to use `emitTimerAction` instead of `emitSetQuestion`
  - Added proper logging to track confirmation dialog state
  - Updated function dependencies
