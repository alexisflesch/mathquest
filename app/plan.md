# MathQuest Modernization Plan - Phase 3

**Status: 🚧 IN PROGRESS**
**Start Date: June 13, 2025**

## 🎯 PHASE 3: SHARED CONSTANTS & CLEANUP

### **Current Checklist:**

#### **3A: Question Type Constants (HIGH PRIORITY)**
- [x] Analyze all hard-coded question type strings in codebase
- [x] Fix `/shared/types/constants/questionTypes.ts` to use canonical types (not migration layer)
- [ ] Update frontend components to use constants instead of hard-coded strings
- [ ] Update backend code to use constants instead of hard-coded strings
- [ ] Update test files to use constants instead of hard-coded strings
- [ ] Verify TypeScript compilation passes

#### **3B: Helper Function Simplification (HIGH PRIORITY)**
- [ ] Analyze current helper functions in QuestionCard components
- [ ] Simplify/eliminate `getQuestionType()` functions where possible
- [ ] Simplify/eliminate `getQuestionTextToRender()` functions where possible
- [ ] Update components to use shared types directly
- [ ] Remove unnecessary complexity layers

#### **3C: Backup File Cleanup (MEDIUM PRIORITY)**
- [ ] Verify backup files are not needed:
  - [ ] `docs/frontend/modernization-progress-backup.md`
  - [ ] `frontend/src/app/live/[code]/page-backup.tsx`
  - [ ] `frontend/src/hooks/useTeacherQuizSocket_backup.ts`
  - [ ] `frontend/src/hooks/useProjectionQuizSocket_backup.ts`
  - [ ] `frontend/src/app/lobby/[code]/page.tsx.backup`
  - [ ] `tests/e2e/practice-mode-backup.spec.ts`
  - [ ] `backend-backup/sockets/tournamentEventHandlers/joinHandler.ts.backup`
- [ ] Remove confirmed backup files

#### **3D: Interface Consolidation (LOW PRIORITY)**
- [ ] Move StatsData interface from components to shared types
- [ ] Update components to use shared StatsData interface

#### **3E: Timeout Constants (LOW PRIORITY)**
- [ ] Extract magic timeout values to shared constants
- [ ] Update components to use timeout constants

### **Exit Criteria for Phase 3:**
- All question type strings extracted to shared constants
- Helper functions simplified or eliminated where possible
- Backup files removed
- Zero TypeScript errors maintained
- StatsData interface moved to shared types
- Magic timeout values extracted to constants

### **Risk Mitigation:**
- Run TypeScript compilation after each task
- Test affected components manually
- Document all changes in log.md
