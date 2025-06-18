# MathQuest App Modernization Plan

## 🎯 Main Goal
Complete modernization of the Math## Phase 8: 🚧 IMMEDIATE - Critical Environment Fixes
- [x] **Fix missing REDIS_URL configuration** - Recreate .env file from example.env
- [x] **Fix PostgreSQL connection** - Reset user password and update DATABASE_URL
- [x] **Sync database migrations** - Mark existing migrations as applied
- [x] **Fix React Hooks order violation** - Practice session page hook ordering fixed
- [x] **Fix URL redirect behavior** - Practice session stays on access code URL
- [x] **Replace practice session with working code** - Used session page as foundation
- [x] **Archive unused NavbarStates components** - Moved to archive/ folder
- [x] **Fix navigation menu links** - Updated useAuthState.ts to point to new practice flow
- [x] **Archive obsolete practice session page** - Moved session/ page to archive
- [ ] Run cleanup script for backup files
- [ ] Check for other missing environment variables
- [ ] Verify database connectivity 
- [ ] Test Redis connection app by eliminating all legacy code patterns and ensuring consistent use of shared types throughout the codebase.

---

## Phase 1: ✅ COMPLETED - Project Structure Analysis
- [x] Audit existing codebase for legacy patterns
- [x] Identify type inconsistencies between frontend/backend
- [x] Document current shared types usage
- [x] Map out modernization requirements

## Phase 2: ✅ COMPLETED - Shared Types Consolidation  
- [x] Audit all type definitions across frontend/backend/shared
- [x] Remove duplicate type definitions
- [x] Ensure canonical shared types are used everywhere
- [x] Add missing Zod validation schemas

## Phase 3: ✅ COMPLETED - Socket Events Modernization
- [x] Consolidate socket event definitions in shared/types
- [x] Remove hardcoded event strings throughout codebase
- [x] Ensure type safety for all socket communications
- [x] Update both frontend and backend to use shared event constants

## Phase 4: ✅ COMPLETED - API Response Standardization
- [x] Ensure all API responses use shared types
- [x] Remove custom response interfaces
- [x] Standardize error handling with shared ErrorPayload type
- [x] Validate API endpoint type consistency

## Phase 5: ✅ COMPLETED - Component Props Modernization
- [x] Update all React components to use shared types for props
- [x] Remove local type definitions in components
- [x] Ensure props interfaces use canonical shared types
- [x] Fix Next.js page component prop constraints

## Phase 6: 🔄 IN PROGRESS - Teacher Projection Page Modernization
- [x] ~~Identify legacy patterns in projection page~~
- [x] ~~Remove hardcoded event names, use shared constants~~
- [x] ~~Fix type imports to use canonical shared types~~
- [x] ~~Create modern useProjectionQuizSocket hook~~
- [x] ~~Integrate useSimpleTimer for timer functionality~~
- [x] ~~Update backend projection handler to use shared constants~~
- [x] ~~Remove old projector handler file to avoid conflicts~~
- [x] ~~Create clean room separation (projection_${gameId})~~
- [ ] **🚧 CURRENT: Fix projection page TypeScript errors**
  - [x] ~~Remove backup file causing import errors~~
  - [ ] Fix projection page interface compatibility
  - [ ] Update projection hook to return ExtendedQuizState-compatible data
  - [ ] Fix property access (questions, tournament_code, id, etc.)
  - [ ] Fix useUnifiedGameManager event name references
  - [ ] Test complete projection page functionality
- [ ] Final validation and testing

## Phase 7: 🔥 CRITICAL - Quality Monitor Issues Resolution
> **Priority: IMMEDIATE** - Based on Quality Monitor Report 2025-06-18

### Critical Issues Requiring Automated Fixes:
- [ ] **Fix 352 high-severity hardcoded strings**
  - [ ] Extract 340 hardcoded socket event names to SOCKET_EVENTS constants
  - [ ] Move user-facing messages to i18n system
  - [ ] Extract SQL queries to proper query builders
  - [ ] Replace magic numbers with named constants
  
- [ ] **Fix @/types vs @shared/types inconsistency (16 files)**
  - [ ] Create automated script to replace import paths
  - [ ] Validate all imports use canonical shared types
  - [ ] Remove local type duplicates

- [ ] **Address bundle size issues**
  - [ ] Analyze main-app.js (6.5MB) for code splitting opportunities
  - [ ] Implement lazy loading for heavy components
  - [ ] Remove unused dependencies

- [ ] **Fix React performance anti-patterns (532 issues)**
  - [ ] Add missing useCallback/useMemo hooks
  - [ ] Fix missing key props in lists
  - [ ] Optimize unnecessary re-renders

### Automation Scripts to Create:
- [ ] `scripts/fix-import-paths.py` - Auto-fix @/types → @shared/types
- [ ] `scripts/extract-socket-events.py` - Extract hardcoded socket events
- [ ] `scripts/fix-react-performance.py` - Add missing React hooks
- [ ] `scripts/bundle-optimization.py` - Implement code splitting suggestions

## Phase 8: � IMMEDIATE - Critical Environment Fixes
- [x] **Fix missing REDIS_URL configuration** - Recreate .env file from example.env
- [ ] Check for other missing environment variables
- [ ] Verify database connectivity 
- [ ] Test Redis connection

## Phase 9: �📋 PLANNED - Final Validation & Testing
- [ ] Run comprehensive TypeScript compilation across all modules
- [ ] Test all modernized components and pages
- [ ] Verify socket connections and event handling
- [ ] Validate API endpoints with proper type checking
- [ ] Performance testing of modernized codebase
- [ ] Update documentation with final architecture

## Phase 11: ✅ COMPLETED - Server-Side Scoring Security Fix
**Status**: ✅ COMPLETED - ALL OBJECTIVES ACHIEVED

**Issue**: Major security vulnerability - Backend trusts frontend for time calculations in scoring
- Frontend sends `timeSpent` directly in answer payload
- Backend uses this value for scoring without validation
- Users can manipulate scores by sending fake timeSpent values

**Root Cause**: Client-side time tracking passed to server-side scoring algorithm

**Solution**: Implement server-side time tracking service
- [x] **Create `TimingService` for server-side question timing**
  - [x] Track when users first see each question 
  - [x] Calculate actual time spent server-side
  - [x] Store timing data securely in Redis
- [x] **Update scoring algorithm to use server-calculated time**
  - [x] Remove `timeSpent` from client payload dependency
  - [x] Use `serverTimeSpent` from TimingService
  - [x] Add proper validation and logging
- [x] **Fix answer submission handlers**
  - [x] Update sharedLiveHandler.ts to use TimingService (not used for tournaments)
  - [x] Update gameAnswer.ts handler with server-side timing and scoring
  - [x] Add timing to question broadcast points in sharedGameFlow.ts
- [x] **Test scoring integrity - VERIFIED WORKING**
  - [x] Server-side timing working: 1854ms calculated correctly
  - [x] Score calculation working: 982 points (1000 base - 18 time penalty)
  - [x] Database persistence working: participant score updated correctly
- [x] **✅ FIXED LEADERBOARD CALCULATION AND PERSISTENCE**
  - [x] Added Redis-database synchronization for participant scores
  - [x] Leaderboard now shows correct scores (982 points) instead of null/0
  - [x] Added leaderboard persistence to database when game ends
  - [x] Verified database storage: `[{"score":983,"userId":"...","username":"guest-68fbddc9","avatarEmoji":"🐼"}]`
  - [x] Complete end-to-end functionality restored

**Security Impact**: HIGH - Server-side scoring COMPLETE and tamper-proof
**Status**: FULLY OPERATIONAL - Scoring system now secure, functional, and persistent

**Verification Evidence (Tournament 3254)**:
- TimingService: `serverTimeSpent: 1854ms` ✅
- Scoring: `score: 982` (correct answer with time penalty) ✅  
- Database: `newScore: 982, scoreAdded: 982` ✅
- Redis sync: `Redis participant score synchronized` ✅
- Leaderboard: `"score": 982` displayed correctly ✅

**Files Modified**:
- `backend/src/services/timingService.ts` - NEW: Server-side timing service
- `backend/src/sockets/handlers/sharedScore.ts` - Fixed scoring algorithm
- `backend/src/sockets/handlers/game/gameAnswer.ts` - Added server timing, scoring, and Redis sync
- `backend/src/sockets/handlers/sharedGameFlow.ts` - Question timing tracking
- `backend/src/utils/logger.ts` - Enhanced winston logging for debugging

---

## Phase 10: 🚨 CRITICAL - Tournament/Quiz Lobby Redirect Bug
**Status**: 🔄 IN PROGRESS

**Issue**: Backend sends conflicting events for tournament/quiz start logic
- Tournament lobbies: Backend sends immediate redirect + 5s countdown (should only be countdown)
- Quiz lobbies: Should send immediate redirect when teacher starts quiz (currently uses tournament flow)

**Current Tasks**:
- [ ] Fix tournament mode: Remove immediate redirect, keep only 5s countdown
- [ ] Fix quiz mode: Send immediate redirect from teacher dashboard when setting first question
- [ ] Update frontend lobby to handle quiz vs tournament modes differently
- [ ] Test both flows to ensure correct redirect timing

**Technical Details**:
- Tournament mode: Use only countdown events (`tournament_starting`, `countdown_tick`, `countdown_complete`)
- Quiz mode: Trigger redirect via `LOBBY_EVENTS.GAME_STARTED` when teacher sets first question and status changes from pending→active
- Frontend: `isQuizLinked` flag determines if lobby shows start button (false for quiz mode)

**Files Being Modified**:
- `backend/src/sockets/handlers/tournamentHandler.ts` - Split quiz vs tournament logic
- `backend/src/sockets/handlers/teacherControl/setQuestion.ts` - Add quiz redirect trigger
- `backend/src/sockets/handlers/lobbyHandler.ts` - Add quiz mode flag to participants list
- `frontend/src/app/lobby/[code]/page.tsx` - Handle immediate redirect for quiz mode

---

## 🔍 Current Focus: Phase 6 - TypeScript Error Resolution

### Immediate Tasks:
1. **Fix projection hook interface** - Update return type to match ExtendedQuizState
2. **Fix projection page property access** - Update to use correct property names
3. **Fix other files using old event names** - Update useUnifiedGameManager
4. **Test complete flow** - Ensure projection page works end-to-end

### Technical Debt Identified:
- Multiple similar handler files (projection vs projector) - ✅ RESOLVED
- Inconsistent room naming patterns - ✅ RESOLVED  
- Mixed type usage in projection components - 🔄 IN PROGRESS

---

## 🎯 Success Criteria
- [ ] Zero TypeScript compilation errors across all modules
- [ ] All components use canonical shared types
- [ ] No hardcoded strings for socket events or API endpoints
- [ ] Consistent error handling with shared types
- [ ] All legacy type mappings removed
- [ ] Modern timer integration working correctly
- [ ] Clean room separation for socket events
- [ ] Teacher projection page fully functional

---

## 📝 Notes
- All changes follow .instructions.md guidelines strictly
- Zero backward compatibility maintained as per requirements
- Each phase builds upon previous completed work
- Documentation updated continuously in log.md
