# TypeScript Conversion Tracker

This document tracks the progress of converting individual files from JavaScript to TypeScript in the MathQuest backend.

## Core Modules

| File | Status | Notes |
|------|--------|-------|
| `/sockets/quizState.js` | ✅ Converted | Now available as `quizState.ts` with proper type annotations |
| `/sockets/quizUtils.js` | ✅ Converted | Now available as `quizUtils.ts` with proper type annotations |
| `/sockets/tournamentUtils/tournamentState.js` | ✅ Converted | Now available as `tournamentUtils/tournamentState.ts` |
| `/sockets/quizHandler.js` | ❌ Pending | Socket event registration |
| `/sockets/quizEvents.js` | ✅ Converted | Now available as `quizEvents.ts` |
| `/sockets/tournamentHandler.js` | ❌ Pending | Socket event registration |
| `/sockets/tournamentEvents.js` | ❌ Pending | Event handler registration |
| `/sockets/lobbyHandler.js` | ❌ Pending | Socket event registration |
| `/server.js` | ❌ Pending | Main server initialization |

## Type Definitions

| File | Status | Notes |
|------|--------|-------|
| `/sockets/types/quizTypes.ts` | ✅ Created | Core quiz state types |
| `/sockets/types/tournamentTypes.ts` | ✅ Created | Tournament state types |
| `/sockets/types/socketTypes.ts` | ✅ Created | Socket event payload types, updated with PauseResumePayload |

## Quiz Event Handlers

The following files in `/sockets/quizEventHandlers/` need to be converted:

| File | Status | Notes |
|------|--------|-------|
| `closeQuestion.js` | ❌ Pending | |
| `disableQuestion.js` | ❌ Pending | |
| `endHandler.js` | ✅ Converted | Now available as `endHandler.ts` |
| `getQuizState.js` | ❌ Pending | |
| `joinDashboard.js` | ❌ Pending | |
| `joinQuiz.js` | ❌ Pending | |
| `lockHandler.js` | ✅ Converted | Now available as `lockHandler.ts` |
| `pauseHandler.js` | ✅ Converted | Now available as `pauseHandler.ts` |
| `quitQuiz.js` | ❌ Pending | |
| `resumeHandler.js` | ✅ Converted | Now available as `resumeHandler.ts` |
| `setQuestionHandler.js` | ✅ Converted | Now available as `setQuestionHandler.ts` |
| `setTimerHandler.js` | ✅ Converted | Now available as `setTimerHandler.ts` |
| `timerActionHandler.js` | ✅ Converted | Now available as `timerActionHandler.ts` |
| `unlockHandler.js` | ✅ Converted | Now available as `unlockHandler.ts` |

## Tournament Event Handlers

The following files in `/sockets/tournamentEventHandlers/` need to be converted:

| File | Status | Notes |
|------|--------|-------|
| `answerHandler.js` | ✅ Converted | Now available as `answerHandler.ts` |
| `joinHandler.js` | ✅ Converted | Now available as `joinHandler.ts` |
| `pauseHandler.js` | ✅ Converted | Now available as `pauseHandler.ts` |
| `resumeHandler.js` | ✅ Converted | Now available as `resumeHandler.ts` |
| `startHandler.js` | ✅ Converted | Now available as `startHandler.ts` |
| `disconnectingHandler.js` | ✅ Converted | Now available as `disconnectingHandler.ts` |

## Tournament Utilities

The following files in `/sockets/tournamentUtils/` need to be converted:

| File | Status | Notes |
|------|--------|-------|
| `scoreUtils.js` | ✅ Converted | Now available as `scoreUtils.ts` with proper type annotations |
| `computeStats.js` | ✅ Converted | Now available as `computeStats.ts` with proper type annotations |
| `tournamentTriggers.js` | ❌ Pending | Event trigger functions |
| `tournamentHelpers.js` | ❌ Pending | Helper functions |
| `computeLeaderboard.js` | ❌ Pending | Leaderboard calculation |
| `sendTournamentQuestion.js` | ❌ Pending | Question broadcasting | 

## Next Steps

1. Convert the following remaining core files:
   - `/sockets/tournamentUtils/tournamentTriggers.js`
   - `/sockets/tournamentUtils/tournamentHelpers.js`  
   - `/sockets/tournamentUtils/computeLeaderboard.js`
   - `/sockets/tournamentUtils/sendTournamentQuestion.js`
   - `/sockets/tournamentHandler.js`
   - `/sockets/tournamentEvents.js`

2. Fix bridge files for all handlers (completed for tournament handlers)

3. Convert the remaining quiz event handlers in `/sockets/quizEventHandlers/`

4. Gradually enable stricter TypeScript options
