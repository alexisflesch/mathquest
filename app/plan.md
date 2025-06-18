# MathQuest App Modernization Plan

## 🎯 Main Goal
Complete modernization of the MathQuest app by eliminating all legacy code patterns and ensuring consistent use of shared types throughout the codebase.

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

## Phase 8: 📋 PLANNED - Final Validation & Testing
- [ ] Run comprehensive TypeScript compilation across all modules
- [ ] Test all modernized components and pages
- [ ] Verify socket connections and event handling
- [ ] Validate API endpoints with proper type checking
- [ ] Performance testing of modernized codebase
- [ ] Update documentation with final architecture

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
