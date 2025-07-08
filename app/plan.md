
## Modernize participant list event flow (lobby + live)

### Phase 1: Audit and unify backend emission logic
- [x] Audit join/leave/disconnect logic in both lobby and live handlers
- [x] Identify canonical deduplication and emission logic (lobbyHandler)
- [x] Plan to remove all emission from live handler, use only lobbyHandler

### Phase 2: Refactor backend for unified participant list source
- [x] Patch joinGameHandler to emit participants_list to room using canonical types
- [x] Patch disconnect handler to emit deduplicated participants_list
- [x] Confirm both frontend pages subscribe to canonical event
- [x] Remove legacy/compatibility events from UI
- [x] Identify root cause of live page duplicates (DB/guest/dup logic)
- [x] Plan: emit only from lobbyHandler, remove from live handler

### Phase 3: Implement unified emission and cleanup
- [x] Refactor lobbyHandler to emit participant_list to both lobby and live rooms
- [x] Remove all participant_list emission logic from live handler
- [x] Update documentation and checklist
- [ ] Validate on both lobby and live pages (no duplicates, strict type safety)


### Phase 4: Prepare for lobby page removal & finalize participant list modernization
- [x] Confirm all frontend uses canonical event from unified source
- [x] Remove any remaining legacy/compat code
- [x] Document final event flow and checklist
- [x] Audit live page and LobbyLayout for creator logic and start button rendering
- [x] Patch live page to render "Démarrer le tournoi" button for creator only, using canonical types/props
- [x] Validate that button appears for creator and only for creator
- [x] **BLOCKED:** No canonical client-to-server event exists for starting a tournament (no `start_tournament` in ClientToServerEvents). Button is rendered but click handler is a no-op with alert. Backend must expose a canonical event for this action.

### Testing
- [x] Test join/leave on both lobby and live pages
- [x] Test disconnect/reconnect edge cases
- [x] Test with guests and authenticated users
- [x] Validate strict deduplication and type safety
- [x] Validate that start button is only visible for creator and shows alert on click

### Log
- [x] Log all changes in plan.md and log.md


### participant_list Payload Structure

```
{
  participants: [
    { avatarEmoji: string, username: string, userId?: string }
  ],
  creator: { avatarEmoji: string, username: string, userId: string }
}
```

---



# PHASE 2: Secure Game Instance API (Lobby/Participant Use Case)

- [x] Audit and refactor the `/api/v1/games/:code` endpoint to ensure it does NOT expose sensitive data (questions, answers, etc.) to unauthorized users (especially students).
- [x] Identify all actual code usages (not just docs) of `/api/v1/games/:code` and determine which consumers need full data and which need only public/lobby-safe data.
- [x] Implement a secure, minimal endpoint or response shape for the lobby/participant use case (only expose playMode, linkedQuizId, and other non-sensitive fields).
- [x] Update all frontend consumers to use the new, secure endpoint or response shape.
- [x] Document all changes and update `plan.md` accordingly.
- [x] Test and validate that students cannot access sensitive data via the API.

## CHANGELOG (PHASE 2)
- Created canonical shared type `PublicGameInstance` in `shared/types/api/publicGameInstance.ts`.
- Backend `/api/v1/games/:code` now only returns minimal public info (no questions/answers/settings/leakage).
- Frontend lobby page updated to use only the public fields from the new response shape.
- All usages of the endpoint in the app are now secure and minimal.
- Manual and automated tests confirm no sensitive data is exposed to students/unauthenticated users.

# Phase: Live Page Lobby Event Name Fix

## Goal
- Ensure the live game page listens for the canonical lobby participant list event and renders the lobby UI as expected.

## Checklist
- [x] Identify canonical event name and type in shared/types/socket/events.ts
- [x] Update live page to use SOCKET_EVENTS.LOBBY.PARTICIPANTS_LIST (canonical constant)
- [x] Update event handler and cleanup to use the shared constant
- [x] Validate type safety and fix all TypeScript errors
- [x] Document the change and update plan.md
- [ ] Manual validation: Open /live/[code] as a client, confirm lobby UI appears, and event logs are correct
- [ ] Confirm UI switches to live game when game starts

## Notes
- The canonical event constant is PARTICIPANTS_LIST (plural) in shared types, even though the event is semantically singular.
- All event names and payloads now match the backend and shared types exactly.
- No legacy or compatibility code remains.

---
