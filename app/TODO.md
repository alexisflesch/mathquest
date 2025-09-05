# TODO - Code Quality & Technical Debt

This document tracks code quality issues and technical debt that need to be addressed in future development cycles.

## ESLint Warnings & Code Quality Issues

The following ESLint warnings were temporarily downgraded from errors to warnings to allow builds to succeed. These should be systematically addressed:

### Critical React Hooks Issues ⚠️
- **react-hooks/rules-of-hooks**: React hooks being called conditionally in multiple files
  - Affects: `/src/app/live/[code]/page.tsx`, `/src/app/lobby/[code]/page.tsx`, and others
  - **Risk**: Can cause React rendering inconsistencies and crashes
  - **Priority**: HIGH - These can cause runtime errors

- **react-hooks/exhaustive-deps**: Missing dependencies in useEffect/useCallback hooks
  - Widespread across many components
  - **Risk**: Stale closures and missed re-renders
  - **Priority**: MEDIUM

### TypeScript Type Safety Issues
- **@typescript-eslint/no-explicit-any**: 200+ instances of `any` type usage
  - **Risk**: Loss of type safety benefits
  - **Priority**: MEDIUM - Should be gradually replaced with proper types

- **@typescript-eslint/no-unused-vars**: Unused variables, imports, and parameters
  - **Risk**: Dead code, larger bundle size
  - **Priority**: LOW - Cleanup task

- **@typescript-eslint/no-unsafe-function-type**: Usage of generic `Function` type
  - **Risk**: Type safety issues
  - **Priority**: MEDIUM

### React Best Practices
- **react/no-unescaped-entities**: Unescaped quotes and apostrophes in JSX
  - **Risk**: Potential rendering issues
  - **Priority**: LOW - Easy fixes

- **prefer-const**: Variables that should be `const` instead of `let`
  - **Risk**: Potential accidental reassignment
  - **Priority**: LOW

### Socket Event Imports
- **@typescript-eslint/no-unused-vars**: `SOCKET_EVENTS` imported but never used in 50+ files
  - **Risk**: Dead imports, larger bundle size
  - **Priority**: LOW - Mass cleanup needed

## Systematic Approach for Fixing

### Phase 1: Critical Fixes (HIGH Priority)
1. **Fix React Hooks Rules Violations**
   - Audit all conditional hook calls
   - Refactor components to move hooks to top level
   - Estimated effort: 2-3 days

### Phase 2: Type Safety Improvements (MEDIUM Priority)
1. **Replace `any` types with proper types**
   - Start with most critical components (auth, game logic)
   - Create proper interfaces for socket events
   - Estimated effort: 1-2 weeks

2. **Fix unsafe function types**
   - Replace `Function` type with proper function signatures
   - Estimated effort: 1 day

### Phase 3: Code Cleanup (LOW Priority)
1. **Remove unused imports and variables**
   - Can be largely automated with ESLint fixes
   - Special attention to unused `SOCKET_EVENTS` imports
   - Estimated effort: 1 day

2. **Fix React entity escaping**
   - Replace unescaped quotes with proper HTML entities
   - Can be automated
   - Estimated effort: 2 hours

3. **Prefer const over let**
   - Can be automatically fixed
   - Estimated effort: 1 hour

## Files Requiring Attention

### React Hooks Issues (Priority 1)
- `/src/app/live/[code]/page.tsx`
- `/src/app/lobby/[code]/page.tsx`
- `/src/components/TeacherDashboardClient.tsx`
- `/src/hooks/useProjectionQuizSocket.ts`
- `/src/hooks/useSimpleTimer.ts`

### Heavy `any` Usage (Priority 2)
- `/src/hooks/useProjectionQuizSocket.ts` (40+ instances)
- `/src/hooks/useStudentGameSocket.ts` (30+ instances)
- `/src/components/TeacherDashboardClient.tsx` (10+ instances)
- `/src/app/teacher/games/[id]/edit/page.tsx` (10+ instances)

### Mass Cleanup Candidates
- Socket event imports: 50+ files with unused `SOCKET_EVENTS`
- React entity escaping: 20+ files
- Prefer const: 10+ files

## ESLint Configuration Evolution

Currently using relaxed rules to allow builds:
```javascript
'@typescript-eslint/no-explicit-any': 'warn',
'react-hooks/rules-of-hooks': 'warn',
// ... others as warnings
```

**Future Goal**: Gradually re-enable strict rules as issues are fixed:
1. Enable `react-hooks/rules-of-hooks` as error after fixing all violations
2. Enable stricter TypeScript rules progressively
3. Eventually achieve zero-warning build

## Automation Opportunities

1. **ESLint Auto-fixes**: Many issues can be automatically fixed
   ```bash
   npx eslint --fix src/
   ```

2. **TypeScript Strict Mode**: Gradually enable stricter TypeScript settings

3. **Pre-commit Hooks**: Prevent new violations from being introduced

## Monitoring Progress

- [ ] Set up ESLint warning count tracking
- [ ] Create periodic reports on code quality metrics
- [ ] Establish "no new warnings" policy for new code

---
**Last Updated**: September 5, 2025  
**Status**: Initial documentation after PWA implementation  
**Next Review**: September 12, 2025
