# Time Penalty Behavior for Restarted Questions

## Overview

This document describes the time penalty system for quiz questions that are restarted by teachers. The system ensures fair scoring while providing appropriate penalties for students who answer after question restarts.

## Penalty Behavior by Session

### First Session (Original Question Display)
- **Penalty Range**: 0% to 30%
- **Calculation**: Based on total time from first question display
- **Formula**: `penalty = 30% * log(time_spent + 1) / log(time_limit + 1)`
- **Example**:
  - Answer immediately: 0% penalty
  - Answer at time limit: 30% penalty
  - Answer after time limit: 30% penalty (capped)

### Second Session (First Restart)
- **Penalty Range**: 30% to 50%
- **Calculation**: Based on current session time (pause time ignored)
- **Formula**: `penalty = 30% + (20% * log(session_time + 1) / log(time_limit + 1))`
- **Example**:
  - Answer immediately in second session: 30% penalty
  - Answer at time limit in second session: 50% penalty
  - Answer after time limit in second session: 50% penalty (capped)

### Third Session and Beyond (Multiple Restarts)
- **Penalty Range**: Fixed at 50%
- **Calculation**: Always 50% penalty regardless of answer timing
- **Rationale**: Prevents excessive penalties while maintaining fairness

## Technical Implementation

### Timer State Tracking
```typescript
interface CanonicalTimerState {
  // ... existing fields
  questionPresentedAt?: number;  // Original presentation time (never reset)
  restartCount?: number;         // Number of times question restarted
}
```

### Scoring Algorithm
```typescript
// Dynamic penalty calculation based on restart count
if (restartCount === 0) {
  // First session: 0-30%
  basePenalty = 0.3;
  maxPenalty = 0.3;
} else if (restartCount === 1) {
  // Second session: 30-50%
  basePenalty = 0.3;
  maxPenalty = 0.5;
} else {
  // Third+ session: 50% cap
  basePenalty = 0.5;
  maxPenalty = 0.5;
}

// Calculate effective time for penalty
effectiveTime = (restartCount >= 1) ? currentSessionTime : totalPresentationTime;

// Apply logarithmic penalty
penaltyFactor = min(1, log(effectiveTime + 1) / log(timeLimit + 1));
dynamicPenalty = basePenalty + ((maxPenalty - basePenalty) * penaltyFactor);
```

### Key Design Decisions

1. **Fairness**: Students who answer quickly in first session get lower penalties
2. **No Gaming**: Students cannot wait for restarts to reduce penalties
3. **Reasonable Caps**: Maximum 50% penalty prevents excessive punishment
4. **Pause Time Ignored**: For restarted sessions, only current session time counts
5. **Preserved Original Scores**: First session answers maintain their calculated scores

## Examples

### Scenario 1: Student answers quickly in first session
- First session time: 5 seconds (out of 30 second limit)
- Penalty: ~8% (logarithmic calculation)
- Final score: High (correct answer with small penalty)

### Scenario 2: Student waits for restart
- First session: Question shown for 30 seconds, student doesn't answer
- Teacher restarts after 2 minute pause
- Second session: Student answers immediately
- Penalty: 30% (base penalty for second session)
- Final score: Moderate (correct answer with 30% penalty)

### Scenario 3: Student takes full time in second session
- First session: Question shown for 30 seconds, student doesn't answer
- Teacher restarts after 2 minute pause
- Second session: Student answers after 30 seconds
- Penalty: 50% (maximum for second session)
- Final score: Lower (correct answer with 50% penalty)

### Scenario 4: Multiple restarts
- Question restarted 3 times
- Student answers in fourth session
- Penalty: 50% (capped for third+ sessions)
- Final score: Consistent penalty regardless of timing

## Testing

The implementation includes comprehensive tests covering:
- First session penalty progression (0% to 30%)
- Second session penalty progression (30% to 50%)
- Third+ session penalty cap (50%)
- Pause time exclusion from penalty calculation
- Original answer score preservation

## Backward Compatibility

The system maintains backward compatibility:
- Existing first-session answers keep their scores
- New penalty behavior only applies to restarted questions
- Default values handle cases where restart count is unavailable