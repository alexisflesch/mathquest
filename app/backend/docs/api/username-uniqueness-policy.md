# API Username Uniqueness Policy

## Policy
- **Usernames are NOT unique** in MathQuest. They are user-editable display names and should not be used as unique identifiers in any API endpoints, database queries, or business logic.
- All API endpoints and internal logic must use unique, immutable identifiers such as `userId` (UUID or database ID) or `email` (if unique and immutable) for user identification.

## Rationale
- Usernames can be changed by users and are not enforced to be unique.
- Using usernames as identifiers can lead to data integrity issues, security problems, and user confusion.

## Implementation Guidance
- Never use `username` as a path or query parameter for user lookups in API endpoints.
- Always use `userId` or another unique, immutable field for user identification in API requests and responses.
- If you find an endpoint or logic using `username` as a unique identifier, refactor it to use `userId` instead.

## Example (Do NOT do this):
```
GET /api/users/by-username/:username   ❌
```

## Correct Example:
```
GET /api/users/:userId   ✅
```

## Enforcement
- Code reviews and automated tests should check for improper use of `username` as a unique identifier.
- This policy must be documented in all relevant backend and API documentation.

---

_Last updated: 2025-05-18_
