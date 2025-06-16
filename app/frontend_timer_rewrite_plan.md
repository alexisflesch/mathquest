# Frontend Timer Rewrite Plan

## 🎯 **Goal: Simple Frontend Timer System**

Keep the solid backend + shared types, rewrite only the frontend timer management.

---

## 🏗️ **New Frontend Architecture**

### 1. **Single Timer Hook**
```typescript
// Replace all timer hooks with one simple hook
export function useTimer(config: {
  gameId: string;
  accessCode: string;
  socket: Socket;
  role: 'teacher' | 'student' | 'projection';
}): {
  // Simple state
  timeLeftMs: number;
  status: TimerStatus;
  questionUid: string | null;
  
  // Simple actions (teacher only)
  startTimer: (questionUid: string, durationMs: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
}
```

### 2. **Clean Component Integration**
```typescript
// Teacher Dashboard becomes simple
function TeacherDashboard() {
  const timer = useTimer({ gameId, accessCode, socket, role: 'teacher' });
  
  const handleQuestionPlay = (questionUid: string, durationMs: number) => {
    if (timer.status !== 'stop' && timer.questionUid !== questionUid) {
      // Simple confirmation dialog
      showConfirmDialog({
        message: "Switch to different question?",
        onConfirm: () => timer.startTimer(questionUid, durationMs)
      });
    } else {
      timer.startTimer(questionUid, durationMs);
    }
  };
  
  return (
    <QuestionList 
      onPlay={handleQuestionPlay}
      currentTimer={{ ...timer }} 
    />
  );
}
```

### 3. **Uses Existing Backend Protocol**
- Emits: `timer_action` with existing `TimerActionPayload`
- Listens: `dashboard_timer_updated` with existing `GameTimerUpdatePayload`
- No backend changes needed!

---

## 📋 **Implementation Steps**

### Phase 1: Create New Timer Hook (1-2 hours)
- [ ] Create `src/hooks/useSimpleTimer.ts`
- [ ] Implement socket listeners for backend events
- [ ] Implement timer actions that emit to backend
- [ ] Add local countdown for smooth UI updates

### Phase 2: Replace Teacher Dashboard (2-3 hours)
- [ ] Update `TeacherDashboardPage` to use new hook
- [ ] Simplify confirmation dialog logic
- [ ] Remove complex timer state management
- [ ] Test teacher timer controls

### Phase 3: Replace Other Views (2-3 hours)
- [ ] Update student view components
- [ ] Update projection view components
- [ ] Remove old timer hooks

### Phase 4: Cleanup (1 hour)
- [ ] Delete old timer hooks
- [ ] Remove unused timer components
- [ ] Update tests

**Total: ~6-9 hours for clean, working timer system**

---

## 🎯 **Benefits**

1. **Keeps solid backend** - No backend changes needed
2. **Uses existing types** - Leverages well-designed shared types
3. **Simple frontend** - One hook, clear responsibilities
4. **Fixes all bugs** - Clean slate eliminates inherited issues
5. **Easy maintenance** - Simple, predictable code

---

## 🚀 **Ready to Start?**

This approach leverages your existing solid foundation while eliminating the frontend complexity that's causing the bugs.

Want to start with Phase 1 (creating the new simple timer hook)?
