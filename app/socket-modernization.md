# Socket Payload Modernization Audit & Refactor Plan

## Goal
Modernize all socket event payloads in both backend and frontend to:
- Use canonical shared types from `shared/types/` for all payloads
- Enforce Zod validation for all incoming and outgoing socket data
- Remove all usage of `any` for socket payloads
- Eliminate legacy/compatibility patterns

---

## PHASE 1: AUDIT & SCOPING

### [x] Audit all socket usage (emit/on) in backend and frontend
### [x] Identify all files using `any` for socket payloads or missing Zod validation
### [x] List all files requiring modernization

---

## PHASE 2: FILES REQUIRING MODERNIZATION

### Backend
- [ ] `src/sockets/handlers/projectionHandler.ts` (uses `payload: any`)
- [ ] `src/sockets/handlers/game/index.ts` (uses `payload: any`)
- [ ] `src/sockets/handlers/game/requestNextQuestion.ts` (uses `payload: any`)
- [ ] `src/sockets/handlers/game/gameAnswer.ts` (uses `payload: any`)
- [ ] `src/sockets/handlers/sharedLiveHandler.ts` (uses `payload: any`)
- [ ] `src/sockets/handlers/tournamentHandler.ts` (uses `payload: any`)
- [ ] `src/sockets/handlers/teacherControl/setQuestion.ts` (uses `payload: any`)
- [ ] `src/sockets/handlers/teacherControl/pauseTimer.ts` (uses `_payload: any`)
- [ ] `src/sockets/handlers/validateProjectionStateWithZod.ts` (uses `payload: any`)
- [ ] `src/sockets/handlers/practiceSessionHandler.ts` (uses `payload: any`)
- [ ] `src/sockets/handlers/teacherControl/lockAnswers.ts` (callback uses `(data: any) => void`)
- [ ] `src/sockets/handlers/teacherControl/joinDashboard.ts` (callback uses `(data: any) => void`)

### Frontend
- [ ] `src/hooks/usePracticeSession.ts` (uses `(payload: any)` in multiple handlers)
- [ ] `src/hooks/useProjectionQuizSocket.ts` (uses `(payload: any)` in multiple handlers)
- [ ] `src/hooks/useGameSocket.ts` (uses `as any` and `(payload: any)`)
- [ ] `src/hooks/useTeacherQuizSocket.ts` (uses `as any` and `(state: any)`)
- [ ] `src/components/TeacherDashboardClient.tsx` (uses `(state: any)` and `(error: any)`)

---

## PHASE 3: MODERNIZATION CHECKLIST

For each file above:
- [ ] Replace all `any` payloads with canonical shared types from `shared/types/`
- [ ] Import and use the correct Zod schema for each payload
- [ ] Validate all incoming and outgoing payloads with Zod
- [ ] Remove all legacy/compatibility code (no `as any`, no local interfaces for shared types)
- [ ] Ensure event names and payloads match exactly across backend/frontend/shared
- [ ] Add/Update tests to cover Zod validation and type safety
- [ ] Document all changes in this file and log any new/changed events

---

## PHASE 4: TESTING & VALIDATION
- [ ] Run all relevant tests after each file is modernized
- [ ] Manually test socket flows for type and validation errors
- [ ] Update this checklist as each file is completed

---

## PHASE 5: FINAL REVIEW
- [ ] Confirm all socket payloads use shared types and Zod validation
- [ ] Remove any remaining legacy patterns
- [ ] Summarize modernization in project documentation

---

## LOG
- [ ] Log each file refactor and any new/changed socket events here

---

> **Note:**
> This checklist must be updated after every change. No file is considered complete until all checklist items are checked and validated.
