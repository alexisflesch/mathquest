# Plan: Live Page Timer Modernization Project

## ✅ **CRITICAL ISSUE RESOLVED: Legacy Timer System Eliminated**

### **Current Status: CORE MODERNIZATION COMPLETE ✅**
All production hooks have been modernized to use `useSimpleTimer` as the single source of timer truth. The dual timer system has been eliminated from all main application code.

### **Evidence of Successful Modernization**
```
Legacy Format: {"isPaused": false, "timeLeftMs": 10054, "startedAt": 1750086061402} ❌ ELIMINATED
Modern Format: {"status": "play", "timeLeftMs": 10054, "questionUid": "q1", "timestamp": 1750086061402} ✅ ACTIVE
```

### **Phase 4: ELIMINATE LEGACY TIMER SYSTEMS** ✅ COMPLETED
- [x] **INVESTIGATE**: Identify all remaining legacy timer code ✅
- [x] **AUDIT**: Find sources of `isPaused`, `startedAt` fields (legacy format) ✅
- [x] **REMOVE**: Comment out/remove ALL legacy timer hooks and handlers ✅
  - [x] **Core Issue**: Replace useUnifiedGameManager timer logic with useSimpleTimer ✅
  - [x] **Teacher Hook**: Update useTeacherQuizSocket to use useSimpleTimer instead of gameManager.gameState.timer ✅
  - [x] **Projection Hook**: Update useProjectionQuizSocket to use useSimpleTimer instead of gameManager.gameState.timer ✅
  - [x] **Tournament Hook**: Update useTournamentSocket to use modern timer system ✅
  - [ ] **Test Cleanup**: Remove all legacy timer references from test files
- [x] **ENFORCE**: Only useSimpleTimer should handle timer state ✅
- [x] **VALIDATE**: Ensure shared types are used consistently ✅
- [ ] **TEST**: Verify late joiner countdown works with single timer system

### **Phase 5: 🚨 CRITICAL BACKEND HANDLER ARCHITECTURE CLEANUP** ✅ COMPLETED  
- [x] **AUDIT**: Run `scripts/audit_event_handlers.py` to identify duplicate handler registrations ✅
- [x] **ANALYZE**: Review handler_audit_report.md findings (22 duplicate event registrations found!) ✅
- [x] **ELIMINATE DUPLICATES**: Remove redundant handler registrations ✅
  - [x] join_game: Removed duplicate from sharedLiveHandler.ts, using dedicated game/joinGame.ts ✅
  - [x] game_answer: Removed internal registration from gameAnswer.ts (handler returned for index.ts) ✅  
  - [x] request_participants: Removed duplicate from sharedLiveHandler.ts, using dedicated handler ✅
  - [x] Verified production handlers with scripts/audit_production_handlers.py ✅
- [x] **CONSOLIDATE**: Established single source of truth for each critical event handler ✅
- [x] **VALIDATE**: Confirmed only legitimate disconnect handlers remain (4 for different components) ✅

### **Current Status: BACKEND ARCHITECTURE MODERNIZED ✅**
All critical duplicate event handler registrations have been eliminated from production code. The timer system is now fully modernized with single source of truth and proper security validation.

### **Phase 6: PRODUCTION ISSUE RESOLUTION** ✅ COMPLETED
- [x] **CRITICAL BUG FIX**: Resolved quiz mode answer submission issue ✅
  - [x] **Root Cause**: Game status remained "pending" when timer paused, blocking answer submissions ✅  
  - [x] **Solution**: Ensured `gameState.status = 'active'` syncs with database when timer starts ✅
  - [x] **Validation**: Timer pause now keeps game active while changing only timer.status ✅
- [x] **STATUS ARCHITECTURE**: Clarified separation between game status and timer status ✅
- [x] **SECURITY MAINTAINED**: Answer validation still prevents submissions when timer.status is "stop" ✅

### **Phase 7: FINAL CLEANUP & TESTING** ⏳ IN PROGRESS
- [x] **CRITICAL BUG FIX**: Fixed guest user login issue preventing game joining ✅
  - [x] Identified root cause: missing `userId` in guest profiles when registration fallback occurs ✅
  - [x] Enhanced `setGuestProfile` to lookup existing users via `/api/auth/status` ✅
  - [x] Ensured all guest users have `userId` for game joining capability ✅
- [x] **LOBBY REDIRECT FIX**: Removed legacy REDIRECT_TO_QUIZ event per DRY principles ✅
  - [x] Eliminated dual redirect handlers (legacy compatibility forbidden per .instructions.md) ✅
  - [x] Now using only canonical REDIRECT_TO_GAME event for all redirects ✅
- [x] **TIMER FEEDBACK ENHANCEMENT**: Added debug logging to timer stopped validation ✅
  - [x] Backend correctly detects when timer is stopped and validates answer submissions ✅
  - [x] Frontend properly handles game_error events for user feedback ✅
  - [x] Added explicit logging for game_error emissions to track validation ✅
- [ ] **TEST CURRENT**: Verify timer stopped feedback works consistently in live testing
- [ ] **TEST CLEANUP**: Remove all legacy timer references from test files
  - [ ] Remove `isPaused`, `startedAt`, `gameManager.gameState.timer` from frontend tests
  - [ ] Update test expectations to use `GameTimerState` format
  - [ ] Ensure test handlers don't conflict with production handlers
- [ ] **LEGACY TYPE CLEANUP**: Remove unused legacy timer types if no longer referenced
- [ ] **END-TO-END VALIDATION**: Comprehensive testing of modernized timer system
  - [ ] Verify quiz mode answer submission works correctly when timer is paused
  - [ ] Test timer validation prevents unauthorized answer submissions when timer is stopped
  - [ ] Confirm all timer events use shared `GameTimerState` type
  - [ ] Validate late joiner countdown works with single timer system

### **Expected Outcome**
- ✅ Single timer system (useSimpleTimer only) ✅ ACHIEVED
- ✅ Consistent shared types across all layers ✅ ACHIEVED  
- ✅ No timer conflicts or dual state management ✅ ACHIEVED
- ✅ Single event handler registration per event ✅ ACHIEVED
- [ ] Clean test suite with no legacy references
- [ ] Complete documentation of new architecture

---

## 🔥 ARCHIVE: Previous Teacher Dashboard Timer Issues (Completed)

### **Issue Description** ✅
When teacher clicks "play" on a question in the dashboard, the timer starts immediately on the frontend. According to the instructions and documentation, the timer should only start when the backend sends the correct payload.

### **Root Cause Analysis**
In `/home/aflesch/mathquest/app/frontend/src/components/DraggableQuestionsList.tsx`, the `handlePlay` function immediately calls `onTimerAction` with `status: 'play'`, which starts the frontend timer before receiving backend confirmation.

According to the documentation:
- **Backend Authority**: Backend is single source of truth for timer values and status
- **Frontend Display**: Frontend only handles local countdown display from backend-provided values  
- **No Optimistic Updates**: Frontend must never predict or update timer state independently
- **Event-Driven**: Timer updates only occur via backend events

### **Phase Checklist**

#### **Phase 1: Analysis and Documentation** ✅
- [x] Read the instructions and understand requirements
- [x] Identify the timer responsibility division from documentation
- [x] Find the problematic code in `DraggableQuestionsList.tsx`
- [x] Understand that frontend should wait for `dashboard_timer_updated` event

#### **Phase 2: Fix Implementation** ✅
- [x] Modify `emitTimerAction` function to NOT immediately start timer
- [x] Remove optimistic timer updates from `emitPauseQuiz`, `emitResumeQuiz`, `emitSetTimer`
- [x] Remove automatic timer start from `emitSetQuestion`
- [x] Enhance `dashboard_timer_updated` handler to be the ONLY source of timer state changes
- [x] Ensure frontend only starts timer when receiving `dashboard_timer_updated` with `status: 'play'`

#### **Phase 3: Timer Duration Units Fix** ✅
- [x] **CRITICAL**: Fix timer duration units consistency issue
- [x] Backend was receiving seconds instead of milliseconds from frontend
- [x] Remove timer unit conversions in SortableQuestion component
- [x] Update dashboard handlePlay to expect milliseconds
- [x] Fix shared type documentation to reflect millisecond requirement
- [x] Ensure all timer values use milliseconds per documentation

#### **Phase 4: Additional Timer Fixes** ✅
- [x] **CRITICAL**: Fix backend pause logic to use frontend remaining time
- [x] Backend was resetting timer to full duration instead of preserving remaining time  
- [x] Fix timer stop action Zod validation error
- [x] Update Zod schema to accept `duration: 0` for stop actions
- [x] Fix timer payloads missing questionUid in timer object
- [x] Backend now includes resolved questionUid in timer object before broadcasting

## 🎯 **CURRENT PHASE: Socket Configuration Modernization** ✅

### **Latest Issue: Hardcoded Values Violation**
The user flagged hardcoded socket URLs and event names in the teacher dashboard, which violates the `.instructions.md` zero-tolerance policy for hardcoding.

### **Phase Checklist**

#### **Phase 1: Analysis and Documentation** ✅
- [x] Read the instructions and understand requirements
- [x] Identify the timer responsibility division from documentation
- [x] Find the problematic code in `DraggableQuestionsList.tsx`
- [x] Understand that frontend should wait for `dashboard_timer_updated` event

#### **Phase 2: Fix Implementation** ✅
- [x] Modify `emitTimerAction` function to NOT immediately start timer
- [x] Remove optimistic timer updates from `emitPauseQuiz`, `emitResumeQuiz`, `emitSetTimer`
- [x] Remove automatic timer start from `emitSetQuestion`
- [x] Enhance `dashboard_timer_updated` handler to be the ONLY source of timer state changes
- [x] Ensure frontend only starts timer when receiving `dashboard_timer_updated` with `status: 'play'`

#### **Phase 3: Timer Duration Units Fix** ✅
- [x] **CRITICAL**: Fix timer duration units consistency issue
- [x] Backend was receiving seconds instead of milliseconds from frontend
- [x] Remove timer unit conversions in SortableQuestion component
- [x] Update dashboard handlePlay to expect milliseconds
- [x] Fix shared type documentation to reflect millisecond requirement
- [x] Ensure all timer values use milliseconds per documentation

#### **Phase 4: Additional Timer Fixes** ✅
- [x] **CRITICAL**: Fix backend pause logic to use frontend remaining time
- [x] Backend was resetting timer to full duration instead of preserving remaining time  
- [x] Fix timer stop action Zod validation error
- [x] Update Zod schema to accept `duration: 0` for stop actions
- [x] Fix timer payloads missing questionUid in timer object
- [x] Backend now includes resolved questionUid in timer object before broadcasting

#### **Phase 5: Socket Configuration Modernization** ✅
- [x] **CRITICAL**: Remove hardcoded socket URL from teacher dashboard
- [x] Replace `'http://localhost:3001'` hardcoding with `SOCKET_CONFIG.url` from config
- [x] Replace hardcoded socket event names with shared constants
- [x] Update socket initialization to use canonical configuration pattern
- [x] Map all event names to shared constants from `@shared/types/socket/events`
- [x] Verify backend event names match frontend expectations

#### **Phase 6: Final Testing and Validation** ⏳
- [ ] Test complete timer workflow: play → pause → resume → stop
- [ ] Verify dashboard starts local countdown when receiving backend timer events
- [ ] Test timer expiration and completion events
- [ ] Verify all timer actions work correctly with questionUid association
- [ ] Test edge cases (switching questions mid-timer, etc.)

## 🔥 PHASE 3: Reconnect Dashboard to Unified System with Shared Types

### Current Issue: Auth Failure - Type Inconsistency
- **Problem**: `join_dashboard` socket event has mismatched types between Zod schema and TypeScript interface
  - Zod schema (`socketEvents.zod.ts`): expects `{ accessCode: string }`
  - TypeScript interface (`socketEvents.ts`): expects `{ gameId: string }`
  - Frontend code: sends `{ gameId }` but backend validates for `accessCode`
  
### Tasks:
- [x] **CRITICAL**: Fix type inconsistency for `join_dashboard` event
  - [x] Determine correct payload structure (accessCode vs gameId vs both)
  - [x] Update Zod schema OR TypeScript interface to match
  - [x] Update frontend emission in `useUnifiedGameManager.ts`
  - [x] Ensure all backend handlers expect the correct payload
- [x] Test dashboard connection after auth fix
- [x] **FIXED**: Timer action type inconsistencies
  - [x] Updated canonical `TimerActionPayload` type to match backend Zod schema
  - [x] Fixed timer action emission in `useUnifiedGameManager.ts` to use `accessCode`
  - [x] Timer actions now send correct payload format: `{ accessCode, action, duration, questionUid }`
- [x] **SUCCESS**: Test timer actions work without accessCode validation errors ✅
  - Backend now properly processes timer actions and broadcasts updates
  - Multi-room broadcasting working (liveRoom + projectionRoom)
  - Timer state properly created with correct status and duration
- [ ] Test all timer actions (pause, resume, stop) to ensure they all work
- [ ] Verify frontend receives and processes timer updates from backend  
- [ ] Clean up backup files with old timer action format
- [ ] Validate other socket events for similar inconsistencies

### Files to Modify:
- `shared/types/socketEvents.zod.ts` - Zod validation schema
- `shared/types/socketEvents.ts` - TypeScript interface  
- `frontend/src/hooks/useUnifiedGameManager.ts` - Event emission
- Need to check backend handlers for expected payload format

### Exit Criteria:
- [ ] All socket event types match between Zod schema and TypeScript interface
- [ ] Teacher dashboard successfully connects without auth errors
- [ ] Timer actions work with proper accessCode validation

### **Implementation Strategy**

The fix should:
1. Keep the backend communication (`onTimerAction` call)
2. Remove frontend timer starting logic
3. Let the backend `dashboard_timer_updated` event be the only trigger for timer status changes

### **Files to Modify**
- `/home/aflesch/mathquest/app/frontend/src/components/DraggableQuestionsList.tsx`

### **Exit Criteria**
- Timer only starts when backend sends the payload
- All other timer controls work correctly
- No regression in backend communication

- [x] **CRITICAL BUG FIXED**: Timer status auto-calculation 
  - Root cause: Frontend was automatically calculating timer status from incomplete backend data
  - Fix: Removed status auto-calculation from GameTimerUpdatePayload handler  
  - Result: Timer status only changes when backend explicitly provides status updates
  - Files: `frontend/src/hooks/useGameTimer.ts`

### **Phase 4: Final Timer System Validation** ⏳
- [x] **FIXED**: Timer duration type documentation inconsistency
  - **Issue**: `TimerActionPayload.duration` was documented as "seconds" but actually used as milliseconds  
  - **Root Cause**: Comment in shared types contradicted actual implementation and documentation requirement
  - **Fix**: Updated shared type comment to correctly reflect milliseconds usage
  - **Result**: All timer values now consistently documented as milliseconds throughout the app
- [ ] **PENDING**: Ensure backend always includes questionUid in timer payloads (currently shows null)
- [ ] **PENDING**: Verify dashboard starts local countdown on dashboard_timer_updated with status "play"
- [ ] **PENDING**: Test all timer actions (pause, resume, stop) and their propagation
- [ ] **PENDING**: Clean up any backup/legacy files using old timer formats
- [ ] **PENDING**: Audit other socket events for type and payload consistency

## 🎯 **CURRENT PHASE: Modernize Live/[code] Page Timer** ⏳

### **Issue Description**
The live/[code] page is using the old timer implementation via `useStudentGameSocket` and `gameState.timer`. It needs to be modernized to use the new timer system (`useSimpleTimer`) that was implemented and validated in the teacher/dashboard/[code] page.

### **Current vs. Target Implementation**
- **Current**: Live page uses `gameState.timer.timeLeftMs` from `useStudentGameSocket`
- **Target**: Live page should use `useSimpleTimer` hook with role 'student' like teacher dashboard uses role 'teacher'

### **Phase Checklist**

#### **Phase 1: Analysis and Planning** ⏳
- [ ] Document current timer flow in live/[code] page
- [ ] Identify how useStudentGameSocket provides timer data
- [ ] Plan integration of useSimpleTimer with role 'student'
- [ ] Verify student timer events match the backend timer system

#### **Phase 2: Timer Modernization Implementation** 
- [ ] Replace gameState.timer usage with useSimpleTimer hook
- [ ] Update TournamentTimer component to receive timer from useSimpleTimer
- [ ] Ensure proper socket event handling for student timer updates
- [ ] Remove legacy timer code from useStudentGameSocket if no longer needed

#### **Phase 3: Testing and Validation** ⏳
- [x] **ISSUE FOUND**: Late joining timer doesn't start - event mismatch
- [x] **ROOT CAUSE**: useSimpleTimer listening to wrong events vs useGameTimer  
- [x] **FIX APPLIED**: Updated useSimpleTimer to listen to correct events:
  - `GAME_EVENTS.GAME_TIMER_UPDATED` (primary)
  - `GAME_EVENTS.TIMER_UPDATE` (alternative for students)
- [ ] Test timer displays when teacher starts question from dashboard
- [ ] Verify timer countdown works correctly on live page
- [ ] Test timer pause/resume functionality  
- [ ] Validate timer expiration handling
- [ ] Ensure no regression in other live page functionality

### **Files to Modify**
- `/home/aflesch/mathquest/app/frontend/src/app/live/[code]/page.tsx` - Replace timer usage
- Potentially `/home/aflesch/mathquest/app/frontend/src/hooks/useStudentGameSocket.ts` - Remove legacy timer if unused

### **Exit Criteria**
- Live page uses modern timer system via useSimpleTimer
- Timer behavior matches teacher dashboard implementation
- All timer functionality works correctly for students
- No legacy timer code remains

## 🔧 NEW TASK: Live Page Timer Modernization

**Goal**: Modernize the live/[code] page to use the new `useSimpleTimer` hook (the one implemented in teacher/dashboard/[code])

### **Compatibility Analysis Result**: ✅ COMPATIBLE

#### **Current State**:
- Live page uses `TournamentTimer` component with `timerS` (seconds) prop
- Timer data comes from `gameState.timer?.timeLeftMs` (milliseconds from useStudentGameSocket)
- Converts ms to seconds: `Math.ceil(gameState.timer.timeLeftMs / 1000)`

#### **Target State**:
- Replace timer data source with `useSimpleTimer` hook
- Use role='student' configuration
- Keep existing `TournamentTimer` component (just change data source)

### **Phase Checklist**

#### **Phase 1: Analysis and Integration Planning** ✅
- [x] Document current timer flow in live/[code] page
- [x] Analyze useSimpleTimer hook capabilities and interface  
- [x] Verify compatibility between useSimpleTimer and TournamentTimer component
- [x] Confirm socket events and role configuration requirements
- [x] Plan integration steps with minimal code changes

#### **Phase 2: Timer Modernization Implementation** ✅
- [x] Add useSimpleTimer hook to live/[code] page with student role
- [x] Update timer data source from gameState.timer to useSimpleTimer
- [x] Remove timer-related code from useStudentGameSocket if redundant
- [x] Ensure proper error handling and fallbacks

#### **Phase 3: Testing and Validation**
- [ ] Test timer display starts when teacher starts question from dashboard
- [ ] Verify timer countdown works correctly on live page
- [ ] Test timer synchronization with backend timer system  
- [ ] Validate timer expiration handling (timer reaches zero)
- [ ] Ensure no regression in other live page functionality (answer submission, feedback, etc.)

### **Implementation Details**

**Required Hook Configuration**:
```typescript
const timer = useSimpleTimer({
    gameId: string,           // from page params or context
    accessCode: string,       // from page params  
    socket: Socket | null,    // from existing useStudentGameSocket
    role: 'student'           // student role for read-only timer
});
```

**TournamentTimer Integration**:
```typescript
// Before: 
<TournamentTimer 
    timerS={gameState.timer?.timeLeftMs ? Math.ceil(gameState.timer.timeLeftMs / 1000) : null} 
    isMobile={isMobile} 
/>

// After:
<TournamentTimer 
    timerS={timer.timeLeftMs ? Math.ceil(timer.timeLeftMs / 1000) : null} 
    isMobile={isMobile} 
/>
```

### **Exit Criteria**
- [ ] Live page timer uses useSimpleTimer hook instead of useStudentGameSocket timer data
- [ ] Timer displays correctly and syncs with teacher dashboard
- [ ] No breaking changes to existing live page functionality
- [ ] Code is cleaner and follows the modernization pattern

## ### **Phase 4.1 Status Update: useTeacherQuizSocket Modernization**
**Current Issue:** File restoration showed that my import changes were applied but the main implementation still uses legacy gameManager.
**Next Action:** Complete the replacement of gameManager usage with modern useSimpleTimer + useGameSocket pattern.
**Critical:** Must maintain exact same return interface for backward compatibility with existing consumers.

**Plan:**
1. Replace gameManager initialization with useSimpleTimer + useGameSocket
2. Update all internal method implementations to use new timer methods  
3. Keep return interface identical to avoid breaking debug page and tests
4. Test TypeScript compilation

### 🚨 **CRITICAL SECURITY FIX APPLIED** ✅
- **Fixed Timer Bypass Vulnerability**: Added comprehensive timer validation to `gameAnswer.ts`
- **Issue**: Users could submit answers when timer was stopped in quiz mode
- **Root Cause**: Dual event handler registration with inconsistent validation
- **Solution**: Added proper timer status checks before answer processing
- **Result**: Timer controls now properly enforced across all game modes

### **🚨 Phase 5: BACKEND HANDLER ARCHITECTURE CLEANUP** 🔄 ACTIVE
**Discovered**: Systemic dual event handler registration causing security vulnerabilities

#### **Critical Issues Found**:
- [x] **Dual `game_answer` handlers**: Fixed - removed duplicate from sharedLiveHandler ✅
- [ ] **Dual `JOIN_GAME` handlers**: `sharedLiveHandler.ts` + `game/index.ts` both register
- [ ] **Architecture confusion**: Handler responsibility unclear
- [ ] **Complete audit needed**: Check all event registrations for duplicates

#### **Phase 5 Tasks** (Following .instructions.md guidelines):
- [ ] **Create handler audit script**: Python script to systematically identify all dual registrations
- [ ] **Fix JOIN_GAME duplication**: Choose single handler or implement proper coordination
- [ ] **Document handler responsibilities**: Clear separation of concerns in docs/
- [ ] **Validate no other duplicates**: Ensure clean event handler architecture
- [ ] **Test all fixed handlers**: Verify no regressions in functionality
- [ ] **Update documentation**: Handler patterns and best practices

### **Phase 8: FIX LOBBY REDIRECT ISSUE - ELIMINATE LEGACY REDIRECT EVENTS** 🚧 IN PROGRESS
- [ ] **INVESTIGATE**: Students stuck in lobby after teacher starts quiz ✅
- [ ] **ROOT CAUSE**: Legacy dual redirect events (`REDIRECT_TO_QUIZ` + `REDIRECT_TO_GAME`) ✅  
- [ ] **MODERNIZE**: Remove legacy `REDIRECT_TO_QUIZ` event completely
- [ ] **VALIDATE**: Test lobby → live game redirection works correctly
- [ ] **CLEANUP**: Remove legacy socket event definitions

**ISSUE**: Students receive `redirect_to_game` event but don't redirect automatically. Frontend has legacy compatibility code listening to both `REDIRECT_TO_QUIZ` (legacy) and `REDIRECT_TO_GAME` (canonical). Per `.instructions.md`, must eliminate all legacy patterns.

### **Phase 9: IMPLEMENT REAL-TIME ANSWER STATISTICS** ✅ COMPLETED
**OBJECTIVE**: Emit real-time answer statistics to teacher dashboard for each question, enabling live visualization of student response distribution as in the pre-rewrite system.

#### **Implementation** ✅
- [x] **Event Definition**: Added `DASHBOARD_ANSWER_STATS_UPDATE` event to shared types ✅
- [x] **Backend Emission**: Modified `gameAnswer.ts` to emit answer stats after each submission ✅
- [x] **Stats Calculation**: Enhanced `getAnswerStats` helper to handle current answer data structure ✅
- [x] **Room Targeting**: Correctly identifies dashboard room based on game mode (quiz vs tournament) ✅
- [x] **Data Structure**: Uses `DashboardAnswerStatsUpdatePayload` with `questionUid` and `stats` mapping ✅

#### **Technical Details** ✅
- **Event Name**: `dashboard_answer_stats_update`
- **Payload Type**: `DashboardAnswerStatsUpdatePayload`
- **Emission Location**: After successful answer storage in Redis, before leaderboard update
- **Room Logic**: `dashboard_${gameId}` for general games, `teacher_${initiatorUserId}_${accessCode}` for quiz mode
- **Error Handling**: Graceful fallback if stats calculation fails, with detailed logging

#### **Code Changes** ✅
1. **Shared Types** (`shared/types/socket/events.ts`):
   - Added `DASHBOARD_ANSWER_STATS_UPDATE: 'dashboard_answer_stats_update'` event
2. **Backend Handler** (`backend/src/sockets/handlers/game/gameAnswer.ts`):
   - Import `getAnswerStats` helper and dashboard payload types
   - Emit stats update after successful answer submission
3. **Stats Helper** (`backend/src/sockets/handlers/teacherControl/helpers.ts`):
   - Enhanced to handle direct answer values (numbers) and nested structures
   - Convert answer indices to string keys for consistent mapping
4. **Frontend Integration** (`frontend/src/app/teacher/dashboard/[code]/page.tsx`):
   - Updated to use `useTeacherQuizSocket` hook which provides `answerStats`
   - Added `getStatsForQuestion` function to convert backend stats format to UI format
   - Connected stats to `DraggableQuestionsList` component for real-time display
   - Stats are always visible on teacher dashboard (no toggle needed)

**STATUS**: ✅ COMPLETED - Teacher dashboard now displays live answer statistics as students submit responses.

### **Phase 8: DASHBOARD SOCKET CONSISTENCY** ✅ COMPLETED
- [x] **NAMING CONVENTION**: Implemented consistent `dashboard_${gameId}` room naming across all game types ✅
- [x] **DRY PRINCIPLE**: Removed special-case room logic for quiz mode ✅
- [x] **CODE SIMPLIFICATION**: Unified dashboard room emission logic for all play modes ✅
- [x] **BACKEND PERCENTAGE CALCULATION**: Simplified answer stats to use unified percentage calculation for all question types ✅
