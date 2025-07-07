# plan.md

## Phase: Robust Leaderboard Highlighting (User Row)

### Goal
- Ensure the leaderboard highlights only the current user's row, even with duplicate usernames/avatars, using canonical userId and backend-driven logic.

### Phases & Checklist

#### Phase 1: Planning & Schema Update
- [ ] Update this plan.md with phases and checklist (this file)
- [ ] Update shared LeaderboardEntry type and Zod schema to include `isCurrentUser: boolean` (in `shared/types/core/leaderboardEntry.zod.ts`)
- [ ] Update API response schema in `shared/types/api/schemas.ts` to include the new field

#### Phase 2: Backend API Modernization
- [ ] Update `/api/v1/games/:code/leaderboard` endpoint to accept optional `userId` (query param)
- [ ] In backend, set `isCurrentUser: true` for leaderboard entries matching the provided userId
- [ ] Return the updated leaderboard array with highlight info
- [ ] Log and document the new API contract

#### Phase 3: Frontend Modernization
- [ ] Update frontend leaderboard fetch to send canonical userId from auth context
- [ ] Use `isCurrentUser` for row highlighting (remove username/avatar matching logic)
- [ ] Remove debug logs
- [ ] Test with duplicate usernames, different user types, and edge cases
- [ ] Update documentation and log all changes

#### Phase 4: Validation & Testing
- [ ] Describe test cases and validation steps in plan.md
- [ ] Confirm expected vs. actual behavior

### Log
- [x] Added plan.md with phase breakdown and checklist for robust leaderboard highlighting
- [x] Updated shared LeaderboardEntry type and Zod schema to include `isCurrentUser: boolean`
- [x] Updated API response schema in `shared/types/api/schemas.ts` to use canonical type and support new field
- [x] Updated backend leaderboard endpoint to accept `userId` and return `isCurrentUser` for each entry
- [x] Updated frontend to send canonical userId and use `isCurrentUser` for highlighting
- [x] Removed username/avatar matching logic and debug logs from frontend
- [x] Synced all types and validated with Zod
- [ ] Test with duplicate usernames, different user types, and edge cases
- [ ] Update documentation and log all changes after validation
