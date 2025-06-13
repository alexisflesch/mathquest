# MathQuest Backend Middleware

This document describes the main Express middleware in the MathQuest backend (`backend/src/middleware/`).

## Authentication Middleware

### `teacherAuth`
- **Purpose:** Protects routes that require teacher authentication.
- **How it works:**
  - Checks for a JWT in the `Authorization` header (Bearer token) or cookies (`teacherToken` or `authToken`).
  - Verifies the token and attaches the decoded user info to `req.user`.
  - Responds with `401 Unauthorized` if no valid token is found.
- **Usage:**
  - Add as middleware to any route that should only be accessible by authenticated teachers.

### `optionalAuth`
- **Purpose:** Optionally authenticates requests if a valid JWT is present, but does not reject unauthenticated requests.
- **How it works:**
  - Checks for a JWT in the `Authorization` header or cookies.
  - If present and valid, attaches user info to `req.user`.
  - If not present or invalid, continues without authentication.
- **Usage:**
  - Use for routes that can be accessed by both authenticated and unauthenticated users, but may behave differently if a user is logged in.

---

For more details, see the source in `backend/src/middleware/auth.ts`.
