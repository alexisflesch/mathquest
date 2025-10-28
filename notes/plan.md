# MathQuest Production Readiness Plan

**Goal:** Achieve production-ready stability for classroom deployment with 100+ students

**Context:** App is feature-complete and in active classroom use. Need to ensure it can handle real load without performance degradation, event storms, or excessive resource usage.

---

## Phase A: Test Isolation & Stability ⏳ IN PROGRESS

**Objective:** Fix test isolation issue to achieve 84/84 test suites passing cleanly

**Work Items:**
- [ ] Investigate `data-lifecycle-cleanup.test.ts` failure in full suite
  - Likely causes: Redis key pollution, DB record leakage, unclosed timers/connections
  - Check for shared state between test suites
  - Review beforeEach/afterEach cleanup logic
- [ ] Fix root cause of test pollution
- [ ] Verify fix: run full test suite 3 times consecutively, all must pass
- [ ] Document fix and any new test isolation patterns discovered

**Exit Criteria:**
- ✅ 84/84 test suites passing
- ✅ 733/733 tests passing (excluding skipped)
- ✅ Full test suite completes in <120 seconds
- ✅ No flaky tests (3 consecutive clean runs)

**Time Estimate:** 2-4 hours

---

## Phase B: Performance Profiling & Optimization ⏸️ PENDING

**Objective:** Identify and fix unnecessary broadcasts, re-renders, and log spam

### B.1: Event Storm Detection

**Work Items:**
- [ ] Add broadcast event counter to chaos E2E tests
  - Track: GAME_QUESTION, PARTICIPANT_LIST, LEADERBOARD_UPDATE, TIMER_UPDATE
  - Budget limits: max events per student per question
  - Fail test if budget exceeded
- [ ] Add socket event deduplication tracking
  - Detect: identical payloads sent multiple times
  - Log: event name, payload hash, count, time window
- [ ] Review backend emission points for unnecessary broadcasts
  - Check: lobby updates, leaderboard recalculations, timer emissions
  - Look for: broadcast inside loops, duplicate emit calls

**Exit Criteria:**
- ✅ E2E tests detect event storms (budget violations fail test)
- ✅ No duplicate broadcasts for same state change
- ✅ Event count per game phase documented and reasonable

### B.2: Re-render Detection & Optimization

**Work Items:**
- [ ] Add React render counter to E2E tests
  - Inject `window.__mqRenderCounts = {}` tracking component renders
  - Use React DevTools Profiler API or custom HOC
  - Track: LiveQuizPage, GameBoard, QuestionDisplay, Leaderboard components
- [ ] Set render budgets for common scenarios
  - Example: Receiving GAME_QUESTION should trigger ≤5 renders
  - Example: Timer tick should trigger ≤2 renders
- [ ] Identify excessive re-renders and optimize
  - Check: missing React.memo, unstable dependencies, prop drilling
  - Use: useMemo, useCallback, proper dependency arrays

**Exit Criteria:**
- ✅ Render budgets documented and enforced in tests
- ✅ No component renders >10 times per question lifecycle
- ✅ Timer updates don't cause full page re-renders

### B.3: Log Spam Reduction

**Work Items:**
- [ ] Add log line counter to E2E tests
  - Track: console.log, console.warn, console.error counts
  - Budget: max log lines per game phase (frontend + backend)
- [ ] Audit and reduce verbose logging
  - Backend: Remove debug logs from hot paths (timer ticks, answer processing)
  - Frontend: Gate verbose logs behind debug flag
  - Keep: error logs, correlation ID logs, key state transitions
- [ ] Verify log levels are appropriate
  - Production: WARN and ERROR only
  - Staging: INFO + WARN + ERROR
  - Development: DEBUG + INFO + WARN + ERROR

**Exit Criteria:**
- ✅ Log budget tests passing
- ✅ Production logs: <50 lines per student per game
- ✅ No repetitive log patterns in full game flow

**Time Estimate:** 1-2 days

---

## Phase C: Stress Testing (100 Students, 10 Questions) ⏸️ PENDING

**Objective:** Verify app stability under realistic classroom load

### C.1: Stress Test Infrastructure

**Work Items:**
- [ ] Create Playwright stress test: `tests/e2e/suites/stress-100-students.spec.ts`
  - Simulate: 100 concurrent student connections
  - Game flow: 10 questions (mix of numeric, single_choice, multiple_choice)
  - Timing: realistic answer delays (2-20s per question)
  - Chaos: 10% of students have network flaps during game
- [ ] Add performance metrics collection
  - Track: response times, memory usage, CPU usage
  - Monitor: socket event latency, database query times
  - Alert: if metrics exceed thresholds
- [ ] Add resource monitoring
  - Backend: memory, CPU, open file descriptors, DB connections
  - Frontend: memory per tab, DOM node count, event listener count
  - Redis: memory usage, key count, connection count

**Exit Criteria:**
- ✅ Stress test infrastructure runs successfully
- ✅ Metrics collection working
- ✅ Baseline performance numbers documented

### C.2: Stress Test Execution & Analysis

**Work Items:**
- [ ] Run stress test 5 times, collect metrics
- [ ] Analyze results:
  - Event counts: broadcasts per student, total events per game
  - Render counts: re-renders per component per question
  - Log volume: lines logged per student per game
  - Performance: response times, memory growth, CPU spikes
- [ ] Identify bottlenecks and optimization opportunities
- [ ] Document findings and create optimization tasks if needed

**Exit Criteria:**
- ✅ 5 consecutive stress test runs complete without crashes
- ✅ No memory leaks (memory returns to baseline after game)
- ✅ No event storms (counts within budgets)
- ✅ Response times acceptable (<500ms p95 for critical paths)
- ✅ Log volume reasonable (<5000 lines total per game)

### C.3: Optimization & Remediation

**Work Items:**
- [ ] Fix any issues discovered in stress testing
- [ ] Re-run stress tests to verify fixes
- [ ] Update performance baselines and budgets
- [ ] Document known limits and scaling characteristics

**Exit Criteria:**
- ✅ All stress tests passing with optimizations applied
- ✅ Performance metrics meet production targets
- ✅ Scaling documentation complete

**Time Estimate:** 2-3 days

---

## Success Criteria (Overall)

**Before OAuth/GAR Integration:**
- ✅ 84/84 test suites passing (no flaky tests)
- ✅ Stress test (100 students, 10 questions) passes 5 times consecutively
- ✅ No event storms under load (all budgets respected)
- ✅ No excessive re-renders (render budgets met)
- ✅ Log volume acceptable for production monitoring
- ✅ Performance metrics documented and within targets
- ✅ At least 2 weeks of classroom usage with no critical bugs

**Performance Targets:**
- Response time: p95 <500ms for all critical operations
- Memory: No leaks, stable memory usage across game lifecycle
- Events: <10 broadcasts per student per question on average
- Renders: <5 re-renders per component per state change
- Logs: <50 lines per student per game (production log level)

---

## Execution Notes

- Work proceeds phase by phase (A → B → C)
- Each phase must meet exit criteria before proceeding
- Follow TDD: write failing test, fix code, verify test passes
- Document all findings, optimizations, and limits discovered
- Update VuePress docs only when contracts or APIs change (not implementation details)

---

## Current Status

**Phase A:** Starting now
**Phase B:** Pending Phase A completion
**Phase C:** Pending Phase B completion

**Last Updated:** 2025-10-28
- Zero backward-compatibility and no migration layers (rewrite cleanly when needed).
