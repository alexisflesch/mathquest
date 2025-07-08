## PHASE 1: Modernize Lobby Participant List Event

- [ ] Define canonical Zod schema and type for `participant_list` event in `shared/types/lobbyParticipantListPayload.ts` (Done)
- [x] Refactor backend to emit only `participant_list` for all lobby participant changes (join, leave, disconnect, etc.)
- [ ] Remove legacy events: `participant_joined`, `participant_left`, `participants_list`, `room_left`, etc. from backend and frontend
- [ ] Update frontend to consume only the new `participant_list` event
- [ ] Ensure all payloads use the canonical shared type and are Zod validated
- [ ] Test: All lobby participant changes are reflected in real time via the new event

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

- [x] Implement backend refactor (Phase 1)
- [ ] Implement frontend refactor (Phase 1)
- [ ] Remove all legacy/duplicate participant events
- [ ] Test and validate canonical creator emission in all lobby scenarios (join, leave, disconnect, get_participants)

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
