# Player Endpoints

### POST /api/v1/players/register (DEPRECATED)
- **Description**: Register a new student (anonymous or with account). Deprecated—use `/api/v1/auth/register` instead.
- **Authentication**: None
- **Request Body**: `{ username, email, password, cookie_id, avatar }`
- **Response**: `{ user: { ... }, token: string }`
- **Status Codes**: 201, 400, 500
- **LEGACY**: This endpoint is deprecated and should be removed.

---

### GET /api/v1/players/cookie/:cookieId
- **Description**: Get student by cookieId.
- **Authentication**: None
- **Path Parameters**: `cookieId` (string)
- **Response**: `{ user: { ... } }`
- **Status Codes**: 200, 400, 404, 500
