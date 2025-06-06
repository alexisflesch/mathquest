# Socket Type Migration Plan - Phase 3

## Overview
Migrate frontend hooks to use strict shared types from `/shared/types/socketEvents.ts` and eliminate local type definitions that duplicate or conflict with shared types.

## Current Issues Identified

### 1. Local Type Conflicts
- ~~`TimerUpdate` (frontend) vs shared timer payload types~~ ✅ **RESOLVED**
- ~~`GameTimerUpdate` (frontend) vs shared timer payload types~~ ✅ **RESOLVED**
- ~~`SocketQuestion` (frontend) vs `QuestionData` (shared)~~ ✅ **RESOLVED**
- ~~`SocketParticipant` (frontend) vs `ParticipantData` (shared)~~ ✅ **RESOLVED**

### 2. Missing Shared Types Usage
- ~~Frontend hooks not using `ClientToServerEvents` and `ServerToClientEvents` interfaces~~ ✅ **RESOLVED**
- ~~Event payloads using `any` or local types instead of shared payload interfaces~~ ✅ **PARTIALLY RESOLVED** (core hooks migrated)

### 3. Timer Event Inconsistencies
- ~~Multiple timer event handlers (`timer_update`, `game_timer_updated`, etc.) with different payload structures~~ ✅ **RESOLVED**
- ~~Need to standardize on shared `timer_update` payload type~~ ✅ **RESOLVED**

## Migration Strategy

### Phase 3.1: Create Migration Types ✅ **COMPLETED**
- ✅ Create temporary bridge types for compatibility during migration
- ✅ Add runtime validation for critical event payloads
- ✅ Create type guards for safe type narrowing

### Phase 3.2: Migrate Core Socket Hooks ✅ **100% COMPLETED**
- ✅ ~~Update `useGameTimer` to use shared timer payload types~~ **COMPLETED**
- ✅ ~~Update `useStudentGameSocket` to use shared event payload types~~ **COMPLETED**
- ✅ ~~Update `useTeacherQuizSocket` to use shared event payload types~~ **COMPLETED**
- ✅ ~~Update `useTournamentSocket` to use shared event payload types~~ **COMPLETED**
- ✅ ~~Update `useProjectionQuizSocket` to use shared event payload types~~ **COMPLETED**
- ✅ ~~Update `usePracticeGameSocket` to use shared event payload types~~ **COMPLETED**

### Phase 3.3: Legacy Type Cleanup (COMPLETE)
- All legacy/conflicting types removed from `/frontend/src/types/socket.ts` (except `AnswerValue` and `SocketConfig` as needed).
- All usages of legacy types/imports removed from codebase.
- All core socket hooks now use shared types from `/shared/types/socketEvents.ts` and runtime validation.
- All related tests updated to use valid payloads and pass with runtime validation enabled.
- [x] 100% complete.

### Phase 3.4: Comprehensive Testing (IN PROGRESS)
- All core socket hooks and tests migrated and passing.
- Next: Full regression and integration testing across app.

---

**Last updated: 2025-06-06**

## Target Architecture
- All socket event payloads use shared types from `/shared/types/socketEvents.ts`
- Frontend socket hooks are strongly typed with `ClientToServerEvents` and `ServerToClientEvents`
- Runtime validation ensures type safety at event boundaries
- Consistent event payload structures across all hooks

## Completed Work

### ✅ Phase 3.1: Migration Types (COMPLETED)
**File: `/frontend/src/types/socketTypeGuards.ts`**
- ✅ Created comprehensive runtime validation system with `createSafeEventHandler` function
- ✅ Added extensive type guards for all socket event payloads:
  - Student game types: `StudentGameQuestion`, `GameQuestionPayload`, timer payloads
  - Teacher quiz types: `SetQuestionPayload`, `TeacherTimerActionPayload`, `GameErrorDetails`, dashboard events
  - Tournament types: tournament-specific payload interfaces and validation
- ✅ Added migration helper functions for converting between legacy and shared formats
- ✅ Implemented runtime validation utilities and error handling

### ✅ Phase 3.2a: Student Game Socket Migration (COMPLETED)
**File: `/frontend/src/hooks/useStudentGameSocket.ts`**
- ✅ Updated imports to use shared types from `@shared/types/socketEvents`
- ✅ Added type guards for runtime validation from `@/types/socketTypeGuards`
- ✅ Migrated `StudentGameQuestion` interface to extend shared `QuestionData` type
- ✅ Updated timer event handlers to use `TimerUpdatePayload` with `running` boolean field
- ✅ Updated error handlers to use shared `ErrorPayload` type
- ✅ Updated game_joined handler to use shared `GameJoinedPayload` type
- ✅ Fixed test files to use new shared timer format (with `running: boolean` field)

**Security Fix Applied:**
- ✅ Fixed student socket tests to use `LiveQuestionPayload` (filtered for students) instead of `GameQuestionPayload` (teacher-level data with sensitive info)
- ✅ Removed `code` field and other sensitive teacher data from test payloads
- ✅ Verified backend properly filters questions using `filterQuestionForClient()` function

### ✅ Phase 3.2b: Teacher Quiz Socket Migration (COMPLETED)
**File: `/frontend/src/hooks/useTeacherQuizSocket.ts`**
- ✅ Added comprehensive type guards for teacher-specific socket types
- ✅ Updated imports to include shared types: `QuestionData`, `ErrorPayload`, `TimerUpdatePayload`, `GameTimerUpdatePayload`, `TimerActionPayload`
- ✅ Modified `Question` interface to properly extend shared `QuestionData` type with teacher-specific fields
- ✅ Updated `QuizState` interface to maintain compatibility while using shared structure
- ✅ Converted event handlers to use `createSafeEventHandler` with runtime validation
- ✅ Updated timer update handler to support both shared and legacy timer formats
- ✅ Added null safety checks for `quizId` parameter in all emit functions
- ✅ Fixed type conversion issues between `TeacherQuizState` and `QuizState`
- ✅ Migrated all dashboard event handlers to use type guards and shared types

### ✅ Phase 3.2c: Tournament Socket Migration (COMPLETED)
**File: `/frontend/src/hooks/useTournamentSocket.ts`**
- ✅ Added tournament-specific type guards to `socketTypeGuards.ts`
- ✅ Updated imports to use shared types and comprehensive type guards
- ✅ Converted event handlers to use type-safe event handling
- ✅ Fixed compilation errors and ensured proper type validation

### ✅ Phase 3.2d: Projection Quiz Socket Migration (COMPLETED)
**File: `/frontend/src/hooks/useProjectionQuizSocket.ts`**
- ✅ Added projector-specific type guards to `socketTypeGuards.ts`:
  - `ProjectorQuestion`, `ProjectorState`, `ProjectorJoinedRoomPayload` interfaces
  - `ProjectorConnectedCountPayload`, `ProjectorTimerUpdatePayload`, `LegacyQuizTimerUpdatePayload` interfaces
  - Type guard functions: `isProjectorState`, `isProjectorJoinedRoomPayload`, `isProjectorConnectedCountPayload`, etc.
  - Migration helper functions: `migrateProjectorTimerUpdate`, `migrateLegacyQuizTimerUpdate`
- ✅ Replaced legacy `QuizState` type with `ProjectorState` from shared types
- ✅ Converted all event handlers to use `createSafeEventHandler` with runtime validation:
  - `PROJECTOR.PROJECTOR_STATE` with `isProjectorState` validation
  - `PROJECTOR.JOINED_ROOM` with `isProjectorJoinedRoomPayload` validation
  - `LEGACY_QUIZ.TIMER_UPDATE` with `isLegacyQuizTimerUpdatePayload` and migration
  - `PROJECTOR.PROJECTION_TIMER_UPDATED` with `isProjectorTimerUpdatePayload` validation
  - `PROJECTOR.PROJECTOR_CONNECTED_COUNT` with `isProjectorConnectedCountPayload` validation
- ✅ Updated timer management to use shared `TimerUpdatePayload` format with migration helpers
- ✅ Eliminated all legacy type references and implemented comprehensive runtime validation

## Current Status: **85% COMPLETED**

### 🔄 Remaining Work

#### Phase 3.2e: Practice Game Socket Migration (PENDING)
**File: `/frontend/src/hooks/usePracticeGameSocket.ts`**
- 🔄 Update imports to use shared types
- 🔄 Add type guards for practice game events
- 🔄 Convert event handlers to use runtime validation
- 🔄 Ensure proper type safety for practice mode

#### Phase 3.4: Comprehensive Testing (PENDING)
- 🔄 Run full test suite to verify all socket hooks work correctly
- 🔄 Test runtime validation is working properly
- 🔄 Verify no type errors or runtime issues remain
- 🔄 Performance testing to ensure type guards don't impact performance
