# React Render Tracking for E2E Tests

## Overview

The render tracking infrastructure allows E2E tests to monitor React component render frequency to detect excessive re-renders that could impact performance.

## How It Works

1. **Injection**: `injectRenderCounters(page)` adds tracking functions to `window.__mqTrackRender()`
2. **Instrumentation**: Components call `window.__mqTrackRender(componentName, reason)` in their render method
3. **Analysis**: Tests can query render counts, history, and assert budgets

## API

### Setup Functions

```typescript
// Inject render tracking (call before page loads)
await injectRenderCounters(page);

// Reset counters (e.g., before starting a test section)
await resetRenderCounters(page);
```

### Query Functions

```typescript
// Get current render counts
const counts = await getRenderCounts(page);
// Returns: { "QuestionDisplay": 12, "Leaderboard": 5, ... }

// Get detailed render history with timestamps
const history = await getRenderHistory(page);
// Returns: [{ component: "QuestionDisplay", timestamp: 1234567890, count: 1, reason: "new_question" }, ...]

// Log statistics for debugging
await logRenderStatistics(page, "After Question 3");
```

### Budget Assertions

```typescript
// Assert render budgets - test fails if exceeded
await assertRenderBudgets(page, {
    "QuestionDisplay": 10,     // Max 10 renders during test
    "Leaderboard": 5,          // Max 5 renders during test
    "TimerDisplay": 50         // Max 50 renders (once per second for ~50s)
});
```

## Instrumenting Components

### Method 1: useEffect Hook (Recommended for Testing)

Add to component:

```typescript
import { useEffect } from 'react';

export function QuestionDisplay({ question, timer }) {
    // Track renders in development/test
    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).__mqTrackRender) {
            (window as any).__mqTrackRender('QuestionDisplay', 'props_changed');
        }
    });

    return <div>...</div>;
}
```

### Method 2: Direct Call (Minimal Overhead)

```typescript
export function Leaderboard({ scores }) {
    // Track at start of render
    if (typeof window !== 'undefined' && (window as any).__mqTrackRender) {
        (window as any).__mqTrackRender('Leaderboard', 
            `scores_length_${scores.length}`);
    }

    return <div>...</div>;
}
```

### Method 3: Custom Hook (Reusable)

Create `hooks/useRenderTracking.ts`:

```typescript
import { useEffect } from 'react';

export function useRenderTracking(componentName: string, reason?: string) {
    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).__mqTrackRender) {
            (window as any).__mqTrackRender(componentName, reason || 'render');
        }
    });
}

// Usage in component:
export function MyComponent() {
    useRenderTracking('MyComponent', 'props_changed');
    return <div>...</div>;
}
```

## Example Test

```typescript
test('should not exceed render budgets during quiz', async ({ browser }) => {
    const page = await browser.newPage();
    
    // Inject tracking before loading page
    await injectRenderCounters(page);
    
    await page.goto('/live/TEST123');
    
    // Reset counters after initial load
    await resetRenderCounters(page);
    
    // Play through 3 questions
    for (let i = 0; i < 3; i++) {
        await page.click('button:has-text("Next Question")');
        await page.waitForTimeout(1000);
    }
    
    // Check render statistics
    await logRenderStatistics(page, 'After 3 Questions');
    
    // Assert budgets
    await assertRenderBudgets(page, {
        "QuestionDisplay": 5,      // Should render once per question + initial
        "Leaderboard": 10,         // May update after each answer
        "TimerDisplay": 180        // 60s per question * 3 questions
    });
});
```

## Recommended Budgets

Based on typical quiz flow (3 questions, 60s each):

| Component | Budget | Reasoning |
|-----------|--------|-----------|
| QuestionDisplay | 5 | 1 per question + 2 for transitions |
| Leaderboard | 10 | Updates after each answer (3-6 students) |
| TimerDisplay | 200 | ~1/second * 180 seconds + buffer |
| LobbyDisplay | 3 | Initial + 2 participant updates |
| GameBoard (parent) | 10 | Question changes + state updates |

## Performance Baseline

Target render counts for 100-student quiz with 10 questions:

- **Student side**: ~250 renders per student (25 per question)
  - QuestionDisplay: ~12 (once per question + transitions)
  - TimerDisplay: ~600 (10 min * 60 fps - should be memo'd!)
  - Leaderboard: ~30 (3 updates per question)
  
- **Teacher side**: ~500 renders total
  - ParticipantList: ~150 (updates as students join/answer)
  - Leaderboard: ~50 (updates per question completion)
  - ControlPanel: ~15 (once per question + control updates)

## Red Flags

**Excessive Renders** (indicates optimization needed):

1. **TimerDisplay > 100/min** → Missing `React.memo` or unstable deps
2. **QuestionDisplay renders on timer tick** → Props changing unnecessarily
3. **Leaderboard renders without score changes** → Parent re-rendering children
4. **Any component > 10 renders per second** → Likely render loop

## Debugging High Render Counts

```typescript
// Get render history to see patterns
const history = await getRenderHistory(page);
const recentRenders = history.slice(-20);

// Group by component
const byComponent = recentRenders.reduce((acc, r) => {
    acc[r.component] = (acc[r.component] || 0) + 1;
    return acc;
}, {});

console.log('Renders in last 20:', byComponent);

// Check time between renders
const timerRenders = history.filter(r => r.component === 'TimerDisplay');
const intervals = [];
for (let i = 1; i < timerRenders.length; i++) {
    intervals.push(timerRenders[i].timestamp - timerRenders[i-1].timestamp);
}
const avgInterval = intervals.reduce((a,b) => a+b, 0) / intervals.length;
console.log(`TimerDisplay avg interval: ${avgInterval}ms`);
```

## Next Steps

After adding render tracking to key components:

1. **B.2**: Run stress test with 10+ students to get baseline counts
2. **B.5**: Audit components with high render counts
3. **Optimize**: Add `React.memo`, fix unstable deps, lift state up
4. **Verify**: Re-run tests to confirm render counts decreased

## Integration with CI

```typescript
// In E2E test suite
afterEach(async ({ page }) => {
    const counts = await getRenderCounts(page);
    const total = Object.values(counts).reduce((a,b) => a+b, 0);
    
    // Log to CI for trend tracking
    console.log(`CI_METRIC: total_renders=${total}`);
    
    // Fail if extreme (potential render loop)
    if (total > 1000) {
        throw new Error(`Excessive renders detected: ${total}`);
    }
});
```
