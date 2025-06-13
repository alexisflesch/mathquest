# 🚫 Legacy Code Removal TODO

This file tracks all remaining legacy code, endpoints, fields, or compatibility logic that must be removed to achieve full modernization and compliance with project rules.

## Why?
- The project enforces ZERO backward compatibility and ZERO legacy code patterns (see `instructions.md`).
- All legacy endpoints, fields, and compatibility logic must be identified and removed.

---

## Legacy Code/Endpoint Audit

### [ ] `POST /api/v1/games/tournament` (backend/src/api/v1/games.ts)
- Still supports legacy frontend format (fields: `action`, `nom`, `questions_ids`, etc.)
- Accepts `questions_ids` instead of canonical `questionUids`.
- Contains logic for legacy payloads and on-the-fly template creation.
- **Action:** Refactor or remove this endpoint and all legacy field handling.

### [ ] `POST /api/v1/players/register` (backend/src/api/v1/players.ts)
- Deprecated endpoint for student registration (should use /api/v1/auth/register).
- Accepts legacy fields like `cookie_id` and `avatar` (should use canonical shared types).
- **Action:** Remove this endpoint and update all references to use the canonical auth/register flow.

### [ ] `POST /api/v1/teachers/register` (backend/src/api/v1/teachers.ts)
- Deprecated endpoint for teacher registration (should use /api/v1/auth/register).
- **Action:** Remove this endpoint and update all references to use the canonical auth/register flow.

---

_Add more legacy code findings here as you continue the audit._
