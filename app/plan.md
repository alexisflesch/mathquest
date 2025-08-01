## Timer Modernization Checklist

**Goal:** Ensure all timer displays use canonical, drift-corrected timer state from `useSimpleTimer`.

### Phase 1: Identify and List Timer Components

- [x] List all timer-related components for refactor:
    - TimerField (in TimerDisplayAndEdit.ts)
    - TimerDisplayAndEdit.ts (parent of TimerField)
    - QuestionDisplay.tsx (uses TimerField for question timer display)
    - TournamentTimer.tsx (displays tournament timer)
    - TeacherDashboardClient.tsx (dashboard timer logic)
    - TeacherProjectionClient.tsx (TimerDisplay subcomponent and timer logic)
    - SimpleTimerTest.tsx (demo/test component for timer hook)
    - AnswerFeedbackOverlay.tsx (shows timer/progress bar for feedback overlays)

### Phase 2: Refactor Timer Components

---
## Audit Findings: Timer Components

### TimerField (in TimerDisplayAndEdit.ts)

## Ancestor/Child Analysis for Timer Modernization

**Key Principle:** Only update the furthest ancestor responsible for sourcing timer values. All child components are compliant if their parent provides canonical, drift-corrected values from `useSimpleTimer`.

### Ancestors to Update:
- TeacherDashboardClient.tsx (provides timer state to DraggableQuestionsList, SortableQuestion, QuestionDisplay, TimerField)

### Child Components (No Update Needed if Parent is Correct):
- DraggableQuestionsList.tsx

### Already Compliant:
- SimpleTimerTest.tsx (uses useSimpleTimer directly)

**Action:** Focus all refactoring efforts on ancestors. Once an ancestor is compliant, all its timer display children are automatically compliant.

### TournamentTimer.tsx
- No use of `useSimpleTimer`. Displays timer using `timerS` prop (seconds). Source of `timerS` must be verified; likely not canonical.

### TeacherDashboardClient.tsx
- Uses `useSimpleTimer` directly. All timer state and actions are sourced from the canonical, drift-corrected state. All timer-related props passed to child components are compliant. No legacy or non-canonical timer sources are used. **No update needed.**

### TeacherProjectionClient.tsx
- No direct use of `useSimpleTimer`. Has `TimerDisplay` subcomponent using `timeLeftMs` prop. Source of `timeLeftMs` must be verified; may not be canonical.

### SimpleTimerTest.tsx
- Uses `useSimpleTimer` directly. Timer state and display are canonical and compliant.

### AnswerFeedbackOverlay.tsx
- No use of `useSimpleTimer`. Uses `duration` prop for progress bar/timer display. Source of `duration` must be verified; likely not canonical.

---

- [ ] Refactor TimerField in TimerDisplayAndEdit.ts to use canonical drift-corrected timer value
- [ ] Refactor parent logic in TimerDisplayAndEdit.ts to pass canonical timer value
- [ ] Refactor QuestionDisplay.tsx to use canonical timer state from useSimpleTimer
- [ ] Refactor TournamentTimer.tsx to use canonical timer state
- [ ] Refactor TeacherDashboardClient.tsx to use canonical timer state
- [ ] Refactor TeacherProjectionClient.tsx and its TimerDisplay to use canonical timer state
- [ ] Refactor SimpleTimerTest.tsx to use canonical timer state
- [ ] Refactor AnswerFeedbackOverlay.tsx to use canonical timer state

### Phase 3: Validation & Testing

- [ ] Validate timer display matches backend state, even with artificial drift
- [ ] Document changes and update testing steps

---
