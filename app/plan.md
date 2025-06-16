# Plan: Fix Teacher Dashboard Timer Issue

## 🎯 **CURRENT PHASE: Timer Frontend Fix**

### **Issue Description**
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

## 🎯 **NEXT IMMEDIATE PRIORITY**
Focus on validating that the dashboard properly starts its local countdown timer when receiving backend timer events with status "play", per the documentation requirement.
