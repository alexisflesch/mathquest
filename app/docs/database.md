# Database Model Update: Unified User Table

## Summary
- The schema now uses a single `User` table with a `role` field (STUDENT or TEACHER) to represent both students and teachers.
- All relations that previously referenced `Player` or `Teacher` now reference `User`.
- Optional profile tables (`TeacherProfile`, `StudentProfile`) are available for role-specific fields.
- This change simplifies permission checks and supports both student- and teacher-driven tournaments/quizzes.

## Key Schema Changes
- Added `User` model with `role` enum.
- `GameTemplate.creatorId`, `GameInstance.initiatorUserId`, and `GameParticipant.userId` now reference `User`.
- `Player` and `Teacher` models are replaced by `StudentProfile` and `TeacherProfile` (optional, 1:1 with `User`).

---

## TODO: Backend & Tests Update
- [ ] Update all backend logic to use the new `User` model instead of `Player`/`Teacher`.
    - User creation, authentication, and role checks should use `User.role`.
    - Game/template creation: set `creatorId` to the user's `id`.
    - Game participation: use `userId` from `User`.
- [ ] Update JWT and authentication helpers to issue tokens for `User` and include the `role` claim.
- [ ] Update all Prisma queries and mutations to reference `User` instead of `Player`/`Teacher`.
- [ ] Update integration and unit tests:
    - Seed test users in the `User` table with appropriate roles.
    - Update test helpers to create and use `User` records.
    - Update all test logic to use the new schema and relations.
- [ ] Remove or refactor any code that references the old `Player` or `Teacher` models.
- [ ] Update documentation and onboarding guides to reflect the new user model.

## Migration Checklist: Backend & Tests

1. Update all backend logic to use the new `User` model instead of `Player`/`Teacher`.
    - Refactor user creation and authentication to use `User` and `User.role`.
    - Update all permission and role checks to use `User.role`.
    - Update game/template creation to set `creatorId` to the user's `id`.
    - Update game participation logic to use `userId` from `User`.
2. Update JWT and authentication helpers to issue tokens for `User` and include the `role` claim.
3. Update all Prisma queries and mutations to reference `User` instead of `Player`/`Teacher`.
4. Update integration and unit tests:
    - Seed test users in the `User` table with appropriate roles.
    - Update test helpers to create and use `User` records.
    - Update all test logic to use the new schema and relations.
5. Remove or refactor any code that references the old `Player` or `Teacher` models.
6. Update documentation and onboarding guides to reflect the new user model.

---

_Last updated: 2025-05-18_
