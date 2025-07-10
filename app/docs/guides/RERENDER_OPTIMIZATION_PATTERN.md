# React Re-render Optimization Pattern - Battery Life & Performance

## Problem Statement
Timer updates (every 100ms) were causing excessive component re-renders. This creates poor performance, unnecessary CPU usage, and drains battery life on mobile devices. The core issue affects any page with frequent updates (timers, counters, live data).

## Root Causes Identified
1. **Hook Level**: Timer updating `timeLeftMs` every 100ms but display only changing every second
2. **Component Level**: Components re-rendering unnecessarily due to object reference changes
3. **State Level**: New objects/arrays created on every render causing child component re-renders

## Complete Solution Pattern

### Phase 1: Hook Optimization ✅
**Location**: `frontend/src/hooks/useProjectionQuizSocket.ts`

#### 1.1 Optimize Timer Value Updates
```typescript
// Instead of updating every 100ms, only update when display value changes
const [optimizedTimeLeftMs, setOptimizedTimeLeftMs] = useState<number | undefined>(timerState?.timeLeftMs);
const [optimizedTimerStatus, setOptimizedTimerStatus] = useState<TimerStatus | undefined>(timerState?.status);

useEffect(() => {
    // Only update if displayed seconds value has changed
    if (currentTimeLeftMs !== lastTimeLeftMsRef.current) {
        const newDisplaySeconds = Math.floor(currentTimeLeftMs / 1000);
        const currentDisplaySeconds = optimizedTimeLeftMs ? Math.floor(optimizedTimeLeftMs / 1000) : -1;
        
        if (newDisplaySeconds !== currentDisplaySeconds) {
            setOptimizedTimeLeftMs(currentTimeLeftMs);
        }
    }
}, [currentTimeLeftMs, currentTimerStatus]);
```

#### 1.2 Stable Object References
```typescript
// Prevent new object creation on every render
const EMPTY_STATS: Record<string, number> = {};
const EMPTY_LEADERBOARD: Array<{ userId: string; username: string; avatarEmoji?: string; score: number }> = [];

// Use stable references instead of {} or []
const [currentStats, setCurrentStats] = useState<Record<string, number>>(EMPTY_STATS);
const [leaderboard, setLeaderboard] = useState<Array<LeaderboardEntry>>(EMPTY_LEADERBOARD);
```

#### 1.3 Memoized Hook Return Value
```typescript
// Prevent new object creation when only internals change
return useMemo(() => ({
    gameState,
    timerStatus: optimizedTimerStatus,
    timerQuestionUid,
    timeLeftMs: optimizedTimeLeftMs,
    connectedCount,
    leaderboard,
    // ... other return values
}), [
    gameState,
    optimizedTimerStatus,
    timerQuestionUid,
    optimizedTimeLeftMs,
    connectedCount,
    leaderboard,
    // ... other dependencies
]);
```

### Phase 2: Component Memoization ✅
**Location**: `frontend/src/components/TeacherProjectionClient.tsx`

#### 2.1 Extract Frequently Changing Components
```typescript
// Move frequently changing components OUTSIDE the main component to prevent recreation
const TimerDisplay = React.memo(({ timeLeftMs }: { timeLeftMs: number | null }) => {
    return <span className="timer-display">{formatTimerMs(timeLeftMs)}</span>;
});
TimerDisplay.displayName = 'TimerDisplay';
```

#### 2.2 Memoize Content Sections
```typescript
// Isolate frequently changing content in memoized components
const QuestionDisplay = React.memo(({ 
    currentTournamentQuestion, 
    gameState,
    showStats,
    statsToShow,
    // ... other props
}: QuestionProps) => {
    // Question rendering logic
});

const LeaderboardDisplay = React.memo(({ 
    hookLeaderboard, 
    shouldAnimatePodium,
    // ... other props
}: LeaderboardProps) => {
    // Leaderboard rendering logic
});

const StatsDisplay = React.memo(({ 
    showStats,
    currentStats,
    // ... other props
}: StatsProps) => {
    // Stats rendering logic
});
```

#### 2.3 Stable Function References
```typescript
// Use useCallback for functions passed to memoized components
const handleStatToggle = useCallback(() => {
    // Toggle stats logic
}, []);

const handleQuestionNavigation = useCallback((direction: 'next' | 'prev') => {
    // Navigation logic
}, []);
```

### Phase 3: Performance Polish ✅
**Location**: Various components

#### 3.1 Optimize Conditional Rendering
```typescript
// Avoid creating new objects in render
// ❌ Bad - creates new object every render
const styles = { color: showStats ? 'red' : 'blue' };

// ✅ Good - stable object references
const STATS_STYLE = { color: 'red' };
const DEFAULT_STYLE = { color: 'blue' };
const styles = showStats ? STATS_STYLE : DEFAULT_STYLE;
```

#### 3.2 Minimize Effect Dependencies
```typescript
// Extract only what you need from objects to prevent unnecessary re-runs
const { timeLeftMs, status } = timerState || {};
useEffect(() => {
    // Only runs when timeLeftMs or status change, not when entire timerState object changes
}, [timeLeftMs, status]);
```

## Application Pattern for Other Pages

### For Teacher Dashboard (`TeacherDashboardClient.tsx`)
1. **Identify timer/frequent updates**: Look for `timeLeftMs`, `connectedCount`, `leaderboard` updates
2. **Memoize content sections**: Timer display, question display, stats display, participant list
3. **Stable references**: Use `useCallback` for event handlers, stable empty objects
4. **Extract timer logic**: Move timer display to separate memoized component

### For Live Pages (`LiveQuizClient.tsx`)
1. **Optimize answer submission state**: Only update when submission status changes
2. **Memoize question display**: Prevent re-render when timer updates
3. **Stable leaderboard references**: Use empty array constant
4. **Extract interactive components**: Answer buttons, progress indicators
5. **Optimize answer highlighting**: Only re-render when answer selection changes

### For Student Pages
1. **Timer display optimization**: Only update when seconds change
2. **Answer state isolation**: Prevent timer updates from affecting answer buttons
3. **Progress indicators**: Memoize progress components
4. **Connection status**: Stable references for connection state

## Implementation Checklist

### Hook Level Optimization
- [ ] Identify high-frequency state updates (timer, counters, etc.)
- [ ] Implement display-value-only updates (e.g., seconds vs milliseconds)
- [ ] Create stable empty object/array references
- [ ] Add useMemo to hook return value
- [ ] Extract individual values to prevent object dependency issues

### Component Level Optimization  
- [ ] Extract frequently changing components outside main component
- [ ] Add React.memo to components that re-render often
- [ ] Use useCallback for event handlers passed to memoized components
- [ ] Identify and memoize content sections (timer, question, leaderboard, stats)
- [ ] Verify memoized components have stable prop references

### Performance Polish
- [ ] Optimize conditional rendering with stable object references
- [ ] Minimize useEffect dependencies by extracting individual values
- [ ] Test performance during active timers and frequent updates
- [ ] Verify smooth interactions without unnecessary re-renders
- [ ] Monitor battery usage on mobile devices

## Performance Metrics to Track
- **Before**: ~10 re-renders per second due to timer updates
- **After**: 1 re-render per second (only when display changes)
- **Battery Life**: Reduced CPU usage saves battery on mobile devices
- **Memory**: Stable object references prevent garbage collection spikes
- **User Experience**: Smooth interactions without lag or jank

## Testing Strategy
1. **Start active timer** in the component
2. **Monitor console for re-render frequency** - should be ~1/second
3. **Verify all interactive elements work** during timer updates
4. **Test on mobile devices** for battery impact
5. **Check React DevTools Profiler** for re-render patterns
6. **Verify smooth scrolling and interactions** during active timers

## Common Pitfalls to Avoid
1. **Don't memo components with unstable props** - use useCallback for functions
2. **Don't create new objects in render** - use stable references
3. **Don't add unnecessary dependencies** to useEffect/useMemo
4. **Don't forget displayName** for memoized components (debugging)
5. **Don't over-optimize** - only memoize components that actually re-render frequently

## Files Modified in Original Implementation
- `frontend/src/hooks/useProjectionQuizSocket.ts` - Hook optimization
- `frontend/src/components/TeacherProjectionClient.tsx` - Component memoization
- `frontend/src/hooks/useSimpleTimer.ts` - Timer value optimization
- `plan.md` - Documentation of changes

This pattern can be applied to any React component with frequent updates to improve performance and battery life.
