# TypeScript Conversion Plan

## Remaining Files to Convert

This document outlines the step-by-step plan for converting the remaining JavaScript files to TypeScript in the MathQuest application.

### Core Files
- ~~`/home/aflesch/mathquest/app/server.js` → `server.ts`~~ (Completed, server.js to be removed)
- ~~`/home/aflesch/mathquest/app/register-ts-handlers.js` → `register-ts-handlers.ts`~~ (Removed)
- `/home/aflesch/mathquest/app/db/index.js` → `db/index.ts` (Completed)
- ~~`/home/aflesch/mathquest/app/test-quizstate-imports.js` → `test-quizstate-imports.ts`~~ (Removed)
- ~~`/home/aflesch/mathquest/app/test-timer-sync.js` → `test-timer-sync.ts`~~ (Removed)

### Bridge Files (to review rather than convert)
- Legacy quiz event handler bridges in `/home/aflesch/mathquest/app/sockets/quizEventHandlers/*.legacy.js`
- Tournament event handler bridges in `/home/aflesch/mathquest/app/sockets/tournamentEventHandlers/*.js`
- Tournament utility bridges in `/home/aflesch/mathquest/app/sockets/tournamentUtils/*.js`
- `/home/aflesch/mathquest/app/sockets/quizUtils.legacy.js`

## Step 1: Convert Core Database Module

**File**: `/home/aflesch/mathquest/app/db/index.js`

**Approach**:
1. Create a new TypeScript file `db/index.ts`
2. Add appropriate type annotations for the PrismaClient
3. Use ES module syntax for imports and exports
4. Ensure the module continues to export a singleton PrismaClient instance
5. Test database connectivity still works

## Step 2: Convert Server Entry Point

**File**: `/home/aflesch/mathquest/app/server.js`

**Approach**:
**Status**: Completed. `server.ts` is functional. Original `server.js` to be removed.

## Step 3: Convert Test Files

**Files**:
- ~~`/home/aflesch/mathquest/app/test-quizstate-imports.js`~~ (Removed)
- ~~`/home/aflesch/mathquest/app/test-timer-sync.js`~~ (Removed)

**Approach**:
These files have been deemed no longer necessary and have been removed.

## Step 4: Evaluate Register TS Handlers

**File**: `/home/aflesch/mathquest/app/register-ts-handlers.js`

**Approach**:
1. ~~Determine if this file is still necessary after conversion~~
2. ~~If needed, convert to TypeScript with appropriate type annotations~~
3. ~~If no longer needed, document this and plan for safe removal~~
**Conclusion**: This file is no longer necessary as `ts-node/register` is handled by the npm scripts. It can be safely removed.

## Step 5: Review Bridge Files

After converting all core files, systematically review all bridge files to ensure they correctly import from their TypeScript counterparts:

1. Legacy quiz event handlers in `/home/aflesch/mathquest/app/sockets/quizEventHandlers/*.legacy.js`
2. Tournament event handlers in `/home/aflesch/mathquest/app/sockets/tournamentEventHandlers/*.js`
3. Tournament utility files in `/home/aflesch/mathquest/app/sockets/tournamentUtils/*.js`

## Best Practices for Conversion

1. **Type Safety**: Add appropriate type annotations progressively, starting with basic types and then refining
2. **Module Patterns**: Use ES module syntax (import/export) consistently, but maintain CommonJS compatibility
3. **Path Aliases**: Use path aliases (@logger, @sockets/*, @db/*) consistently
4. **Error Handling**: Use typed error handling for improved debugging
5. **Bridge Files**: Keep legacy .js files as thin bridges that import from TypeScript
6. **Testing**: Test each file after conversion to ensure functionality is preserved

## Timeline

- Database module (`db/index.js`): 1 day (Completed)
- Server entry point (`server.js`): 2 days (Completed)
- ~~Test files: 1 day~~ (Removed)
- Register TS handlers evaluation: 0.5 days (Completed - determined for removal)
- Bridge file review: 2 days (Next Step)

**Total Estimated Time**: 6.5 working days

## File Cleanup

The following duplicate or outdated migration tracking files should be removed or archived to avoid confusion:

1.  **Migration Progress Summaries**:
    *   `/home/aflesch/mathquest/app/migration-progress-summary.md`
    *   `/home/aflesch/mathquest/app/docs/migration-progress-summary.md` (supersedes daily summary files)

2.  **General TypeScript Tracking Files**:
    *   `/home/aflesch/mathquest/app/typescript-migration.md` (superseded by `typescript-migration-status.md`)
    *   `/home/aflesch/mathquest/app/typescript-conversion-tracker.md` (superseded by `typescript-conversion-plan.md`)
    *   `/home/aflesch/mathquest/app/typescript-progress-update.md` (superseded by `typescript-migration-status.md`)

**Recommendation**:
*   **Keep**:
    *   `typescript-migration-status.md` (for tracking overall progress and current status)
    *   `typescript-conversion-plan.md` (this file, for detailed conversion steps and future planning)
    *   `typescript-next-steps.md` (if it contains distinct, actionable items not covered elsewhere)
*   **Archive or Remove**: All other listed .md files related to migration tracking.
