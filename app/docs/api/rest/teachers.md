# Teacher Endpoints

### POST /api/v1/teachers/register (DEPRECATED)
- **Description**: Register a new teacher. Deprecated—use `/api/v1/auth/register` instead.
- **Authentication**: None
- **Request Body**: `{ username, email, password, adminPassword }`
- **Response**: `{ user: { ... }, token: string }`
- **Status Codes**: 201, 400, 500
- **LEGACY**: This endpoint is deprecated and should be removed.

---

### GET /api/v1/teachers/profile
- **Description**: Get the authenticated teacher's profile.
- **Authentication**: Teacher (JWT required)
- **Response**: `{ user: { ... } }`
- **Status Codes**: 200, 401, 404, 500
