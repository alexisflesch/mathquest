# Migration from Tournament to Game: Progress Report

## Overview
This document tracks the progress of refactoring the codebase from using the "Tournament" concept to the new "GameInstance" model as defined in the Prisma schema. This is part of a larger effort to align the backend and frontend with the schema changes and standardize on English terminology.

## Completed Tasks

### Core Files Renamed
- ✅ `/backend/sockets/tournamentEvents.ts` → `/backend/sockets/gameEvents.ts` 
- ✅ Created `/backend/sockets/gameHandler.ts` (new file that replaces tournamentHandler.ts)
- ✅ Created `/backend/sockets/gameUtils/gameState.ts` 
- ✅ Created `/backend/sockets/gameUtils/gameHelpers.ts`
- ✅ Created `/backend/sockets/gameUtils/computeLeaderboard.ts`
- ✅ Created `/backend/sockets/gameUtils/gameTriggers.ts`
- ✅ Created `/backend/sockets/types/gameTypes.ts`

### Socket Events Renamed
- ✅ `start_tournament` → `start_game`
- ✅ `join_tournament` → `join_game`
- ✅ `tournament_answer` → `game_answer`
- ✅ `tournament_pause` → `game_pause`
- ✅ `tournament_resume` → `game_resume`

### Updated Imports
- ✅ Updated `/backend/sockets/gameHandler.ts` to use gameState and gameEvents (with absolute paths)
- ✅ Updated `/backend/sockets/gameUtils/gameState.ts` to use absolute paths
- ✅ Updated `/backend/sockets/gameEvents.ts` to use absolute paths
- ✅ Updated `/backend/server.ts` to import from gameHandler instead of tournamentHandler

## Pending Tasks

### Additional File Renames/Updates
- ⬜ Update all imports in `gameEventHandlers/` files to use absolute paths (using @sockets alias)
- ⬜ Update all imports in `gameUtils/` files to use absolute paths (using @sockets alias)
- ⬜ Delete or update `/backend/sockets/tournamentHandler.ts` once all references are migrated

### Event Handler Updates
- ⬜ Update `/backend/sockets/gameEventHandlers/startHandler.ts` to use gameState and remove tournamentState references
- ⬜ Update `/backend/sockets/gameEventHandlers/joinHandler.ts` to use gameState and remove tournamentState references
- ⬜ Update `/backend/sockets/gameEventHandlers/answerHandler.ts` to use gameState and remove tournamentState references
- ⬜ Update `/backend/sockets/gameEventHandlers/pauseHandler.ts` to use gameState and remove tournamentState references
- ⬜ Update `/backend/sockets/gameEventHandlers/resumeHandler.ts` to use gameState and remove tournamentState references
- ⬜ Update `/backend/sockets/gameEventHandlers/disconnectingHandler.ts` to use gameState and remove tournamentState references

### Frontend Component Updates
- ⬜ Update `/frontend/src/components/` components that reference tournament to use game terminology
- ⬜ Update `/frontend/src/hooks/` hooks that reference tournament to use game terminology

### Shared Types Updates
- ⬜ Make sure all types properly resolve from imports like `@shared/types/game/*`

## Tips for Continuing the Migration

1. **Use absolute paths**: Use absolute path imports with tsconfig path aliases like `@sockets/gameUtils/gameState` instead of relative paths like `../gameUtils/gameState`.

2. **Run TypeScript checks**: After each change, run `tsc` to ensure type integrity.

3. **Update one file at a time**: Make sure each file fully compiles before moving to the next one.

4. **Test after logical groupings**: After updating a logical group of files (e.g., all event handlers), test that functionality works.

## Known Issues and Blockers

- The `Question` type lacks `correctAnswers` property needed by answerHandler.ts
- There may be circular dependencies between state and helper modules

## Next Steps

1. Update all gameEventHandlers files to use gameState from @sockets/gameUtils/gameState
2. Ensure Question type includes correctAnswers property for scoring logic
3. Continue with frontend updates after backend is stable
